import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";
import { after, before, describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type Browser } from "playwright";

import { getDatabase } from "@/lib/db";

import { createAuthFixtures } from "./helpers/auth-fixtures";
import { getTestDatabaseUrl } from "./helpers/database";
import { registerManagementBrowserTests } from "./management-browser";
import { registerQuoteBrowserTests } from "./quotes-browser";
import { registerExternalDataBrowserTests } from "./external-data-browser";

const origin = "http://localhost:3100";
const originalDatabaseUrl = process.env.DATABASE_URL;
let server: ChildProcess | undefined;
let logs = "";
let browser: Browser | undefined;
let database: ReturnType<typeof getDatabase> | undefined;
let fixtures: Awaited<ReturnType<typeof createAuthFixtures>> | undefined;

describe(
  "Login, management and public quote browser regression",
  { concurrency: false, timeout: 120_000 },
  () => {
    before(async () => {
      const testDatabaseUrl = getTestDatabaseUrl();
      // Refuse to test an unrelated application already listening at this address.
      const probe = createServer();
      await new Promise<void>((resolve, reject) => {
        probe.once("error", reject);
        probe.listen(3100, "127.0.0.1", () =>
          probe.close((error) => (error ? reject(error) : resolve())),
        );
      });

      server = spawn(
        process.execPath,
        [
          "node_modules/next/dist/bin/next",
          process.env.TEST_APP_MODE === "production" ? "start" : "dev",
          "--hostname",
          "127.0.0.1",
          "--port",
          "3100",
        ],
        {
          detached: process.platform !== "win32",
          stdio: ["ignore", "pipe", "pipe"],
          env: {
            ...process.env,
            DATABASE_URL: testDatabaseUrl,
            BETTER_AUTH_URL: origin,
            BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
          },
        },
      );
      for (const stream of [server.stdout, server.stderr]) {
        stream?.on("data", (chunk: Buffer) => {
          logs = (logs + chunk.toString()).slice(-30_000);
        });
      }

      let ready = false;
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (server.exitCode !== null)
          throw new Error(
            "O servidor de teste encerrou. Pare outros servidores Next.js deste repositório antes de testar.",
          );
        try {
          ready = (
            await fetch(`${origin}/login`, {
              signal: AbortSignal.timeout(2_000),
            })
          ).ok;
        } catch {
          /* Startup is still in progress. */
        }
        if (ready) break;
        await delay(200);
      }
      assert.ok(
        ready,
        "Servidor de teste não ficou disponível em loopback:3100.",
      );
      process.env.DATABASE_URL = testDatabaseUrl;
      database = getDatabase();
      fixtures = await createAuthFixtures(database);
      browser = await chromium.launch({
        headless: true,
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      });
    });

    after(async () => {
      await browser?.close();
      if (
        server?.pid &&
        server.exitCode === null &&
        server.signalCode === null
      ) {
        const stopped = once(server, "exit");
        if (process.platform === "win32") server.kill("SIGTERM");
        else process.kill(-server.pid, "SIGTERM");
        await stopped;
      }
      await fixtures?.cleanup();
      if (database) {
        await database.rateLimit.deleteMany({
          where: {
            OR: [
              {
                key: {
                  in: ["127.0.0.1|/sign-in/email", "127.0.0.1|/sign-out"],
                },
              },
              { key: { startsWith: "198.18.10." } },
            ],
          },
        });
        await database.$disconnect();
      }
      if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDatabaseUrl;
    });

    it("logs in and out without JavaScript, without ever submitting credentials in a URL", async () => {
      const context = await browser!.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      let credentialsInUrl = false;
      const submissions: Array<{ method: string; path: string }> = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.searchParams.has("password") || url.searchParams.has("email"))
          credentialsInUrl = true;
        if (url.pathname.startsWith("/api/auth/"))
          submissions.push({ method: request.method(), path: url.pathname });
      });
      await page.goto("http://127.0.0.1:3100/login");
      assert.equal(new URL(page.url()).origin, origin);
      assert.equal(await page.locator("form").getAttribute("method"), "post");

      await page
        .getByLabel("E-mail", { exact: true })
        .fill(fixtures!.manager.email);
      await page
        .getByLabel("Senha", { exact: true })
        .fill("incorrect-password");
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.locator("#login-error").waitFor();
      assert.equal(
        await page.locator("#login-error").textContent(),
        "E-mail ou senha inválidos.",
      );
      assert.equal(new URL(page.url()).search, "?erro=credenciais");

      await page
        .getByLabel("E-mail", { exact: true })
        .fill(fixtures!.manager.email);
      await page.getByLabel("Senha", { exact: true }).fill(fixtures!.password);
      await page.getByLabel("Senha", { exact: true }).press("Enter");
      await page.waitForURL(`${origin}/gestor`);
      await page
        .getByRole("heading", { name: "Área do gestor", exact: true })
        .waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.reload();
      assert.equal(new URL(page.url()).pathname, "/gestor");
      await page.getByRole("button", { name: "Sair", exact: true }).click();
      await page.waitForURL(`${origin}/login`);
      await page.goto(`${origin}/gestor`);
      assert.equal(new URL(page.url()).pathname, "/login");
      assert.equal(credentialsInUrl, false);
      assert.deepEqual(submissions, [
        { method: "POST", path: "/api/auth/login" },
        { method: "POST", path: "/api/auth/login" },
        { method: "POST", path: "/api/auth/logout" },
      ]);
      await context.close();
    });

    it("preserves the enhanced login, session reload and wrong-role protection", async () => {
      const context = await browser!.newContext();
      const page = await context.newPage();
      await page.goto(`${origin}/login`);
      await page.waitForLoadState("networkidle");
      await page
        .getByLabel("E-mail", { exact: true })
        .fill(fixtures!.manager.email);
      await page.getByLabel("Senha", { exact: true }).fill(fixtures!.password);
      const signedIn = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/auth/sign-in/email",
      );
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      assert.equal((await signedIn).status(), 200);
      await page.waitForURL(`${origin}/gestor`);
      const response = await page.reload();
      assert.match(response!.headers()["cache-control"], /no-store/);
      await page.goto(`${origin}/frigorifico`);
      assert.equal(new URL(page.url()).pathname, "/acesso-negado");
      await page.goto(`${origin}/acesso`);
      await page.getByRole("button", { name: "Sair", exact: true }).click();
      await page.waitForURL(`${origin}/login`);
      await context.close();
    });

    it("authenticates a slaughterhouse without JavaScript and keeps its own identity", async () => {
      const context = await browser!.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(`${origin}/login`);
      await page
        .getByLabel("E-mail", { exact: true })
        .fill(fixtures!.users[0].email);
      await page.getByLabel("Senha", { exact: true }).fill(fixtures!.password);
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await page.waitForURL(`${origin}/frigorifico`);
      const content = await page.locator("main").innerText();
      assert.ok(content.includes(fixtures!.slaughterhouses[0].name));
      assert.ok(!content.includes(fixtures!.slaughterhouses[1].name));
      await page.getByRole("button", { name: "Sair", exact: true }).click();
      await page.waitForURL(`${origin}/login`);
      await context.close();
    });

    it("cleans a legacy credential URL without echoing its fields or logging its marker", async () => {
      const context = await browser!.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      const marker = "LOGIN_QUERY_REGRESSION_FIXTURE";
      await page.goto(
        `${origin}/login?email=legacy%40example.invalid&password=${marker}`,
      );
      assert.equal(page.url(), `${origin}/login?erro=reenvio`);
      assert.ok(!(await page.content()).includes(marker));
      await delay(100);
      assert.ok(
        !logs.includes(marker),
        "Campo sensível apareceu no log de desenvolvimento.",
      );
      await context.close();
    });

    registerQuoteBrowserTests(() => ({
      browser: browser!,
      database: database!,
      fixtures: fixtures!,
      origin,
    }));

    registerExternalDataBrowserTests(() => ({
      browser: browser!,
      database: database!,
      fixtures: fixtures!,
      origin,
    }));

    registerManagementBrowserTests(() => ({
      browser: browser!,
      database: database!,
      fixtures: fixtures!,
      origin,
      logs: () => logs,
    }));
  },
);
