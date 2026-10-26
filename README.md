# Cotaroba

Observatório pecuário da Bahia: portal de indicadores regionais
consolidados. As cotações individuais dos frigoríficos são privadas.

## Estado da implementação

F0-T01, F1-T01 e F2-T01 foram validadas pelo usuário. A F3-T01 acrescenta
cadastro de regiões e gestão privada de frigoríficos e acessos. O login usa sessões PostgreSQL e Better Auth. O histórico e a aprovação de cada etapa estão em
[PROJECTS_STATUS.md](./PROJECTS_STATUS.md).

A página pública continua simples, em português e sem dados de mercado,
exibindo “Dados insuficientes”. Cotações não são expostas por API ou formulários nesta etapa.

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

## Modelo do domínio

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
de escrita e a autoria das cotações serão tratadas na F4-T01.

Nenhuma região, categoria ou cotação de negócio é criada automaticamente.
Dados externos e indicadores serão modelados nas respectivas etapas, conforme
as regras aprovadas. Os modelos de autenticação estão descritos abaixo.

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
é versionado. A restrição de preço positivo e o índice único `lower(name)` das
regiões são mantidos nas migrations SQL, pois não são representados no schema
Prisma; preserve-os em migrations futuras.

O acesso da aplicação é `getDatabase()` em `src/lib/db.ts`: somente no servidor,
com inicialização sob demanda e reutilização do cliente/pool entre chamadas.
Não importe esse módulo em componentes cliente. A página pública não o utiliza.

Para conferir os modelos no banco de desenvolvimento, execute `npm run db:studio`
e abra o endereço local indicado pelo comando. Os cadastros inseridos pelo operador e pelo gestor ficam nesse banco. Não use
credenciais de produção nesse fluxo local.

## Login, sessões e permissões

A autenticação usa Better Auth `1.7.13` e o adapter Prisma. Sem cadastro público,
OAuth ou envio de e-mails nesta etapa. `/login` aceita e-mail e senha; o papel e
o frigorífico são definidos no servidor, sem seletor de perfil no formulário.

No `.env`, configure a origem exata da aplicação e um segredo privado de pelo
menos 32 caracteres:

```dotenv
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET=""
```

Gere um segredo com o comando abaixo e substitua o campo vazio do `.env` pelo
valor gerado. Não use o texto do exemplo como segredo nem versione o arquivo:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Nenhum usuário de negócio é criado automaticamente. A página `/login` redireciona
para a origem configurada em `BETTER_AUTH_URL` antes de receber credenciais.
`localhost` e `127.0.0.1` representam origens diferentes; o redirecionamento
resolve o alias local sem ampliar a lista de origens confiáveis. Fora de
loopback, a configuração exige HTTPS, e o cookie recebe o atributo Secure.

Com o banco migrado, crie **somente o primeiro gestor** no terminal:

```sh
npm run auth:create-manager -- seu-email@exemplo.com "Seu nome"
```

O comando solicita uma senha de 12 a 128 caracteres com entrada mascarada.
A senha não vai em argumentos, arquivo ou logs; é persistido somente o hash do
Better Auth. O bootstrap recusa criar outro gestor quando já existe um, com
transação e lock PostgreSQL para impedir duas criações simultâneas. Nenhum
endpoint público invoca esse comando. Os acessos de frigorífico são criados
pelo gestor na interface privada descrita abaixo.

Entre em <http://localhost:3000/login>. `/acesso` encaminha ao destino do perfil:
`/gestor` ou `/frigorifico`. Cada página privada verifica a sessão e a permissão
no servidor. Perfil incorreto é encaminhado a `/acesso-negado`; visitante e
acesso desativado são encaminhados ao login. O gestor administra os cadastros;
a área do frigorífico ainda não oferece cotações (F4-T01).

As sessões duram no máximo oito horas, sem renovação automática nem cache de
permissões no cookie. O cookie é HttpOnly e SameSite=Lax. Logout exclui a sessão
persistida; replay do cookie antigo é recusado. O usuário e o frigorífico são
consultados novamente em cada requisição protegida: desativação ou alteração
do papel tem efeito imediato na próxima requisição ao servidor.

