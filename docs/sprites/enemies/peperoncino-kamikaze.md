# Peperoncino Kamikaze

- **Tipo:** inimigo da issue #16 · **id:** `peperoncino-kamikaze`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Corre, acende e pisca (aviso) e explode.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `peperoncino-kamikaze.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando | 5 | 490 ms | 110 ms | 140 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 420 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Recuar a tempo; matar antes de acender evita a explosão.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×360 px, 6 animações, 28 quadros por camada.
- Animações: parado, andando, aceso, atacando, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Vista de lado.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
