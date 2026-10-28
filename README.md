# Cotaroba

Observatório pecuário da Bahia: consulta pública dos preços da arroba
informados por cada frigorífico, por região e categoria.

## Estado da implementação

F0-T01 a F6-T01 foram validadas pelo usuário. A F6-T01, com fontes
externas e cadastro manual, foi aprovada para o MVP. Ajustes adicionais serão
definidos após concluir as etapas do roadmap. A F7 acrescenta painel, gráficos e
simulador, com validação humana pendente.
O login usa sessões PostgreSQL e Better Auth. O histórico e a aprovação de cada etapa estão em
[PROJECTS_STATUS.md](./PROJECTS_STATUS.md).

A página inicial leva à consulta `/cotacoes`. Ela mostra nome, preço vigente,
categoria, região e datas, conforme a mudança de produto autorizada em F5.
Na F7, `/painel` publica evolução por frigorífico/data usando apenas registros
vigentes; correções substituídas, autores pessoais e contas continuam privados.
O simulador fica em `/simulador`, sem login ou gravação de premissas.

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
O build continua independente do PostgreSQL. As consultas públicas `/cotacoes` e `/dados`
requer o banco local em execução.

## Modelo do domínio

| Modelo           | Finalidade                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Region`         | Regiões com nomes únicos, sem lista de negócio predefinida.                                                                                  |
| `CattleCategory` | Categorias comerciais com nomes únicos, sem seed.                                                                                            |
| `Slaughterhouse` | Nome, região atual, situação ativa e datas de criação/alteração.                                                                             |
| `Quote`          | Registro histórico com frigorífico, região de referência, categoria, preço e datas; somente a cotação vigente selecionada é publicada na F5. |

Os preços usam `NUMERIC(12,2)`, em reais por arroba (`pricePerArroba`, R$/@),
com restrição SQL para valores positivos. Use strings/`Prisma.Decimal` ao
persistir valores monetários. `referenceDate` é uma data civil (`DATE`);
`createdAt` e `updatedAt` usam `TIMESTAMPTZ(3)` para instantes com fuso.

As relações impedem excluir cadastros ainda referenciados. A região de cada
cotação fica preservada mesmo se a região atual do frigorífico mudar.
Atualizar uma cotação acrescenta uma versão, preservando preço, categoria, data,
região e autoria anteriores. A primeira versão de registros anteriores à F4
mantém a autoria como não registrada, sem atribuição fictícia.

Nenhuma região, categoria ou cotação de negócio é criada automaticamente.
Dados externos usam `ExternalSeries` (metadados fixos), `ExternalObservation`
(valores e revisões em `NUMERIC(18,4)`, períodos civis, origem, coleta e autoria privada)
e `ExternalSync` (última tentativa/sucesso da fonte). Indicadores calculados aguardam F7.
Os modelos de autenticação estão descritos abaixo.

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
é versionado. A restrição de preço positivo, os índices únicos `lower(name)`
de regiões/categorias e a forma das versões de cotações são mantidos nas migrations SQL, pois não são representados no schema
Prisma; preserve-os em migrations futuras.

O acesso da aplicação é `getDatabase()` em `src/lib/db.ts`: somente no servidor,
com inicialização sob demanda e reutilização do cliente/pool entre chamadas.
Não importe esse módulo em componentes cliente. A página pública de cotações o
utiliza somente no servidor.

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
a área do frigorífico oferece cadastro, atualização e histórico próprios de cotações.

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
Server Actions. A F4 acrescenta a jornada privada de categoria, cotação e
revisão; a F5 confere a consulta pública e a F6 cobre série manual, correção,
consulta externa pública e bloqueio por perfil. Ela inicia e encerra seu próprio servidor em
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
8. Abra o portal sem login: a área inicial de indicadores adicionais continua
   em “Dados insuficientes”; a consulta `/cotacoes` da F5 publica preços vigentes,
   sem e-mails ou histórico privado. Finalize encerrando as sessões de teste.

## Cotações privadas (F4-T01)

O gestor cadastra categorias por nome em `/gestor/categorias`, sem lista
predefinida. Nomes têm até 120 caracteres; espaços são normalizados e nomes
que diferem apenas por caixa são recusados. O frigorífico usa uma categoria
cadastrada para informar preço em R$/@, sem separador de milhar e com até duas
casas decimais, e data civil de referência. A região é derivada do cadastro
atual do frigorífico, sem campo editável no formulário.

Em `/frigorifico`, os acessos da empresa veem somente as versões atuais das
suas cotações. **Atualizar e ver histórico** abre todas as versões da série,
incluindo autor e horário. Uma correção acrescenta versão e preserva a região
da primeira; outro frigorífico recebe 404 ao tentar abrir essa série. A F5
publica somente o preço vigente selecionado. Escritas são limitadas a 30 por minuto por
frigorífico, compartilhadas entre seus acessos.

A migration `20261026211810_quote_versions_and_categories` adiciona série,
versão, vínculo à versão anterior e autoria. Os testes cobrem validação,
isolamento, concorrência, histórico e limites:

```sh
npm run test:quotes
PLAYWRIGHT_CHANNEL=chrome npm run test:browser
```

Para validar manualmente:

1. Aplique as migrations com `npm run db:deploy` e entre como gestor.
2. Cadastre uma categoria em **Categorias**. Tente repetir em maiúsculas e
   confira a mensagem de duplicidade.
3. Entre com um acesso de frigorífico, abra **Cadastrar cotação**, informe
   categoria, preço e data e salve. Confira a cotação na lista privada.
4. Abra **Atualizar e ver histórico**, altere o preço e salve. Confira duas
   versões, valores anteriores preservados e autor/horário de cada uma.
5. Entre com um acesso de outro frigorífico: o histórico privado da primeira
   empresa não deve aparecer, e sua URL deve retornar 404. A página pública
   `/cotacoes` mostra o nome e o preço vigente selecionado na F5.
6. Repita o envio com JavaScript desativado e confira a interface no celular.

## Consulta pública por frigorífico (F5-T01)

Em `/cotacoes`, qualquer visitante escolhe região e, opcionalmente, categoria.
A página mostra o **nome e o preço vigente de cada frigorífico ativo** naquela
região, em R$/@, com data de referência e da última atualização. Não calcula
média. Quando uma empresa tem várias séries na mesma categoria, aparece a
cotação vigente com a data de referência mais recente; em empate, a atualização
mais recente. As versões anteriores continuam disponíveis somente no histórico
privado da empresa. Se a empresa mudar de região ou for desativada, suas
cotações anteriores deixam de aparecer na região antiga. Sem cotação vigente,
a página mostra “Dados insuficientes”.

Essa publicação individual substitui a regra anterior de agregação anônima,
por decisão explícita do usuário em 2026-10-27. Ela pode revelar informações
comerciais sensíveis; os aspectos concorrenciais devem ser revisados antes do
deploy público previsto para F8. Não há API pública específica nesta etapa.

Para verificar as regras de seleção e a página:

```sh
npm run test:public-quotes
PLAYWRIGHT_CHANNEL=chrome npm run test:browser
```

Para testar manualmente, abra `/cotacoes` sem login, selecione uma região e
categoria e confira nome, preço e datas. Atualize a cotação como frigorífico e
reabra a página pública: ela deve mostrar apenas o novo valor. Uma segunda
empresa na mesma região aparece em linha própria, sem média. Uma região sem
preços mostra “Dados insuficientes”. O histórico de versões e o nome do
responsável não devem aparecer publicamente.

## Conferência do banco (F1-T01)

1. Inicie o banco com `docker compose up -d --wait db`.
2. Execute `npm ci`, `npm run db:validate`, `npm run db:deploy` e `npm run db:status`.
3. Confira o status das migrations; repetir `npm run db:deploy` não deve reaplicar a migration.
4. Use `npm run db:studio` para conferir as entidades de domínio, autenticação e histórico administrativo descritas acima.
5. Prepare o banco separado de testes conforme esta documentação e execute `npm run test:db`.
6. Inicie a aplicação com `npm run dev` e abra <http://localhost:3000> sem login.
   A área de indicadores adicionais da página inicial mostra “Dados
   insuficientes”; a consulta pública de preços está em `/cotacoes`.
7. Pare o banco com `docker compose stop db` e confirme que a página inicial
   continua acessível; retome-o depois com `docker compose up -d --wait db`.

## Contrato e especificações

Leia [AGENTS.md](./AGENTS.md), [PROJECTS_STATUS.md](./PROJECTS_STATUS.md) e os
arquivos de [docs/](./docs/), começando pela especificação de produto e roadmap.
Cada etapa exige testes, atualização do status, commit Conventional Commits e
validação explícita do usuário antes da próxima etapa.

## Dados externos — F6

Entre como gestor e abra **Dados externos** (`/gestor/dados`). Os botões
**Sincronizar dólar** e **Sincronizar abates** consultam APIs oficiais, validam o
resultado e armazenam os registros. Não há coleta agendada nesta etapa; o clique
inicia a coleta automática. Nenhum serviço pago ou credencial adicional é necessário.

- **Dólar:** PTAX de venda do Banco Central, em R$/US$, referência diária nacional,
  últimos 14 dias corridos. Mantém quatro casas decimais e tolera fins de semana/feriados;
  sinaliza defasagem após cinco dias da referência. Fonte e licença ODbL aparecem na consulta.
- **Abates:** IBGE/SIDRA 1092, variável 284, Bahia/UF 29, total do trimestre,
  todos os rebanhos e tipos de inspeção. Armazena os quatro últimos trimestres
  divulgados, em cabeças, sem transformar o trimestre em dado diário. Prazo de
  atualização: 180 dias após o encerramento do trimestre.

Cada conector tem timeout de oito segundos, resposta limitada a 256 KB e no
máximo uma tentativa por minuto em toda a aplicação. Repetir uma coleta não
multiplica registros; correções da fonte geram revisões. Falhas não removem
valores anteriores nem atualizam artificialmente sua data de referência.
O sucesso de uma fonte independe da outra. Novas coletas cobrem apenas as janelas
acima; o histórico já armazenado é preservado além delas.

O gestor também pode criar séries manuais de dólar, chuva acumulada, milho,
soja, abates, bezerro e referência da arroba. Deve informar nome, localidade,
fonte/link HTTPS, frequência e prazo de atualização; as unidades aparecem no formulário.
Use somente dados cuja publicação seja permitida pela fonte. Uma série mantém
metadados fixos para preservar a comparabilidade; outra fonte/localidade/frequência
exige outra série. Não há importação de arquivos nesta etapa.

Na série manual, cadastre início e fim do período, valor e validade opcional.
Use um dia, sete dias, mês completo ou trimestre completo conforme a frequência.
Períodos futuros/incompletos são recusados. Preços são positivos; chuva e abates
aceitam zero, e abates exigem inteiro. A correção do mesmo período acrescenta uma
versão, inclusive ao voltar a um valor anterior; enviar novamente a versão atual
não duplica o registro. A autoria do gestor fica apenas no histórico privado.

Se uma fonte automática falhar, crie/utilize uma série manual com identificação
própria. As séries ficam separadas e identificadas na consulta, sem mistura nem
substituição silenciosa. INMET, Open-Meteo, CONAB e CEPEA não têm coleta automática
implementada; acesso, licenciamento e formato precisam estar confirmados antes
de acrescentar conectores. Veja [a avaliação das fontes](./docs/DATA_AND_INTEGRATIONS.md).

A consulta `/dados`, também acessível pela página inicial, mostra a última
referência de cada série, sua origem, fonte, unidade, localidade, período e coleta.
“Dado defasado” considera o fim do período mais o prazo da série;
“Validade encerrada” considera a validade informada. Uma coleta recente não
rejuvenesce uma referência antiga. Séries vazias mostram “Dados insuficientes”.
A leitura pública consulta somente PostgreSQL e não faz chamadas às fontes.
Histórico e listagem têm paginação de 20 registros/séries. Não há gráficos,
indicadores derivados, simulador ou deploy nesta etapa.

Teste automatizado (banco separado já migrado):

```sh
npm run test:external-data
PLAYWRIGHT_CHANNEL=chrome npm run test:browser
```

A suíte determinística usa respostas sintéticas de API, cobre falhas, validação,
autorização, deduplicação concorrente, revisões, defasagem e privacidade.
Para conferir somente o acesso às fontes reais, sem gravar no banco:

```sh
npm run data:check-sources
```

Roteiro de validação manual:

1. Execute `npm run db:deploy` e `npm run dev`; entre como gestor em `/gestor/dados`.
2. Sincronize dólar e abates separadamente e confira referência, unidade e fonte.
   Aguarde um minuto e repita: não deve criar versões iguais.
3. Cadastre uma série manual de chuva diária para uma localidade, com fonte e
   prazo. Registre um dia passado e um valor; depois corrija o valor no mesmo dia.
4. Confira as duas versões no histórico. Abra `/dados` sem login: somente o
   valor vigente da referência mais recente deve aparecer, sem autoria pessoal.
5. Confira uma referência antiga, uma validade encerrada e uma série sem registros.
   Repita o cadastro com JavaScript desativado e confira as telas no celular.
6. Com o acesso de frigorífico, `/gestor/dados` e URLs de histórico devem ser
   recusados. Sem login, essas rotas devem encaminhar ao login.

## Painel e simulador — F7

A página inicial oferece **Abrir painel** (`/painel`) e **Simular receita e margem**
(`/simulador`). Ambas são públicas e funcionam com JavaScript desativado.
As funcionalidades seguem as duas decisões explícitas do usuário na F7:
publicar evolução por frigorífico/data sem correções substituídas e usar a
fórmula do simulador descrita abaixo.

### Filtros e gráficos

O painel permite escolher região, categoria, frigorífico, datas e uma região
para comparação. Os preços vigentes continuam individuais, sem média, e
mantêm referência e atualização próprias. As listas atuais respondem à região e
categoria; o período responde pelos gráficos. O painel mostra até 20 cotações
por região, com link à consulta paginada completa. Cinco aparecem inicialmente;
**Ver mais cotações** expande as demais sem sair do painel.

O painel organiza consultas em quatro abas: **Preços**, **Evolução**, **Contexto**
e **Relação de troca**. Cada aba mostra somente seus filtros; região/categoria,
período, comparação e referências continuam preservados ao alternar. O simulador
tem acesso direto no topo. Explicações e tabelas ficam em seções expansíveis.

Com JavaScript, selecionar um filtro atualiza dados via App Router, sem recarregar
o documento ou saltar a rolagem. Datas atualizam após 500 ms de pausa; atalhos
**30/90/365 dias** aplicam períodos em um clique. Um intervalo temporariamente
inválido mantém o rascunho e a consulta anterior, com mensagem para ajustar as datas.
Região atualiza automaticamente
as opções de frigorífico. A URL conserva a visão e os filtros para compartilhar
ou recarregar; voltar/avançar restaura as abas. Se uma atualização estiver pendente,
trocar de aba reaplica os filtros atuais junto com a nova visão, evitando perda da
seleção por respostas atrasadas. **Aplicar filtros** permanece como
ação explícita e fallback. Sem JavaScript, use as abas como links e envie o GET
pelo botão; atalhos de período também funcionam como links.

As abas aceitam setas, Home e End no teclado. Gráficos permitem explorar a
observação por mouse/toque ou controle com setas; a chamada de valor mostra data,
valor e unidade. Linhas contínuas com círculos identificam cotações; referências
externas usam linhas tracejadas com quadrados, e totais de chuva/abates usam barras.
A tabela equivalente permanece disponível em **Ver valores do gráfico**.

Regra permanente para todas as consultas: menor número possível de cliques sem
comprometer clareza, acessibilidade ou precisão.

Para o gráfico local, selecione uma categoria específica. Para cada data no
recorte, a consulta toma o registro vigente mais recentemente informado daquele
frigorífico/categoria na região atual. Versões substituídas ficam fora mesmo
quando uma correção muda sua data ou categoria. Logo, atualizar repetidamente
uma única série pode deixar somente sua referência atual; registrar uma nova
cotação para cada nova referência preserva os pontos distintos. Não há snapshot
público imutável nem reconstrução de preços corrigidos. Frigoríficos inativos e
cotações da região anterior não contribuem.

As séries externas são selecionadas separadamente, com sua própria unidade,
localidade, frequência, fonte/link, coleta e situação de atualização. Seleciona-se
apenas a última revisão de cada período. Para semanas, meses e trimestres, o
filtro considera a data final da referência e preserva o período completo na tabela.
O painel lê PostgreSQL; uma falha na API da fonte não exige consultá-la durante
a navegação. O prazo da F6 continua sinalizando referências antigas/expiradas.

O recorte padrão tem 90 datas civis na Bahia; aceita até 366 datas, sem datas
futuras. Datas inválidas mostram mensagem e retomam o padrão. Os gráficos SVG
possuem escala começando em zero, datas proporcionais, pontos observados e tabela
expansível acessível; não preenchem dias sem informação. Uma única observação
não define tendência. Vazio mostra **Dados insuficientes**.

Variação no período = último valor − primeiro valor observado; percentual =
(último − primeiro) ÷ primeiro × 100. São necessárias duas datas distintas;
com base zero, o percentual fica indisponível. O cálculo é por frigorífico ou
série específica, nunca média entre empresas. A variação não é previsão de preço.

### Relação de troca

Selecione uma série externa **Referência da arroba** e uma de **Bezerro**.
O indicador mostra quantas arrobas seriam necessárias para o preço de um bezerro:

```text
arrobas por bezerro = preço do bezerro (R$/cabeça) / referência da arroba (R$/@)
```

Exige valores positivos, mesma localidade textual normalizada (sem inferir
mapeamentos entre praças), frequência e início/fim do período, sem validade
encerrada ou defasagem. Escolhas ausentes ou incompatíveis mostram **Dados
insuficientes**. Os nomes/fontes e datas permanecem visíveis para o visitante
conferir condições comerciais. Não se presume peso de carcaça nem se transforma
uma referência nacional em preço regional.

### Simulador por animal

Todos os campos principais são preenchidos pelo visitante, sem rendimento,
preço ou custo comerciais predefinidos:

```text
carcaça (kg) = peso vivo (kg) × rendimento (%) / 100
arrobas = carcaça (kg) / 15
receita = arrobas × preço da arroba
margem = receita − custo total por animal informado
preço de equilíbrio = custo / arrobas
```

O preço alternativo é opcional e muda apenas a receita/margem, mantendo peso,
rendimento e custo. Compra, alimentação, frete, tributos e descontos só entram
se incluídos no custo informado. Não há taxas automáticas, promessa de lucro,
previsão ou gravação das premissas. Envio por POST, sem colocar custos na URL.
A implementação usa Server Action e aprimoramento progressivo com
[`useActionState`](https://react.dev/reference/react/useActionState).

Peso: maior que zero, até 2.000 kg, três casas; rendimento: maior que zero e até
100%, duas casas; preços: positivos até R$ 1.000.000, duas casas; custo: zero a
R$ 10.000.000, duas casas. São limites operacionais de entrada. Aceita vírgula ou
ponto decimal, sem milhar/expoentes. Cálculos usam Decimal; intermediários não
são arredondados para gerar receita. Resultados monetários são arredondados para
centavos e mostram explicitamente margem positiva, zero ou negativa. Arrobas
são exibidas com quatro casas e carcaça com três.

Exemplo verificável: 500 kg, rendimento 55%, R$ 300/@ e custo R$ 4.000 por animal
resultam em 275 kg de carcaça, 18,3333 @ exibidas, receita R$ 5.500 e margem
R$ 1.500. Com preço alternativo R$ 270/@, receita R$ 4.950 e margem R$ 950.

### Testar a F7

```sh
npm run test:dashboard
PLAYWRIGHT_CHANNEL=chrome npm run test:browser
npm run build
TEST_APP_MODE=production PLAYWRIGHT_CHANNEL=chrome npm run test:browser
```

O script de dashboard executa os arquivos sequencialmente porque as fixtures
isoladas de banco exercitam a restrição de gestor inicial único. As suítes
usam apenas `TEST_DATABASE_URL` local separado; não execute simultaneamente
outras suítes que criam esse gestor no mesmo banco.

Roteiro manual:

1. Execute `npm run dev`, abra `/painel` sem login e, na aba **Preços**, escolha região/categoria.
   Compare outra região, conferindo nomes/preços individuais e datas, sem média.
2. Cadastre cotações de datas distintas no frigorífico; selecione-o no painel,
   altere o período e abra **Ver valores do gráfico**. Corrija uma cotação e
   confira que o valor substituído não aparece; autoria e IDs internos não aparecem.
3. Sincronize ou cadastre séries externas no gestor; selecione-as no painel e
   confira período/unidade/fonte/variação. Referência antiga deve ser sinalizada.
4. Cadastre referências comparáveis de arroba/bezerro no gestor e escolha ambas
   nos filtros. R$ 300/@ e R$ 2.400/cabeça no mesmo local/período dão 8 @/bezerro;
   períodos ou locais diferentes devem mostrar **Dados insuficientes**.
5. Abra `/simulador`, use o exemplo acima, altere preço/custo e confira a margem
   negativa quando o custo superar a receita. Teste rendimento inválido e custo zero.
6. Repita filtros/tabela/simulador sem JavaScript e no celular. Para o painel,
   use duas datas distintas de referência, não duas versões de correção da mesma data.

### Conferir a refatoração de UX/UI F7-UX01

1. Abra `/painel` em desktop: filtros principais e os primeiros preços devem estar visíveis sem rolagem excessiva. Compare outra região e confira as referências próprias, sem média.
2. Alterne entre **Preços**, **Evolução**, **Contexto** e **Relação de troca**: uma visualização por vez, filtros pertinentes, seleções preservadas. Com JavaScript, não há recarga do documento; no teclado, use as setas nas abas.
3. Na **Evolução**, escolha categoria/frigorífico, ajuste datas ou use **30 dias**. Confira atualização automática e ausência de salto de rolagem; valores e variação devem refletir o recorte. Troque região e confira as novas opções.
4. Explore pontos por mouse, toque e setas no controle de observações. Em **Contexto**, confira unidades e gráficos de linhas para preços/câmbio, barras para chuva/abates. Abra a tabela para conferir valores exatos e datas completas.
5. Recarregue/compartilhe a URL, use voltar/avançar e repita em 320/390/768/1280px. Desative JavaScript: abas, envio **Aplicar filtros**, atalhos e tabelas devem continuar utilizáveis.
6. Confira estados sem dados/período inválido, privacidade de correções e o simulador existente. Aprovação humana continua pendente; esta refatoração não inicia F8.

## Formulários em modais — F7-UX02a (primeira entrega)

A revisão geral foi mapeada no `PROJECTS_STATUS.md`. Esta entrega migra somente
`/simulador`; dados externos, gestão de frigoríficos/acessos e cotações permanecem
na fila, com validação por fluxo exigida pelo `AGENTS.md`.

Use **Simular cenário** para abrir o modal. Preencha **Animal**, use **Continuar**
e informe **Preços e custos**. **Voltar**, **Fechar** e Escape preservam os campos
na página atual; reabrir continua na etapa em que você parou. Recarregar ou sair
da página não guarda o rascunho. Não há persistência em banco ou storage do navegador.
Os erros aparecem junto aos campos, usando o mesmo schema do servidor. Nenhuma
fórmula, limite ou contrato de Server Action foi alterado.

**Calcular cenário** envia o mesmo POST existente. Durante a resposta, os controles
e o fechamento ficam bloqueados e aparece **Calculando…**. Ao concluir, a janela
fecha e o foco vai ao resultado, com confirmação. **Editar premissas** reabre os
valores enviados. Um rascunho só substitui o último resultado ao calcular novamente.
Metodologia e precisão ficam em detalhes expansíveis.

O modal adapta-se à viewport e rola internamente, preservando o cabeçalho com
**Fechar**. Tab/Shift+Tab ficam na janela; Escape fecha quando não há cálculo
pendente. Sem JavaScript, a mesma ação expande um único formulário com as duas
seções e **Calcular cenário**, mantendo validação do servidor, resultado e erros.

Para validar: abrir/fechar/reabrir, navegar entre etapas, testar rendimento 101%
e campos vazios, conferir valores preservados, usar teclado e larguras 320/390/768/1280px.
Exemplo: 500 kg, 55%, R$ 300/@ e R$ 4.000 de custo → receita R$ 5.500, margem R$ 1.500;
custo R$ 6.000 → margem −R$ 500. Repetir sem JavaScript e conferir que valores não
aparecem na URL. Testes do simulador permanecem em `tests/simulation.test.ts` e as
jornadas no navegador em `tests/dashboard-browser.ts`.
