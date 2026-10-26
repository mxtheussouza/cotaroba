# Cotaroba

Observatório pecuário da Bahia: portal público de indicadores regionais
consolidados. As cotações individuais dos frigoríficos são privadas.

## Estado da implementação

A F0-T01 foi validada pelo usuário. A F1-T01 acrescenta PostgreSQL local,
Prisma e a migration inicial. O histórico e a aprovação de cada etapa estão em
[PROJECTS_STATUS.md](./PROJECTS_STATUS.md).

A página pública continua simples, em português e sem dados de mercado,
exibindo “Dados insuficientes”. Banco e modelos não estão expostos por API ou
formulários nesta etapa.

## Requisitos e execução local

- Node.js 24 (versão indicada em `.nvmrc`).
- npm 11.
- Docker Desktop iniciado, com Docker Compose, para o banco local.

Na primeira execução, crie `.env` a partir do exemplo. Se já houver `.env`,
preserve as configurações existentes:

```sh
cp .env.example .env
npm ci
docker compose up -d --wait db
npm run db:deploy
npm run dev
```

Abra <http://localhost:3000>. Encerre a aplicação com `Ctrl+C`.
O PostgreSQL fica disponível apenas em `127.0.0.1:5433`, com volume local
persistente. As credenciais do exemplo são exclusivas para desenvolvimento.
Para parar o banco preservando os dados, use `docker compose stop db`.

O Prisma CLI e os testes carregam `.env` na raiz. Se alterar usuário, senha,
porta ou nome do banco, atualize também as URLs. Variáveis já definidas no
ambiente têm precedência. Não versione `.env` nem credenciais reais.

`npm ci` gera o cliente Prisma via `postinstall`; não exige conexão com banco.
A página pública e seu build também continuam independentes de PostgreSQL.

## Modelo inicial

| Modelo           | Finalidade                                                                        |
| ---------------- | --------------------------------------------------------------------------------- |
| `Region`         | Regiões com nomes únicos, sem lista de negócio predefinida.                       |
| `CattleCategory` | Categorias comerciais com nomes únicos, sem seed.                                 |
| `Slaughterhouse` | Nome, região atual, situação ativa e datas de criação/alteração.                  |
| `Quote`          | Registro privado com frigorífico, região de referência, categoria, preço e datas. |

Os preços usam `NUMERIC(12,2)`, em reais por arroba (`pricePerArroba`, R$/@),
com restrição SQL para valores positivos. Use strings/`Prisma.Decimal` ao
persistir valores monetários. `referenceDate` é uma data civil (`DATE`);
`createdAt` e `updatedAt` usam `TIMESTAMPTZ(3)` para instantes com fuso.

As relações impedem excluir cadastros ainda referenciados. A região de cada
cotação fica preservada mesmo se a região atual do frigorífico mudar.
O modelo comporta vários registros históricos; a futura operação de atualização
de cotações deverá acrescentar registros, preservando os anteriores. A política
de escrita e a autoria serão tratadas nas etapas de autenticação e cotações.

Nenhuma região, categoria ou cotação de negócio é criada automaticamente.
Usuários/sessões, dados externos e indicadores serão modelados nas respectivas
etapas, conforme o provedor de autenticação e as regras aprovadas.

## Migrations e Prisma

```sh
npm run db:generate
npm run db:validate
npm run db:status
```

Para aplicar as migrations versionadas em um banco novo, use `npm run db:deploy`.
O comando pode ser repetido: migrations já aplicadas não são executadas novamente.
Para criar migrations futuras somente no banco de desenvolvimento:

```sh
npm run db:migrate -- --name descricao_da_alteracao
```

A configuração é `prisma7.config.ts`, explícita nos scripts, e o schema está em
`prisma/schema.prisma`. O cliente gerado fica em `src/generated/prisma/` e não
é versionado. A restrição de preço positivo é mantida na migration SQL, pois
não é representada no schema Prisma; preserve-a em migrations futuras.

O acesso da aplicação é `getDatabase()` em `src/lib/db.ts`: somente no servidor,
com inicialização sob demanda e reutilização do cliente/pool entre chamadas.
Não importe esse módulo em componentes cliente. A página pública não o utiliza.

Para conferir os modelos no banco de desenvolvimento, execute `npm run db:studio`
e abra o endereço local indicado pelo comando. Nesta etapa, as tabelas estarão
vazias. Não use credenciais de produção nesse fluxo local.

## Testes de banco

Os testes usam um banco separado, local e com nome terminado em `_test`.
Eles recusam o nome do banco de desenvolvimento e revertem as transações com
fixtures sintéticas, sem inserir dados de teste na aplicação pública.

Com o PostgreSQL local iniciado, crie o banco de testes **uma única vez**:

```sh
docker compose exec -T db createdb -U cotaroba cotaroba_test
```

Aplique a mesma migration nesse banco e execute os testes. Este exemplo corresponde
às URLs locais de `.env.example`; adapte-o se tiver alterado a configuração:

```sh
DATABASE_URL=postgresql://cotaroba:cotaroba_local@127.0.0.1:5433/cotaroba_test npm run db:deploy
npm run test:db
```

Os testes verificam decimais exatos, datas e histórico, preços não positivos,
chaves estrangeiras, exclusão de frigorífico referenciado, preservação da região
histórica, unicidade de regiões e erros de configuração sem exposição de senha.

## Verificações da aplicação

```sh
npm run lint
npm run typecheck
npm run format:check
npm run build
```

O typecheck gera os tipos de rotas antes de verificar o TypeScript. O lint é
executado separadamente do build. `npm run format` formata código e configurações,
preservando os documentos do contrato e do histórico. Para formatar o schema,
use `npm exec -- prisma format --config prisma7.config.ts`.

Para testar a versão de produção localmente, após o build:

```sh
npm start
```

## Organização inicial

```text
prisma/         # Schema e migrations SQL versionadas
prisma7.config.ts
src/app/        # Layout, página inicial, estilos e ícone
src/lib/db.ts   # Acesso ao banco somente no servidor
src/generated/  # Cliente Prisma gerado, fora do Git
tests/          # Testes de integração com PostgreSQL real
docs/           # Especificações e roadmap
```

App Router com Server Components por padrão, TypeScript estrito e alias `@/*`
para `src/*`. Novos módulos serão criados conforme cada etapa aprovada,
mantendo UI, domínio, persistência e integrações separados. A fonte usa a pilha
sans-serif do sistema, sem downloads externos no build.

## Teste manual da F1-T01

1. Inicie o banco com `docker compose up -d --wait db`.
2. Execute `npm ci`, `npm run db:validate`, `npm run db:deploy` e `npm run db:status`.
3. Confira o status das migrations; repetir `npm run db:deploy` não deve reaplicar a migration.
4. Use `npm run db:studio` para conferir as quatro entidades e os campos descritos acima.
5. Prepare o banco separado de testes conforme esta documentação e execute `npm run test:db`.
6. Inicie a aplicação com `npm run dev` e abra <http://localhost:3000> sem login.
   A página deve continuar mostrando “Dados insuficientes”, sem preços individuais.
7. Pare o banco com `docker compose stop db` e confirme que a página inicial
   continua acessível; retome-o depois com `docker compose up -d --wait db`.

## Contrato e especificações

Leia [AGENTS.md](./AGENTS.md), [PROJECTS_STATUS.md](./PROJECTS_STATUS.md) e os
arquivos de [docs/](./docs/), começando pela especificação de produto e roadmap.
Cada etapa exige testes, atualização do status, commit Conventional Commits e
validação explícita do usuário antes da próxima etapa.
