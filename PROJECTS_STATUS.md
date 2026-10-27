# PROJECTS_STATUS.md — Histórico vivo

**Regra:** atualizar após **cada tarefa executada**, preservando todas as entradas. Ver `AGENTS.md`. O status é a fonte de verdade do andamento.

## Estado atual
- Data de referência: 2026-10-27.
- Fase atual: **F5 — agregação regional e consulta pública**.
- Etapa atual: **F5-T01 — IMPLEMENTADA_AGUARDANDO_VALIDACAO**.
- Aprovação do usuário: **F0-T01 a F4-T01 VALIDADAS**; F4 confirmada explicitamente em 2026-10-27.
- Implementações concluídas: **F0-T01 a F4-T01 VALIDADAS**; F5 implementada e aguardando validação humana.
- Commit da F0-T01: `d42c693` — `chore(setup): initialize Next.js project foundation`.
- Testes atuais da F2-T01: **27 de autenticação + 8 de banco + 4 de navegador aprovados**; navegador repetido em desenvolvimento e produção, com JavaScript desativado/ativado, POST/Enter, origem canônica e proteção de URLs/logs. Lint, typecheck, formatação, build, instalação limpa e auditoria npm aprovados; detalhes no histórico.
- Commit da F1-T01: `c9650fd` — `feat(database): add PostgreSQL schema and initial migration`.
- Commit original da F2-T01: `746e44d` — `feat(auth): add login and role-based access`.
- Commit da correção validada: `3805007` — `fix(auth): make login work before hydration`.
- Testes da F3-T01: **19 de gestão + 27 de autenticação + 8 de banco + 8 de navegador aprovados (62 distintos)**; navegador aprovado em desenvolvimento e produção. Lint, typecheck, formatação, validação Prisma e build aprovados.
- Commit validado da F3-T01: `7e0b966` — `feat(slaughterhouses): manage regions, slaughterhouses and accesses`.
- Testes da F4-T01: **19 cotações + 19 gestão + 27 autenticação + 8 banco + 9 navegador aprovados (82 distintos)**; navegador aprovado em desenvolvimento e produção. Lint, typecheck, formatação, validação Prisma e build aprovados.
- Commit final da F4-T01: `0d69b35` — `feat(quotes): complete private quote workflow and browser coverage`.
- Testes da F5-T01: **5 de publicação + 19 cotações + 19 gestão + 27 autenticação + 8 banco + 9 navegador aprovados (87 distintos)**; navegador aprovado em desenvolvimento e produção. Lint, typecheck, formatação, validação Prisma e build aprovados.
- Próxima ação: usuário testar e validar explicitamente a F5-T01. A troca local de senha recomendada na F2 não foi confirmada pelo usuário.

## Quadro de etapas
| ID | Etapa | Estado | Commit | Validação do usuário |
|---|---|---|---|---|
| F0-T01 | Inspeção e fundação do projeto | VALIDADA | `d42c693` | CONFIRMADA em 2026-10-26 |
| F1-T01 | Banco e modelo inicial | VALIDADA | `c9650fd` | CONFIRMADA em 2026-10-26 |
| F2-T01 | Login e permissões | VALIDADA | `746e44d` + correção `3805007` | CONFIRMADA em 2026-10-26 |
| F3-T01 | Gestor: cadastro de frigoríficos | VALIDADA | `7e0b966` | CONFIRMADA em 2026-10-26 |
| F4-T01 | Frigorífico: cadastro/atualização de cotações | VALIDADA | `93cd0ec` + `a614bee` + `0d69b35` | CONFIRMADA em 2026-10-27 |
| F5-T01 | Consulta pública por frigorífico e região | IMPLEMENTADA_AGUARDANDO_VALIDACAO | commit final (consultar Git) | PENDENTE |
| F6-T01 | Integrações externas e cadastro manual | PENDENTE | — | PENDENTE |
| F7-T01 | Gráficos, indicadores e simulador | PENDENTE | — | PENDENTE |
| F8-T01 | Homologação e deploy | PENDENTE | — | PENDENTE |

Estados permitidos: `PENDENTE`, `EM_ANDAMENTO`, `BLOQUEADA`, `IMPLEMENTADA_AGUARDANDO_VALIDACAO`, `VALIDADA`.

## Decisões confirmadas
- Portal público, sem login para consulta.
- Gestor cadastra frigoríficos e acessos; frigoríficos informam/atualizam cotações próprias.
- Na F5, por decisão explícita do usuário em 2026-10-27, público vê **nome e preço vigente de cada frigorífico por região/categoria**, sem média; versões anteriores e autores pessoais continuam privados.
- Dados externos por APIs/fontes públicas, com entrada manual pelo gestor quando necessário.
- Next.js + TypeScript, PostgreSQL, Prisma, deploy planejado na Vercel.
- Produto simples: sem marketplace, IA, microserviços ou alertas avançados no MVP.
- Cada etapa é implementada, testada, commitada e submetida à validação humana **antes** da seguinte.
- Autenticação por e-mail/senha com Better Auth e sessões PostgreSQL; sem cadastro público ou serviço externo de autenticação.
- Regiões cadastradas por nome pelo gestor, conforme opção 1 aprovada em 2026-10-26; sem lista comercial ou geográfica predefinida.

## Questões ainda abertas
- Nome/identidade visual definitiva.
- Nomes de regiões e categorias comerciais serão definidos pelo gestor nos cadastros autorizados pelo usuário; não há lista predefinida.
- Revisão dos aspectos concorrenciais da publicação individual antes do deploy público da F8.
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

