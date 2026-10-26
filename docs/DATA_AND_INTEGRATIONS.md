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

## Consolidação regional
- Agrupar cotações comparáveis por região, categoria e período.
- Uma empresa não pode multiplicar artificialmente o peso da própria contribuição.
- **Não publicar** média ou recorte que permita inferir preço individual; não presumir que qualquer limiar fixo garanta anonimato.
- Definir política de publicação e critérios de suficiência antes de implementar F5-T01, com validação apropriada; se não aprovada, mostrar “Dados insuficientes”.
- Guardar metodologia e versão dos indicadores.

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
