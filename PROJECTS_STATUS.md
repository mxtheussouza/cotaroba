# PROJECTS_STATUS.md — Histórico vivo

**Regra:** atualizar após **cada tarefa executada**, preservando todas as entradas. Ver `AGENTS.md`. O status é a fonte de verdade do andamento.

## Estado atual
- Data de referência: 2026-10-26.
- Fase atual: **F0 — preparação**.
- Etapa atual: **F0-T01 — IMPLEMENTADA_AGUARDANDO_VALIDACAO**.
- Aprovação do usuário: **PENDENTE**.
- Implementações concluídas: **F0-T01**, com verificações técnicas aprovadas; validação humana pendente.
- Commit da F0-T01: `chore(setup): initialize Next.js project foundation`; hash: consultar `git log -1 --format=%h` (referência autoritativa após o commit).
- Testes executados: instalação por lockfile, lint, typecheck, formatação, build, auditoria npm e smoke no Chrome em desenvolvimento/produção; resultados abaixo.
- Próxima ação: usuário executar roteiro manual e validar explicitamente a F0-T01. F1-T01 não iniciada; exige autorização.

## Quadro de etapas
| ID | Etapa | Estado | Commit | Validação do usuário |
|---|---|---|---|---|
| F0-T01 | Inspeção e fundação do projeto | IMPLEMENTADA_AGUARDANDO_VALIDACAO | `chore(setup)`; hash: consultar Git | PENDENTE |
| F1-T01 | Banco e modelo inicial | PENDENTE | — | PENDENTE |
| F2-T01 | Login e permissões | PENDENTE | — | PENDENTE |
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

## Questões ainda abertas
- Nome/identidade visual definitiva.
- Regiões e categorias comerciais iniciais.
- Critérios seguros de publicação agregada e eventual revisão concorrencial.
- Provedores de banco/autenticação e credenciais.
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