### 2026-10-26 — F2-T01 — Validação humana da correção do login
- **Estado:** VALIDADA.
- **Objetivo e resultado:** registrar a aprovação explícita da correção da F2-T01, sem iniciar outra etapa ou alterar a aplicação.
- **Aprovação do usuário:** confirmação “Aprovada a correcao” recebida em 2026-10-26.
- **Commits validados:** implementação `746e44d` e correção `3805007` — `fix(auth): make login work before hydration`; hashes confirmados no histórico Git.
- **Arquivos alterados:** somente `PROJECTS_STATUS.md`; estado atual e quadro atualizados, histórico anterior preservado.
- **Decisões:** aprovação encerra a validação da F2-T01; não implica autorização para iniciar a F3-T01. Não presumir que a senha foi substituída.
- **Verificações executadas:** `git status --short --branch` → árvore inicialmente limpa em `main`; `git log -5 --oneline` → commits conferidos; `git diff --check` → sem erros de whitespace; revisão do diff → somente registro documental da validação.
- **Testes não executados e motivo:** testes de aplicação não repetidos, pois não há alteração de código/configuração; resultados reais da entrega corrigida permanecem registrados acima.
- **Commit Conventional Commits:** `docs(status): record approval of login correction`; hash: consultar Git após a criação.
- **Como validar manualmente:** conferir F2-T01 como VALIDADA no estado atual/quadro e F3-T01 como PENDENTE; nenhum novo teste funcional necessário para este registro.
- **Pendências/bloqueios:** nenhuma pendência da correção aprovada. Questões de domínio e demais etapas continuam pendentes nos respectivos escopos.
- **Próximo passo autorizado:** somente registrar esta validação; aguardar autorização para iniciar F3-T01.

### 2026-10-26 — F3-T01 — Autorização, inspeção e plano
- **Estado:** EM_ANDAMENTO.
- **Autorização:** usuário confirmou “Autorizado” após a validação da correção da F2-T01; somente F3-T01 autorizada.
- **Inspeção:** Git limpo em `main`, commit `20bebed`; contrato, status e todos os documentos de `docs/` revisados. Node.js 24.18.0/npm 11.16.0; PostgreSQL local saudável e servidor de desenvolvimento existente na porta 3000.
- **Objetivo e critérios de aceite:** gestor lista, cadastra, edita e desativa frigoríficos e seus acessos; validações e autorização no servidor por operação; login dos acessos criados, revogação de sessões e formulários sem dependência de JavaScript verificados. Preservar histórico e consulta pública sem identidades/cotações individuais.
- **Plano/arquivos esperados:** módulo `src/features/slaughterhouses`, páginas sob `/gestor`, schema/migration caso necessário para histórico administrativo, testes de integração/navegador, README e este status.
- **Decisões:** exclusão lógica por desativação, conforme produto; acessos de frigorífico sempre vinculados no servidor, sem criação de gestores na interface. Não implementar cotações nem etapas seguintes.
- **Questão solicitada ao usuário:** lista de regiões ainda aberta; solicitado escolher entre cadastro de nomes pelo gestor nesta etapa ou fornecer lista inicial. Parte dependente aguarda resposta; restante pode avançar.
- **Testes executados:** inspeções de Git, versões e `docker compose ps`; testes funcionais pendentes de implementação.
- **Commit Conventional Commits:** não realizado nesta etapa.
- **Aprovação do usuário:** execução da F3-T01 autorizada; entrega final ainda pendente de validação.
- **Próximo passo autorizado:** concluir somente F3-T01, verificar, registrar e aguardar validação.

### 2026-10-26 — F3-T01 — Implementação parcial verificada; decisão sobre regiões pendente
- **Estado:** BLOQUEADA (parcial). Não declarar a F3 concluída: o banco real não tem regiões e falta a decisão de produto solicitada ao usuário.
- **Escopo realizado:** listagem privada paginada (20), cadastro/edição/desativação/reativação de frigoríficos; criação/edição/desativação/reativação e redefinição de senha dos acessos vinculados; validação de dados e autorização em cada operação; histórico administrativo transacional. Tudo verificado com regiões sintéticas exclusivamente no banco de testes.
- **Arquivos alterados/criados:**
  - `src/features/slaughterhouses/schema.ts`, `service.ts`: Zod estrito, serviços somente no servidor, leitura mínima, gestor ativo reconsultado, perfil/vínculo fixos, e-mail normalizado/único, hashes Better Auth, revogação de sessões e operações transacionais.
  - `src/features/slaughterhouses/actions.ts`: Server Actions com sessão/perfil/origem verificados e códigos fixos nos redirects; sem credenciais em URLs/retornos. Própria proteção Origin/Host do Next.js mantida.
  - `src/features/slaughterhouses/{manager-shell.tsx,forms.tsx,feedback.tsx,submit-button.tsx}`: interface pt-BR, campos rotulados e feedback; formulários POST com funcionamento sem JavaScript e estado de envio quando disponível.
  - `src/app/(private)/gestor/page.tsx`, `frigorificos/novo/page.tsx`, `frigorificos/[id]/page.tsx`: listagem, criação e administração. Cadastro bloqueado quando não há região; não há tela/ação de criar regiões enquanto a decisão estiver pendente.
  - `prisma/schema.prisma`, `prisma/migrations/20261026201632_management_history/migration.sql`: tabela `ManagementEvent`, enum de ações, autor/alvos/datas, índices/FKs. Migration aditiva, sem modificar preços, tabelas existentes ou dados do operador.
  - `tests/management.test.ts`, `tests/management-browser.ts`, `tests/login-browser.test.ts`, `tests/helpers/auth-fixtures.ts`, `package.json`: 15 casos de gestão, quatro novas jornadas de navegador (oito totais com regressões da F2), cleanup de registros administrativos e script `test:management`.
  - `README.md`, `PROJECTS_STATUS.md`: funcionamento, limites, comandos, roteiro manual e registro da pendência; histórico preservado.
- **Decisões técnicas:**
  - Desativação como remoção lógica conforme PRODUCT_SPEC; sem exclusão física de empresas/acessos/histórico. Não implementar preços/cotações, agregação, integrações ou simulador.
  - Vários responsáveis podem ter acessos individuais ao mesmo frigorífico, conforme modelo existente. Criação aceita apenas nome/e-mail/senha; papel e vínculo vêm do servidor. Administração recusa alvo de outra empresa, gestor ou alvo inexistente; sem transferência de vínculo.
  - Alterações de acesso/senha encerram suas sessões; salvar frigorífico encerra sessões de todos os seus acessos. Frigorífico inativo bloqueia novos logins/criações de acesso. Reativação não ativa automaticamente acessos individualmente desativados nem restaura sessões. Locks de linha coordenam alterações administrativas do mesmo frigorífico.
  - Auditoria na mesma transação da alteração, somente campos administrativos selecionados antes/depois; redefinição registra apenas o evento/revogação. Nenhuma senha/hash/token vai ao histórico administrativo. Tabela privada, sem endpoint público ou tela de histórico nesta entrega.
  - Server Actions atendem o padrão do projeto e o envio nativo POST. A sessão/papel são verificados em cada action e novamente no serviço; dados não confiáveis são validados. Referência técnica consultada: https://nextjs.org/docs/app/guides/data-security e https://better-auth.com/docs/concepts/users-accounts.
  - Não instalar dependências novas nem contratar serviços. Nenhum seed/região/categoria/usuário de negócio criado; conta/senha do operador preservadas.
