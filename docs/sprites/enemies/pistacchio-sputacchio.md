# Pistacchio Sputacchio

- **Tipo:** inimigo da issue #16 · **id:** `pistacchio-sputacchio`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Abre a casca e cospe um caroço.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `pistacchio-sputacchio.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando (emite `caroco` no quadro 2) | 6 | 660 ms | 270 ms | 310 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 600 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Aproximar-se logo depois do disparo, antes que feche a casca.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×360 px, 5 animações, 25 quadros por camada.
- Animações: parado, andando, atacando, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Refino médio aplicado em 2026-11-07 (luz mais dura, base do corpo mais escura, desgaste e olhos mais fundos, sujeira na base). Detalhes em `NOTAS.md` desta pasta.

## O que falta
Vista de lado; morte própria.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
