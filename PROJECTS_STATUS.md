# PROJECTS_STATUS.md — Histórico vivo

**Regra:** atualizar após **cada tarefa executada**, preservando todas as entradas. Ver `AGENTS.md`. O status é a fonte de verdade do andamento.

## Estado atual
- Data de referência: 2026-10-26.
- Fase atual: **F2 — login e permissões**.
- Etapa atual: **F2-T01 — IMPLEMENTADA_AGUARDANDO_VALIDACAO (correção do login concluída)**.
- Aprovação do usuário: **F0-T01 e F1-T01 VALIDADAS**; validação final da F2-T01 **PENDENTE**.
- Implementações concluídas: **F0-T01 e F1-T01 VALIDADAS**; **F2-T01 corrigida após falha reportada**, aguardando nova validação humana.
- Commit da F0-T01: `d42c693` — `chore(setup): initialize Next.js project foundation`.
- Testes atuais da F2-T01: **27 de autenticação + 8 de banco + 4 de navegador aprovados**; navegador repetido em desenvolvimento e produção, com JavaScript desativado/ativado, POST/Enter, origem canônica e proteção de URLs/logs. Lint, typecheck, formatação, build, instalação limpa e auditoria npm aprovados; detalhes no histórico.
- Commit da F1-T01: `c9650fd` — `feat(database): add PostgreSQL schema and initial migration`.
- Commit original da F2-T01: `746e44d` — `feat(auth): add login and role-based access`; correção em análise.
- Commit da correção: `fix(auth): make login work before hydration`; hash: consultar Git após o commit.
- Próxima ação: usuário substituir a senha usada na tentativa anterior pelo comando local, testar o login corrigido e validar a F2-T01; F3-T01 não iniciada.

## Quadro de etapas
| ID | Etapa | Estado | Commit | Validação do usuário |
|---|---|---|---|---|
| F0-T01 | Inspeção e fundação do projeto | VALIDADA | `d42c693` | CONFIRMADA em 2026-10-26 |
| F1-T01 | Banco e modelo inicial | VALIDADA | `c9650fd` | CONFIRMADA em 2026-10-26 |
| F2-T01 | Login e permissões | IMPLEMENTADA_AGUARDANDO_VALIDACAO | `746e44d` + correção `fix(auth)`; hash: consultar Git | PENDENTE |
| F3-T01 | Gestor: cadastro de frigoríficos | PENDENTE | — | PENDENTE |
| F4-T01 | Frigorífico: cadastro/atualização de cotações | PENDENTE | — | PENDENTE |
| F5-T01 | Agregação regional e consulta pública | PENDENTE | — | PENDENTE |
| F6-T01 | Integrações externas e cadastro manual | PENDENTE | — | PENDENTE |
| F7-T01 | Gráficos, indicadores e simulador | PENDENTE | — | PENDENTE |
| F8-T01 | Homologação e deploy | PENDENTE | — | PENDENTE |

Estados permitidos: `PENDENTE`, `EM_ANDAMENTO`, `BLOQUEADA`, `IMPLEMENTADA_AGUARDANDO_VALIDACAO`, `VALIDADA`.

## Decisões confirmadas
- Portal público, sem login para consulta.
- Gestor cadastra frigoríficos e acessos; frigoríficos informam/atualizam cotações próprias.
- Público vê **somente indicadores regionais**, sem identificação ou preços individuais de frigoríficos.
- Dados externos por APIs/fontes públicas, com entrada manual pelo gestor quando necessário.
- Next.js + TypeScript, PostgreSQL, Prisma, deploy planejado na Vercel.
- Produto simples: sem marketplace, IA, microserviços ou alertas avançados no MVP.
- Cada etapa é implementada, testada, commitada e submetida à validação humana **antes** da seguinte.
- Autenticação por e-mail/senha com Better Auth e sessões PostgreSQL; sem cadastro público ou serviço externo de autenticação.

## Questões ainda abertas
- Nome/identidade visual definitiva.
- Regiões e categorias comerciais iniciais.
- Critérios seguros de publicação agregada e eventual revisão concorrencial.
- Provedor hospedado do banco, domínio HTTPS e segredos de produção; desenvolvimento usa PostgreSQL local e Better Auth com sessões no banco.
- Licenças e endpoints das fontes externas.
- Parâmetros e fórmulas comerciais do simulador.

## Histórico imutável (acrescentar entradas; não apagar)
### 2026-10-26 — DOC-001 — Kit de instruções para Codex
- Resultado: documentos Markdown de orientação produzidos; **nenhum código de aplicação foi gerado neste pacote**.
- Testes: nenhum teste de aplicação executado.
- Git: nenhum commit executado.
- Próximo passo: F0-T01.

## Modelo para cada execução
### AAAA-MM-DD — F?-T?? — Título
- **Estado:** EM_ANDAMENTO / BLOQUEADA / IMPLEMENTADA_AGUARDANDO_VALIDACAO / VALIDADA
- **Objetivo e critérios de aceite:**
- **Arquivos alterados:**
- **Implementação e decisões:**
- **Testes executados (comando → resultado):**
- **Testes não executados e motivo:**
- **Commit Conventional Commits:** tipo/escopo/mensagem/hash (ou “não realizado”)
- **Como validar manualmente:**
- **Pendências/bloqueios:**
- **Aprovação do usuário:** pendente / confirmada em AAAA-MM-DD
- **Próximo passo autorizado:**

### 2026-10-26 — F0-T01 — Inspeção e fundação do projeto
- **Estado:** EM_ANDAMENTO.
- **Objetivo e critérios de aceite:** inicializar Next.js/TypeScript, definir organização inicial e entregar página simples; aplicação local e lint/typecheck/build funcionais.
- **Inspeção:** repositório em `main`, sem commits, somente kit Markdown não rastreado; sem remoto. Node.js `v24.18.0`, npm `11.16.0` e identidade Git disponíveis. Contrato e todos os documentos de `docs/` lidos.
- **Arquivos em implementação:** `src/app/{layout.tsx,page.tsx,globals.css}`, configurações de Next.js/TypeScript/ESLint/PostCSS, `package.json`, lockfile, `.gitignore`, `.prettierignore`, `.nvmrc`, `README.md` e este status.
- **Decisões:** App Router, TypeScript estrito, Tailwind com tokens documentados; página pública sem dados fictícios; fonte do sistema sem download externo. Dependências de banco, autenticação, gráficos e componentes adicionais somente quando suas etapas exigirem.
- **Testes executados:** verificações de aplicação ainda pendentes; instalação das dependências em andamento.
- **Commit Conventional Commits:** não realizado.
- **Pendências:** concluir verificações, registrar resultados finais e criar um único commit da F0-T01.
- **Aprovação do usuário:** pendente; nenhuma etapa seguinte autorizada.