- **Testes executados (comando → resultado):**
  - `npm exec -- prisma format --config prisma7.config.ts`, `npm run db:generate` → exit 0; schema formatado e cliente gerado.
  - `npm run db:migrate -- --name management_history --create-only` → migration gerada sem aplicação; SQL revisado antes do deploy.
  - `npm run db:deploy` no banco de desenvolvimento e o mesmo comando com `DATABASE_URL` local apontando `cotaroba_test` → exit 0 em ambos; terceira migration aplicada, dados existentes preservados.
  - `npm run test:management` → **15/15 aprovados**, zero falhas/skips; cadastro, autorização, validação, credenciais reais via provedor, duplicidade concorrente, vínculo, revogação, desativação/reativação, preservação de cotação histórica, paginação e auditoria sem credenciais.
  - `npm run test:auth` → **27/27 aprovados**; `npm run test:db` → **8/8 aprovados**; sem regressões.
  - `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → **8/8 aprovados** em desenvolvimento, inclusive fluxo novo sem JavaScript, envio POST, login real do acesso criado, sessão encerrada ao desativar, erros/troca de senha com JavaScript, replay real de Server Actions recusado para visitante/frigorífico/origem externa e portal sem cadastros privados.
  - `TEST_APP_MODE=production PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → **8/8 aprovados** no build de produção local; mesmas jornadas. São 58 testes distintos (15 + 27 + 8 + 8), sem contar repetições como casos novos.
  - `TEST_SCREENSHOT_DIR=/tmp/cotaroba-f3-qa PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → **8/8 aprovados**; layout sem rolagem horizontal em 320/390/1280px, capturas temporárias; celular/desktop inspecionados visualmente. Artefato de captura após resize resolvido recarregando a página antes da captura.
  - Primeira execução de typecheck identificou incompatibilidade do Buffer com o tipo BodyInit no harness de replay; corrigido para ArrayBuffer. Primeira execução do navegador detectou seletor ambíguo entre alerta de feedback e anunciador de rota Next.js; restringido ao conteúdo principal e repetido com sucesso.
  - Tentativa de aguardar requestAnimationFrame para captura com JavaScript desativado travou o harness; navegador exclusivo de QA encerrado, suíte retornou quatro falhas de contexto fechado, cleanup executado. Espera retirada, reload usado só para captura, timeout global de 120s adicionado; execução seguinte **8/8 aprovada**. Não foi falha de autenticação nem de domínio.
  - `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` → exit 0; compilação/TypeScript/prerender aprovados, páginas de gestor dinâmicas e portal estático.
  - SQL de contagens: desenvolvimento com um usuário/uma credencial, zero regiões/frigoríficos/cotações/eventos administrativos; banco de testes limpo após as suítes. Nenhuma credencial real foi usada para QA.
- **Testes não executados e motivo:** jornada com regiões de negócio no banco real depende da resposta do usuário e da conclusão dessa parte. Validação humana da F3 não solicitada como entrega concluída. TLS/proxy/deploy, outros navegadores e política de agregação pertencem às etapas previstas. Auditoria npm/instalação limpa não repetidas: nenhuma dependência nova instalada.
- **Ambiente ao encerrar:** `npm run dev -- --hostname 127.0.0.1 --port 3000` reiniciado com `.env` e banco real de desenvolvimento; `/login` HTTP 200 com formulário presente. PostgreSQL saudável. Suítes encerraram servidores/fixtures de QA; banco de testes com zero usuários/contas/regiões/frigoríficos/cotações/eventos/contadores de limite.
- **Commit Conventional Commits:** não realizado; implementação parcial permanece no workspace junto do status, sem commit de funcionalidade concluída. Último commit confirmado antes da execução: `20bebed`.
- **Como conferir o parcial:** entrar com o gestor em `/gestor` para conferir a listagem vazia; `/gestor/frigorificos/novo` informa ausência de regiões e não permite salvar. Os fluxos completos já podem ser reproduzidos no banco isolado com `npm run test:management` e `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` (parar o dev antes do navegador). Roteiro final no README será aplicável após definir regiões/concluir F3.
- **Bloqueio e decisão necessária:** escolher (1) permitir que o gestor cadastre regiões por nome nesta etapa; ou (2) fornecer a lista inicial de nomes. Pergunta enviada pela ferramenta assíncrona, ainda sem resposta. A questão já estava aberta no status desde a fundação; não inferir divisão comercial/geográfica nem ampliar o cadastro sem confirmação. AGENTS.md, regra 7: “se encontrar ambiguidade que afete produto, segurança ou preço, explique e solicite decisão antes de implementar”.
- **Aprovação do usuário:** F3-T01 autorizada para execução; etapa final ainda não concluída/verificada integralmente nem validada pelo usuário.
- **Próximo passo autorizado:** aguardar somente a definição de regiões; após resposta, concluir F3-T01, executar checks adequados, criar commit incluindo implementação/status e submeter à validação. F4-T01 permanece PENDENTE.

### 2026-10-26 — F3-T01 — Decisão sobre regiões e retomada
- **Estado:** EM_ANDAMENTO; bloqueio de produto resolvido.
- **Decisão/autorização do usuário:** resposta “1” confirma cadastro simples de regiões por nome pelo gestor nesta etapa. Não há lista de regiões predefinida nem seed de negócio.
- **Plano e critérios:** página privada `/gestor/regioes`, cadastro/listagem, validação de nome até 120 caracteres, normalização de espaços/Unicode e prevenção de duplicatas sem diferenciar caixa; região disponível nos formulários de frigoríficos. Revalidar jornadas da F3 e regressões, registrar resultados e criar um único commit da implementação com status.
- **Arquivos:** módulo/páginas/testes de gestão já em andamento, migration aditiva de unicidade de regiões, README e este status.
- **Inspeção:** alterações parciais anteriores preservadas; último commit `20bebed`; PostgreSQL saudável; banco de desenvolvimento ainda com zero regiões. Não houve implementação de outra etapa.
- **Testes:** inspeção inicial concluída; testes da extensão e verificações finais pendentes.
- **Commit:** não realizado; será criado somente após concluir e verificar a F3-T01.
- **Aprovação:** extensão do cadastro de regiões autorizada; validação final da F3 ainda pendente.

### 2026-10-26 — F3-T01 — Conclusão técnica de regiões, frigoríficos e acessos
- **Estado:** IMPLEMENTADA_AGUARDANDO_VALIDACAO. Bloqueio anterior resolvido pela resposta “1”; toda a implementação parcial desta etapa e a extensão autorizada compõem uma única entrega/commit. Nenhuma outra etapa foi iniciada.
- **Objetivo e critérios atendidos:** gestor cadastra/lista regiões, cadastra/lista/edita/desativa/reativa frigoríficos e administra seus acessos; validação e autorização no servidor em cada operação; fluxos reais de login, sessão, erros e desativação verificados. Público permanece sem identidades/preços individuais.
- **Arquivos da entrega:**
  - `src/features/slaughterhouses/{schema.ts,service.ts,actions.ts,rate-limit.ts}`: entrada Zod, serviços somente no servidor, transações, autorização, histórico, limite de envios e Server Actions.
  - `src/features/slaughterhouses/{manager-shell.tsx,forms.tsx,feedback.tsx,submit-button.tsx}`: navegação/feedback/campos/botões da gestão em português, formulários com POST e funcionamento sem JavaScript.
  - `src/app/(private)/gestor/page.tsx`, `src/app/(private)/gestor/frigorificos/novo/page.tsx`, `src/app/(private)/gestor/frigorificos/[id]/page.tsx`, `src/app/(private)/gestor/regioes/page.tsx`: listagem paginada, cadastro/administração e regiões.
  - `prisma/schema.prisma`, `prisma/migrations/20261026201632_management_history/migration.sql`, `prisma/migrations/20261026203246_region_names_case_insensitive/migration.sql`: auditoria administrativa e unicidade de nomes de região sem diferenciar caixa. Migrations anteriores preservadas.
  - `tests/management.test.ts`, `tests/management-browser.ts`, `tests/login-browser.test.ts`, `tests/helpers/auth-fixtures.ts`, `package.json`: testes e script `test:management`; fixtures/contadores/histórico sintéticos removidos ao final. Sem novas dependências.
  - `README.md`, `PROJECTS_STATUS.md`: funcionamento final, decisões, comandos e roteiro manual; histórico preservado.
- **Decisões e implementação:**
  - Cadastro simples de regiões por nome pelo gestor em `/gestor/regioes`, sem seed de negócio. Nome obrigatório até 120 caracteres, espaços externos/extras normalizados e Unicode NFC. Índice SQL único `lower(name)` impede duplicatas em maiúsculas/minúsculas inclusive em concorrência; schema/README documentam a preservação do índice nas migrations futuras. Não se presume que nomes sem acentos sejam equivalentes.
  - A região cadastrada aparece imediatamente nos formulários dos frigoríficos. Instalação sem regiões apresenta link para criá-las antes de salvar um frigorífico. Não foi acrescentada edição/exclusão de regiões.
  - Frigoríficos removidos logicamente por desativação, conforme produto; preservação do cadastro e histórico. Vários responsáveis podem ter acessos individuais ao mesmo frigorífico. Gestor edita nome/e-mail/situação e redefine senha; não cria gestores pela interface nem transfere vínculos.
  - Senhas de 12–128 caracteres, hash Better Auth, nunca reexibidas; comunicação das credenciais feita pelo gestor por canal seguro, sem serviço de e-mail. Troca de identidade/senha e desativação revogam sessões. Salvar frigorífico encerra todas as sessões vinculadas; reativação não restaura sessões nem ativa acessos individualmente desativados.
  - Sessão/papel/origem validados em cada Server Action e papel/situação atuais reconsultados no serviço. Alvos de acesso limitados ao frigorífico indicado e ao perfil de frigorífico; criação fixa papel/vínculo no servidor. Valores inesperados/IDs/nomes/e-mails/senhas/situações são validados. Redirects contêm somente códigos fixos.
  - Envios administrativos limitados a **30/minuto por gestor** em janela fixa atômica PostgreSQL, compartilhada entre processos; tentativas inválidas contam e recebem mensagem de espera, sem persistir a operação bloqueada. Reutiliza `RateLimit`, sem nova infraestrutura. Leitura de páginas não consome esse limite.
  - `ManagementEvent` registra autor, instante, alvos e alterações administrativas selecionadas, na mesma transação. Sem senha/hash/token/cotação nesse histórico e sem endpoint público de consulta. Locks de linha coordenam alterações administrativas do mesmo frigorífico.
  - Sem funcionalidades de F4–F8. Cotações históricas existentes são preservadas ao mudar região; não há formulários/serviços de escrita de preços nesta entrega.
- **Testes executados (comando → resultado real):**
  - `npm run db:deploy` no desenvolvimento e `DATABASE_URL=postgresql://cotaroba:cotaroba_local@127.0.0.1:5433/cotaroba_test npm run db:deploy` → exit 0; migration do índice aplicada em ambos. Migration de auditoria já aplicada/verificada na parte anterior da mesma etapa; quatro migrations versionadas no total.
  - `npm run test:management` → exit 0, **19/19 aprovados**, zero falhas/skips; inclui cadastro de regiões, normalização, duplicidade concorrente, limite atômico/janela, autorização, CRUD lógico, vínculos, senhas/sessões, preservação de histórico e DTO/auditoria sem credenciais.
  - `npm run test:auth` → exit 0, **27/27 aprovados**, zero falhas/skips; regressões da F2 preservadas.
  - `npm run test:db` → exit 0, **8/8 aprovados**, zero falhas/skips; sem regressões das restrições/modelos existentes.
  - `TEST_SCREENSHOT_DIR=/tmp/cotaroba-f3-final-qa PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → exit 0, **8/8 aprovados em desenvolvimento**. Jornada inclui região/duplicata/frigorífico/acesso por POST sem JavaScript; login do novo acesso e desativação; edição/reset com JavaScript; replay de Server Actions negado para visitante/frigorífico/origem externa; limite administrativo com feedback e sem gravação; portal sem cadastros privados.
  - `TEST_APP_MODE=production PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → exit 0, **8/8 aprovados em produção local**, mesma cobertura. Total de **62 testes distintos** (19+27+8+8), sem duplicar contagem por repetição.
  - Layout sem rolagem horizontal em **320/390/1280px**; capturas de celular/desktop inspecionadas visualmente em `/tmp/cotaroba-f3-final-qa`, fora do Git.
  - `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run db:validate`, `npm run build` → exit 0; Prisma válido, TypeScript/compilação/prerender aprovados. Portal estático, páginas de gestão dinâmicas.
  - Primeira execução da extensão cancelou 18 testes por uma asserção do harness fora do seu escopo (`events`); typecheck identificou o mesmo erro. Asserção corrigida; 18 casos passaram e, após acrescentar o limite, **19/19 passaram**. Sem defeito de persistência ou autenticação nessa falha do harness.
  - Primeira repetição final em produção retornou **7/8** por corrida no harness entre dois salvamentos com o mesmo código/URL; DOM era substituído durante a abertura do formulário seguinte. Sincronização do teste ajustada para aguardar a requisição antes do próximo formulário; repetição final **8/8 aprovada**. Nenhuma mudança de regra/domínio para acomodar teste.
  - SQL final → testes com **zero usuários/contas/regiões/frigoríficos/cotações/eventos/contadores**; desenvolvimento preservado com **um usuário/uma credencial**, zero regiões/frigoríficos/cotações/eventos. Nenhuma senha real usada/alterada e nenhum dado de negócio inventado.
  - `git check-ignore .env src/generated/prisma/client.ts` → ignorados. `git diff --check` e revisão do diff → arquivos pertinentes à F3, sem erros de whitespace.