O login tem limite de cinco tentativas por minuto por IP, inclusive em
desenvolvimento, com contadores atômicos no PostgreSQL. Na publicação, o proxy
precisa fornecer um IP confiável e sanitizar cabeçalhos encaminhados; essa
configuração deverá ser conferida na F8-T01. A origem é validada pelo Better Auth
para impedir ações de autenticação vindas de outros sites.

Modelos privados adicionais: `User` (papel/situação/vínculo), `Account` (hash de
senha), `Session`, `Verification` (estrutura exigida pelo provedor) e `RateLimit`.
O SQL exige que o gestor não tenha frigorífico, que o usuário de frigorífico
tenha um vínculo válido e que o e-mail esteja normalizado. Campos de papel,
situação e vínculo não são aceitos como entrada pelo provedor.

O provedor expõe POST `/api/auth/sign-in/email` e POST `/api/auth/sign-out`.
Os formulários HTML também usam POST `/api/auth/login` e POST `/api/auth/logout`,
que delegam ao mesmo handler do provedor, preservando cookies, validação de origem
e ratelimit. A consulta de sessão é interna ao servidor.
Operações privadas futuras deverão chamar `requireRole` ou a verificação
correspondente em cada operação, além de derivar o frigorífico da identidade
autenticada; proteger apenas layout ou esconder botões não é autorização.

### Envio do formulário e recuperação de acesso

O formulário declara método POST e destino no servidor, funcionando antes da
hidratação ou com JavaScript desativado. Com JavaScript disponível, permanece a
interação aprimorada. E-mail e senha não são colocados em parâmetros de URL.
Erros do envio HTML usam apenas códigos fixos, sem reproduzir as credenciais.
O servidor limita esse corpo a 8 KiB e aceita o formato URL-encoded do formulário.

A revisão da F2 corrigiu o formulário anterior, que dependia exclusivamente de
JavaScript e podia enviar os campos por GET. URLs antigas com esses campos são
redirecionadas para uma URL limpa; o log de desenvolvimento ignora requisições
com os parâmetros de credenciais. Isso não apaga histórico ou logs anteriores.

Para substituir a senha informada durante a falha, ou recuperar um acesso local,
use o terminal interativo, com o e-mail já cadastrado:

```sh
npm run auth:reset-password -- seu-email@exemplo.com
```

A nova senha é solicitada com máscara (12–128 caracteres). O comando atualiza
somente o hash e encerra as sessões anteriores desse usuário, em transação. Não
altera papel, vínculo ou situação do acesso e não cria contas. O comando não é
exposto como endpoint público. Não execute novamente o bootstrap para tentar
recuperar um gestor já cadastrado.

Para executar os testes de autenticação com o banco separado já migrado:

```sh
npm run test:auth
```

As fixtures são sintéticas, limitadas ao banco local `_test` e removidas ao final.
Cobrem os dois perfis, dois frigoríficos, sessões, bloqueios, origem, ratelimit e
restrições SQL. Nenhuma cotação é criada por essas fixtures. O primeiro bootstrap
de testes requer que não exista gestor nesse banco; uma interrupção de testes
pode exigir revisar e limpar as fixtures restantes exclusivamente no banco de
testes antes de repetir.

## Regressão de login no navegador

A suíte versionada cobre login/logout com JavaScript desativado, envio por Enter,
ausência de credenciais nas URLs, alias de origem, fluxo aprimorado, bloqueio por
perfil e limpeza de URLs antigas. Também cobre a F3: cadastro/edição/desativação,
criação e administração de acessos, mensagens, troca de senha e proteção das
Server Actions. Ela inicia e encerra seu próprio servidor em
loopback:3100, usando exclusivamente `TEST_DATABASE_URL` e segredo efêmero.
Pare outros servidores Next.js deste repositório antes de executar os testes.

Instale o Chromium para testes uma vez e execute:

```sh
npm exec -- playwright install chromium
npm run test:browser
```

