# Design System — proposta inicial

## Direção visual
Profissional, clara, moderna, simples e orientada a dados. Referências discretas ao agronegócio, sem visual carregado. Mobile-first, alto contraste, interface pt-BR.

## Tokens iniciais (revisáveis pelo cliente)
| Token | Cor |
|---|---|
| background | `#F8FAF8` |
| foreground | `#17251C` |
| surface | `#FFFFFF` |
| primary | `#246B45` |
| primary-hover | `#195536` |
| primary-foreground | `#FFFFFF` |
| secondary | `#E9F1EB` |
| muted | `#5E6B62` |
| border | `#DCE5DE` |
| success | `#247A49` |
| warning | `#A96A15` |
| danger | `#B4433C` |

## Tipografia e layout
- Fonte sans-serif legível (Geist ou equivalente).
- Corpo 14–16px, títulos de seção 20–24px, página 28–36px.
- Grid responsivo, container ~1200px, escala de espaçamento 4/8/12/16/24/32px, raio padrão 12px.
- Contraste WCAG AA, navegação por teclado, foco visível, formulários com labels e feedback.

## Componentes previstos
`Header`, `Footer`, `PageTitle`, `MetricCard`, `FilterBar`, `PriceChart`, `DataTable`, `SourceLabel`, `FreshnessBadge`, `EmptyState`, `QuoteForm`, `SimulationForm`.
Criar componentes **quando a etapa precisar deles**, não todos antecipadamente.

## Regras de visualização
- Sempre indicar R$/@ ou outra unidade correta, data, região e fonte.
- Exibir carregamento, erro, vazio, desatualizado e “Dados insuficientes”.
- Não usar apenas cor para representar variação; exibir sinais/texto.
- Gráficos devem ter período, legenda e eixos claros; evitar distorção.
- Na consulta de cotações, mostrar preço vigente conforme F5. No painel F7, evolução autorizada por data sem média entre frigoríficos; correções substituídas e autoria pessoal continuam privadas. Gráficos individuais por unidade, eixo zero, datas proporcionais e tabela acessível; sinais/textos para variação e margem negativa.

## Páginas
Públicas: início/dashboard, cotações, indicadores/clima, simulador.
Privadas: gestor (frigoríficos, usuários e dados manuais), frigorífico (preços e histórico).

## Regra permanente de UX para consultas
- Exigir o menor número possível de cliques sem comprometer clareza, acessibilidade ou precisão. Ações frequentes devem ter acesso direto; remover etapas redundantes e reduzir carga cognitiva.
- No painel, exibir uma visualização por vez: Preços, Evolução, Contexto ou Relação de troca. Filtros ficam junto às abas, mostrando apenas campos pertinentes; valores das demais consultas são preservados.
- Com JavaScript, seleções atualizam via App Router sem recarregar documento nem saltar a rolagem; abas alternam conteúdo já renderizado. Sem JavaScript, links/GET mantêm a consulta acessível. Teclado: abas com setas/Home/End, controles rotulados e foco visível.
- Preços individuais em linhas compactas, com referência e atualização próprias; mostrar cinco inicialmente e expandir os demais, mantendo acesso à lista completa. Não criar médias ou novos indicadores.
- Gráficos: linha contínua/círculos para cotações, tracejada/quadrados para referências externas, barras para totais de chuva/abates por período. Sem misturar unidades; cor acompanha papel da série, nunca sinal de valorização/desvalorização sozinho. Fonte/unidade, observações, período e tabela equivalente presentes.
- Consulta de pontos por ponteiro/toque e controle de observações operável por teclado, com valor/data/unidade anunciados. SVG e tabela permanecem legíveis sem JavaScript; explicações extensas são expansíveis.