- **Testes não executados e motivo:** instalação limpa/auditoria npm não repetidas, sem dependências novas; resultados da base permanecem no histórico. TLS/proxy/deploy e outros navegadores aguardam homologação. Acessibilidade automática completa não repetida; labels, teclado e dimensões foram conferidos no fluxo. Validação com dados/conta do usuário será feita por ele, sem solicitar suas credenciais.
- **Commit Conventional Commits:** `feat(slaughterhouses): manage regions, slaughterhouses and accesses`; hash: consultar Git após criação. Implementação, migrations, testes, README e este status no mesmo commit; hash real informado na entrega.
- **Como validar manualmente:**
  1. Abrir `http://localhost:3000/login` e entrar com seu gestor existente. Aplicação local reiniciada em 3000 com `.env` e banco real; PostgreSQL saudável. Em outra instalação, executar `npm ci`, `docker compose up -d --wait db`, `npm run db:deploy` e `npm run dev`.
  2. Em **Regiões**, cadastrar um nome; repetir em maiúsculas/espaços extras deve mostrar duplicidade. Em **Cadastrar frigorífico**, usar essa região, salvar e editar o nome; conferir na listagem.
  3. Criar um acesso do responsável com e-mail e senha de 12–128 caracteres. Conferir erro de e-mail duplicado e ausência da senha após salvar/errar. Em janela privativa, entrar com o novo acesso: deve abrir `/frigorifico`, identificar a própria empresa e negar `/gestor`.
  4. No gestor, editar/desativar o acesso e conferir que a sessão da janela privativa deixa de valer. Reativar e redefinir a senha: anterior falha, nova funciona. Desativar o frigorífico bloqueia todos os acessos e mantém o cadastro na listagem; reativar não ativa acessos individualmente desativados.
  5. Repetir por teclado/celular e sem JavaScript; URL não deve conter credenciais. Portal sem login continua com “Dados insuficientes”. Se exceder 30 envios administrativos em um minuto, aguardar antes de continuar.
