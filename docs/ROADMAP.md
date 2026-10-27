# Roadmap — execução estritamente sequencial

**Regra principal:** implementar **uma única etapa por vez**, executar testes, atualizar `PROJECTS_STATUS.md`, criar commit Conventional Commits e **aguardar validação explícita do usuário**. Não iniciar a próxima etapa automaticamente.

| Ordem | ID | Entrega isolada | Critérios de aceite e teste manual |
|---|---|---|---|
| 1 | F0-T01 | Inspecionar repositório, inicializar base Next.js/TypeScript se necessário e definir organização inicial | App sobe localmente; página inicial simples; lint/typecheck/build conforme disponíveis |
| 2 | F1-T01 | PostgreSQL + Prisma + entidades mínimas e migrations | Migração reproduzível em banco de desenvolvimento; modelos conferidos |
| 3 | F2-T01 | Login e perfis gestor/frigorífico | Acesso protegido; sessões; visitante não acessa áreas privadas |
| 4 | F3-T01 | Gestor cadastra e administra frigoríficos e seus acessos | CRUD básico; validação; gestor testa cadastro |
| 5 | F4-T01 | Frigorífico cadastra/atualiza preços e vê histórico próprio | Salvar, editar e consultar histórico; isolamento testado |
| 6 | F5-T01 | Página pública de cotações por frigorífico e região | Nome e última cotação vigente por frigorífico/categoria; sem média; ausência de cotações tratada |
| 7 | F6-T01 | Integrações externas e entrada manual de dados pelo gestor | Fontes disponíveis sincronizam; falhas não derrubam site; fallback manual |
| 8 | F7-T01 | Dashboard completo, gráficos, indicadores e simulador | Filtros, fontes, fórmulas e cenários testados |
| 9 | F8-T01 | Testes finais, revisão de segurança e deploy Vercel | Checklist de homologação e publicação aprovado |

## Limites de cada etapa
- Cada ID é **uma entrega com gate de aprovação**. Se ficar grande, subdividir em `F?-T??a`, `F?-T??b` etc., com autorização do usuário; **cada subetapa também exige teste, status, commit e aprovação antes da próxima**.
- Correções da etapa atual não autorizam avanço.
- Refatorações só quando necessárias para a etapa atual; registrar justificativa.
- Não pular etapa sem pedido explícito do usuário.
- Priorizar jornada funcional simples antes de refinamentos.

## Condição para avançar
`IMPLEMENTADA_AGUARDANDO_VALIDACAO` → usuário testa → usuário confirma explicitamente → registrar `VALIDADA` → iniciar próxima etapa mediante autorização.
