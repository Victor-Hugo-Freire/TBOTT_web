# Cannolo Carica

- **Tipo:** inimigo da issue #16 · **id:** `cannolo-carica`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Raspa o pé (aviso), investe em linha reta e fica atordoado.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `cannolo-carica.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando | 4 | 280 ms | 600 ms (inclui `preparando`: 600 ms) | 0 ms |
| atacando-lado | 4 | 280 ms | 600 ms (inclui `preparando-lado`: 600 ms) | 0 ms |

**Janela de contra-ataque:** `atordoado`: 600 ms (4 quadros)

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 600 ms por ciclo); versão de lado `andando-lado`.
- Como vencer: Esquivar de lado e bater enquanto está atordoado.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×360 px, 12 animações, 54 quadros por camada.
- Animações: parado, andando, andando-lado, preparando, atacando, atordoado, dano, morte, preparando-lado, atacando-lado, dano-lado, morte-lado.
- Vista de lado: andando-lado, preparando-lado, atacando-lado, dano-lado, morte-lado.
- Prévias em GIF na pasta `previas/`.

## Refino
Refino médio aplicado em 2026-11-07 (luz mais dura, base do corpo mais escura, desgaste e olhos mais fundos, sujeira na base). Detalhes em `NOTAS.md` desta pasta.

## O que falta
Morte própria.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