Se já houver Chrome instalado, ele pode ser usado sem baixar outro navegador:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:browser
```

Para repetir a suíte no build de produção local:

```sh
npm run build
TEST_APP_MODE=production PLAYWRIGHT_CHANNEL=chrome npm run test:browser
```

As fixtures são removidas ao final; o acesso de desenvolvimento do operador não
é alterado. Os testes recusam reutilizar uma aplicação já aberta na porta 3100.

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
src/app/        # Páginas públicas/privadas, Server Actions e login/logout
src/features/   # Autenticação e gestão privada de frigoríficos/acessos
scripts/        # Bootstrap do primeiro gestor e recuperação local de senha
src/lib/db.ts   # Acesso ao banco somente no servidor
src/generated/  # Cliente Prisma gerado, fora do Git
tests/          # Testes de integração com PostgreSQL real
docs/           # Especificações e roadmap
```

App Router com Server Components por padrão, TypeScript estrito e alias `@/*`
para `src/*`. Novos módulos serão criados conforme cada etapa aprovada,
mantendo UI, domínio, persistência e integrações separados. A fonte usa a pilha
sans-serif do sistema, sem downloads externos no build.

## Teste manual da F2-T01

1. Execute `npm ci`, `docker compose up -d --wait db` e `npm run db:deploy`.
   Configure as variáveis de autenticação descritas acima.
2. Se já criou o gestor, use o acesso existente. Para substituir sua senha,
   execute `npm run auth:reset-password -- seu-email@exemplo.com`. Em uma instalação
   nova, crie o primeiro gestor com `npm run auth:create-manager -- seu-email@exemplo.com "Seu nome"`.
3. Inicie `npm run dev` e abra <http://localhost:3000> sem login; a consulta deve
   continuar pública. Acesse `/gestor` e `/frigorifico` diretamente: ambos devem
   encaminhar ao login.
4. Em `/login`, use uma senha incorreta: deve aparecer uma mensagem genérica.
   Entre com o acesso correto: deve abrir `/gestor`. Atualize a página e confira
   a sessão. Acesse `/frigorifico` com esse perfil: deve negar a entrada.
5. Clique em “Sair” e tente abrir `/gestor` novamente: deve exigir novo login.
6. Confira login e área privada no celular, por Enter e com JavaScript desativado.
   A URL não deve conter e-mail/senha; acessar `/login` por `127.0.0.1` deve
   redirecionar para a origem configurada. Se exceder cinco
   tentativas em um minuto, aguarde antes de tentar novamente.
7. Prepare/migre `cotaroba_test` conforme abaixo e execute `npm run test:auth` e
   `npm run test:db`. O perfil frigorífico é verificado com fixtures neste estágio;
   o cadastro dos acessos pela interface está descrito na F3-T01 abaixo.

## Gestão de frigoríficos e acessos (F3-T01)

As regiões são definidas pelo gestor em **Regiões** (`/gestor/regioes`), conforme
a opção aprovada pelo usuário. Informe um nome de 1–120 caracteres; espaços
extras são normalizados e nomes que diferem apenas por maiúsculas/minúsculas
são recusados, inclusive em envios simultâneos. Nenhuma região é criada
automaticamente. Se ainda não houver regiões, o formulário do frigorífico
apresenta o link para cadastrá-las antes de continuar.

Entre como gestor em `/gestor`. A listagem é privada, paginada em 20 cadastros,
e inclui frigoríficos ativos e inativos. Em **Cadastrar frigorífico**, informe
nome (até 160 caracteres) e uma região cadastrada. Depois de salvar, a página
de administração permite editar nome/região/situação e criar os acessos dos
responsáveis. Não há exclusão física: desativar preserva cadastros e histórico.

Cada acesso tem nome, e-mail único normalizado, situação e senha inicial de
12–128 caracteres. O perfil é sempre frigorífico e o vínculo é fixado pelo
servidor; a interface não cria gestores nem transfere acessos entre empresas.
O gestor pode editar nome/e-mail/situação e redefinir a senha pelo próprio
cadastro. As senhas são armazenadas apenas como hash do Better Auth, nunca
reexibidas. O gestor comunica as credenciais ao responsável por um canal seguro;
a aplicação não envia e-mails nem oferece cadastro público.

