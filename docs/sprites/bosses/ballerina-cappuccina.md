# Ballerina Cappuccina

- **Tipo:** chefe da issue #16 · **id:** `ballerina-cappuccina`
- **Onde aparece:** grupo B (andares 3 e 4). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Pirueta que ricocheteia e gotas de café; fica tonta ao acertar a parede.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `ballerina-cappuccina.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| pirueta | 6 | 420 ms | 70 ms | 70 ms |
| atacando (emite `gota-cafe` no quadro 2) | 5 | 520 ms | 230 ms | 210 ms |

**Janela de contra-ataque:** `tonta`: 520 ms (4 quadros)

## Movimento e como vencer
- Movimento: animação `andando` (4 quadros, 480 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Desviar da pirueta e bater quando ela está tonta.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 660×660 px, 7 animações, 34 quadros por camada.
- Animações: parado, andando, pirueta, atacando, tonta, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Vista de lado. Direitos do meme em disputa.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