### 2026-10-26 — F0-T01 — Conclusão técnica e submissão à validação
- **Estado:** IMPLEMENTADA_AGUARDANDO_VALIDACAO.
- **Objetivo e critérios de aceite:** fundação Next.js/TypeScript com organização inicial, página pública simples e execução local; lint/typecheck/build aprovados. Somente F0-T01 implementada.
- **Arquivos da implementação:**
  - `package.json`, `package-lock.json`: scripts e dependências; Next.js `16.4.3`, React `19.3.1`, TypeScript `5.9.3`, Tailwind `4.3.3`, ESLint `10.13.0`, Prettier `3.9.10`.
  - `.nvmrc`, `.gitignore`, `.prettierignore`: Node.js 24, exclusão de artefatos/segredos e preservação dos documentos originais na formatação.
  - `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`: TypeScript estrito, alias `@/*`, App Router, lint e Tailwind.
  - `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/icon.svg`: idioma/metadados, página inicial responsiva, tokens visuais e ícone da aba.
  - `README.md`: requisitos, instalação, comandos, organização e roteiro de teste manual.
  - `PROJECTS_STATUS.md`: andamento e conclusão técnica, com histórico preservado.
  - O primeiro commit também versiona o kit documental original (`AGENTS.md`, `CODEX_START_PROMPT.md`, `docs/*.md`), antes não rastreado; seu conteúdo foi preservado.
- **Implementação e decisões:**
  - Inicialização manual mínima no repositório existente, preservando a documentação; npm com lockfile e Node.js 24/npm 11 para reproduzir o ambiente verificado.
  - Página estática em português, Server Component, sem cotações fictícias; mensagem “Dados insuficientes” e compromisso de publicação regional consolidada. Não há banco, login, APIs ou regras de agregação nesta etapa.
  - Tokens do design system, layout de até 1200px, fonte sans-serif do sistema, link de salto e foco visível. Fonte sem download externo no build.
  - Organização inicial em `src/app`; componentes compartilhados e módulos por funcionalidade serão extraídos quando necessários. shadcn/ui, Prisma, autenticação, Zod e gráficos não foram instalados porque ainda não há funcionalidades que os exijam.
  - `agentRules: false` impede que `next dev` acrescente instruções ao contrato `AGENTS.md`. O bloco inserido automaticamente na primeira execução foi removido pelo próprio Next.js na execução seguinte, preservando o contrato original.
  - ESLint 9 inicialmente instalado emitiu aviso de versão sem suporte; atualizado para ESLint 10, suportado pela configuração Next.js usada. Referência: https://nextjs.org/docs/app/api-reference/config/eslint. Avisos de peer dependencies dos plugins transitivos permanecem na instalação, mas lint e `npm ci` funcionam sem flags de contorno.
- **Testes executados (comando → resultado):**
  - `npm install` → dependências instaladas e lockfile gerado; atualização posterior para ESLint 10 via `npm install --save-dev eslint@^10.0.0`.
  - `npm ci` → exit 0; 351 pacotes instalados a partir do lockfile, zero vulnerabilidades reportadas. Avisos: peer dependencies transitivas de ESLint e script de instalação de `unrs-resolver` sem cobertura pela política local do npm. Nenhuma alteração da política ou flag para ignorar resolução foi aplicada.
  - `npm run lint` → exit 0, sem erros ou avisos de lint, inclusive após ajuste da configuração Next.js.
  - `npm run typecheck` → exit 0 antes da primeira execução da aplicação e após o build; tipos de rota gerados e TypeScript sem erros.
  - `npm run format` e `npm run format:check` → exit 0; arquivos compatíveis com Prettier.
  - `npm run dev -- --hostname 127.0.0.1` → servidor pronto em `http://127.0.0.1:3000`; GET `/` 200. Servidor encerrado após o smoke.
  - `npm run build` → exit 0; compilação, TypeScript e geração estática de `/`, `/_not-found` e `/icon.svg` concluídas.
  - `npm start -- --hostname 127.0.0.1 --port 3001` → servidor de produção pronto; GET `/` 200. Servidor encerrado após o smoke.
  - `node /tmp/cotaroba-f0-qa.T9svgM/smoke.cjs http://127.0.0.1:3000` e o mesmo comando com porta `3001` → exit 0 nas versões finais: HTTP 200, título e idioma corretos, mensagem vazia presente, CSS carregado, sem formulários, sem erros de JavaScript/console, sem rolagem horizontal em 320/390/1280px, link de salto visível ao Tab e foco no conteúdo ao Enter.
  - O smoke usou Playwright com Chrome local e axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) → zero violações detectadas nas três larguras, em desenvolvimento e produção. Capturas desktop/celular inspecionadas visualmente. Ferramentas e capturas somente no diretório temporário de QA, sem adicionar dependências de testes ao projeto.
  - A primeira tentativa de QA exigiu corrigir o contexto do navegador no script temporário; a seguinte detectou um recurso 404, resolvido com `src/app/icon.svg`. Smoke repetido com sucesso após as correções.
  - `npm audit --audit-level=moderate` → exit 0; zero vulnerabilidades reportadas.
- **Testes não executados e motivo:** regras de negócio, banco, autenticação e integrações pertencem às etapas seguintes. Sem suíte unitária criada para a página estática. Auditoria automática de acessibilidade não substitui a revisão manual do usuário; outros navegadores ainda não testados.
- **Commit Conventional Commits:** `chore(setup): initialize Next.js project foundation`; hash: consultar `git log -1 --format=%h` após a criação. Implementação e este status integram o mesmo commit; o hash real será informado na entrega, conforme `docs/GIT_WORKFLOW.md`.
- **Como validar manualmente:**
  1. Com Node.js 24/npm 11, executar `npm ci` e `npm run dev`.
  2. Abrir `http://localhost:3000` sem login; conferir marca, idioma, título da aba e “Dados insuficientes”, sem preços individuais.
  3. Conferir layout em desktop e celular, sem rolagem horizontal.
  4. Pressionar Tab e conferir o link “Ir para o conteúdo” com foco visível; Enter deve mover o foco ao conteúdo principal.
  5. Opcionalmente, encerrar o dev, executar `npm run build` e `npm start`, e repetir a consulta.
