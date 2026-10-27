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
- Na F5, somente a cotação vigente e o nome do frigorífico são públicos conforme autorização explícita; histórico, autores pessoais, contas, sessões e metadados internos continuam privados.
- Filtros públicos não devem revelar versões anteriores ou campos além do contrato de publicação aprovado.
- Histórico de alterações, validação Zod e proteção contra abuso.
- LGPD para dados pessoais; avaliar aspectos concorrenciais da divulgação individual de preços autorizada na F5 antes do deploy público.

## Testes mínimos sugeridos
- Gestor consegue cadastrar frigorífico; frigorífico não consegue.
- Frigorífico A não lê/edita o histórico privado de B; ambos veem as cotações vigentes publicadas.
- Visitante não acessa área privada.
- Página sem cotação vigente mostra “Dados insuficientes”.
- Página pública retorna somente os campos de publicação aprovados, sem IDs de cotação, versões anteriores ou autoria pessoal.
- Falha de API externa preserva dado anterior e indica defasagem.
- F6: cobrir respostas malformadas, erro HTTP/rede/timeout, limite de resposta, unidade/geografia/período incorretos, repetição e concorrência, revisões, zero válido para chuva/abates e autorização antes da chamada externa. Defasagem depende da referência, não da última tentativa de coleta. DTO público não inclui autoria ou histórico. Conferir cadastro manual sem JavaScript e consulta sem requisição à fonte no navegador.
- Simulador valida entradas e calcula corretamente.
- Layout funcional em desktop e celular.

## Aprovação
Teste automatizado aprovado **não substitui** validação do usuário. Após cada etapa, apresentar passos para teste manual e aguardar autorização explícita.
