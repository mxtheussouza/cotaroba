# Qualidade, segurança e testes

## Por etapa
- Executar lint, typecheck e build quando aplicáveis.
- Criar testes úteis para regras de negócio, autorização, validações, cálculos e conectores.
- Testar manualmente a jornada implementada; entregar roteiro ao usuário para validação.
- Registrar **comando + resultado real** em `PROJECTS_STATUS.md`; não inventar aprovação.
- Se não houver ambiente ou credenciais, registrar bloqueio e não avançar.

## Segurança
- Autenticação robusta, senhas/sessões protegidas, rate limit em endpoints sensíveis.
- Autorização no servidor por papel e frigorífico; não confiar em `slaughterhouseId` enviado pelo cliente.
- Segredos somente em variáveis de ambiente; nunca em Git.
- Cotações individuais são privadas; endpoints públicos retornam somente agregados aprovados.
- Não permitir inferência por filtros excessivamente granulares, séries diferenciais ou metadados.
- Histórico de alterações, validação Zod e proteção contra abuso.
- LGPD para dados pessoais; avaliar aspectos concorrenciais de divulgação de preços agregados.

## Testes mínimos sugeridos
- Gestor consegue cadastrar frigorífico; frigorífico não consegue.
- Frigorífico A não lê/edita preços de B.
- Visitante não acessa área privada.
- Indicador insuficiente não é publicado.
- API pública não retorna identidade ou preço individual.
- Falha de API externa preserva dado anterior e indica defasagem.
- Simulador valida entradas e calcula corretamente.
- Layout funcional em desktop e celular.

## Aprovação
Teste automatizado aprovado **não substitui** validação do usuário. Após cada etapa, apresentar passos para teste manual e aguardar autorização explícita.
