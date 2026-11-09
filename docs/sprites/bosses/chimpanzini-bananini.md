# Chimpanzini Bananini

- **Tipo:** chefe da issue #16 · **id:** `chimpanzini-bananini`
- **Onde aparece:** grupo A (andares 1 e 2). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Lança uma banana-bumerangue e deixa casca escorregadia; na fase 2 perde a casca.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `chimpanzini-bananini.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando (emite `banana-bumerangue` no quadro 3) | 5 | 470 ms | 280 ms | 120 ms |
| descascar (emite `casca-escorregadia` no quadro 5) | 6 | 660 ms | 550 ms | 0 ms |

**Janela de contra-ataque:** `descascar`: 660 ms (6 quadros)

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 660 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Não pisar na casca; bater quando ele descasca (transição de fase).

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 660×660 px, 7 animações, 36 quadros por camada.
- Animações: parado, andando, atacando, descascar, fase2-andando, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Refino médio aplicado em 2026-11-07 (luz mais dura, base do corpo mais escura, desgaste e olhos mais fundos, sujeira na base). Detalhes em `NOTAS.md` desta pasta.

## O que falta
Vista de lado. O sprite aparece fechado na casca (a foto de referência mostra a banana já descascada).
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