- **Pendências/bloqueios:** nenhum bloqueio técnico da F3-T01; apenas validação humana explícita pendente. Não há regiões/usuários de frigorífico pré-cadastrados no banco real: gestor os define pelos formulários entregues. Categorias e políticas futuras continuam abertas nos respectivos escopos.
- **Aprovação do usuário:** PENDENTE para a entrega final da F3-T01. A escolha “1” autorizou o cadastro de regiões; não equivale à aprovação desta entrega completa.
- **Próximo passo autorizado:** parar e aguardar teste e validação explícita da F3-T01; não iniciar F4-T01 automaticamente.

### 2026-10-26 — F3-T01 — Validação humana e autorização da F4
- **Estado:** VALIDADA.
- **Aprovação:** usuário confirmou “Validado, pode iniciar a F4”, com pedido de trabalhar até o limite de uso de 5 horas do Codex e pausar no ponto em que estiver. Esclarecimento recebido: limite de uso do Codex, não 05h nem cinco horas cronometradas desta execução.
- **Commit validado:** `7e0b966` — `feat(slaughterhouses): manage regions, slaughterhouses and accesses`.
- **Arquivos:** somente registro no status nesta atividade; histórico preservado.
- **Testes:** nenhum teste adicional da F3 nesta validação humana; resultados anteriores preservados.
- **Próximo passo autorizado:** somente F4-T01. F5 não autorizada.

### 2026-10-26 — F4-T01 — Inspeção, plano e decisão de categorias
- **Estado:** EM_ANDAMENTO.
- **Inspeção:** Git limpo em `main`, commit `7e0b966`; AGENTS, status e documentos de `docs/` revisados; PostgreSQL saudável e aplicação existente em 3000. Registro de início às 18:10 (Fortaleza) após leitura/definições.
- **Escopo/critério:** frigorífico cadastra preço em R$/@, data e categoria, atualiza suas próprias cotações sem sobrescrever versões anteriores e consulta histórico próprio. Identidade/vínculo derivados da sessão e rechecados no servidor; região/autoria preservadas; isolamento contra outros frigoríficos/gestor/visitante testado. Sem publicação de preços ou F5.
- **Decisão de produto:** usuário autorizou “Permitir que o gestor cadastre categorias por nome nesta F4”; mesmo modelo simples das regiões, sem seed de categorias comerciais.
- **Plano/arquivos:** módulo `src/features/quotes`, páginas privadas de frigorífico e cadastro de categorias pelo gestor, schema/migration de versões/autoria, testes de domínio/autorização/navegador, README e status.
- **Decisões de implementação:** valores decimais exatos respeitando NUMERIC(12,2); revisão acrescenta registro, mantém região da série e registra autor/instante. Categoria/data/preço corrigíveis com preservação dos valores anteriores. Nenhuma restrição comercial de preço ou lista de categorias será inventada.
- **Limite solicitado:** manter ponto de retomada no status e pausar ao atingir o limite de uso do Codex; se F4 concluir antes, testar/commitar/submeter e parar, sem avançar. Contador de limite não exposto pelas ferramentas disponíveis; não declarar um horário fictício de esgotamento.
- **Testes:** inspeções Git, banco, modelos e suítes existentes; testes da F4 pendentes.
- **Commit:** não realizado; criar somente após conclusão/verificação, ou registrar parcial se ocorrer interrupção.
- **Aprovação:** execução/categorias autorizadas; entrega final da F4 ainda pendente de validação humana.

