# Formaggino Saltellino

- **Tipo:** inimigo da issue #16 · **id:** `formaggino-saltellino`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Persegue aos saltos; agacha (aviso), pula e morde.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `formaggino-saltellino.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando | 6 | 670 ms | 270 ms | 210 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 570 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Bater entre os saltos, quando ele pousa.

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
