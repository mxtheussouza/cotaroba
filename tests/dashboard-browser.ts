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
      await page.getByRole("button", { name: "Aplicar filtros" }).click();
      await page.waitForURL(
        (url) => url.searchParams.get("categoria") === selected.id,
      );
      await page.getByRole("tab", { name: "Evolução", exact: true }).click();
      await page
        .getByLabel("Frigorífico do gráfico")
        .selectOption(r.fixtures.slaughterhouses[0].id);
      await page.getByLabel("Início do período").fill("2026-10-01");
      await page.getByLabel("Fim do período").fill("2026-10-27");
      await page.getByRole("button", { name: "Aplicar filtros" }).click();
      await page.waitForURL(
        (url) => url.searchParams.get("inicio") === "2026-10-01",
      );
      assert.equal(await page.getByRole("img").count(), 1);
      await page
        .getByText("Ver valores do gráfico", { exact: true })
        .first()
        .click();
      const localTable = await page.getByRole("table").innerText();
      assert.ok(localTable.includes("300") && localTable.includes("330"));
      await page.getByRole("tab", { name: "Contexto", exact: true }).click();
      await page.getByLabel("Série externa do gráfico").selectOption(dollar);
      await page.getByRole("button", { name: "Aplicar filtros" }).click();
      await page.waitForURL((url) => url.searchParams.get("serie") === dollar);
      assert.ok(
        (await page.locator("#panel-contexto").innerText()).includes("10%"),
      );
      await page
        .getByRole("tab", { name: "Relação de troca", exact: true })
        .click();
      await page
        .getByLabel("Referência da arroba para relação de troca")
        .selectOption(arroba);
      await page
        .getByLabel("Referência do bezerro para relação de troca")
        .selectOption(calf);
      await page.getByRole("button", { name: "Aplicar filtros" }).click();
      await page.waitForURL((url) => url.searchParams.get("bezerro") === calf);
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
      assert.equal(await page.getByRole("tabpanel").count(), 1);
      assert.deepEqual(remoteRequests, []);
      await page.getByRole("tab", { name: "Preços", exact: true }).click();
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        if (process.env.TEST_SCREENSHOT_DIR) await page.reload();
        assert.equal(await page.locator("main").count(), 1);
        assert.equal(await page.locator("header").count(), 1);
        if (width === 1280) {
          const firstPrice = await page
            .locator("#panel-precos li")
            .first()
            .boundingBox();
          assert.ok(firstPrice && firstPrice.y + firstPrice.height < 844);
        }
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

  it("switches views instantly, updates filters without document navigation and preserves keyboard, period and region context", async () => {
    const r = resources();
    const category = await createCategory(r.database, r.fixtures.manager.id, {
      name: `Categoria UX ${randomUUID()}`,
    });
    for (const [date, value] of [
      ["2026-10-20", "300"],
      ["2026-10-26", "330"],
    ])
      await createQuote(r.database, r.fixtures.users[0].id, {
        categoryId: category.id,
        pricePerArroba: value,
        referenceDate: date,
      });
    const otherRegion = await r.database.region.create({
      data: { name: `Região UX ${randomUUID()}` },
    });
    const otherCompany = await r.database.slaughterhouse.create({
      data: { name: "Frigorífico da outra região", regionId: otherRegion.id },
    });
    const rain = await createManualSeries(r.database, r.fixtures.manager.id, {
      name: `Chuva para gráfico ${randomUUID()}`,
      metric: "RAINFALL",
      frequency: "DAILY",
      geography: "Praça de teste",
      sourceName: "Estação de teste",
      sourceUrl: "https://example.invalid/chuva",
      staleAfterDays: "7",
    });
    for (const [date, value] of [
      ["2026-10-20", "0"],
      ["2026-10-26", "20"],
    ])
      await saveManualObservation(r.database, r.fixtures.manager.id, rain.id, {
        periodStart: date,
        periodEnd: date,
        value,
        validUntil: "",
      });
    const context = await r.browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(
        `${r.origin}/painel?regiao=${r.fixtures.slaughterhouses[0].regionId}&categoria=${category.id}&inicio=2026-10-01&fim=2026-10-27`,
      );
      await page.waitForLoadState("networkidle");
      const navigationRequests: string[] = [];
      const dataRequests: string[] = [];
      page.on("request", (request) => {
        if (new URL(request.url()).searchParams.has("_rsc"))
          dataRequests.push(request.url());
        if (request.isNavigationRequest())
          navigationRequests.push(request.url());
      });
      const firstPrice = await page
        .locator("#panel-precos li")
        .first()
        .boundingBox();
      assert.ok(firstPrice && firstPrice.y + firstPrice.height < 800);
      const tab = page.getByRole("tab", { name: "Preços", exact: true });
      await tab.focus();
      await tab.press("ArrowRight");
      await page.locator("#panel-evolucao").waitFor({ state: "visible" });
      assert.equal(
        await page
          .locator("#tab-evolucao")
          .evaluate((node) => node === document.activeElement),
        true,
      );
      assert.equal(await page.getByRole("tabpanel").count(), 1);
      assert.deepEqual(dataRequests, []);
      assert.equal(
        await page.getByLabel("Categoria", { exact: true }).inputValue(),
        category.id,
      );
      const localChart = page.locator("#panel-evolucao figure");
      const slider = localChart.getByRole("slider");
      await slider.focus();
      await slider.press("Home");
      assert.ok(
        (await localChart.locator("output").innerText()).includes("300 R$/@"),
      );
      await slider.press("ArrowRight");
      assert.ok(
        (await localChart.locator("output").innerText()).includes("330 R$/@"),
      );
      const svg = localChart.locator("svg:visible");
      const bounds = await svg.boundingBox();
      assert.ok(bounds);
      await page.mouse.move(
        bounds.x + bounds.width * 0.08,
        bounds.y + bounds.height * 0.3,
      );
      assert.ok(
        (await localChart.locator("output").innerText()).includes("300 R$/@"),
      );
      await page.getByRole("link", { name: "30 dias", exact: true }).click();
      await page.waitForURL(
        (url) => url.searchParams.get("inicio") === "2026-09-28",
      );
      await page.waitForFunction(
        () =>
          document
            .querySelector('form[aria-label="Filtros do painel"]')
            ?.getAttribute("aria-busy") === "false",
      );
      await page.getByLabel("Fim do período").fill("2026-09-20");
      await page
        .getByRole("alert")
        .filter({ hasText: "A consulta anterior foi mantida" })
        .waitFor();
      assert.equal(new URL(page.url()).searchParams.get("fim"), "2026-10-27");
      assert.equal(
        await page.getByLabel("Fim do período").inputValue(),
        "2026-09-20",
      );
      await page.getByLabel("Fim do período").fill("2026-10-26");
      await page.waitForURL(
        (url) => url.searchParams.get("fim") === "2026-10-26",
      );
      await page.getByRole("link", { name: "30 dias", exact: true }).click();
      await page.waitForURL(
        (url) => url.searchParams.get("fim") === "2026-10-27",
      );
      await page.getByRole("tab", { name: "Contexto", exact: true }).click();
      await page.getByLabel("Série externa do gráfico").selectOption(rain.id);
      await page.waitForURL((url) => url.searchParams.get("serie") === rain.id);
      await page.waitForFunction(
        () =>
          document
            .querySelector('form[aria-label="Filtros do painel"]')
            ?.getAttribute("aria-busy") === "false",
      );
      const externalChart = page.locator("#panel-contexto figure");
      assert.ok(
        (await externalChart.innerText()).includes(
          "Barras: total observado por período",
        ),
      );
      assert.equal(
        await externalChart.locator("svg:visible polyline").count(),
        0,
      );
      assert.ok(
        (await externalChart.locator("output").innerText()).includes("20 mm"),
      );
      assert.equal(
        await page.getByLabel("Início do período").inputValue(),
        "2026-09-28",
      );
      await page.getByRole("tab", { name: "Evolução", exact: true }).click();
      assert.equal(
        await page.getByLabel("Categoria", { exact: true }).inputValue(),
        category.id,
      );
      await page.getByLabel("Categoria", { exact: true }).selectOption("");
      await page.waitForURL((url) => url.searchParams.get("categoria") === "");
      await page
        .getByText(
          "Dados insuficientes. Escolha uma categoria específica e um frigorífico ativo na região.",
          { exact: true },
        )
        .waitFor();
      // A slower filter response must not undo a view selected in the meantime.
      await page.route("**/painel?**", async (route) => {
        if (
          new URL(route.request().url()).searchParams.get("categoria") ===
          category.id
        )
          await new Promise((resolve) => setTimeout(resolve, 250));
        await route.continue();
      });
      await page
        .getByLabel("Categoria", { exact: true })
        .selectOption(category.id);
      await page.getByRole("tab", { name: "Contexto", exact: true }).click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('form[aria-label="Filtros do painel"]')
            ?.getAttribute("aria-busy") === "false",
      );
      assert.equal(await page.locator("#panel-contexto").isVisible(), true);
      assert.equal(new URL(page.url()).searchParams.get("visao"), "contexto");
      assert.equal(
        new URL(page.url()).searchParams.get("categoria"),
        category.id,
        "latest filter remains in URL after changing views during a request",
      );
      assert.equal(
        await page.locator("#dashboard-category").inputValue(),
        category.id,
        "latest filter remains applied after changing views during a request",
      );
      await page.unrouteAll({ behavior: "wait" });
      await page.getByRole("tab", { name: "Evolução", exact: true }).click();
      await page.locator("#panel-evolucao").waitFor({ state: "visible" });
      await page.getByLabel("Região", { exact: true }).focus();
      await page
        .getByLabel("Região", { exact: true })
        .selectOption(otherRegion.id);
      await page.waitForURL(
        (url) => url.searchParams.get("regiao") === otherRegion.id,
      );
      await page.waitForFunction(
        (id) =>
          (document.querySelector("#dashboard-company") as HTMLSelectElement)
            ?.value === id,
        otherCompany.id,
      );
      assert.equal(
        await page.getByLabel("Frigorífico do gráfico").inputValue(),
        otherCompany.id,
      );
      assert.equal(
        await page
          .getByLabel("Região", { exact: true })
          .evaluate((node) => node === document.activeElement),
        true,
        JSON.stringify(
          await page.evaluate(() => ({
            url: location.href,
            active: document.activeElement?.id,
            view: document
              .querySelector(".dashboard")
              ?.getAttribute("data-view"),
          })),
        ),
      );
      await page.getByRole("tab", { name: "Preços", exact: true }).click();
      await page
        .getByLabel("Comparar com outra região")
        .selectOption(r.fixtures.slaughterhouses[0].regionId);
      await page.waitForURL(
        (url) =>
          url.searchParams.get("comparar") ===
          r.fixtures.slaughterhouses[0].regionId,
      );
      await page.waitForFunction(
        () => document.querySelectorAll("#panel-precos h3").length === 2,
      );
      await page.getByRole("tab", { name: "Contexto", exact: true }).click();
      await page.waitForURL(
        (url) => url.searchParams.get("visao") === "contexto",
      );
      await page.waitForFunction(
        () =>
          document
            .querySelector('form[aria-label="Filtros do painel"]')
            ?.getAttribute("aria-busy") === "false",
      );
      await page.goBack();
      await page.waitForURL(
        (url) => url.searchParams.get("visao") === "precos",
      );
      assert.equal(
        new URL(page.url()).searchParams.get("visao"),
        "precos",
        `Back destination: ${page.url()}`,
      );
      await page.locator("#panel-precos").waitFor({ state: "visible" });
      assert.equal(
        await page.locator("#dashboard-category").inputValue(),
        new URL(page.url()).searchParams.get("categoria"),
        "restored form matches history URL",
      );
      const touch = await r.browser.newContext({
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      });
      try {
        const mobile = await touch.newPage();
        await mobile.goto(
          `${r.origin}/painel?visao=evolucao&regiao=${r.fixtures.slaughterhouses[0].regionId}&categoria=${category.id}&inicio=2026-10-01&fim=2026-10-27`,
        );
        await mobile.waitForLoadState("networkidle");
        const graph = mobile.locator("#panel-evolucao figure");
        await graph.locator("svg:visible").scrollIntoViewIfNeeded();
        const plot = await graph.locator("svg:visible").boundingBox();
        assert.ok(plot);
        await mobile.touchscreen.tap(
          plot.x + plot.width * 0.2,
          plot.y + plot.height * 0.4,
        );
        assert.ok(
          (await graph.locator("output").innerText()).includes("300 R$/@"),
        );
      } finally {
        await touch.close();
      }
      assert.deepEqual(navigationRequests, []);
      assert.deepEqual(errors, []);
      await page.getByRole("tab", { name: "Preços", exact: true }).click();
      await page.locator("#panel-precos").waitFor({ state: "visible" });
      await page
        .getByLabel("Região", { exact: true })
        .selectOption(r.fixtures.slaughterhouses[0].regionId);
      await page.waitForURL(
        (url) =>
          url.searchParams.get("regiao") ===
          r.fixtures.slaughterhouses[0].regionId,
      );
      await page.waitForFunction(
        () =>
          document
            .querySelector('form[aria-label="Filtros do painel"]')
            ?.getAttribute("aria-busy") === "false",
      );
      assert.equal(
        await page.locator("#panel-precos").isVisible(),
        true,
        `selected view after changing region: ${page.url()}`,
      );
      await page
        .getByLabel("Categoria", { exact: true })
        .selectOption(category.id);
      await page.waitForURL(
        (url) => url.searchParams.get("categoria") === category.id,
      );
      await page.waitForFunction(
        () =>
          document
            .querySelector('form[aria-label="Filtros do painel"]')
            ?.getAttribute("aria-busy") === "false",
      );
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        for (const view of [
          "Preços",
          "Evolução",
          "Contexto",
          "Relação de troca",
        ]) {
          await page.getByRole("tab", { name: view, exact: true }).click();
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          if (process.env.TEST_SCREENSHOT_DIR) {
            // Flush layout after tab changes before measuring the full document.
            await page.evaluate(
              () =>
                new Promise<void>((resolve) =>
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => resolve()),
                  ),
                ),
            );
            await mkdir(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
            await page.screenshot({
              path: join(
                process.env.TEST_SCREENSHOT_DIR,
                `f7-ux-${view}-${width}.png`,
              ),
              fullPage: true,
              animations: "disabled",
            });
          }
        }
      }
      await page.reload();
      await page.locator("#panel-troca").waitFor({ state: "visible" });
      assert.equal(
        await page.locator("#dashboard-category").inputValue(),
        new URL(page.url()).searchParams.get("categoria"),
      );
      await page
        .getByRole("navigation", { name: "Navegação principal" })
        .getByRole("link", { name: "Painel", exact: true })
        .click();
      await page.waitForURL(
        (url) => url.pathname === "/painel" && url.search === "",
      );
      await page.locator("#panel-precos").waitFor({ state: "visible" });
    } finally {
      await context.close();
      await r.database.externalObservation.deleteMany({
        where: { seriesId: rain.id },
      });
      await r.database.externalSeries.delete({ where: { id: rain.id } });
      await r.database.slaughterhouse.delete({
        where: { id: otherCompany.id },
      });
      await r.database.region.delete({ where: { id: otherRegion.id } });
    }
  });

  it("keeps all current quotes available through compact list expansion without JavaScript", async () => {
    const r = resources();
    const names: string[] = [];
    for (let index = 0; index < 6; index++) {
      const name = `Categoria da lista ${index} ${randomUUID()}`;
      const category = await createCategory(r.database, r.fixtures.manager.id, {
        name,
      });
      names.push(name);
      await createQuote(r.database, r.fixtures.users[0].id, {
        categoryId: category.id,
        pricePerArroba: String(300 + index),
        referenceDate: "2026-10-26",
      });
    }
    const context = await r.browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(
        `${r.origin}/painel?regiao=${r.fixtures.slaughterhouses[0].regionId}`,
      );
      const panel = page.locator("#panel-precos");
      assert.equal(await panel.locator("li:visible").count(), 5);
      const count = await panel.locator("li").count();
      assert.ok(count >= 6);
      await panel.locator("summary").filter({ hasText: "Ver mais" }).click();
      assert.equal(await panel.locator("li:visible").count(), count);
      for (const name of names)
        assert.ok(await panel.getByText(name, { exact: true }).isVisible());
    } finally {
      await context.close();
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
        .getByRole("button", { name: "Simular cenário", exact: true })
        .click();
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
        .getByRole("button", { name: "Editar premissas", exact: true })
        .click();
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

  it("keeps simulator drafts through modal steps, validates fields, traps focus and confirms a negative scenario", async () => {
    const r = resources();
    const context = await r.browser.newContext();
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      const sensitiveUrls: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (
          ["liveWeight", "yieldPercent", "arrobaPrice", "totalCost"].some(
            (key) => new URL(request.url()).searchParams.has(key),
          )
        )
          sensitiveUrls.push(request.url());
      });
      await page.goto(`${r.origin}/simulador`);
      await page.waitForLoadState("networkidle");
      const trigger = page.getByRole("button", {
        name: "Simular cenário",
        exact: true,
      });
      const modal = page.getByRole("dialog", {
        name: "Premissas da simulação",
        exact: true,
      });
      assert.equal(await modal.count(), 0);
      await trigger.click();
      await modal.waitFor({ state: "visible" });
      await modal
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      assert.equal(await modal.getByRole("alert").count(), 2);
      await page
        .getByLabel("Peso vivo por animal (kg)", { exact: true })
        .fill("500");
      await page
        .getByLabel("Rendimento de carcaça (%)", { exact: true })
        .fill("101");
      await modal
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      assert.equal(
        await page
          .getByLabel("Rendimento de carcaça (%)", { exact: true })
          .getAttribute("aria-invalid"),
        "true",
      );
      assert.equal(
        await page
          .getByLabel("Preço da arroba (R$/@)", { exact: true })
          .isVisible(),
        false,
      );
      await page
        .getByLabel("Rendimento de carcaça (%)", { exact: true })
        .fill("55");
      await modal
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      await page
        .getByLabel("Preço da arroba (R$/@)", { exact: true })
        .fill("300");
      await page
        .getByLabel("Custo total por animal (R$)", { exact: true })
        .fill("6000");
      await page
        .getByLabel("Preço alternativo da arroba (R$/@, opcional)", {
          exact: true,
        })
        .fill("270");
      await modal.getByRole("button", { name: "Voltar", exact: true }).click();
      assert.equal(
        await page
          .getByLabel("Peso vivo por animal (kg)", { exact: true })
          .inputValue(),
        "500",
      );
      assert.equal(
        await page
          .getByLabel("Rendimento de carcaça (%)", { exact: true })
          .inputValue(),
        "55",
      );
      await modal
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
      assert.equal(
        await page
          .getByLabel("Custo total por animal (R$)", { exact: true })
          .inputValue(),
        "6000",
      );
      await modal
        .getByRole("button", {
          name: "Fechar Premissas da simulação",
          exact: true,
        })
        .click();
      await modal.waitFor({ state: "hidden" });
      assert.ok(
        await trigger.evaluate((node) => node === document.activeElement),
      );
      await trigger.click();
      assert.equal(
        await page
          .getByLabel("Custo total por animal (R$)", { exact: true })
          .inputValue(),
        "6000",
      );
      await page.keyboard.press("Escape");
      await modal.waitFor({ state: "hidden" });
      await trigger.click();
      await page.waitForFunction(() =>
        document.activeElement?.closest("dialog")?.hasAttribute("open"),
      );
      await page
        .locator("header a")
        .first()
        .evaluate((node) => (node as HTMLElement).focus());
      assert.ok(
        await modal.evaluate((node) => node.contains(document.activeElement)),
        JSON.stringify(
          await modal.evaluate((node) => ({
            modal: node.matches(":modal"),
            open: node.hasAttribute("open"),
            expanded: node.closest("details")?.open,
            active: document.activeElement?.outerHTML.slice(0, 220),
          })),
        ),
      );
      const close = modal.getByRole("button", {
        name: "Fechar Premissas da simulação",
        exact: true,
      });
      await close.focus();
      await page.keyboard.press("Shift+Tab");
      assert.ok(
        await modal.evaluate((node) => node.contains(document.activeElement)),
      );
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 568 });
        // Fresh paint avoids Chrome top-layer capture artifacts after resizing.
        await page.reload();
        await page.waitForLoadState("networkidle");
        await trigger.click();
        await page.waitForFunction(
          () =>
            document.querySelector("dialog")?.matches(":modal") &&
            document.activeElement?.getAttribute("name") === "liveWeight",
        );
        await page
          .getByLabel("Peso vivo por animal (kg)", { exact: true })
          .fill("500");
        await page
          .getByLabel("Rendimento de carcaça (%)", { exact: true })
          .fill("55");
        await modal
          .getByRole("button", { name: "Continuar", exact: true })
          .click();
        await page
          .getByLabel("Preço da arroba (R$/@)", { exact: true })
          .fill("300");
        await page
          .getByLabel("Custo total por animal (R$)", { exact: true })
          .fill("6000");
        await page
          .getByLabel("Preço alternativo da arroba (R$/@, opcional)", {
            exact: true,
          })
          .fill("270");
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
        if (width === 320)
          assert.ok(
            await modal
              .locator("div")
              .first()
              .evaluate((node) => node.scrollHeight > node.clientHeight),
          );
        if (process.env.TEST_SCREENSHOT_DIR) {
          await mkdir(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({
            path: join(
              process.env.TEST_SCREENSHOT_DIR,
              `simulation-modal-${width}.png`,
            ),
            animations: "disabled",
          });
        }
      }
      await page.route("**/simulador", async (route) => {
        if (route.request().method() === "POST")
          await new Promise((resolve) => setTimeout(resolve, 400));
        await route.continue();
      });
      await modal
        .getByRole("button", { name: "Calcular cenário", exact: true })
        .click();
      await modal
        .getByRole("button", { name: "Calculando…", exact: true })
        .waitFor();
      assert.ok(await close.isDisabled());
      await page.keyboard.press("Escape");
      assert.ok(await modal.isVisible());
      await page
        .getByText("O cenário apresenta margem negativa.", { exact: true })
        .waitFor();
      await modal.waitFor({ state: "hidden" });
      assert.ok((await page.locator("main").innerText()).includes("-500,00"));
      assert.ok(
        await page
          .locator("#simulation-result")
          .evaluate((node) => node.parentElement === document.activeElement),
      );
      await page
        .getByRole("button", { name: "Editar premissas", exact: true })
        .click();
      assert.equal(
        await page
          .getByLabel("Custo total por animal (R$)", { exact: true })
          .inputValue(),
        "6000",
      );
      assert.deepEqual(sensitiveUrls, []);
      assert.deepEqual(errors, []);
      await page.unrouteAll({ behavior: "wait" });
    } finally {
      await context.close();
    }
  });
}
