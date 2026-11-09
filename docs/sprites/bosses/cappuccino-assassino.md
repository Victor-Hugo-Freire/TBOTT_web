# Cappuccino Assassino

- **Tipo:** chefe da issue #16 · **id:** `cappuccino-assassino`
- **Onde aparece:** grupo B (andares 3 e 4) (decisão de 2026-10-31 nas notas da #18). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Teleporte e corte de katana; a animação de clones mostra o original encolhido e dois fantasmas.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `cappuccino-assassino.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando (emite `corte-katana` no quadro 2) | 5 | 500 ms | 240 ms | 130 ms |
| teleporte (emite `poof` no quadro 2) | 6 | 530 ms | 170 ms | 280 ms |
| clones (emite `poof` no quadro 1) | 6 | 600 ms | 100 ms | 100 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 600 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Seguir a fumaça do teleporte; bater logo depois do corte.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 660×660 px, 7 animações, 38 quadros por camada.
- Animações: parado, andando, atacando, teleporte, clones, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Vista de lado. Os clones são só um quadro (o jogo move e causa dano). Direitos do meme em disputa.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
