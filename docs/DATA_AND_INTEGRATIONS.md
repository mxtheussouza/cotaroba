# Dados, integrações e indicadores

## Princípio
Cotações locais vêm dos frigoríficos. Dados externos são complementares; quando a API não estiver disponível, o gestor poderá inserir dados manualmente. **Não assumir API gratuita sem confirmar acesso, licença e formato.**

| Informação | Fonte candidata | Plano |
|---|---|---|
| Arroba regional | Frigoríficos locais | Cadastro manual autenticado |
| Dólar | Banco Central PTAX | API pública, referência diária |
| Clima/chuvas | INMET | Verificar API/acesso disponível |
| Clima alternativo | Open-Meteo | Avaliar licença para uso comercial |
| Milho/soja | CONAB | Avaliar dados/exportação; fallback manual |
| Abates bovinos | IBGE SIDRA | API pública; periodicidade não diária |
| Bezerro/indicadores de referência | CEPEA ou outras | Verificar licença; fallback manual |

## Contrato dos dados
Valor, unidade, categoria/produto, região, fonte, origem (`API`/`MANUAL`/`IMPORT`), data de referência, data de coleta e validade quando aplicável. Guardar histórico, evitar duplicação e sinalizar desatualização.

## Publicação de cotações na F5
- Decisão explícita do usuário em 2026-10-27: publicar o nome e o preço vigente de **cada frigorífico** da região, por categoria, sem calcular média, inclusive quando houver apenas um participante. Essa decisão substitui a política de agregação anônima planejada anteriormente.
- Exibir uma cotação vigente por frigorífico e categoria na região atual do cadastro, escolhendo a maior data de referência e, em empate, a atualização mais recente. Não publicar versões anteriores, autoria pessoal nem IDs de cotações.
- Exibir R$/@, categoria, região, data de referência e atualização; não apresentar preço como tempo real. Quando não houver cotação vigente, mostrar “Dados insuficientes”.
- A publicação individual pode revelar informação comercialmente sensível; registrar a decisão e submeter os aspectos concorrenciais à revisão apropriada antes do deploy público em F8.

## Indicadores e simulador
- Variação temporal da arroba e comparação regional.
- Relação de troca boi/bezerro apenas quando houver dados comparáveis.
- Clima, dólar, milho/soja e abates como **contexto**, não previsão garantida.
- Simulador: peso vivo × rendimento / 15 = arrobas de carcaça estimadas; receita = arrobas × preço; margem = receita − custos informados. Validar premissas comerciais com o cliente.
- Sempre mostrar hipóteses e limitações.

## Referências
- BCB: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/aplicacao
- INMET: https://portal.inmet.gov.br/
- IBGE: https://apisidra.ibge.gov.br/
- CONAB: https://portaldeinformacoes.conab.gov.br/
- Open-Meteo: https://open-meteo.com/en/docs
- CEPEA: https://onetoone.cepea.org.br/docs/api
