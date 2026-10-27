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
- Separar DTO público de entidade privada; na F5, somente nome, região, categoria, preço vigente, unidade, referência e atualização. Na F7, a evolução autorizada contém uma cotação vigente por data, sem versões substituídas. Nunca serializar IDs de cotações, autores, acessos ou sessões.
- API externa → normalização/validação → persistência → cálculo → dashboard; nunca depender diretamente da API no carregamento público.
- Jobs curtos e idempotentes; Vercel Cron se adequado. Não criar infraestrutura complexa prematuramente.
- Usar migrations versionadas; não alterar schema de produção sem plano de migração.
- F6: `src/features/external-data` separa contratos, conectores HTTP, serviços transacionais e ações autenticadas. Séries possuem metadados fixos; observações acrescentam revisões sob lock da série. `ExternalSync` registra tentativa/sucesso e limita concorrência entre instâncias, sem transação aberta durante HTTP. Coleta sob demanda pelo gestor; `/dados` lê somente dados persistidos. Sem novo serviço ou dependência.
- F7: dashboard em `/painel`, monólito com consultas parametrizadas no servidor e SVG com renderização inicial no servidor e interação no cliente, tabela equivalente e sem biblioteca adicional. Cálculos decimais ficam em serviços próprios. Simulador público usa Server Action e `useActionState` com permalink para aprimoramento progressivo; POST sem persistência, logs de entradas ou parâmetros de custo na URL. Sem banco ou nova infraestrutura para cálculos.
- Não criar abstrações apenas para “parecer enterprise”; SOLID, KISS, DRY e YAGNI com bom senso.

## Decisões técnicas
Documentar trade-offs relevantes no status. Se escolher biblioteca diferente, justificar e manter aderência ao escopo.

## Definition of Done
Critérios da etapa atendidos, validações e testes pertinentes executados, documentação/status atualizados, commit Conventional Commits criado e instruções de teste manual entregues. **Aprovação do usuário é gate separado, posterior ao commit.**

### Refatoração F7-UX01
- Server Components e serviços de consulta continuam responsáveis pelos dados. Workspace cliente recebe slots renderizados, alterna abas por History API integrada ao App Router e mantém a visão na URL; filtros usam `router.replace` com `scroll: false` e transição, conservando GET nativo sem JavaScript.
- Controles existentes ficam montados; CSS por visão expõe apenas filtros relevantes. Normalização do servidor atualiza opções/datas sem remontar controles. Seleções automáticas, datas com breve espera e atalhos de período eliminam o envio adicional na jornada aprimorada. Intervalo temporariamente inválido mantém rascunho/consulta anterior até ser corrigido; mesma validação de período no cliente e no servidor.
- Durante uma atualização pendente, a troca de aba reaplica os valores atuais do formulário com a nova visão. A aba aparece imediatamente enquanto o App Router resolve a consulta; isso evita que uma escrita isolada no histórico cancele filtros pendentes. Essa troca usa `router.push` para registrar a nova aba e permitir voltar à anterior; alterações comuns de filtros usam `replace`. Fora dessa situação, abas apenas atualizam o histórico local, sem buscar dados novamente. Voltar/avançar, recarregar e acesso pelo menu usam a visão da URL.
- Estado imediato das abas usa `useOptimistic` com a visão da URL como base, dentro de uma transição React. A seleção temporária termina junto com a transição, evitando restaurar uma aba pendente ao voltar pelo histórico. Referência: [documentação oficial React](https://react.dev/reference/react/useOptimistic).
- Gráfico cliente recebe somente DTO público já autorizado; números monetários/indicadores permanecem nos serviços Decimal. Sem novas rotas HTTP, dependências, schema ou coleta externa na consulta.
