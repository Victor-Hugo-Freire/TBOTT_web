# Brr Brr Patapim

- **Tipo:** chefe da issue #16 · **id:** `brr-brr-patapim`
- **Onde aparece:** grupo A (andares 1 e 2) (decisão de 2026-10-31 nas notas da #18). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Pisão com onda de choque e raízes em linha.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `brr-brr-patapim.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando (emite `onda-choque` no quadro 3) | 5 | 550 ms | 320 ms | 130 ms |
| raizes (emite `raiz` no quadro 2) | 4 | 440 ms | 220 ms | 110 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 840 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Sair da linha das raízes; bater no pé depois do pisão.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 660×660 px, 6 animações, 30 quadros por camada.
- Animações: parado, andando, atacando, raizes, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Vista de lado. Só as cores seguem a foto de referência; direitos do meme em disputa.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