- **Pendências/bloqueios:** nenhum bloqueio técnico da F0-T01; validação manual explícita pendente. Avisos transitivos da instalação documentados acima. Questões de domínio já abertas continuam reservadas às etapas correspondentes.
- **Aprovação do usuário:** PENDENTE. Sucesso técnico não equivale a validação humana.
- **Próximo passo autorizado:** aguardar teste e aprovação explícita da F0-T01; não iniciar F1-T01 automaticamente.

### 2026-10-26 — F0-T01 — Validação humana e autorização da próxima etapa
- **Estado:** VALIDADA.
- **Aprovação do usuário:** confirmação explícita “Aprovado! Pode prosseguir.” recebida em 2026-10-26.
- **Commit validado:** `d42c693` — `chore(setup): initialize Next.js project foundation`.
- **Arquivos alterados:** `PROJECTS_STATUS.md`; preservado o histórico anterior.
- **Testes:** aprovação fornecida pelo usuário; nenhum teste adicional de F0 executado nesta tarefa.
- **Próximo passo autorizado:** somente F1-T01 — PostgreSQL, Prisma, entidades mínimas e migrations.

### 2026-10-26 — F1-T01 — Inspeção e início
- **Estado:** EM_ANDAMENTO.
- **Objetivo e critérios de aceite:** PostgreSQL local, Prisma e entidades mínimas; migration reproduzível em banco novo e modelos conferidos, com testes de integração e verificações da aplicação.
- **Inspeção:** Git limpo em `main`, commit `d42c693`; Node.js 24/npm 11. Sem URLs de banco configuradas ou arquivos `.env`. Docker Desktop e Compose instalados; daemon inicialmente parado, inicialização solicitada via `open -a Docker`.
- **Plano/arquivos esperados:** `compose.yaml`, `.env.example`, configuração e schema/migrations Prisma, módulo de banco em `src/`, testes de integração, scripts npm, README e este status.
- **Decisões iniciais:** PostgreSQL somente local nesta etapa; sem contratar serviço. Tabelas de regiões/categorias sem seed de negócio para não resolver arbitrariamente questões abertas. Sem login, telas ou API pública de cotações.
- **Testes executados:** inspeção de Git/Node/npm/Docker; verificações funcionais pendentes.
- **Commit Conventional Commits:** não realizado.
- **Pendências:** confirmar Docker disponível, implementar e testar somente F1-T01.
- **Aprovação do usuário:** execução autorizada; conclusão ainda pendente de validação.
- **Próximo passo autorizado:** concluir F1-T01 e aguardar validação.

### 2026-10-26 — F1-T01 — Banco, entidades mínimas e migration inicial
- **Estado:** IMPLEMENTADA_AGUARDANDO_VALIDACAO.
- **Objetivo e critérios de aceite:** PostgreSQL + Prisma com entidades mínimas e migration reproduzível em banco de desenvolvimento; modelos conferidos e testes úteis de persistência/restrições aprovados. Somente F1-T01 implementada.
- **Arquivos alterados/criados:**
  - `compose.yaml`, `.env.example`: PostgreSQL local, volume persistente, healthcheck, porta 5433 limitada a loopback e exemplo de configuração.
  - `prisma7.config.ts`, `prisma/schema.prisma`, `prisma/migrations/migration_lock.toml`, `prisma/migrations/20261026183034_init/migration.sql`: configuração Prisma 7, quatro entidades e migration inicial versionada.
  - `src/lib/db.ts`: acesso somente no servidor, validação da URL sem expor seu conteúdo, inicialização sob demanda e reutilização de cliente/pool (máximo de cinco conexões, timeout de conexão de cinco segundos).
  - `tests/database.test.ts`: oito testes de integração em PostgreSQL real; fixtures sintéticas isoladas e revertidas em transações.
  - `package.json`, `package-lock.json`: Prisma CLI/Client/adapter-pg `7.10.1`, `pg` `8.23.1`, `dotenv`, `server-only`, `tsx`, tipos de pg e scripts de geração, migrations, Studio e testes. Projeto ESM (`type: module`).
  - `.gitignore`, `.prettierignore`, `eslint.config.mjs`: excluir cliente Prisma gerado; segredos e artefatos continuam fora do Git.
  - `README.md`: instalação, configuração, modelos, migrations, banco separado de testes e roteiro manual.
  - `PROJECTS_STATUS.md`: validação explícita da F0-T01, início e conclusão técnica da F1-T01, com histórico anterior preservado.
- **Implementação e decisões:**
  - Docker Desktop existente iniciado com `open -a Docker`; PostgreSQL `17.11` confirmado em `postgres:17-alpine`, sem contratar serviço ou selecionar provedor de produção. Criado `.env` local a partir do exemplo; arquivo ignorado pelo Git.
  - Prisma 7 fixado na versão estável `7.10.1`, com CLI/Client/adapter na mesma versão; a tag latest do CLI apontava para Prisma 8 release candidate. Usado `prisma7.config.ts` explicitamente nos scripts e adapter PostgreSQL conforme a documentação da versão 7: https://www.prisma.io/docs/v7/prisma-orm/quickstart/postgresql.
  - `Region` e `CattleCategory` têm UUID e nome único, sem seed de regiões/categorias comerciais ainda não aprovadas. `Slaughterhouse` tem nome, região atual, situação ativa e timestamps. `Quote` registra frigorífico, categoria, região de referência, preço em BRL por arroba, data civil de referência e instante de criação.
  - Preço em `NUMERIC(12,2)`, com CHECK SQL `Quote_pricePerArroba_positive`; zero e valores negativos recusados no banco. Referências usam UUID/FKs com `ON DELETE RESTRICT`. Índices contemplam vínculos e consulta futura de histórico/recortes regionais, sem implementar agregação.
  - `referenceDate` usa `DATE`; instantes usam `TIMESTAMPTZ(3)`. Região da cotação é preservada independentemente de alterações posteriores no cadastro do frigorífico.
  - O modelo comporta histórico por acréscimo de registros. O fluxo de escrita, autoria e autorização ainda será implementado nas etapas correspondentes; esta entrega não implementa imutabilidade por trigger, usuários, sessões, formulários, CRUD ou APIs. Entidades de autenticação serão definidas com o provedor em F2-T01; dados externos/indicadores aguardam suas etapas.
  - Nenhum dado de mercado ou cadastro real inserido. A página pública permanece estática e sem acesso ao banco. Importação de `server-only` impede uso acidental do módulo de banco em componentes cliente.
  - `postinstall` gera o cliente sem exigir URL ou conexão; cliente gerado fica fora do Git. Configuração e schema, em conjunto com o lockfile, permitem reproduzir o cliente.
  - Banco `cotaroba_test` separado do desenvolvimento. Testes recusam host não local, nome sem sufixo `_test` ou nome igual ao banco de desenvolvimento; URLs inválidas são tratadas com mensagem sem credenciais.
