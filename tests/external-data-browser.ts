import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { it } from "node:test";
import type { Browser } from "playwright";

import { createManualSeries } from "@/features/external-data/service";

import type { getDatabase } from "@/lib/db";
import type { createAuthFixtures } from "./helpers/auth-fixtures";

type Resources = {
  browser: Browser;
  database: ReturnType<typeof getDatabase>;
  fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
  origin: string;
};

export function registerExternalDataBrowserTests(resources: () => Resources) {
  it("creates and corrects manual external data without JavaScript and publishes only its latest value", async () => {
    const r = resources();
    const context = await r.browser.newContext({ javaScriptEnabled: false });
    const publicContext = await r.browser.newContext({
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    const signedIn = await context.request.post(
      `${r.origin}/api/auth/sign-in/email`,
      {
        headers: { origin: r.origin, "x-forwarded-for": "198.18.10.251" },
        data: {
          email: r.fixtures.manager.email,
          password: r.fixtures.password,
        },
      },
    );
    assert.equal(signedIn.status(), 200);
    const name = `Chuva navegador ${randomUUID()}`;
    let id: string | undefined;
    try {
      await page.goto(`${r.origin}/gestor/dados`);
      await page
        .getByRole("button", { name: "Nova série manual", exact: true })
        .click();
      await page.getByLabel("Nome da série", { exact: true }).fill(name);
      await page
        .getByLabel("Informação e unidade", { exact: true })
        .selectOption("RAINFALL");
      await page
        .getByLabel("Frequência", { exact: true })
        .selectOption("DAILY");
      await page
        .getByLabel("Região ou localidade da fonte")
        .fill("Localidade sintética");
      await page
        .getByLabel("Nome da fonte", { exact: true })
        .fill("Fonte de teste do navegador");
      await page
        .getByLabel("Link HTTPS da fonte")
        .fill("https://example.invalid/chuva");
      await page.getByLabel("Prazo de atualização").fill("7");
      await page
        .getByRole("button", { name: "Cadastrar série", exact: true })
        .click();
      await page.waitForURL(
        (url) =>
          url.pathname.startsWith("/gestor/dados/") &&
          url.searchParams.get("aviso") === "serie",
      );
      id = new URL(page.url()).pathname.split("/").at(-1)!;
      const fillRecord = async (value: string) => {
        await page.getByLabel("Início do período").fill("2026-10-26");
        await page.getByLabel("Fim do período").fill("2026-10-26");
        await page.getByLabel("Valor (mm)", { exact: true }).fill(value);
        await page
          .getByRole("button", { name: "Salvar registro", exact: true })
          .click();
        await page.waitForURL(
          (url) => url.searchParams.get("aviso") === "salvo",
        );
      };
      await fillRecord("7,1234");
      // A reload ensures the second submission is made from the updated server document.
      await page.reload();
      await fillRecord("8,5678");
      const content = await page.locator("main").innerText();
      assert.ok(content.includes("7,1234 mm"));
      assert.ok(content.includes("8,5678 mm"));
      assert.ok(content.includes("Versão 2"));
      assert.ok(content.includes(r.fixtures.manager.name));

      const visitor = await publicContext.newPage();
      const requests: string[] = [];
      visitor.on("request", (request) =>
        requests.push(new URL(request.url()).hostname),
      );
      await visitor.goto(`${r.origin}/`);
      await visitor
        .getByRole("link", { name: "Consultar dados externos" })
        .click();
      const card = visitor
        .getByRole("listitem")
        .filter({ has: visitor.getByRole("heading", { name, exact: true }) });
      assert.ok((await card.innerText()).includes("8,5678"));
      assert.ok(!(await visitor.content()).includes("7,1234"));
      assert.ok(!(await visitor.content()).includes(r.fixtures.manager.name));
      assert.ok(!(await visitor.content()).includes(r.fixtures.manager.email));
      assert.equal(
        await card
          .getByRole("link", { name: "Fonte de teste do navegador" })
          .getAttribute("href"),
        "https://example.invalid/chuva",
      );
      assert.ok(
        requests.every((hostname) => hostname === "localhost"),
        "Consulta pública não deve consultar fontes externas.",
      );
      for (const width of [320, 390, 1280]) {
        await visitor.setViewportSize({ width, height: 844 });
        assert.ok(
          await visitor.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.setViewportSize({ width, height: 844 });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        if (process.env.TEST_SCREENSHOT_DIR) {
          await mkdir(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
          await visitor.screenshot({
            path: join(
              process.env.TEST_SCREENSHOT_DIR,
              `f6-public-${width}.png`,
            ),
            fullPage: true,
          });
          await page.screenshot({
            path: join(
              process.env.TEST_SCREENSHOT_DIR,
              `f6-manager-${width}.png`,
            ),
            fullPage: true,
          });
        }
      }
      await visitor.goto(`${r.origin}/gestor/dados/${id}`);
      assert.equal(new URL(visitor.url()).pathname, "/login");
    } finally {
      await context.close();
      await publicContext.close();
      if (id) {
        await r.database.externalObservation.deleteMany({
          where: { seriesId: id },
        });
        await r.database.externalSeries.delete({ where: { id } });
      }
    }
  });

  it("creates a manual series through modal steps and preserves the draft after a duplicate error", async () => {
    const r = resources();
    const name = `Série modal ${randomUUID()}`;
    const ids: string[] = [];
    const duplicate = await createManualSeries(
      r.database,
      r.fixtures.manager.id,
      {
        name,
        metric: "CORN",
        frequency: "MONTHLY",
        geography: "Bahia sintética",
        sourceName: "Fonte sintética",
        sourceUrl: "https://example.invalid/modal",
        staleAfterDays: "7",
      },
    );
    ids.push(duplicate.id);
    const context = await r.browser.newContext();
    try {
      const login = await context.request.post(
        `${r.origin}/api/auth/sign-in/email`,
        {
          headers: { origin: r.origin, "x-forwarded-for": "198.18.10.249" },
          data: {
            email: r.fixtures.manager.email,
            password: r.fixtures.password,
          },
        },
      );
      assert.equal(login.status(), 200);
      const page = await context.newPage();
      const remote: string[] = [];
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(error.message));
      page.on("request", (request) => {
        if (new URL(request.url()).hostname !== "localhost")
          remote.push(request.url());
      });
      await page.goto(`${r.origin}/gestor/dados`);
      await page.waitForLoadState("networkidle");
      const modal = page.getByRole("dialog", {
        name: "Cadastrar série manual",
        exact: true,
      });
      const trigger = page.getByRole("button", {
        name: "Nova série manual",
        exact: true,
      });
      assert.equal(await modal.count(), 0);
      await trigger.click();
      await modal.waitFor({ state: "visible" });
      await modal
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      assert.equal(await modal.getByRole("alert").count(), 2);
      await page.getByLabel("Nome da série", { exact: true }).fill(name);
      await page
        .getByLabel("Informação e unidade", { exact: true })
        .selectOption("CORN");
      await page
        .getByLabel("Frequência", { exact: true })
        .selectOption("MONTHLY");
      await page
        .getByLabel("Região ou localidade da fonte")
        .fill("Bahia sintética");
      await modal
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await modal
        .getByRole("button", { name: "Cadastrar série", exact: true })
        .click();
      assert.equal(await modal.getByRole("alert").count(), 2);
      await page
        .getByLabel("Nome da fonte", { exact: true })
        .fill("Fonte sintética");
      await page.getByLabel("Link HTTPS da fonte").fill("invalido");
      await modal
        .getByRole("button", { name: "Cadastrar série", exact: true })
        .click();
      assert.equal(await modal.getByRole("alert").count(), 1);
      await page
        .getByLabel("Link HTTPS da fonte")
        .fill("http://example.invalid/modal");
      await page.getByLabel("Prazo de atualização").fill("731");
      await modal
        .getByRole("button", { name: "Cadastrar série", exact: true })
        .click();
      assert.equal(await modal.getByRole("alert").count(), 2);
      await page
        .getByLabel("Link HTTPS da fonte")
        .fill("https://example.invalid/modal");
      await page.getByLabel("Prazo de atualização").fill("7");
      await modal.getByRole("button", { name: "Voltar", exact: true }).click();
      assert.equal(
        await page.getByLabel("Nome da série", { exact: true }).inputValue(),
        name,
      );
      assert.equal(
        await page
          .getByLabel("Informação e unidade", { exact: true })
          .inputValue(),
        "CORN",
      );
      await modal
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Link HTTPS da fonte").inputValue(),
        "https://example.invalid/modal",
      );
      await modal
        .getByRole("button", {
          name: "Fechar Cadastrar série manual",
          exact: true,
        })
        .click();
      await modal.waitFor({ state: "hidden" });
      assert.ok(
        await trigger.evaluate((node) => node === document.activeElement),
      );
      await trigger.click();
      await modal.waitFor({ state: "visible" });
      assert.equal(
        await page.getByLabel("Nome da fonte", { exact: true }).inputValue(),
        "Fonte sintética",
      );
      await modal
        .getByRole("button", { name: "Cadastrar série", exact: true })
        .click();
      await page.waitForURL(
        (url) => url.searchParams.get("erro") === "duplicada",
      );
      await modal
        .getByRole("alert")
        .filter({ hasText: "Já existe uma série" })
        .waitFor();
      assert.equal(
        await page.getByLabel("Nome da fonte", { exact: true }).inputValue(),
        "Fonte sintética",
      );
      await modal.getByRole("button", { name: "Voltar", exact: true }).click();
      assert.equal(
        await page.getByLabel("Nome da série", { exact: true }).inputValue(),
        name,
      );
      await page
        .getByLabel("Nome da série", { exact: true })
        .fill(`${name} nova`);
      await modal
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      for (const width of [320, 390, 768, 1280]) {
        await modal
          .getByRole("button", {
            name: "Fechar Cadastrar série manual",
            exact: true,
          })
          .click();
        await modal.waitFor({ state: "hidden" });
        await page.setViewportSize({ width, height: 568 });
        await trigger.click();
        await modal.waitFor({ state: "visible" });
        const bounds = await modal.boundingBox();
        assert.ok(
          bounds &&
            bounds.x >= 0 &&
            bounds.x + bounds.width <= width + 1 &&
            bounds.height <= 537,
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        if (process.env.TEST_SCREENSHOT_DIR) {
          await mkdir(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({
            path: join(
              process.env.TEST_SCREENSHOT_DIR,
              `series-modal-${width}.png`,
            ),
            animations: "disabled",
          });
        }
      }
      await page.route("**/gestor/dados*", async (route) => {
        if (route.request().method() === "POST")
          await new Promise((resolve) => setTimeout(resolve, 400));
        await route.continue();
      });
      await modal
        .getByRole("button", { name: "Cadastrar série", exact: true })
        .click();
      await modal
        .getByRole("button", { name: "Salvando…", exact: true })
        .waitFor();
      assert.ok(
        await modal
          .getByRole("button", {
            name: "Fechar Cadastrar série manual",
            exact: true,
          })
          .isDisabled(),
      );
      await page.keyboard.press("Escape");
      assert.ok(await modal.isVisible());
      await page.waitForURL(
        (url) =>
          url.pathname.startsWith("/gestor/dados/") &&
          url.searchParams.get("aviso") === "serie",
      );
      const id = new URL(page.url()).pathname.split("/").at(-1)!;
      ids.push(id);
      await page
        .getByRole("status")
        .filter({ hasText: "Série criada" })
        .waitFor();
      assert.equal(await page.locator("dialog:modal").count(), 0);
      const saved = await r.database.externalSeries.findUniqueOrThrow({
        where: { id },
      });
      assert.equal(saved.name, `${name} nova`);
      assert.equal(saved.metric, "CORN");
      assert.equal(saved.frequency, "MONTHLY");
      assert.equal(saved.geography, "Bahia sintética");
      assert.equal(saved.sourceName, "Fonte sintética");
      assert.equal(saved.sourceUrl, "https://example.invalid/modal");
      assert.equal(saved.staleAfterDays, 7);
      await page.unrouteAll({ behavior: "wait" });
      await page
        .getByRole("link", { name: "Voltar aos dados externos", exact: true })
        .click();
      await page.waitForURL(
        (url) => url.pathname === "/gestor/dados" && !url.search,
      );
      await page
        .getByRole("button", { name: "Nova série manual", exact: true })
        .click();
      await page
        .getByLabel("Nome da série", { exact: true })
        .waitFor({ state: "visible" });
      assert.equal(
        await page.getByLabel("Nome da série", { exact: true }).inputValue(),
        "",
      );
      assert.deepEqual(remote, []);
      assert.deepEqual(browserErrors, []);
    } finally {
      await context.close();
      await r.database.externalObservation.deleteMany({
        where: { seriesId: { in: ids } },
      });
      await r.database.externalSeries.deleteMany({
        where: { id: { in: ids } },
      });
    }
  });

  it("denies slaughterhouse access to external-data management and history", async () => {
    const r = resources();
    const context = await r.browser.newContext({ javaScriptEnabled: false });
    try {
      const login = await context.request.post(
        `${r.origin}/api/auth/sign-in/email`,
        {
          headers: { origin: r.origin, "x-forwarded-for": "198.18.10.250" },
          data: {
            email: r.fixtures.users[0].email,
            password: r.fixtures.password,
          },
        },
      );
      assert.equal(login.status(), 200);
      const page = await context.newPage();
      await page.goto(`${r.origin}/gestor/dados`);
      assert.equal(new URL(page.url()).pathname, "/acesso-negado");
      await page.goto(`${r.origin}/gestor/dados/${randomUUID()}`);
      assert.equal(new URL(page.url()).pathname, "/acesso-negado");
    } finally {
      await context.close();
    }
  });
}
