# Tralalero Tralala

- **Tipo:** chefe da issue #16 · **id:** `tralalero-tralala`
- **Onde aparece:** andar 5, chefe final fixo. Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Três fases: investida tripla, mordida, canto (pauta musical), mergulho-barbatana.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `tralalero-tralala.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| investida | 4 | 280 ms | 510 ms (inclui `preparando-investida`: 510 ms) | 0 ms |
| atacando | 5 | 510 ms | 240 ms | 120 ms |
| canto-tralala (emite `nota-musical` no quadro 2) | 5 | 600 ms | 240 ms | 240 ms |
| barbatana (emite `barbatana` no quadro 0) | 4 | 480 ms | 0 ms | 360 ms |
| pauta (emite `pauta` no quadro 2) | 6 | 720 ms | 240 ms | 120 ms |
| investida-lado | 4 | 280 ms | 510 ms (inclui `preparando-investida-lado`: 510 ms) | 0 ms |
| atacando-lado | 5 | 510 ms | 240 ms | 120 ms |

**Janela de contra-ataque:** `tropeco-vulneravel`: 720 ms (4 quadros)

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 600 ms por ciclo); versão de lado `andando-lado`.
- Como vencer: Esquivar das investidas, bater no tropeço (vulnerável) e aguentar a fase 2 (óculos escuros).

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 840×840 px, 19 animações, 89 quadros por camada.
- Animações: parado, andando, andando-lado, preparando-investida, investida, atacando, canto-tralala, salto-mergulho, barbatana, tropeco-vulneravel, transicao-fase2, parado-fase2, pauta, dano, morte, preparando-investida-lado, investida-lado, atacando-lado, dano-lado.
- Vista de lado: andando-lado, preparando-investida-lado, investida-lado, atacando-lado, dano-lado.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Morte e mergulho de lado não feitos. Folha enorme: no jogo use as `@1x`. Direitos do meme em disputa.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