### 2026-10-27 — F4-T01 — Conclusão técnica de cotações privadas e histórico
- **Estado:** IMPLEMENTADA_AGUARDANDO_VALIDACAO. Somente F4-T01 concluída tecnicamente; F5 não iniciada.
- **Objetivo e critérios atendidos:** gestor cadastra categorias por nome; frigorífico cria cotação com categoria, preço em R$/@ e data, consulta a lista própria e atualiza por nova versão. Histórico preserva preços, categoria, data, região, autoria e instante anteriores. Leitura/escrita de outra empresa e acesso de visitante/gestor às cotações são negados; portal público continua sem preços individuais.
- **Arquivos da implementação:** `prisma/schema.prisma`, `prisma/migrations/20261026211810_quote_versions_and_categories/migration.sql`, `src/features/quotes/{actions,components,format,rate-limit,schema,service}.ts(x)`, páginas privadas `src/app/(private)/frigorifico/{page.tsx,cotacoes/[id]/page.tsx}` e `src/app/(private)/gestor/categorias/page.tsx`; ajustes de navegação/gestão, fixtures e `tests/quotes.test.ts` já presentes no commit `93cd0ec`. Nesta retomada: `tests/quotes-browser.ts`, `tests/login-browser.test.ts`, `src/features/quotes/service.ts`, `README.md` e este status.
- **Implementação e decisões:** categoria criada pelo gestor, normalizada e única sem diferenciar caixa; nenhum seed comercial. Preço validado como decimal positivo de até duas casas, sem separador de milhar; data civil validada; empresa, região e autor derivados no servidor. Atualização acrescenta versão e rejeita revisão obsoleta, inclusive concorrente. Região da série permanece a original mesmo se o cadastro da empresa mudar. Registros anteriores não recebem autoria inventada. Limite atômico de 30 escritas/minuto por frigorífico. Leituras transacionais passaram a ser sequenciais no mesmo cliente, sem lançar consultas paralelas no mesmo `pg` client. A migration aditiva aplicada preservou dados existentes. O fluxo de navegador foi acrescentado e README atualizado para a entrega real.
- **Histórico de Git observado na retomada:** `93cd0ec` (`feat: initialize F4-T01`) continha a implementação inicial e os testes de domínio; `a614bee` (`fix: remove text`) alterou uma linha do README. Ambos já existiam em `main` com workspace limpo ao retomar; não foram reescritos. O commit final desta conclusão inclui testes de navegador, ajuste de leitura, README e status, conforme o fluxo de Git.
- **Testes executados (comando → resultado real):**
  - `npm run test:quotes` → **19/19 aprovados**, zero falhas/skips, após ajuste de leitura. Cobrem categorias, validação de preço/data, isolamento, versões/concorrência, região/autoria, paginação, desativação e limite. O driver `pg` ainda emitiu aviso de depreciação de consulta concorrente em algum fluxo da suíte; nenhuma falha funcional.
  - `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → **9/9 aprovados em desenvolvimento**; nova jornada sem JavaScript cadastra categoria, cria/revisa cotação, confere as duas versões, 404 para outra empresa e ausência do preço no portal. Regressões de login/gestão preservadas.
  - `TEST_APP_MODE=production PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → **9/9 aprovados em produção local**; mesma jornada e regressões.
  - `npm run test:management` → **19/19 aprovados**; `npm run test:auth` → **27/27 aprovados**; `npm run test:db` → **8/8 aprovados**. Total de **82 testes distintos** (19+19+27+8+9), sem contar a repetição do navegador como casos novos.
  - `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run db:validate`, `npm run build` → exit 0. `npm run format` aplicado aos arquivos cobertos pelo formatter. `npm run db:status` → cinco migrations encontradas, banco de desenvolvimento atualizado. Consulta SQL ao banco `cotaroba_test` após as suítes → **0 usuários, 0 frigoríficos, 0 cotações, 0 categorias, 0 eventos administrativos**.
  - Primeira tentativa de `npm run test:quotes` e `npm run db:status` no sandbox falhou por acesso local `EPERM`/`P1001`; repetidas com acesso ao PostgreSQL local, aprovadas. `git diff --check` → sem erro de whitespace.
- **Testes não executados e motivo:** validação humana com cadastros reais, outros navegadores e revisão de publicação agregada (F5) não pertencem ao gate automatizado desta entrega. Instalação limpa/auditoria npm não repetidas porque não houve mudança de dependências.
- **Commit Conventional Commits:** `feat(quotes): complete private quote workflow and browser coverage`; hash: consultar `git log -1 --format=%h` após criação. Este status integra o mesmo commit final; hash real será informado ao usuário.
- **Como validar manualmente:** aplicar migrations com `npm run db:deploy`, executar `npm run dev` e entrar como gestor em `/gestor/categorias`; criar categoria e conferir duplicidade em maiúsculas. Entrar como frigorífico em `/frigorifico`, salvar preço/data/categoria, abrir **Atualizar e ver histórico**, corrigir valor e conferir duas versões com autores/horários. Entrar como outro frigorífico: cotação ausente e URL da série retorna 404. Abrir portal sem login: “Dados insuficientes”, sem preço/empresa. Repetir com JavaScript desativado e no celular. Detalhes no README.
- **Pendências/bloqueios:** nenhum bloqueio técnico da F4-T01; validação explícita do usuário pendente. Política de suficiência/publicação regional permanece questão da F5, não resolvida nesta etapa. Aviso de depreciação do `pg` será acompanhado se persistir na atualização futura do driver.
- **Aprovação do usuário:** PENDENTE. Testes automatizados e commit não equivalem à validação humana.
- **Próximo passo autorizado:** parar e aguardar teste e confirmação explícita da F4-T01; não iniciar F5 automaticamente.

