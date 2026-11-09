# Garfo

- **Para que serve:** é a chave do jogo. Enrola e tira o nó de espaguete das portas trancadas (Sala do Tesouro do andar 2 em diante e Sala de Descanso, pela issue #18). Cada porta gasta 1 garfo.
- **Quando aparece:** cai de inimigos e de obstáculos quebráveis, e pode sair no Fliperama e na Adega Secreta (proposta da #18; a regra de drop ainda não existe no jogo).
- **Estado dos sprites:**

| arte | arquivo | quadros | feito |
|---|---|---|---|
| ícone parado | `garfo.png` | 1 | sim |
| no chão, com sombra (balança e brilha) | `garfo_sheet.png`, linha `chao` | 4 × 140 ms | sim |
| aparecer (cai e quica) | linha `aparecer` | 5 | sim |
| coleta (sobe, pisca e some em faíscas) | linha `coleta` | 5 | sim |
| HUD | `hud.png` (20×20 na grade) e `previas/hud-mockup.png` | 1 | sim, mas é o mais fraco (ver NOTAS) |
| porta trancada (o garfo enrola o nó e abre) | `porta_trancada_sheet.png` | 8 | sim |

- Célula de 44×44 pixels da grade (132 px), pés em (22, 40), mesma escala de pixel dos outros sprites. JSON no formato de `_novo`.
- **Ainda não existe no jogo:** garfo, drop, porta trancada e HUD de contadores.
