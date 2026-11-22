# Tiramisu
- id: tiramisu
- sala: Loja  (a loja vende itens por grãos de café, a moeda do jogo) (sala proposta na issue #18, ainda não confirmada pelo Victor)
- raridade: incomum
- como se obtém: Comprado na Loja por 15 grãos de café (decisão do Victor, 2026-11-21).
- frase do banner: ME LEVANTA!
- aparência: Fatia de tiramisu em camadas, com cacau e um grão de café em cima.
- humor/ideia: "Tiramisu" quer dizer "me puxa para cima": cada grão de café dá um gás.
- efeito visual: `po-de-cacau` (sprites/po-de-cacau_sheet.png)
- estado da arte: ícone, pedestal (6 quadros), coleta (6 quadros), banner e efeito visual: feitos

## Onde e quando aparece (spawn, proposta)
- sala: Loja
- andares: 1, 2, 3, 4, 5 (a Loja existe em todos os andares)
- peso de sorteio: 6 (incomum) na Loja; os outros 2 pedestais vendem consumíveis (coração e garfo)
- condição: nenhuma (a Loja está sempre aberta)
- pedestal: pedestal do meio dos 3 do balcão (colunas 4, 6 e 8, linha 3: uma fileira livre embaixo do balcão, para o jogador não ficar preso); a Loja tem 3 pedestais
- repetição: não repete; se os itens da Loja acabarem, o pedestal vende um coração
- preço ou custo: 15 grãos de café (o garfo custa 7 e o coração 5, em src/data/economy.js)