- **Testes executados (comando → resultado):**
  - `docker info --format '{{.ServerVersion}}'` → inicialmente falhou por daemon parado; após `open -a Docker`, retornou `29.8.0`. `docker compose version` → `v5.5.1`.
  - `docker compose up -d --wait db` → exit 0; container saudável. Volume local criado e PostgreSQL confirmado via `SELECT version()` como `17.11`.
  - `npm exec -- prisma format --config prisma7.config.ts`, `npm run db:generate`, `npm run db:validate` → exit 0; schema formatado/válido e cliente gerado.
  - `npm run db:migrate -- --name init --create-only` → migration `20261026183034_init` gerada; SQL revisado e CHECK de preço positivo incluído antes da primeira aplicação.
  - `npm run db:migrate` → exit 0; migration aplicada no banco novo `cotaroba`; schema sincronizado.
  - `docker compose exec -T db createdb -U cotaroba cotaroba_test` → exit 0; banco separado criado. `DATABASE_URL=postgresql://cotaroba:cotaroba_local@127.0.0.1:5433/cotaroba_test npm run db:deploy` → exit 0; mesma migration aplicada em outro banco vazio.
  - `npm run db:deploy` (banco de desenvolvimento, após instalação limpa) → exit 0, “No pending migrations to apply”. `npm run db:status` → exit 0, schema atualizado. Uma tentativa anterior de reaplicação foi iniciada enquanto `npm ci` substituía `node_modules` e falhou com `prisma: command not found`; repetida sequencialmente com sucesso após a reinstalação.
  - `docker compose exec -T db psql -U cotaroba -d cotaroba -c '\dt' -c '\d "Quote"'` → conferidas quatro entidades, tabela de migrations, `NUMERIC(12,2)`, `DATE`, timestamps, índices, FKs e CHECK de preço positivo.
  - `npm run test:db` → exit 0; **8 testes aprovados**, zero falhas/skips: configuração sem vazamento de senha; persistência decimal exata/data/histórico e cliente reutilizado; rejeição de preço zero/negativo; FK de frigorífico inexistente; exclusão bloqueada de frigorífico com cotação; região histórica preservada após mudança/desativação; nome de região único.
  - Verificação SQL de contagens em `cotaroba_test` após os testes → zero regiões, categorias, frigoríficos e cotações; rollback das fixtures confirmado.
  - Harness Python executando `npm run test:db` com três `TEST_DATABASE_URL` inválidas/inseguras (banco de desenvolvimento, host externo, URL malformada) → três recusas esperadas, sem exposição da senha de teste na saída; nenhum acesso ao host externo necessário.
  - `env -u DATABASE_URL DOTENV_CONFIG_PATH=/dev/null npm ci` → exit 0; 497 pacotes instalados, cliente Prisma gerado pelo postinstall sem URL de banco, zero vulnerabilidades reportadas. Avisos de peer dependencies transitivas do ESLint e de scripts de instalação não cobertos pela política local do npm persistem, sem alterar a política ou usar flags de resolução.
  - `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck` → exit 0, inclusive após o ajuste final do guard de configuração dos testes.
  - `npm audit --audit-level=moderate` → exit 0; zero vulnerabilidades reportadas.
  - `docker compose stop db` seguido de `npm run build` → exit 0 com PostgreSQL parado; compilação, TypeScript e geração estática de `/`, `/_not-found` e `/icon.svg` concluídas.
  - `npm start -- --hostname 127.0.0.1 --port 3001` e requisição Python `urllib.request.urlopen('http://127.0.0.1:3001')` → HTTP 200 com PostgreSQL parado; idioma pt-BR e “Dados insuficientes” presentes, sem URL de banco no HTML. Servidor de aplicação encerrado após o smoke; banco retomado com `docker compose up -d --wait db` para validação do usuário.
  - `git check-ignore .env src/generated/prisma/client.ts` → ambos ignorados, preservando credenciais e artefatos fora do commit.
- **Testes não executados e motivo:** serviços gerenciados/deploy, login/isolamento por papel, CRUD, agregação e integrações pertencem às etapas seguintes. Nenhuma alteração visual exigiu repetir a auditoria completa de navegador da F0. Prisma Studio consta no roteiro manual, sem alegar revisão humana pela ferramenta.
- **Commit Conventional Commits:** `feat(database): add PostgreSQL schema and initial migration`; hash: consultar Git após a criação. Implementação e atualização deste status no mesmo commit; hash real informado na entrega, conforme `docs/GIT_WORKFLOW.md`.
- **Como validar manualmente:**
  1. Com Docker Desktop iniciado e `.env` configurado conforme `.env.example`, executar `npm ci` e `docker compose up -d --wait db`.
  2. Executar `npm run db:validate`, `npm run db:deploy`, `npm run db:status`; repetir deploy não deve reaplicar a migration.
  3. Executar `npm run db:studio` e conferir as quatro entidades e seus campos; neste ambiente de desenvolvimento as tabelas estão sem dados de negócio.
  4. Executar `npm run test:db` (banco `cotaroba_test` já preparado neste ambiente). Em instalação nova, seguir no README a criação do banco e aplicação da migration.
  5. Executar `npm run dev`, abrir `http://localhost:3000`, conferir a página pública sem login e “Dados insuficientes”. Banco parado não deve impedir essa página.
- **Pendências/bloqueios:** nenhum bloqueio técnico da F1-T01; aprovação humana pendente. Regiões/categorias de negócio, provedor de autenticação/banco hospedado e política de publicação continuam abertos para as etapas apropriadas. Banco local foi deixado saudável; dados persistem no volume e nenhum servidor Next.js ficou em execução.
- **Aprovação do usuário:** PENDENTE para F1-T01; F0-T01 já validada explicitamente.
- **Próximo passo autorizado:** parar e aguardar validação explícita da F1-T01. Não iniciar F2-T01 automaticamente.

### 2026-10-26 — F1-T01 — Validação humana
- **Estado:** VALIDADA.
- **Aprovação do usuário:** “Aprovado! Pode prosseguir.” em 2026-10-26.
- **Commit validado:** `c9650fd` — `feat(database): add PostgreSQL schema and initial migration`.
- **Arquivos alterados:** este status, preservando o histórico.
- **Próximo passo autorizado:** somente F2-T01.

