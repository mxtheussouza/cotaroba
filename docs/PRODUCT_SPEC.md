# Especificação do produto

## Objetivo
Criar um site público, simples e responsivo, de consulta e inteligência do mercado pecuário da Bahia, combinando cotações locais de frigoríficos e informações externas para apoiar decisões de compra/venda de gado. **Não é marketplace nem sistema de transações.**

## Perfis
- **Visitante:** consulta sem login.
- **Gestor:** cadastra, edita e desativa frigoríficos e acessos; administra dados externos manuais.
- **Frigorífico:** entra com credenciais e cadastra/atualiza **somente suas próprias** cotações, visualizando seu histórico.

## Funcionalidades do MVP
1. Cadastro de frigoríficos pelo gestor e acesso autenticado.
2. Cadastro e atualização manual de preços da arroba por frigorífico, com data, região, categoria e histórico.
3. Consulta pública por região com nome e cotação vigente de cada frigorífico, por categoria, sem média. Histórico de versões e autoria pessoal permanecem privados.
4. Dashboard de cotações e gráficos de evolução por frigorífico/região/categoria/período, conforme autorização explícita da F7. Apenas registros vigentes por data, sem correções substituídas nem autoria; comparação entre regiões por preços individuais, sem média.
5. Dados externos de dólar, clima/chuvas, milho/soja, abates e referências de mercado quando disponíveis/licenciados.
6. Cadastro manual pelo gestor para dados externos indisponíveis automaticamente.
7. Indicadores simples: variação de preços, relação de troca (quando houver preço do bezerro), contexto climático e econômico.
8. Simulador de receita, custos e margem estimados por animal, com premissas preenchidas pelo visitante, fórmula aprovada e comparação opcional de preço alternativo. Sem armazenar entradas.

## Limites
- Não apresentar hipótese de chuva/alta de preços como certeza causal.
- Não prometer cotações em tempo real quando a fonte for diária, semanal ou trimestral.
- Não usar valores fictícios como reais.
- Sem alertas WhatsApp/e-mail na primeira entrega; evolução futura mediante autorização.
- Sem funcionalidade de compra/venda, estoque, rebanho ou contratos.

## Regras de aceite do produto
- Público acessa indicadores sem autenticação.
- Frigorífico não lê nem altera o histórico privado de outro; cotações vigentes publicadas são acessíveis a todos.
- A página pública mostra somente os campos de publicação aprovados: nome do frigorífico, região, categoria, preço em R$/@, data de referência e atualização.
- Indicador sem base suficiente exibe “Dados insuficientes”.
- Mostrar fonte, região, unidade e data de referência/atualização.
- Falhas de fonte externa não impedem consulta ao histórico armazenado.
- F7: `/painel` mostra evolução de referências vigentes por data e variação entre primeira/última observação do recorte; uma observação não define tendência. Relação de troca exige unidades/localidade/frequência/períodos compatíveis, validade e atualidade. `/simulador` aplica peso vivo kg × rendimento % / 100 / 15, receita = arrobas × preço, margem = receita − custo total informado por animal.