### 2026-10-27 — F4-T01 — Validação humana e autorização da F5
- **Estado:** VALIDADA.
- **Aprovação do usuário:** confirmação explícita “Validada! Iniciar a F%” recebida em 2026-10-27; “F%” interpretado como F5-T01, a próxima etapa do roadmap.
- **Commit validado:** `0d69b35` — `feat(quotes): complete private quote workflow and browser coverage`, além dos commits anteriores da mesma etapa `93cd0ec` e `a614bee`.
- **Arquivos alterados:** somente este status nesta atividade; histórico preservado.
- **Testes:** aprovação manual informada pelo usuário; nenhum teste adicional da F4 executado nesta validação. Resultados anteriores preservados.
- **Próximo passo autorizado:** iniciar somente F5-T01, sujeito à definição prévia da política de publicação exigida por `docs/DATA_AND_INTEGRATIONS.md` e pela regra 7 do `AGENTS.md`.

### 2026-10-27 — F5-T01 — Inspeção e decisão de publicação pendente
- **Estado:** BLOQUEADA por decisão de produto/segurança necessária antes de implementar a publicação.
- **Objetivo e critérios:** consolidar cotações comparáveis por região/categoria/período e oferecer consulta pública sem identidade nem preço individual; exibir “Dados insuficientes” quando não houver base segura. Uma empresa não pode multiplicar o próprio peso. Metodologia e versão dos indicadores devem ser documentadas.
- **Inspeção:** Git limpo em `main`, commit `0d69b35`; página pública ainda estática, sem consulta ao banco. O banco local de desenvolvimento possui **1 região, 1 categoria, 1 frigorífico e 1 cotação** (somente contagens consultadas; nenhum preço ou identificador foi exibido). O contrato do projeto não define atraso, janela, recortes, suficiência nem medidas contra inferência entre publicações sucessivas.
- **Motivo da decisão:** `docs/DATA_AND_INTEGRATIONS.md` proíbe presumir que um limiar fixo garanta anonimato e exige política aprovada antes da F5. O Cade alerta que informações recentes e desagregadas sobre preço entre concorrentes são sensíveis; referência: https://www.gov.br/cade/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-sobre-infracoes-a-ordem-economica. O risco não se resolve apenas escolhendo um número mínimo de frigoríficos.
- **Decisão solicitada ao usuário:** preparar cálculo e página mantendo valores de preços ocultos até revisão da política de divulgação (opção conservadora), ou fornecer uma política/parecer já aprovado para orientar publicação. Pergunta assíncrona enviada; resposta pendente neste registro.
- **Arquivos alterados:** `PROJECTS_STATUS.md`; nenhum código ou migration da F5 alterado.
- **Testes executados (comando → resultado):** `git status --short --branch` → limpo no início, `main` um commit à frente de `origin/main`; leitura de `docs/ROADMAP.md`, `docs/DATA_AND_INTEGRATIONS.md`, `docs/QUALITY_AND_SECURITY.md`, página pública e serviço de cotações → escopo e fronteiras revisados; `docker compose exec -T db psql -U cotaroba -d cotaroba -Atc 'SELECT ... contagens ...'` → `1|1|1|1` para regiões/categorias/frigoríficos/cotações. Testes de aplicação não executados porque não houve implementação da F5.
- **Commit Conventional Commits:** `docs(status): record F4 approval and F5 publication decision`; hash: consultar Git após criação.
- **Como validar manualmente:** não há funcionalidade nova da F5 para validar neste ponto. A F4 já foi validada pelo usuário.
- **Pendência/bloqueio:** política de publicação e critérios de suficiência explicitamente aprovados ou decisão de manter valores ocultos durante esta etapa. Não inferir autorização da ausência de resposta.
- **Aprovação do usuário:** F4 confirmada; F5 autorizada para início, política pendente; entrega F5 ainda não implementada nem validada.
- **Próximo passo autorizado:** aguardar a decisão solicitada, então implementar somente o escopo da F5 correspondente, testar, atualizar status, commitar e submeter à validação. Não iniciar F6.

### 2026-10-27 — F5-T01 — Proposta de média com um ou dois frigoríficos
- **Estado:** BLOQUEADA até confirmação explícita da mudança na regra de confidencialidade.
- **Proposta do usuário:** “Caso uma região tenha apenas um frigorifico, mantem o preco do mesmo, se tiver 2 ou mais ai sim tiramos a media.”
- **Análise:** com um participante, o indicador público reproduz uma cotação individual; com dois, cada participante que conhece o próprio preço consegue calcular o preço do outro a partir da média (`outro = 2 × média − próprio`). A proposta contraria a decisão confirmada de que o público nunca vê cotação individual e o requisito de privacidade em `AGENTS.md`, `docs/PRODUCT_SPEC.md` e `docs/QUALITY_AND_SECURITY.md`. A condição também precisa considerar categoria e período, pois o número de frigoríficos por região isoladamente não assegura contribuições comparáveis.
- **Decisão solicitada:** confirmar se o usuário quer substituir explicitamente a regra de confidencialidade e autorizar a exposição/inferência descrita, ou preservar a privacidade e definir outra política de publicação. Pergunta enviada pela ferramenta assíncrona; resposta pendente neste registro.
- **Arquivos alterados:** `PROJECTS_STATUS.md` somente. Nenhuma alteração de código, migration ou dados públicos.
- **Testes:** nenhum teste de aplicação executado; nenhuma implementação de F5 foi feita. Conferência aritmética da inferência para dois participantes.
- **Commit Conventional Commits:** `docs(status): record F5 disclosure proposal and privacy conflict`; hash: consultar Git após criação.
- **Aprovação:** proposta recebida, mas substituição do requisito anterior ainda não confirmada.
- **Próximo passo:** aguardar confirmação explícita antes de implementar qualquer saída pública de preço. Não iniciar F6.