Alterar um acesso ou sua senha encerra as sessões desse acesso. Salvar o
cadastro do frigorífico encerra as sessões de todos os acessos vinculados;
a desativação impede novos logins. Reativar o frigorífico preserva a situação
individual de cada acesso, e sessões antigas não voltam a valer. Alterar a
região atual não altera regiões/preços nos registros históricos de cotações.

Os formulários usam Server Actions com POST e funcionam sem JavaScript.
Cada operação valida a sessão, a origem configurada, o perfil de gestor e os
dados no servidor. Envios administrativos têm limite de 30 por minuto por
gestor, com contador atômico no PostgreSQL compartilhado entre processos;
tentativas inválidas também contam. Ao atingir o limite, aguarde um minuto. A camada de persistência reconsulta o papel/situação do gestor.
Erros aparecem como mensagens fixas, sem credenciais na URL ou nos retornos.
Leituras selecionam apenas campos necessários, sem hashes, sessões ou preços.

A migration `20261026203246_region_names_case_insensitive` garante unicidade
dos nomes de regiões sem diferenciar caixa, com índice único `lower(name)`.

A migration `20261026201632_management_history` acrescenta `ManagementEvent`,
com autor, instante, ação e campos administrativos explicitamente selecionados.
Alteração e histórico são gravados na mesma transação. Não são gravados senhas,
hashes ou tokens nesse histórico, e não há endpoint público para consultá-lo.
As operações de gestão serializam alterações de um frigorífico para coordenar
criação/edição de acessos com desativação. Não há implementação de preços,
agregação, integrações ou simulador nesta etapa.

Teste de regras, validações, autorização, sessões, histórico e concorrência:

```sh
npm run test:management
```

Execute as suítes que criam gestores **sequencialmente**, no banco separado e
migrado. Cada suíte usa fixtures sintéticas e as remove ao final; elas não
alteram contas de desenvolvimento.

## Teste manual da F3-T01

1. Aplique as migrations com `npm run db:deploy`, inicie `npm run dev` e entre
   com seu gestor existente em <http://localhost:3000/login>.
2. Em **Regiões**, cadastre um nome e tente repeti-lo em maiúsculas para conferir
   a validação. Em **Cadastrar frigorífico**, use a região criada. Salve, confira a
   confirmação, edite o nome e salve novamente. Volte à listagem e confira.
3. No cadastro, crie um acesso com nome, e-mail e senha de 12–128 caracteres.
   Tente e-mail já usado para conferir a validação. A senha não deve reaparecer
   após salvar ou falhar.
4. Em uma janela privativa, entre com o novo acesso; deve abrir `/frigorifico`
   com a identidade da empresa. Tentar `/gestor` deve negar entrada.
5. No gestor, edite ou desative o acesso. Recarregar a janela privativa deve
   exigir login novamente; desativado não entra. Reative e redefina a senha:
   a anterior deve falhar e a nova funcionar.
6. Desative o frigorífico. Todos os seus acessos devem perder a sessão e ficar
   impedidos de entrar; o cadastro continua na listagem. Reative e confira
   que os acessos individualmente desativados continuam bloqueados.
7. Repita por teclado e com JavaScript desativado. Confira no celular, sem
   rolagem horizontal. A URL não deve conter e-mail ou senha.
8. Abra o portal sem login: deve continuar em “Dados insuficientes”, sem nomes,
   e-mails ou preços individuais. Finalize encerrando as sessões de teste.

## Conferência do banco (F1-T01)

1. Inicie o banco com `docker compose up -d --wait db`.
2. Execute `npm ci`, `npm run db:validate`, `npm run db:deploy` e `npm run db:status`.
3. Confira o status das migrations; repetir `npm run db:deploy` não deve reaplicar a migration.
4. Use `npm run db:studio` para conferir as entidades de domínio, autenticação e histórico administrativo descritas acima.
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
