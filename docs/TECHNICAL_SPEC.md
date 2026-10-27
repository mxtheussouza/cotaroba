# Arquitetura e padrões técnicos

## Stack prevista
- Next.js App Router + React + **TypeScript strict**.
- Tailwind CSS + shadcn/ui para UI, Recharts ou biblioteca similar para gráficos.
- PostgreSQL + Prisma; Zod para validação.
- Autenticação madura e compatível com Next.js (ex.: Auth.js), selecionada conforme estabilidade no momento da implementação.
- Deploy Vercel; banco gerenciado compatível.

## Estilo arquitetural
**Monólito modular**. Não criar backend separado nem microsserviços sem necessidade real. Separar UI, domínio, persistência e integrações; preferir organização por funcionalidade. Evitar lógica financeira em componentes React.

## Convenções
- TypeScript estrito; nomes descritivos; código em inglês e interface em português.
- ESLint/formatter, imports organizados, validação Zod na entrada, erros tratados e mensagens compreensíveis.
- Server Components para leitura quando adequado; Server Actions para formulários; Route Handlers para APIs/jobs.
- Autenticação e autorização verificadas no servidor em **cada** operação protegida.
- Valores monetários em `Decimal`/`NUMERIC`, com unidade explícita.
- Datas com fuso e referência claros; apresentação `pt-BR`.
- Separar DTO público de entidade privada; na F5, o DTO público contém apenas nome do frigorífico, região, categoria, preço vigente, unidade, data de referência e atualização. Não serializar IDs de cotações, autores, acessos, sessões ou versões anteriores.
- API externa → normalização/validação → persistência → cálculo → dashboard; nunca depender diretamente da API no carregamento público.
- Jobs curtos e idempotentes; Vercel Cron se adequado. Não criar infraestrutura complexa prematuramente.
- Usar migrations versionadas; não alterar schema de produção sem plano de migração.
- F6: `src/features/external-data` separa contratos, conectores HTTP, serviços transacionais e ações autenticadas. Séries possuem metadados fixos; observações acrescentam revisões sob lock da série. `ExternalSync` registra tentativa/sucesso e limita concorrência entre instâncias, sem transação aberta durante HTTP. Coleta sob demanda pelo gestor; `/dados` lê somente dados persistidos. Sem novo serviço ou dependência.
- Não criar abstrações apenas para “parecer enterprise”; SOLID, KISS, DRY e YAGNI com bom senso.

## Decisões técnicas
Documentar trade-offs relevantes no status. Se escolher biblioteca diferente, justificar e manter aderência ao escopo.

## Definition of Done
Critérios da etapa atendidos, validações e testes pertinentes executados, documentação/status atualizados, commit Conventional Commits criado e instruções de teste manual entregues. **Aprovação do usuário é gate separado, posterior ao commit.**
