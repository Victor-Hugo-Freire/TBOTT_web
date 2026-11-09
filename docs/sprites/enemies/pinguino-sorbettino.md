# Pinguino Sorbettino

- **Tipo:** inimigo da issue #16 · **id:** `pinguino-sorbettino`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Desliza de barriga em linha reta deixando rastro escorregadio; cada golpe derruba uma das 3 bolas de sorvete (a vida visível).

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `pinguino-sorbettino.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando | 6 | 580 ms | 260 ms | 110 ms |
| deslizando (emite `rastro-gelo` no quadro 0) | 4 | 280 ms | 0 ms | 210 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 600 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Não pisar no rastro; 3 golpes derrubam as 3 bolas.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×390 px, 8 animações, 37 quadros por camada.
- Animações: parado, parado-2, parado-1, andando, atacando, deslizando, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Vista de lado.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