### 2026-10-26 — F2-T01 — Inspeção e início
- **Estado:** EM_ANDAMENTO.
- **Critérios de aceite:** login/logout, sessões persistidas e áreas mínimas de gestor/frigorífico protegidas por verificação no servidor; visitante sem acesso privado; permissões e bloqueios testados.
- **Inspeção:** Git limpo em `main`, commit `c9650fd`; PostgreSQL local saudável. Contrato e especificações relidos.
- **Plano e arquivos esperados:** schema/migration de autenticação, `src/features/auth/`, rotas de login/autenticação/áreas privadas, bootstrap local do primeiro gestor, testes, README, ambiente de exemplo e este status.
- **Decisão técnica:** Better Auth estável `1.7.13`, com suporte declarado a Next.js 16/Prisma 7, email/senha e sessões PostgreSQL; Auth.js v5 permanece beta. Sem serviço pago/OAuth/cadastro público; nenhuma implementação de CRUD da F3-T01.
- **Testes:** verificação inicial do Git e saúde do banco; testes da implementação pendentes.
- **Commit:** não realizado.
- **Aprovação do usuário:** execução autorizada; conclusão aguarda validação.

### 2026-10-26 — F2-T01 — Login, sessões e permissões
- **Estado:** IMPLEMENTADA_AGUARDANDO_VALIDACAO.
- **Objetivo e critérios de aceite:** login/logout e sessões persistentes, páginas privadas mínimas para gestor e frigorífico, bloqueio de visitantes e de perfis sem permissão, verificações no servidor e testes pertinentes. Somente F2-T01 implementada.
- **Arquivos alterados/criados:**
  - `prisma/schema.prisma`, `prisma/migrations/20261026185225_auth/migration.sql`: `UserRole`, `User`, `Session`, `Account`, `Verification`, `RateLimit`, relações, índices, unicidade e CHECKs de vínculo/e-mail. Modelos de domínio da F1 preservados, com relação reversa de usuários no frigorífico.
  - `src/features/auth/{auth.ts,authorization.ts,session.ts,schema.ts}`: provedor local, ambiente/validação Zod, sessões, consulta de identidade e guards no servidor.
  - `src/features/auth/{client.ts,login-form.tsx,logout-button.tsx,private-area.tsx}`: formulário com labels/autocomplete, feedback em português, logout e área privada mínima.
  - `src/features/auth/bootstrap.ts`, `scripts/create-manager.ts`: criação local e transacional do primeiro gestor, com senha mascarada e hash do provedor.
  - `src/app/login/page.tsx`, `src/app/acesso/page.tsx`, `src/app/acesso-negado/page.tsx`, `src/app/(private)/{layout.tsx,gestor/page.tsx,frigorifico/page.tsx}`, `src/app/api/auth/[...all]/route.ts`: páginas e endpoints desta etapa. Robots noindex para login/áreas privadas; cada página privada chama seu guard.
  - `src/app/page.tsx`: link funcional “Entrar” no cabeçalho público, preservando a consulta pública e o estado vazio.
  - `tests/auth.test.ts`, `tests/helpers/{database.ts,auth-fixtures.ts}`, `tests/database.test.ts`: 17 testes de autenticação, fixtures isoladas e guard de banco de teste compartilhado com os oito testes anteriores.
  - `package.json`, `package-lock.json`: Better Auth `1.7.13`, Zod `4.6.7`, `@inquirer/password` `5.2.4` e comandos `auth:create-manager`/`test:auth`.
  - `.env.example`, `README.md`, `PROJECTS_STATUS.md`: configuração sem segredo real, arquitetura, limitações desta etapa, roteiro manual, aprovação da F1 e resultados reais da F2.
- **Implementação e decisões:**
  - Better Auth estável com adapter Prisma, usando o PostgreSQL já existente, sem serviço pago/OAuth/envio de e-mails. A especificação permite escolher biblioteca madura compatível no momento da implementação; Auth.js v5 estava em beta (`5.0.0-beta.32`), enquanto Better Auth `1.7.13` declara compatibilidade com Next.js 16 e Prisma 7. Referências: https://better-auth.com/docs/adapters/prisma e https://authjs.dev/getting-started.
  - Cadastro público desabilitado no provedor. O Route Handler expõe apenas POST `/api/auth/sign-in/email` e POST `/api/auth/sign-out`; outros caminhos/métodos recebem 404. Consulta de sessão ocorre internamente no servidor. Nenhum endpoint de cadastro, alteração de perfil, listagem de sessões ou administração de usuários foi publicado.
  - Login usa cliente HTTP do provedor para que o ratelimit se aplique. Chamadas diretas `auth.api` não recebem o ratelimit nativo e não são usadas para login em Server Action. Origem confiável única e explícita; CSRF/origem tratados pelo provedor. Referência: https://better-auth.com/docs/concepts/rate-limit.
  - Senhas com 12–128 caracteres no provisionamento, hash/verificação fornecidos pelo Better Auth; sem implementação própria de criptografia. Primeiro gestor criado apenas por comando local com senha mascarada, fora dos argumentos, arquivos e logs. Lock transacional PostgreSQL e verificação de gestor existente impedem bootstrap duplicado.
  - Nenhum usuário/senha padrão ou gestor real criado automaticamente. Gerado segredo aleatório de 32 bytes em `.env` local, ignorado no Git; origem local `http://localhost:3000`. Provedor exige segredo de pelo menos 32 caracteres e HTTPS fora de loopback; telemetria desabilitada. Segredos de produção continuam reservados ao deploy.
  - Sessão no banco, validade máxima de oito horas, sem renovação ou cache de permissões no cookie. Hook limita também sessões `rememberMe=false`, para as quais o provedor usa um dia por padrão. Cookies HttpOnly/SameSite=Lax e Secure quando a origem é HTTPS. Logout remove a sessão e invalida replay do cookie.
  - Papel, situação e vínculo não são entradas aceitas do usuário e não são retornados desnecessariamente pelo provedor. Após validar sessão, o servidor consulta o usuário e o frigorífico atuais no banco. Desativação ou alteração de papel vale na próxima requisição protegida; não confiar em cookies/JWT/clientes para autorização.
  - Gestor sem vínculo com frigorífico; usuário de frigorífico obrigatoriamente vinculado por FK, com CHECK SQL para impedir combinações inconsistentes. E-mail normalizado por validação e CHECK SQL. Nome/identidade exibidos apenas ao próprio usuário autenticado.
  - Cada página privada verifica seu papel, além de qualquer layout: visitante/inativo → `/login`; papel incorreto → `/acesso-negado`. Helper de autorização também distingue 401/403 para operações futuras. Nenhum CRUD da F3, formulário de cotação ou leitura pública de preços individuais implementado.
  - Ratelimit ativo inclusive em desenvolvimento: cinco tentativas de login por minuto por IP e limite geral de 30 requisições/minuto, com contador PostgreSQL atômico e sem Redis/fila. Conferir cabeçalhos confiáveis/proxy na F8-T01 antes da publicação; não assumir que cabeçalhos arbitrários do cliente sejam confiáveis em produção.
  - UI mínima com HTML semântico/Tailwind e tokens existentes; sem camada genérica de componentes antecipada. Páginas privadas não têm funcionalidades futuras simuladas. O portal continua estático e independente do banco.
