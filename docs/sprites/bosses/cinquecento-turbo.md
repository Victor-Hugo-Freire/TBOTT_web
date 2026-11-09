# Cinquecento Turbo

- **Tipo:** chefe da issue #16 · **id:** `cinquecento-turbo`
- **Onde aparece:** grupo A (andares 1 e 2); chefe da fatia jogável (proposta). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Fiat 500 de faróis-olhos e rodas como pernas: investe e ricocheteia nas paredes, buzina (onda de som) e abre o capô para esfriar.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `cinquecento-turbo.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| investida (emite `marca-pneu` no quadro 0) | 4 | 280 ms | 520 ms (inclui `preparando-investida`: 520 ms) | 0 ms |
| atacando (emite `buzina` no quadro 2) | 5 | 510 ms | 220 ms | 110 ms |
| investida-lado (emite `marca-pneu` no quadro 0) | 4 | 280 ms | 520 ms (inclui `preparando-investida-lado`: 520 ms) | 0 ms |
| atacando-lado (emite `buzina` no quadro 2) | 5 | 510 ms | 220 ms | 110 ms |

**Janela de contra-ataque:** `esfriando`: 840 ms (6 quadros)

## Movimento e como vencer
- Movimento: animação `andando` (6 quadros, 540 ms por ciclo); versão de lado `andando-lado`.
- Como vencer: Esquivar da investida, sair da onda da buzina e bater quando abre o capô.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 660×660 px, 14 animações, 70 quadros por camada.
- Animações: parado, andando, andando-lado, preparando-investida, investida, atacando, esfriando, dano, morte, preparando-investida-lado, investida-lado, atacando-lado, dano-lado, morte-lado.
- Vista de lado: andando-lado, preparando-investida-lado, investida-lado, atacando-lado, dano-lado, morte-lado.
- Prévias em GIF na pasta `previas/`.

## Refino
Refino médio aplicado em 2026-11-07 (luz mais dura, base do corpo mais escura, desgaste e olhos mais fundos). Detalhes em `NOTAS.md` desta pasta.

## O que falta
Nada de arte pendente: refinado de frente e de lado, e os efeitos `buzina` e `marca-pneu` também foram refinados. A investida que ricocheteia é lógica do jogo.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
