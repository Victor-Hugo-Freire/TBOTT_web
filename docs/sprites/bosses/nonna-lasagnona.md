# Nonna Lasagnona

- **Tipo:** chefe da issue #16 · **id:** `nonna-lasagnona`
- **Onde aparece:** grupo A (andares 1 e 2); no grupo B também, se não saiu antes. Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Colherada com onda de choque; invoca almôndegas; perde camadas de lasanha (4 camadas, a vida visível).

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `nonna-lasagnona.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando (emite `onda-choque` no quadro 3) | 5 | 550 ms | 260 ms | 130 ms |
| invocar (emite `almondega` no quadro 3) | 6 | 720 ms | 360 ms | 240 ms |

**Janela de contra-ataque:** `perde-camada`: 400 ms (4 quadros)

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 660 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Sair da onda, matar as almôndegas e bater nas camadas; cada camada perdida muda o parado.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 660×660 px, 12 animações, 56 quadros por camada.
- Animações: parado, parado-3, parado-2, parado-1, andando, atacando, invocar, perde-camada, perde-camada-3, perde-camada-2, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Refino médio aplicado em 2026-11-07 (luz mais dura, base do corpo mais escura, desgaste e olhos mais fundos, sujeira na base). Detalhes em `NOTAS.md` desta pasta.

## O que falta
Vista de lado.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