- **Testes executados (comando → resultado):**
  - Inspeção `git status --short --branch`, `git log -3 --oneline` e `docker compose ps` → repositório inicialmente limpo em `c9650fd`, PostgreSQL saudável.
  - `npm exec -- prisma format --config prisma7.config.ts`, `npm run db:generate`, `npm run db:validate` → exit 0; schema válido e cliente gerado. Migration SQL revisada antes de aplicar; relação indevida introduzida na primeira edição do schema removida nessa revisão, sem aplicação no banco.
  - `npm run db:migrate -- --name auth --create-only`, revisão SQL, `npm run db:migrate` → migration `20261026185225_auth` criada/aplicada com sucesso em desenvolvimento. `DATABASE_URL=postgresql://cotaroba:cotaroba_local@127.0.0.1:5433/cotaroba_test npm run db:deploy` → exit 0, mesma migration aplicada no banco de testes.
  - `npm run db:status` → exit 0; duas migrations, schema atualizado. `npm run db:deploy` repetido ao final → exit 0, nenhuma migration pendente.
  - `npm run test:auth` → exit 0, **17/17 aprovados**, zero falhas/skips: hash/primeiro gestor e recusa de segundo bootstrap; visitante; login de gestor/cookie; duas identidades de frigorífico com campos adulterados; senha/e-mail incorretos com mesma resposta; cookie adulterado; expiração; logout/replay; usuário/frigorífico inativos; alteração de papel; endpoints não autorizados; origem externa; seis tentativas simultâneas (cinco 401 e uma 429); CHECK SQL de vínculo; configuração segura; cookie Secure em origem HTTPS.
  - `npm run test:db` → exit 0, **8/8 aprovados**, sem regressão nas restrições de preço/histórico/referências da F1. Guard de banco compartilhado exige loopback, nome `_test` diferente do desenvolvimento e recusa parâmetros/fragmentos de conexão.
  - `python3 /tmp/cotaroba-f0-qa.T9svgM/bootstrap-pty.py` → exit 0; comando real `auth:create-manager` executado em PTY contra banco de testes, senha mascarada e ausente da saída/argumentos. Usuário sintético removido ao final, com cascade de credenciais/sessões.
  - `env -u DATABASE_URL -u BETTER_AUTH_SECRET -u BETTER_AUTH_URL DOTENV_CONFIG_PATH=/dev/null npm ci` → exit 0; 525 pacotes instalados, cliente gerado sem URLs/segredos de autenticação ou conexão ao banco. Avisos transitivos já conhecidos do ESLint e de scripts não cobertos pela política local npm, sem flags de contorno ou alteração dessa política.
  - `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck` → exit 0 nas versões finais. Primeira verificação TypeScript detectou tipo de ambiente excessivamente restrito e array de fixtures sem anotação; ambos corrigidos e verificações repetidas com sucesso.
  - `npm audit --audit-level=moderate` → exit 0, zero vulnerabilidades reportadas.
  - `DATABASE_URL=postgresql://cotaroba:cotaroba_local@127.0.0.1:5433/cotaroba_test npm run dev -- --hostname 127.0.0.1 --port 3000` + `node --conditions=react-server --env-file-if-exists=.env --import tsx /tmp/cotaroba-f0-qa.T9svgM/auth-browser.mts` → exit 0 no QA: login real de gestor e dois frigoríficos, identidade própria, sessão após reload, bloqueio de visitante e perfil trocado, logout, cache privado `no-store`, sem erros JS/HTTP inesperados. Servidor dev encerrado após verificação.
  - `node /tmp/cotaroba-f0-qa.T9svgM/smoke.cjs http://localhost:3000` → exit 0; portal público HTTP 200, estado vazio, estilo, responsividade, teclado e zero violações axe detectadas após inclusão do link de login.
  - `npm run build` → exit 0; compilação, TypeScript e prerender concluídos. Portal e acesso negado estáticos; login, encaminhamento, API e duas áreas privadas dinâmicos.
  - `BETTER_AUTH_URL=http://localhost:3001 DATABASE_URL=postgresql://cotaroba:cotaroba_local@127.0.0.1:5433/cotaroba_test npm start -- --hostname 127.0.0.1 --port 3001` + `QA_ORIGIN=http://localhost:3001 node --conditions=react-server --env-file-if-exists=.env --import tsx /tmp/cotaroba-f0-qa.T9svgM/auth-browser.mts` → exit 0; mesmas jornadas verificadas em produção local, sem erros inesperados.
  - QA Chrome/Playwright com axe em desenvolvimento e produção → login, gestor e frigorífico conferidos em **320/390/1280px**, sem rolagem horizontal e zero violações WCAG 2/2.1 A/AA detectadas. Capturas inspecionadas visualmente. Ferramentas/capturas temporárias fora do Git; fixtures somente no banco de testes, sem cotações.
  - `docker compose stop db` + requisição Python `urllib.request.urlopen('http://localhost:3001')` → portal HTTP 200 e “Dados insuficientes” com PostgreSQL parado, sem URL do banco no HTML. Aplicação encerrada; `docker compose up -d --wait db` → saudável novamente.
  - SQL de contagens finais via `docker compose exec -T db psql` → desenvolvimento: zero usuários/credenciais/sessões/cotações; testes: zero usuários/credenciais/sessões/regiões/frigoríficos/cotações após limpeza. Nenhuma credencial ou cotação de negócio inventada. Removidos também os dois contadores de loopback do QA no banco de testes; contagem final de `RateLimit`: zero.
  - `git check-ignore .env src/generated/prisma/client.ts` → arquivos ignorados. Logs WARN/ERROR de senha incorreta/origem externa durante casos negativos são resultados esperados do provedor, sem exposição de senhas.
