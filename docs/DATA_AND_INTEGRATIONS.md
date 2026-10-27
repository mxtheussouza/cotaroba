# Dados, integrações e indicadores

## Princípio
Cotações locais vêm dos frigoríficos. Dados externos são complementares; quando a API não estiver disponível, o gestor poderá inserir dados manualmente. **Não assumir API gratuita sem confirmar acesso, licença e formato.**

| Informação | Fonte candidata | Plano |
|---|---|---|
| Arroba regional | Frigoríficos locais | Cadastro manual autenticado |
| Dólar | Banco Central PTAX | F6: coleta diária de venda, sob demanda pelo gestor; ODbL |
| Clima/chuvas | INMET | Entrada manual; API exige solicitação de acesso |
| Clima alternativo | Open-Meteo | API gratuita restrita a uso não comercial; não integrada |
| Milho/soja | CONAB | Avaliar dados/exportação; fallback manual |
| Abates bovinos | IBGE SIDRA | F6: API de agregados/SIDRA 1092, Bahia, total trimestral |
| Bezerro/indicadores de referência | CEPEA ou outras | Verificar licença; fallback manual |

## Contrato dos dados
Valor, unidade, categoria/produto, região, fonte, origem (`API`/`MANUAL`/`IMPORT`), data de referência, data de coleta e validade quando aplicável. Guardar histórico, evitar duplicação e sinalizar desatualização.

### Implementação da F6 e verificação de fontes (2026-10-27)
- `ExternalSeries` mantém nome, produto/métrica, unidade definida pela métrica, geografia textual da fonte, periodicidade, fonte/link HTTPS e prazo de atualização. Metadados fixos evitam alterar o significado de valores anteriores. Geografia externa (Brasil/UF/município/estação) não é automaticamente associada às regiões comerciais dos frigoríficos.
- `ExternalObservation` guarda início/fim do período em `DATE`, valor exato `NUMERIC(18,4)`, coleta `TIMESTAMPTZ`, origem `API`/`MANUAL`, validade opcional, revisão e autoria privada quando manual. `IMPORT` continua reservado a evolução futura, sem fluxo de importação implementado.
- Correção do mesmo período acrescenta revisão; envio igual à revisão atual é idempotente. Seleção pública: maior fim do período, maior início, maior revisão. Histórico completo permanece no banco e tem consulta paginada pelo gestor.
- Séries automáticas e manuais são independentes e identificadas. Um fallback manual nunca é silenciosamente substituído por uma sincronização; não há média, mescla ou conversão de unidades entre fontes.
- Público em `/dados` recebe apenas metadados de publicação e a última observação por série, sem autoria nem ID interno de observação. Leituras consultam PostgreSQL, sem chamadas HTTP externas. Gestor usa `/gestor/dados`; controles por sessão/papel/origem e limite compartilhado de 30 escritas por minuto. Sincronização adicionalmente limitada a uma tentativa por minuto por fonte em toda a aplicação.
- A coleta é iniciada pelo botão do gestor, com timeout de oito segundos, máximo de 256 KB, sem redirecionamentos e hosts fixos. Não há credenciais, webhook, endpoint de job público ou cron configurado na F6; eventual agendamento de produção pertence à configuração de implantação. Falha conserva observações e último sucesso; não altera artificialmente a referência nem a coleta dos valores existentes.
- Defasagem significa `hoje na Bahia > fim do período + prazo da série`, independentemente de uma coleta recente. Validade encerrada tem precedência. PTAX: cinco dias; abates: 180 dias, considerando frequência/atraso de divulgação. São critérios operacionais de exibição, não garantias sobre a fonte; a série manual exige prazo informado pelo gestor (1–730 dias).

