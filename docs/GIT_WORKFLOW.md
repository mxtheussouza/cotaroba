# Git e Conventional Commits

## Política
**Cada implementação de etapa concluída deve ser commitada** após testes aplicáveis e atualização do `PROJECTS_STATUS.md`. Não iniciar a próxima etapa sem validação explícita do usuário.

## Formato
`<type>(<scope>): <descrição no imperativo>`

Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`.

Exemplos:
- `chore(setup): initialize Next.js project`
- `feat(auth): add role-based access`
- `feat(slaughterhouses): implement manager registration`
- `feat(quotes): allow slaughterhouses to update prices`
- `feat(indicators): publish regional aggregates`
- `feat(integrations): add PTAX synchronization`
- `fix(quotes): prevent cross-organization access`
- `docs(status): record blocked integration task`

## Fluxo obrigatório
1. `git status` e revisar diff.
2. Rodar testes aplicáveis.
3. Atualizar `PROJECTS_STATUS.md` com resultados e mensagem de commit planejada.
4. Stage **somente arquivos pertinentes**, incluindo status.
5. Criar commit Conventional Commits.
6. Confirmar hash (`git log -1 --format=%h`) e status limpo/pendências.
7. Registrar hash no `PROJECTS_STATUS.md` **sem criar um segundo commit desnecessário**: usar hash abreviado previsível não é recomendado. Preferir registrar a referência no histórico em uma nota pós-commit que será incluída no próximo commit, ou, quando viável, preparar o status com identificador de etapa e consultar Git como fonte autoritativa do hash. **Nunca alterar commit já publicado apenas para inserir o próprio hash.**
8. Informar hash real ao usuário e pedir validação.

## Observação sobre status e hash
O arquivo `PROJECTS_STATUS.md` deve estar no **mesmo commit** que a implementação. Como o hash final não existe antes do commit, registrar no status a mensagem/ID da etapa e `hash: consultar git log`; informar o hash real na resposta e atualizar o campo histórico no próximo commit, se necessário. Não afirmar que hash já está gravado no mesmo commit.

## Falhas e bloqueios
- Não fazer commit como `feat` concluída se não foi implementada/testada.
- Documentar falhas; commits `docs`/`chore` são permitidos para registrar bloqueios.
- Não fazer `git push` sem autorização se o remoto não estiver configurado/confirmado.
