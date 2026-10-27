import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
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