- **Testes não executados e motivo:** deploy, terminação TLS real e proxy de produção aguardam F8-T01. Fluxos de cadastro do gestor, cotações e isolamento dessas operações aguardam F3/F4; nesta etapa o vínculo autenticado e o acesso às páginas foram testados. Auditoria automatizada não substitui validação manual; outros navegadores não foram testados.
- **Commit Conventional Commits:** `feat(auth): add login and role-based access`; hash: consultar Git após a criação. Código, migration, testes e este status no mesmo commit; hash real informado na entrega.
- **Como validar manualmente:**
  1. Com `.env` configurado conforme README e Docker iniciado: `npm ci`, `docker compose up -d --wait db`, `npm run db:deploy`. O segredo local já está configurado neste workspace e não é versionado.
  2. Executar `npm run auth:create-manager -- seu-email@exemplo.com "Seu nome"` em terminal interativo; escolher senha de 12–128 caracteres. Se já criou o primeiro gestor, usar o acesso existente; não há senha padrão.
  3. Executar `npm run dev`, abrir `http://localhost:3000` sem login e conferir consulta pública. Acessar `/gestor` e `/frigorifico` diretamente deve encaminhar ao login.
  4. Tentar senha incorreta e conferir mensagem genérica; entrar com a senha escolhida deve abrir `/gestor`. Recarregar a página mantém sessão. Acessar `/frigorifico` com gestor nega entrada.
  5. Clicar “Sair”; novo acesso a `/gestor` deve exigir login. Conferir por teclado/celular. Exceder cinco tentativas/minuto apresenta feedback de espera.
  6. Executar `npm run test:auth` e `npm run test:db` no banco separado já preparado. A jornada de frigorífico usa fixtures neste estágio; provisionamento pelo gestor na interface pertence à F3-T01.
- **Pendências/bloqueios:** nenhum bloqueio técnico da F2-T01. Validação humana pendente. Primeiro usuário de negócio será provisionado pelo operador com suas credenciais, pelo comando entregue. PostgreSQL deixado saudável, sem servidor Next.js em execução. Cadastro/gestão de usuários/frigoríficos, cotações e deploy permanecem nas etapas apropriadas.
- **Aprovação do usuário:** execução autorizada; **entrega final da F2-T01 PENDENTE** de validação explícita.
- **Próximo passo autorizado:** parar e aguardar teste/validação da F2-T01. Não iniciar F3-T01 automaticamente.

### 2026-10-26 — F2-T01 — Revisão de falha de login (início)
- **Estado:** EM_ANDAMENTO; usuário informou que o login não funciona e pediu revisão da etapa, ainda não validada.
- **Escopo autorizado:** somente diagnóstico/correção da F2-T01; não iniciar outra etapa.
- **Inspeção:** Git limpo no commit `746e44d`; Docker/PostgreSQL saudáveis; origem configurada `http://localhost:3000`, segredo definido, banco de desenvolvimento com um gestor ativo e uma conta de credencial. Nenhum servidor em 3000/3001/3002 no momento da inspeção. Senha/conta do usuário serão preservadas.
- **Plano:** reproduzir com fixtures isoladas, verificar endpoint, resposta, origem/porta e cookie; corrigir causa comprovada e adicionar regressão útil; repetir testes e criar commit com este status. Solicitado ao usuário endereço, sintoma e resultado do bootstrap, sem pedir senha.
- **Arquivos previstos:** módulo/rotas/testes de autenticação conforme o diagnóstico, README e este status.
- **Testes:** inspeção inicial de configuração sem exibir segredo; contagens de usuários/credenciais e saúde do banco. Testes de reprodução pendentes.
- **Commit:** não realizado para esta correção.
- **Aprovação do usuário:** pendente para a entrega final; correção expressamente solicitada.

### 2026-10-26 — F2-T01 — Correção do envio de login e cobertura da falha
- **Estado:** IMPLEMENTADA_AGUARDANDO_VALIDACAO; revisão solicitada pelo usuário, sem avanço à F3-T01.
- **Problema e causa confirmada:** o formulário anterior tinha apenas `onSubmit` em JavaScript, sem `method`/`action` HTML. Sem hidratação, o navegador aplicava GET na própria página, sem chamar a autenticação e podendo incluir credenciais na URL. Esse envio foi observado durante o diagnóstico; nenhum valor pessoal ou senha é reproduzido neste histórico. Os testes anteriores cobriam JavaScript já disponível e origem canônica, deixando essa lacuna.
- **Segundo problema reproduzido:** com credenciais de fixture corretas, `localhost:3000` retornava 200 e entrava; `127.0.0.1:3000` recebia 403 `INVALID_ORIGIN` e a interface dizia incorretamente “E-mail ou senha inválidos”. Nenhuma proteção de origem foi desabilitada.
- **Objetivo e critérios de aceite:** login/logout por POST com e sem JavaScript, inclusive antes da hidratação/por Enter; nenhum campo de credencial em URLs geradas pelo formulário; origem canônica e erros corretos; preservar ratelimit, CSRF/cookies, papéis e acesso existente; adicionar regressões reproduzíveis.
- **Arquivos alterados/criados:**
  - `src/features/auth/login-form.tsx`, `logout-button.tsx`: método/destino POST explícitos no HTML, mantendo aprimoramento com JavaScript; logout também funciona sem JavaScript.
  - `src/features/auth/form-handler.ts`, `auth.ts`: caminhos HTML POST `/api/auth/login` e `/api/auth/logout`, delegando ao handler HTTP do provedor, sem bypass de ratelimit. Validação Zod, corpo URL-encoded limitado a 8 KiB, cookies encaminhados, 303 para destinos fixos e respostas sem credenciais.
  - `src/features/auth/login-errors.ts`, `login-location.ts`, `src/app/login/page.tsx`: mensagens por categoria de erro, redirecionamento para origem configurada antes de preencher credenciais, limpeza de parâmetros legados e feedback SSR nos envios nativos.
  - `next.config.ts`: logs de desenvolvimento ignoram URLs com parâmetros `email`/`password`, para não repetir dados de URLs antigas.
  - `src/features/auth/reset-password.ts`, `scripts/reset-password.ts`, `package.json`: comando local `auth:reset-password`, com senha mascarada, hash do provedor e revogação das sessões anteriores em transação. Não publica endpoint de recuperação, não cria conta nem altera papel/vínculo/situação.
  - `tests/auth.test.ts`: dez regressões novas (27 casos totais) para POST/cookies/erros, corpo inválido/grande, origem, limite compartilhado com JSON, logout, URL canônica, erros de serviço e recuperação local.
  - `tests/login-browser.test.ts`, `package.json`, `package-lock.json`: quatro regressões versionadas com Node test runner + Playwright `1.64.1`, servidor próprio em loopback:3100, banco `_test` e segredo efêmero. Sem reutilizar servidor alheio nem alterar credenciais de desenvolvimento.
  - `README.md`, `PROJECTS_STATUS.md`: causa, correção, recuperação local, comandos de teste e roteiro manual; histórico anterior preservado.