**BCB/PTAX:** catálogo oficial [Dólar comercial — cotações diárias](https://dadosabertos.bcb.gov.br/dataset/dolar-americano-usd-todos-os-boletins-diarios) declara ODbL. A interface atribui BCB e liga à licença. Endpoint `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)`, parâmetros `MM-DD-YYYY`, retorno JSON com `cotacaoVenda` e `dataHoraCotacao`. Janela móvel de 14 dias corridos; sem inventar taxas em fins de semana/feriados. Valores com mais de quatro casas são recusados em vez de arredondados silenciosamente. [Documentação BCB](https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/documentacao). Resposta real validada em 2026-10-27; não é promessa de disponibilidade contínua.

**IBGE:** [API oficial de agregados](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3), que alimenta o SIDRA; acesso público sem chave confirmado. Endpoint `https://servicodados.ibge.gov.br/api/v3/agregados/1092/periodos/-4/variaveis/284?localidades=N3[29]&classificacao=12716[115236]|18[992]|12529[118225]`. Metadados da tabela 1092 conferidos: animais abatidos em cabeças, Bahia, total do trimestre, total de rebanhos e inspeções. Últimos quatro trimestres; números/escopo/unidade validados. Símbolos não numéricos não são convertidos em zero. Referência preserva o trimestre inteiro. Atribuição explícita a IBGE/SIDRA e link à tabela; não se atribui uma licença Creative Commons nominal que não consta da documentação consultada. Base de reuso: dados estatísticos públicos não pessoais no [Plano de Dados Abertos do IBGE](https://www.ibge.gov.br/np_download/novoportal/documentos_institucionais/Plano_de_Dados_Abertos_IBGE_2020_2022_1arevisao.pdf) e [política federal de dados abertos](https://www.gov.br/governodigital/pt-br/IND/dados-abertos). O portal principal apresentou HTTP 403, mas API e documentação oficiais responderam e o formato real foi validado.

**Demais candidatas:** INMET informa [canal de solicitação de acesso à API](https://portal.inmet.gov.br/fale-conosco); nenhuma credencial foi solicitada ou presumida. [Termos Open-Meteo](https://open-meteo.com/en/terms) restringem a API gratuita a uso não comercial; nenhum serviço pago foi contratado. CONAB e CEPEA continuam sem licença/contrato automatizado confirmados para este produto; nenhum scraping ou conector desses provedores foi criado. O formulário manual não concede direitos de redistribuição: usar fonte própria/pública/autorizada, com atribuição e período compatíveis.

## Publicação de cotações na F5
- Decisão explícita do usuário em 2026-10-27: publicar o nome e o preço vigente de **cada frigorífico** da região, por categoria, sem calcular média, inclusive quando houver apenas um participante. Essa decisão substitui a política de agregação anônima planejada anteriormente.
- Exibir uma cotação vigente por frigorífico e categoria na região atual do cadastro, escolhendo a maior data de referência e, em empate, a atualização mais recente. Não publicar versões anteriores, autoria pessoal nem IDs de cotações.
- Exibir R$/@, categoria, região, data de referência e atualização; não apresentar preço como tempo real. Quando não houver cotação vigente, mostrar “Dados insuficientes”.
- A publicação individual pode revelar informação comercialmente sensível; registrar a decisão e submeter os aspectos concorrenciais à revisão apropriada antes do deploy público em F8.

## Indicadores e simulador
- Variação temporal da arroba e comparação regional.
- Relação de troca boi/bezerro apenas quando houver dados comparáveis.
- Clima, dólar, milho/soja e abates como **contexto**, não previsão garantida.
- Simulador por animal, confirmado explicitamente pelo usuário na F7: peso vivo kg × rendimento (%) / 100 / 15 = arrobas de carcaça estimadas; receita = arrobas × preço; margem = receita − custo total informado por animal. Sem rendimento, taxa ou preço comercial predefinido. Comparação opcional mantém peso/rendimento/custo e usa outro preço informado.
- Sempre mostrar hipóteses e limitações.

## Referências
- BCB: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/aplicacao
- INMET: https://portal.inmet.gov.br/
- IBGE: https://apisidra.ibge.gov.br/
- CONAB: https://portaldeinformacoes.conab.gov.br/
- Open-Meteo: https://open-meteo.com/en/docs
- CEPEA: https://onetoone.cepea.org.br/docs/api


## Metodologia da F7 — aprovada em 2026-10-27
- O usuário autorizou evolução pública por frigorífico/data, ampliando a regra da F5. A consulta considera apenas registros sem sucessor de correção, da região atual e de empresa ativa; escolhe uma cotação por data/categoria/frigorífico por atualização/ID de desempate. Correções substituídas continuam privadas, mesmo ao mudarem data/categoria. Sem snapshots, médias, autores ou IDs de cotação no resultado público.
- Séries externas do gráfico selecionam última revisão de cada período; frequência/unidade/localidade nunca são mescladas. Janela padrão de 90 datas, máximo 366, sem futuro; filtragem externa pelo fim da referência. SVG e tabela equivalente mostram observações sem interpolar lacunas. Uma observação não define tendência.
- Variação absoluta = último − primeiro ponto disponível; percentual = diferença / primeiro × 100, duas casas. Duas datas necessárias; base zero não gera percentual. O indicador é descritivo do recorte, não retorno financeiro nem previsão.
- Relação de troca em @/bezerro = preço do bezerro R$/cabeça / referência da arroba R$/@. Séries explicitamente selecionadas, valores positivos, mesma geografia textual normalizada, frequência e período, atuais e não expiradas. Dados incompatíveis/ausentes → “Dados insuficientes”; não presumir peso de um boi nem equivalência entre regiões externas e comerciais.
- Simulação usa Decimal e valores por animal; carcaça = peso × rendimento% / 100, arrobas = carcaça / 15, receita = arrobas × preço, margem = receita − custo informado. Preço de equilíbrio = custo / arrobas. Custos omitidos não são presumidos. Apenas a exibição monetária arredonda para centavos (meio para cima), sem reutilizar arrobas arredondadas no cálculo. Campos não são persistidos nem colocados na URL.