### 2026-10-27 — F5-T01 — Publicação de preços por frigorífico e região
- **Estado:** IMPLEMENTADA_AGUARDANDO_VALIDACAO. Somente F5-T01 implementada; F6 não iniciada.
- **Decisão/autorização do usuário:** “Vamos substituir a regra, ao inves de exibir a media, é para exibir o preco de cada frigorifico daquela regiao.” A regra anterior de agregação anônima foi expressamente substituída. O usuário já havia sido informado de que um único preço revela a cotação individual e de que uma média de dois permite inferência; esta entrega segue a nova decisão de publicar cada preço, sem média.
- **Objetivo e critérios atendidos:** página pública `/cotacoes` acessível sem login, com seleção de região e categoria, exibindo nome, preço R$/@, data de referência e atualização da última cotação vigente de cada frigorífico ativo. Uma linha por frigorífico/categoria na região atual; não há média nem mínimo de participantes. Sem registros, “Dados insuficientes”. Histórico de versões, autor pessoal, IDs de cotação, sessões e credenciais continuam fora do DTO público.
- **Arquivos alterados:** `src/features/public-quotes/service.ts`, `src/app/cotacoes/page.tsx`, `src/app/page.tsx`, `tests/public-quotes.test.ts`, `tests/quotes-browser.ts`, `tests/login-browser.test.ts`, `tests/management-browser.ts`, `package.json`, `prisma/schema.prisma` (comentário; sem migration), `README.md`, `AGENTS.md`, `CODEX_START_PROMPT.md`, `docs/{PRODUCT_SPEC,ROADMAP,TECHNICAL_SPEC,DESIGN_SYSTEM,DATA_AND_INTEGRATIONS,QUALITY_AND_SECURITY}.md` e este status. Documentos correntes alinhados à decisão do usuário; entradas históricas deste status preservadas.
- **Implementação e decisões:** seleção SQL parametrizada, no servidor, toma somente a versão vigente de cada série e escolhe a maior data de referência por frigorífico/categoria; empate por instante de criação e ID. Exige frigorífico ativo e mesma região no cadastro atual e na cotação; cotações de região anterior deixam de ser mostradas após mudança de região. Filtros aceitam apenas IDs existentes nas listas do banco; páginação de 20 registros. `/cotacoes` é dinâmica para consultar o banco por requisição. Não há endpoint/API pública separada, média, valores fictícios, novo serviço ou dependência. A página inicial apenas encaminha à consulta e preserva o estado vazio dos indicadores adicionais.
- **Testes executados (comando → resultado real):**
  - `npm run test:public-quotes` → **5/5 aprovados**, zero falhas/skips: região sem preço, publicação de uma empresa, duas empresas sem média, versão vigente/última data, região atual, frigorífico inativo, filtros inválidos e DTO sem metadados privados. Primeira execução teve 2 falhas de expectativa do harness (`createCategory` retorna só ID; região padrão é a primeira por nome); expectativas corrigidas, segunda execução 5/5.
  - `npm run test:quotes` → **19/19 aprovados**; `npm run test:management` → **19/19**; `npm run test:auth` → **27/27**; `npm run test:db` → **8/8**. Aviso de depreciação do `pg` já conhecido na suíte de cotações, sem falha funcional. Total com navegador: **87 testes distintos** (5+19+19+27+8+9).
  - `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → **9/9 aprovados em desenvolvimento**, inclusive criação/revisão sem JavaScript, navegação pública, filtro GET e preço vigente individual, sem versão anterior/e-mail. `TEST_APP_MODE=production PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → **9/9 aprovados em produção local**. Repetidos após os ajustes finais do harness.
  - Primeira execução do navegador em desenvolvimento passou 8/9: asserção procurava preço sem separador de milhar; corrigida para o formato real `pt-BR`, repetição 9/9. Primeira execução de produção passou 8/9 por troca do DOM durante teste antigo de redefinição de senha; reload no harness antes dessa operação estabilizou o teste, repetição 9/9 em produção e desenvolvimento. Sem alteração da lógica de autenticação para acomodar esses testes.
  - `TEST_SCREENSHOT_DIR=/private/tmp/cotaroba-f5-qa PLAYWRIGHT_CHANNEL=chrome npm run test:browser` → **9/9 aprovados**; `/cotacoes` sem rolagem horizontal em 320/390/1280px. Capturas de 320 e 1280px inspecionadas visualmente; artefatos temporários fora do Git.
  - `npm run format`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run db:validate`, `npm run build` → exit 0. Build gera `/cotacoes` como rota dinâmica; página inicial permanece estática.
  - SQL de contagens após as suítes → banco de testes com **0 usuários, 0 frigoríficos, 0 cotações, 0 categorias e 0 eventos**; desenvolvimento preservado com **1 região, 1 categoria, 1 frigorífico e 1 cotação**. `git diff --check` → sem whitespace inválido.
- **Testes não executados e motivo:** navegadores além de Chrome, deploy e revisão concorrencial externa pertencem à homologação F8. Instalação limpa/auditoria npm não repetidas, sem alteração de dependências. Nenhuma migration necessária, pois o esquema persistido não mudou.
- **Risco/pendência:** preço e identidade comercial individuais tornam-se públicos na aplicação local por decisão do usuário. Revisão concorrencial apropriada permanece pendente antes de qualquer deploy público em F8; o guia do Cade consultado na análise anterior aponta sensibilidade de preços recentes/desagregados. A interface indica fonte, unidade e datas e não afirma tempo real.
- **Commit Conventional Commits:** `feat(public-quotes): publish slaughterhouse prices by region`; hash: consultar `git log -1 --format=%h` após criação. Código, testes, documentos e este status compõem o mesmo commit.
- **Como validar manualmente:** com PostgreSQL local ativo, executar `npm run dev` e abrir `/cotacoes` sem login; a região/categoria existentes devem exibir o nome, preço e datas da cotação já cadastrada. Entrar como frigorífico, atualizar a cotação e recarregar a página pública: somente o novo preço vigente deve aparecer. Se houver outro frigorífico com cotação na mesma região/categoria, cada um deve aparecer separadamente, sem média. Testar filtros e uma região/categoria sem cotações (“Dados insuficientes”); conferir que histórico de versões e nome do responsável não aparecem publicamente. Repetir em celular e com JavaScript desativado.
- **Aprovação do usuário:** PENDENTE para a F5-T01; decisão sobre regra de publicação recebida, mas não equivale à validação da entrega implementada.
- **Próximo passo autorizado:** parar e aguardar teste e aprovação explícita da F5-T01. Não iniciar F6 automaticamente.
