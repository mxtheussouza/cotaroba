import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { it } from "node:test";
import type { Browser } from "playwright";

import type { getDatabase } from "@/lib/db";

import type { createAuthFixtures } from "./helpers/auth-fixtures";

type Resources = {
  browser: Browser;
  database: ReturnType<typeof getDatabase>;
  fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
  origin: string;
};

async function login(
  resources: Resources,
  context: Awaited<ReturnType<Browser["newContext"]>>,
  email: string,
) {
  const result = await context.request.post(
    `${resources.origin}/api/auth/sign-in/email`,
    {
      headers: {
        origin: resources.origin,
        "x-forwarded-for": "198.18.10.252",
      },
      data: { email, password: resources.fixtures.password },
    },
  );
  assert.equal(result.status(), 200);
}

export function registerQuoteBrowserTests(resources: () => Resources) {
  it("creates a category and a private quote, then preserves a revision without JavaScript", async () => {
    const r = resources();
    const manager = await r.browser.newContext({ javaScriptEnabled: false });
    const managerPage = await manager.newPage();
    await login(r, manager, r.fixtures.manager.email);
    await managerPage.goto(`${r.origin}/gestor/categorias`);
    const categoryName = `Categoria navegador ${randomUUID()}`;
    await managerPage.getByLabel("Nome da categoria").fill(categoryName);
    await managerPage
      .getByRole("button", { name: "Cadastrar categoria" })
      .click();
    await managerPage.waitForURL(
      (url) => url.searchParams.get("aviso") === "categoria-criada",
    );
    const category = await r.database.cattleCategory.findUniqueOrThrow({
      where: { name: categoryName },
    });

    const member = await r.browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const page = await member.newPage();
    await login(r, member, r.fixtures.users[0].email);
    await page.goto(`${r.origin}/frigorifico`);
    await page
      .getByLabel("Categoria", { exact: true })
      .selectOption(category.id);
    await page.getByLabel("Preço da arroba (R$/@)").fill("7184,23");
    await page.getByLabel("Data de referência").fill("2026-10-26");
    await page.getByRole("button", { name: "Salvar cotação" }).click();
    await page.waitForURL(
      (url) =>
        url.pathname.startsWith("/frigorifico/cotacoes/") &&
        url.searchParams.get("aviso") === "criada",
    );
    const seriesId = new URL(page.url()).pathname.split("/").at(-1)!;
    assert.match(await page.locator("main").innerText(), /Versão 1/);
    const first = await r.database.quote.findFirstOrThrow({
      where: { seriesId },
    });
    assert.equal(first.slaughterhouseId, r.fixtures.slaughterhouses[0].id);
    assert.equal(first.createdById, r.fixtures.users[0].id);
    assert.equal(first.pricePerArroba.toFixed(2), "7184.23");

    await page.getByLabel("Preço da arroba (R$/@)").fill("7185,24");
    await page.getByRole("button", { name: "Salvar nova versão" }).click();
    await page.waitForURL(
      (url) => url.searchParams.get("aviso") === "atualizada",
    );
    assert.match(await page.locator("main").innerText(), /Versão 2/);
    const versions = await r.database.quote.findMany({
      where: { seriesId },
      orderBy: { version: "asc" },
    });
    assert.deepEqual(
      versions.map((quote) => quote.pricePerArroba.toFixed(2)),
      ["7184.23", "7185.24"],
    );

    const other = await r.browser.newContext({ javaScriptEnabled: false });
    await login(r, other, r.fixtures.users[1].email);
    const otherPage = await other.newPage();
    assert.equal(
      (await otherPage.goto(
        `${r.origin}/frigorifico/cotacoes/${seriesId}`,
      ))!.status(),
      404,
    );
    await otherPage.goto(`${r.origin}/frigorifico`);
    assert.ok(
      !(await otherPage.locator("main").innerText()).includes("7185,24"),
    );

    const publicContext = await r.browser.newContext({
      javaScriptEnabled: false,
    });
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`${r.origin}/`);
    const publicContent = await publicPage.content();
    assert.ok(!publicContent.includes("7185,24"));
    assert.ok(!publicContent.includes(r.fixtures.slaughterhouses[0].name));
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await publicContext.close();
    await other.close();
    await member.close();
    await manager.close();
  });
}
