# Moka Scudiera

- **Tipo:** inimigo da issue #16 · **id:** `moka-scudiera`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Apita (a tampa pula) soltando um anel de vapor; também protege aliados com um escudo de vapor.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `moka-scudiera.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando (emite `vapor-anel` no quadro 2) | 6 | 640 ms | 230 ms | 310 ms |
| escudo (emite `vapor-escudo` no quadro 1) | 4 | 440 ms | 110 ms | 220 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 600 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Matar primeiro, antes que proteja os outros.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×360 px, 6 animações, 29 quadros por camada.
- Animações: parado, andando, atacando, escudo, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Vista de lado.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