- **Implementação e decisões:**
  - O envio padrão agora é POST para um destino implementado no servidor. O funcionamento não depende da hidratação, e o fluxo aprimorado continua disponível. Formulários HTML e JSON convergem para o handler HTTP Better Auth, mantendo o mesmo contador atômico PostgreSQL e verificações de origem/CSRF.
  - Apenas códigos fixos de erro aparecem na query. E-mail/senha não são copiados para redirects, mensagens ou HTML de erro. Cookies HttpOnly/SameSite/Secure, validade de sessão e autorização no servidor permanecem com o provedor/guards existentes.
  - `/login` usa a origem validada da configuração como destino; não confia em callback de usuário nem amplia `trustedOrigins`. Host alternativo local é encaminhado antes da digitação. URLs antigas com campos de credenciais vão para uma URL limpa com pedido de reenvio por POST.
  - Ignorar logs novos e limpar URLs não apaga histórico/logs anteriores. Entregue comando local para o operador substituir a senha digitada durante a falha. **Nenhuma senha real foi resetada por esta execução**; conta e credencial existentes foram preservadas.
  - Não criar outro gestor para recuperar acesso existente. O novo comando solicita senha no terminal (12–128 caracteres), troca o hash e elimina sessões do usuário em transação; só opera contas de credenciais existentes e não é Server Action/endpoint.
  - Nenhuma migration ou alteração dos modelos de domínio foi necessária. Não implementar cadastro/gestão de acessos da F3, preços ou agregação.
- **Testes executados (comando → resultado):**
  - Inspeção Git → limpo inicialmente em `746e44d`; Docker saudável; configuração examinada sem exibir segredo; um gestor ativo e uma conta de credencial no banco de desenvolvimento.
  - Harness de reprodução com fixtures isoladas → login canônico 200, alias IP 403 `INVALID_ORIGIN` com mensagem indevida. Envio GET sem autenticação observado no servidor, sem registrar valores pessoais neste documento.
  - `npm run test:auth` → exit 0, **27/27 aprovados**, zero falhas/skips. Inclui todos os 17 cenários anteriores e dez cenários novos; limite compartilhado entre HTML/JSON, cookies, origem, POST e revogação de sessões na troca local verificados.
  - `npm run test:db` → exit 0, **8/8 aprovados**; sem regressão de preços/histórico/referências.
  - `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → exit 0, **4/4 aprovados** em desenvolvimento: gestor sem JavaScript por POST/Enter (inclusive senha incorreta), logout e sessão, fluxo com JavaScript/guard de papel, frigorífico sem JavaScript com identidade própria, origem IP redirecionada e URL legada limpa sem marcador sensível no log. Nenhum envio de credenciais por GET observado.
  - `TEST_APP_MODE=production PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → exit 0, **4/4 aprovados** no build de produção local, mesmas regressões. Servidores/fixtures de QA encerrados/removidos pela suíte.
  - `python3 /tmp/cotaroba-f0-qa.T9svgM/reset-pty.py` → exit 0; criação e troca de senha executadas realmente em PTY no banco de testes, entradas mascaradas e ausentes de argumentos/saída; fixture removida. Hash/aceitação da nova senha, recusa da antiga e revogação de sessão também cobertos na suíte de integração.
  - `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck` → exit 0 nas versões finais.
  - `env -u DATABASE_URL -u BETTER_AUTH_SECRET -u BETTER_AUTH_URL DOTENV_CONFIG_PATH=/dev/null npm ci` → exit 0; 527 pacotes instalados, cliente gerado sem conexão/segredos de autenticação, zero vulnerabilidades reportadas. Persistem somente os avisos transitivos conhecidos de peers ESLint/scripts npm, sem contornar políticas.
  - `npm run build` → exit 0; compilação, TypeScript e prerender concluídos, páginas privadas/login/API dinâmicos.
  - `npm audit --audit-level=moderate` → exit 0, zero vulnerabilidades reportadas.
  - Contagens SQL finais: desenvolvimento com **um gestor ativo e uma conta de credencial**, como no início; testes com zero usuários/contas/sessões/cotações. Fixtures não foram inseridas em desenvolvimento; senha do operador não foi alterada.
  - `npm run dev -- --hostname 127.0.0.1 --port 3000` → aplicação real reiniciada com `.env` e banco de desenvolvimento, após encerrar servidores de QA. Requisição HTTP a `http://127.0.0.1:3000/login` → redirecionamento para `http://localhost:3000/login`, HTTP 200 e HTML com método POST/destino correto confirmados, sem enviar credenciais.
- **Testes não executados e motivo:** não houve tentativa com a senha real do usuário (não solicitada), nem alteração dela. Validação humana segue pendente. TLS/proxy de produção e outros navegadores aguardam as etapas previstas; Chromium/Chrome local foi usado nesta correção.
- **Commit Conventional Commits:** `fix(auth): make login work before hydration`; hash: consultar Git após a criação; código/testes/documentação/status no mesmo commit. Hash real informado na entrega.
- **Como validar manualmente:**
  1. Para substituir a senha usada antes, executar no terminal `npm run auth:reset-password -- seu-email@exemplo.com`, usando o e-mail já cadastrado e escolhendo a nova senha na entrada mascarada. Não informar senha em argumentos nem recriar o gestor.
  2. Abrir `http://localhost:3000/login` (aplicação deixada em execução no banco de desenvolvimento). Se necessário reiniciar, usar `npm run dev -- --port 3000`.
  3. Entrar por clique ou Enter com o acesso existente; deve abrir `/gestor`, manter sessão ao recarregar e bloquear `/frigorifico` para o gestor. Sair deve invalidar a sessão.
  4. Repetir com JavaScript desativado; a URL não deve conter e-mail/senha. Abrir por `127.0.0.1:3000/login` deve encaminhar para a origem configurada.
  5. Senha incorreta mostra erro genérico; excesso de tentativas pede aguardar. Para repetir a regressão automatizada, parar o servidor de desenvolvimento e executar os comandos de navegador descritos no README.
- **Pendências/bloqueios:** nenhuma pendência de implementação da correção. Operador deverá substituir a senha utilizada no formulário antigo e validar seu acesso; nenhuma credencial foi escolhida/alterada em seu nome. Aplicação e PostgreSQL disponíveis localmente para teste.
- **Aprovação do usuário:** PENDENTE para a correção final da F2-T01.
- **Próximo passo autorizado:** parar e aguardar validação explícita; não iniciar F3-T01.
