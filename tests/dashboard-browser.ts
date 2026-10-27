import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { it } from "node:test";
import type { Browser } from "playwright";

import {
  createManualSeries,
  saveManualObservation,
} from "@/features/external-data/service";
import { createQuote, reviseQuote } from "@/features/quotes/service";
import { createCategory } from "@/features/slaughterhouses/service";
import type { getDatabase } from "@/lib/db";

import type { createAuthFixtures } from "./helpers/auth-fixtures";

type Resources = {
  browser: Browser;
  database: ReturnType<typeof getDatabase>;
  fixtures: Awaited<ReturnType<typeof createAuthFixtures>>;
  origin: string;
};

export function registerDashboardBrowserTests(resources: () => Resources) {
  it("filters public trends without JavaScript, hides replaced prices and computes a comparable replacement ratio", async () => {
    const r = resources();
    const selected = await createCategory(r.database, r.fixtures.manager.id, {
      name: `Categoria gráfico ${randomUUID()}`,
    });
    await createQuote(r.database, r.fixtures.users[0].id, {
      categoryId: selected.id,
      pricePerArroba: "300",
      referenceDate: "2026-10-20",
    });
    const replaced = await createQuote(r.database, r.fixtures.users[0].id, {
      categoryId: selected.id,
      pricePerArroba: "315",
      referenceDate: "2026-10-26",
    });
    await reviseQuote(r.database, r.fixtures.users[0].id, replaced.id, {
      categoryId: selected.id,
      pricePerArroba: "330",
      referenceDate: "2026-10-26",
    });
    const ids: string[] = [];
    const source = async (metric: string, first: string, last: string) => {
      const row = await createManualSeries(r.database, r.fixtures.manager.id, {
        name: `Referência ${metric} ${randomUUID()}`,
        metric,
        frequency: "DAILY",
        geography: "Praça sintética",
        sourceName: "Fonte de teste do painel",
        sourceUrl: "https://example.invalid/painel",
        staleAfterDays: "7",
      });
      ids.push(row.id);
      for (const [date, value] of [
        ["2026-10-20", first],
        ["2026-10-26", last],
      ])
        await saveManualObservation(r.database, r.fixtures.manager.id, row.id, {
          periodStart: date,
          periodEnd: date,
          value,
          validUntil: "",
        });
      return row.id;
    };
    const context = await r.browser.newContext({ javaScriptEnabled: false });
    try {
      const dollar = await source("USD_BRL", "5.1", "5.61");
      const arroba = await source("ARROBA_REFERENCE", "290", "300");
      const calf = await source("CALF_PRICE", "2300", "2400");
      const page = await context.newPage();
      const remoteRequests: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).hostname !== "localhost")
          remoteRequests.push(request.url());
      });
      await page.goto(`${r.origin}/`);
      await page
        .getByRole("link", { name: "Abrir painel", exact: true })
        .click();
      await page
        .getByLabel("Região", { exact: true })
        .selectOption(r.fixtures.slaughterhouses[0].regionId);
      await page
        .getByLabel("Categoria", { exact: true })
        .selectOption(selected.id);
      await page
        .getByLabel("Frigorífico do gráfico")
        .selectOption(r.fixtures.slaughterhouses[0].id);
      await page.getByLabel("Início do período").fill("2026-10-01");
      await page.getByLabel("Fim do período").fill("2026-10-27");
      await page.getByLabel("Série externa do gráfico").selectOption(dollar);
      await page
        .getByLabel("Referência da arroba para relação de troca")
        .selectOption(arroba);
      await page
        .getByLabel("Referência do bezerro para relação de troca")
        .selectOption(calf);
      await page.getByRole("button", { name: "Aplicar filtros" }).click();
      await page.waitForURL(
        (url) => url.searchParams.get("categoria") === selected.id,
      );
      const content = await page.content();
      assert.ok(
        (await page.locator("main").innerText()).includes("8 @/bezerro"),
      );
      assert.ok(content.includes("10%"));
      for (const secret of [
        "315,00",
        "315.00",
        r.fixtures.users[0].email,
        r.fixtures.manager.email,
        replaced.id,
        replaced.seriesId,
      ])
        assert.ok(!content.includes(secret));
      assert.equal(await page.getByRole("img").count(), 2);
      await page
        .getByText("Ver valores do gráfico", { exact: true })
        .first()
        .click();
      assert.ok(
        (await page.getByRole("table").first().innerText()).includes("300"),
      );
      assert.ok(
        (await page.getByRole("table").first().innerText()).includes("330"),
      );
      assert.deepEqual(remoteRequests, []);
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        if (process.env.TEST_SCREENSHOT_DIR) await page.reload();
        assert.equal(await page.locator("main").count(), 1);
        assert.equal(await page.locator("header").count(), 1);
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
              `f7-dashboard-${width}.png`,
            ),
            fullPage: true,
            animations: "disabled",
          });
        }
      }
      await page.goto(
        `${r.origin}/painel?regiao=${r.fixtures.slaughterhouses[0].regionId}&categoria=${selected.id}&inicio=invalid&fim=2026-10-27`,
      );
      assert.ok(
        (await page.getByRole("alert").innerText()).includes(
          "Informe datas válidas",
        ),
      );
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

  it("simulates per-animal scenarios without JavaScript, without putting inputs in URLs", async () => {
    const r = resources();
    const context = await r.browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      let inputInUrl = false;
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (
          ["liveWeight", "yieldPercent", "arrobaPrice", "totalCost"].some(
            (key) => url.searchParams.has(key),
          )
        )
          inputInUrl = true;
      });
      await page.goto(`${r.origin}/simulador`);
      await page
        .getByLabel("Peso vivo por animal (kg)", { exact: true })
        .fill("500");
      await page
        .getByLabel("Rendimento de carcaça (%)", { exact: true })
        .fill("55");
      await page
        .getByLabel("Preço da arroba (R$/@)", { exact: true })
        .fill("300");
      await page
        .getByLabel("Custo total por animal (R$)", { exact: true })
        .fill("4000");
      await page
        .getByLabel("Preço alternativo da arroba (R$/@, opcional)", {
          exact: true,
        })
        .fill("270");
      await page.getByRole("button", { name: "Calcular cenário" }).click();
      await page
        .getByRole("heading", { name: "Resultado estimado por animal" })
        .waitFor();
      const content = await page.locator("main").innerText();
      for (const expected of [
        "18,3333",
        "5.500,00",
        "1.500,00",
        "4.950,00",
        "950,00",
        "-550,00",
      ])
        assert.ok(content.includes(expected));
      assert.equal(new URL(page.url()).pathname, "/simulador");
      assert.equal(new URL(page.url()).search, "");
      assert.equal(inputInUrl, false);
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        if (process.env.TEST_SCREENSHOT_DIR)
          await page.screenshot({
            path: join(
              process.env.TEST_SCREENSHOT_DIR,
              `f7-simulator-${width}.png`,
            ),
            fullPage: true,
          });
      }
      await page
        .getByLabel("Rendimento de carcaça (%)", { exact: true })
        .fill("101");
      await page.getByRole("button", { name: "Calcular cenário" }).click();
      await page.getByRole("alert").waitFor();
      assert.equal(
        await page
          .getByRole("heading", { name: "Resultado estimado por animal" })
          .count(),
        0,
      );
    } finally {
      await context.close();
    }
  });

  it("keeps the enhanced simulator interactive and shows a negative margin explicitly", async () => {
    const r = resources();
    const context = await r.browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(`${r.origin}/simulador`);
      await page.waitForLoadState("networkidle");
      await page
        .getByLabel("Peso vivo por animal (kg)", { exact: true })
        .fill("500");
      await page
        .getByLabel("Rendimento de carcaça (%)", { exact: true })
        .fill("55");
      await page
        .getByLabel("Preço da arroba (R$/@)", { exact: true })
        .fill("300");
      await page
        .getByLabel("Custo total por animal (R$)", { exact: true })
        .fill("6000");
      await page.getByRole("button", { name: "Calcular cenário" }).click();
      await page
        .getByText("O cenário apresenta margem negativa.", { exact: true })
        .waitFor();
      assert.ok((await page.locator("main").innerText()).includes("-500,00"));
    } finally {
      await context.close();
    }
  });
}
