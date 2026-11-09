# Grão de café

- **Para que serve:** é a moeda do jogo. Paga os itens da Loja (preços de 2 a 4 grãos no protótipo; o Tiramisu custa 4) e o sorteio do Fliperama.
- **Quando aparece:** cai de inimigos e de obstáculos quebráveis (proposta da #18; a regra de drop ainda não existe no jogo). Em grupos de 1, 3 ou 5.
- **Estado dos sprites:**

| arte | arquivo | quadros | feito |
|---|---|---|---|
| ícone parado | `grao-de-cafe.png` | 1 | sim |
| no chão, com sombra (gira como moeda) | `grao-de-cafe_sheet.png`, linha `chao` | 6 × 110 ms | sim |
| aparecer (cai e quica, com achatamento) | linha `aparecer` | 5 | sim |
| coleta (sobe, pisca e some em faíscas) | linha `coleta` | 5 | sim |
| HUD | `hud.png` (20×20 na grade) e `previas/hud-mockup.png` | 1 | sim |
| grupos de 1, 3 e 5 | `grupos_sheet.png` | 3 | sim (parados) |
| etiqueta de preço da Loja (1 a 9) | `preco_sheet.png` (quadro N−1 = preço N) | 9 | sim |

- Célula de 44×44 pixels da grade (132 px), pés em (22, 40), mesma escala de pixel dos outros sprites. JSON no formato de `_novo`.
- **Ainda não existe no jogo:** moeda, drop, loja e HUD de contadores.
