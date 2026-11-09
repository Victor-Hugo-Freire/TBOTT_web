# Fenicottero Fornarino

- **Tipo:** inimigo da issue #16 · **id:** `fenicottero-fornarino`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
A boca do forno acende (aviso) e lança uma pizza em arco, que deixa queijo quente onde cai.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `fenicottero-fornarino.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando (emite `pizza-lancada` no quadro 3) | 6 | 660 ms | 350 ms | 220 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 600 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Ler a marca no chão e sair do queijo; atacar entre os arremessos.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×390 px, 5 animações, 25 quadros por camada.
- Animações: parado, andando, atacando, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Vista de lado; morte própria.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
