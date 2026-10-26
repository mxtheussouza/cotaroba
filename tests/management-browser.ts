import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { it } from "node:test";
import type {
  Browser,
  BrowserContext,
  Page,
  Request as BrowserRequest,
} from "playwright";

import type { getDatabase } from "@/lib/db";
import type { createAuthFixtures } from "./helpers/auth-fixtures";

type Resources = {
  browser: Browser;
  database: ReturnType<typeof getDatabase>;
  fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
  origin: string;
  logs: () => string;
};

async function login(
  resources: Resources,
  context: BrowserContext,
  email = resources.fixtures.manager.email,
) {
  // Authenticate via the real HTTP handler without spending the shared loopback login quota.
  const response = await context.request.post(
    `${resources.origin}/api/auth/sign-in/email`,
    {
      headers: {
        origin: resources.origin,
        "x-forwarded-for": `198.18.10.${Math.floor(Math.random() * 240) + 1}`,
      },
      data: { email, password: resources.fixtures.password, rememberMe: false },
    },
  );
  assert.equal(response.status(), 200);
}

async function saved(page: Page, code: string) {
  await page.waitForURL((url) => url.searchParams.get("aviso") === code);
  await page.getByRole("status").first().waitFor();
}

export function registerManagementBrowserTests(resources: () => Resources) {
  it("registers and edits a company and its access without JavaScript, then logs in with the created access", async () => {
    const r = resources();
    const context = await r.browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await login(r, context);
    const password = randomUUID() + "-aB1!";
    const companyName = `Empresa navegador ${randomUUID()}`;
    const regionName = `Região navegador ${randomUUID()}`;
    const email = `${randomUUID()}@example.invalid`;
    let credentialUrl = false;
    const actionMethods: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.searchParams.has("email") || url.searchParams.has("password"))
        credentialUrl = true;
      if (request.method() === "POST" && url.pathname.startsWith("/gestor"))
        actionMethods.push(request.method());
    });
    await page.goto(`${r.origin}/gestor`);
    await page.getByRole("link", { name: "Regiões", exact: true }).click();
    await page.getByLabel("Nome da região", { exact: true }).fill(regionName);
    await page
      .getByRole("button", { name: "Cadastrar região", exact: true })
      .click();
    await saved(page, "regiao-criada");
    assert.equal(
      await page.getByRole("listitem").filter({ hasText: regionName }).count(),
      1,
    );
    const region = await r.database.region.findUniqueOrThrow({
      where: { name: regionName },
    });
    await page
      .getByLabel("Nome da região", { exact: true })
      .fill(`  ${regionName.toUpperCase()}  `);
    await page
      .getByRole("button", { name: "Cadastrar região", exact: true })
      .click();
    await page.waitForURL(
      (url) => url.searchParams.get("erro") === "regiao-duplicada",
    );
    assert.match(
      await page.locator("main").getByRole("alert").innerText(),
      /Já existe uma região/,
    );
    await page
      .getByRole("link", { name: "Cadastrar frigorífico", exact: true })
      .click();
    assert.equal(
      await page.locator("form").last().getAttribute("method"),
      "POST",
    );
    await page
      .getByLabel("Nome do frigorífico", { exact: true })
      .fill(companyName);
    await page.getByLabel("Região", { exact: true }).selectOption(region.id);
    await page
      .getByRole("button", { name: "Salvar frigorífico", exact: true })
      .click();
    await saved(page, "frigorifico-criado");
    const companyId = new URL(page.url()).pathname.split("/").at(-1)!;
    await page
      .getByLabel("Nome do frigorífico", { exact: true })
      .fill(`${companyName} editada`);
    await page
      .getByRole("button", { name: "Salvar frigorífico", exact: true })
      .click();
    await saved(page, "frigorifico-atualizado");

    const createForm = page.getByRole("region", {
      name: "Criar acesso",
      exact: true,
    });
    await createForm
      .getByLabel("Nome do responsável", { exact: true })
      .fill("Responsável navegador");
    await createForm
      .getByLabel("E-mail de acesso", { exact: true })
      .fill(email);
    await createForm
      .getByLabel("Senha inicial", { exact: true })
      .fill(password);
    await createForm
      .getByRole("button", { name: "Criar acesso", exact: true })
      .click();
    await saved(page, "acesso-criado");
    assert.ok(!(await page.content()).includes(password));
    assert.ok(!r.logs().includes(password));
    assert.equal(credentialUrl, false);
    assert.deepEqual(actionMethods, ["POST", "POST", "POST", "POST", "POST"]);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      if (process.env.TEST_SCREENSHOT_DIR) {
        // Reload after resizing so no-JavaScript captures use the final viewport layout.
        await page.reload();
        await mkdir(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: join(
            process.env.TEST_SCREENSHOT_DIR,
            `f3-management-${width}.png`,
          ),
          fullPage: true,
        });
      }
    }
    const access = await r.database.user.findUniqueOrThrow({
      where: { email },
    });
    assert.equal(access.slaughterhouseId, companyId);

    const member = await r.browser.newContext({ javaScriptEnabled: false });
    const memberPage = await member.newPage();
    await memberPage.goto(`${r.origin}/login`);
    await memberPage.getByLabel("E-mail", { exact: true }).fill(email);
    await memberPage.getByLabel("Senha", { exact: true }).fill(password);
    await memberPage
      .getByRole("button", { name: "Entrar", exact: true })
      .click();
    await memberPage.waitForURL(`${r.origin}/frigorifico`);
    assert.ok(
      (await memberPage.locator("main").innerText()).includes(
        `${companyName} editada`,
      ),
    );
    await memberPage.goto(`${r.origin}/gestor/frigorificos/${companyId}`);
    assert.equal(new URL(memberPage.url()).pathname, "/acesso-negado");

    // Company deactivation terminates the real member session and preserves its account.
    await page
      .getByLabel("Situação do frigorífico", { exact: true })
      .selectOption("false");
    await page
      .getByRole("button", { name: "Salvar frigorífico", exact: true })
      .click();
    await saved(page, "frigorifico-atualizado");
    assert.equal(
      await page
        .getByRole("region", { name: "Criar acesso", exact: true })
        .count(),
      0,
    );
    await memberPage.goto(`${r.origin}/frigorifico`);
    assert.equal(new URL(memberPage.url()).pathname, "/login");
    assert.equal(
      (await r.database.user.findUniqueOrThrow({ where: { email } })).isActive,
      true,
    );
    await member.close();
    await context.close();
  });

  it("submits the enhanced management form and handles duplicate email/reset/deactivation through the UI", async () => {
    const r = resources();
    const context = await r.browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await login(r, context);
    await page.goto(
      `${r.origin}/gestor/frigorificos/${r.fixtures.slaughterhouses[0].id}`,
    );
    await page.waitForLoadState("networkidle");
    const createForm = page.getByRole("region", {
      name: "Criar acesso",
      exact: true,
    });
    await createForm
      .getByLabel("Nome do responsável", { exact: true })
      .fill("Duplicado");
    await createForm
      .getByLabel("E-mail de acesso", { exact: true })
      .fill(r.fixtures.manager.email);
    await createForm
      .getByLabel("Senha inicial", { exact: true })
      .fill(r.fixtures.password);
    await createForm
      .getByRole("button", { name: "Criar acesso", exact: true })
      .click();
    await page.waitForURL((url) => url.searchParams.get("erro") === "email");
    assert.match(
      await page.locator("main").getByRole("alert").innerText(),
      /e-mail já está em uso/,
    );
    assert.equal(
      await page.locator('input[type="password"]').last().inputValue(),
      "",
    );

    const article = page.getByRole("article", {
      name: `Acesso de ${r.fixtures.users[0].name}`,
      exact: true,
    });
    await article
      .getByLabel("Nome do responsável", { exact: true })
      .fill("Responsável atualizado");
    await article
      .getByLabel("Situação do acesso", { exact: true })
      .selectOption("false");
    await article
      .getByRole("button", { name: "Salvar acesso", exact: true })
      .click();
    await saved(page, "acesso-atualizado");
    assert.equal(
      (
        await r.database.user.findUniqueOrThrow({
          where: { id: r.fixtures.users[0].id },
        })
      ).isActive,
      false,
    );
    const updatedArticle = page.getByRole("article", {
      name: "Acesso de Responsável atualizado",
      exact: true,
    });
    await updatedArticle
      .getByLabel("Situação do acesso", { exact: true })
      .selectOption("true");
    await updatedArticle
      .getByRole("button", { name: "Salvar acesso", exact: true })
      .click();
    // This save reuses the current URL/code. Wait for its request to settle
    // before opening the next form, which the refreshed response replaces.
    await page.waitForLoadState("networkidle");
    await saved(page, "acesso-atualizado");
    const replacement = randomUUID() + "-aB1!";
    await updatedArticle
      .getByText("Redefinir senha de Responsável atualizado", { exact: true })
      .click();
    await updatedArticle
      .getByLabel("Nova senha", { exact: true })
      .fill(replacement);
    await updatedArticle
      .getByRole("button", { name: "Redefinir senha", exact: true })
      .click();
    await saved(page, "senha-alterada");
    assert.ok(!(await page.content()).includes(replacement));
    assert.ok(!r.logs().includes(replacement));
    const loginResult = await context.request.post(
      `${r.origin}/api/auth/sign-in/email`,
      {
        headers: { origin: r.origin, "x-forwarded-for": "198.18.10.251" },
        data: { email: r.fixtures.users[0].email, password: replacement },
      },
    );
    assert.equal(loginResult.status(), 200);
    assert.deepEqual(errors, []);
    await context.close();
  });

  it("rejects real Server Action replay as visitor, slaughterhouse and a foreign origin", async () => {
    const r = resources();
    const context = await r.browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await login(r, context);
    await page.goto(`${r.origin}/gestor/frigorificos/novo`);
    await page
      .getByLabel("Nome do frigorífico", { exact: true })
      .fill(`Reenvio QA ${randomUUID()}`);
    await page
      .getByLabel("Região", { exact: true })
      .selectOption(r.fixtures.slaughterhouses[0].regionId);
    const posted = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        new URL(request.url()).pathname.startsWith("/gestor"),
    );
    await page
      .getByRole("button", { name: "Salvar frigorífico", exact: true })
      .click();
    await saved(page, "frigorifico-criado");
    const request: BrowserRequest = await posted;
    const body = new Uint8Array(request.postDataBuffer()!).buffer;
    const contentType = request.headers()["content-type"];
    const count = await r.database.slaughterhouse.count();
    const visitor = await fetch(request.url(), {
      method: "POST",
      redirect: "manual",
      headers: { origin: r.origin, "content-type": contentType },
      body,
    });
    assert.equal(visitor.status, 303);
    assert.equal(
      new URL(visitor.headers.get("location")!, r.origin).pathname,
      "/login",
    );

    const member = await r.browser.newContext();
    await login(r, member, r.fixtures.users[1].email);
    const memberCookie = (await member.cookies())
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const denied = await fetch(request.url(), {
      method: "POST",
      redirect: "manual",
      headers: {
        origin: r.origin,
        "content-type": contentType,
        cookie: memberCookie,
      },
      body,
    });
    assert.equal(denied.status, 303);
    assert.equal(
      new URL(denied.headers.get("location")!, r.origin).pathname,
      "/acesso-negado",
    );
    const managerCookie = (await context.cookies())
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const csrf = await fetch(request.url(), {
      method: "POST",
      redirect: "manual",
      headers: {
        origin: "https://external.example.invalid",
        "content-type": contentType,
        cookie: managerCookie,
      },
      body,
    });
    assert.ok(csrf.status >= 400);
    assert.equal(await r.database.slaughterhouse.count(), count);
    await r.database.rateLimit.update({
      where: { key: `management:${r.fixtures.manager.id}` },
      data: { count: 30, lastRequest: BigInt(Date.now()) },
    });
    const limited = await fetch(request.url(), {
      method: "POST",
      redirect: "manual",
      headers: {
        origin: r.origin,
        "content-type": contentType,
        cookie: managerCookie,
      },
      body,
    });
    assert.equal(limited.status, 303);
    assert.equal(
      new URL(limited.headers.get("location")!, r.origin).searchParams.get(
        "erro",
      ),
      "limite",
    );
    assert.equal(await r.database.slaughterhouse.count(), count);
    await r.database.rateLimit.delete({
      where: { key: `management:${r.fixtures.manager.id}` },
    });
    await member.close();
    await context.close();
  });

  it("keeps manager records out of the public portal and rejects invalid/private URLs", async () => {
    const r = resources();
    const context = await r.browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto(`${r.origin}/`);
    assert.equal(response!.status(), 200);
    assert.ok(
      (await page.locator("main").innerText()).includes("Dados insuficientes"),
    );
    assert.ok(
      !(await page.content()).includes(r.fixtures.slaughterhouses[0].name),
    );
    assert.ok(!(await page.content()).includes(r.fixtures.users[0].email));
    await page.goto(`${r.origin}/gestor/frigorificos/novo`);
    assert.equal(new URL(page.url()).pathname, "/login");
    await login(r, context);
    for (const id of ["invalid", randomUUID()]) {
      const missing = await page.goto(`${r.origin}/gestor/frigorificos/${id}`);
      assert.equal(missing!.status(), 404);
    }
    await context.close();
  });
}
