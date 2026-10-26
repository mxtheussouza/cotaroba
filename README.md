# Cotaroba

Observatório pecuário da Bahia: portal público de indicadores regionais
consolidados. As cotações individuais dos frigoríficos são privadas.

## Estado da implementação

A F0-T01 entrega a fundação Next.js e uma página inicial simples em português,
com a mensagem “Dados insuficientes”. Não há dados de mercado nesta entrega.
O histórico e a aprovação de cada etapa estão em [PROJECTS_STATUS.md](./PROJECTS_STATUS.md).

## Requisitos e execução local

- Node.js 24 (versão indicada em `.nvmrc`).
- npm 11.

Com Node.js e npm instalados:

```sh
npm ci
npm run dev
```

Abra <http://localhost:3000>. Encerre o servidor com `Ctrl+C`.
Esta etapa não exige variáveis de ambiente, banco de dados ou credenciais.

## Verificações

```sh
npm run lint
npm run typecheck
npm run format:check
npm run build
```

O typecheck gera os tipos de rotas antes de verificar o TypeScript, inclusive
em uma instalação limpa. O lint é executado separadamente do build.
Para formatar o código e as configurações, use `npm run format`; os documentos
do contrato e do histórico são preservados.

Para testar a versão de produção localmente, após o build:

```sh
npm start
```

## Organização inicial

```text
src/app/
  globals.css   # Tailwind e tokens do design system
  layout.tsx    # Layout raiz, idioma e metadados
  page.tsx      # Página inicial pública
docs/           # Especificações e roadmap
```

App Router com Server Components por padrão, TypeScript estrito e alias `@/*`
para `src/*`. Novos módulos e componentes serão criados conforme a necessidade
de cada etapa aprovada, mantendo UI, domínio, persistência e integrações separados.
A fonte usa a pilha sans-serif do sistema, sem downloads externos no build.

## Teste manual da F0-T01

1. Inicie a aplicação e abra <http://localhost:3000> sem login.
2. Confira a identificação Cotaroba, os textos em português e “Dados insuficientes”.
3. Confira o título da aba e a ausência de preços ou identidades de frigoríficos.
4. Teste a página em celular e desktop: o conteúdo deve caber sem rolagem horizontal.
5. Pressione `Tab`: “Ir para o conteúdo” deve aparecer com foco visível.
   Pressione `Enter` para alcançar o conteúdo principal.

## Contrato e especificações

Leia [AGENTS.md](./AGENTS.md), [PROJECTS_STATUS.md](./PROJECTS_STATUS.md) e os
arquivos de [docs/](./docs/), começando pela especificação de produto e roadmap.
Cada etapa exige testes, atualização do status, commit Conventional Commits e
validação explícita do usuário antes da próxima etapa.
