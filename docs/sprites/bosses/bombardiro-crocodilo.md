# Bombardiro Crocodilo

- **Tipo:** chefe da issue #16 · **id:** `bombardiro-crocodilo`
- **Onde aparece:** grupo B (andares 3 e 4). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Marca o chão e bombardeia; pousa para abastecer.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `bombardiro-crocodilo.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando (emite `bomba` no quadro 3) | 6 | 620 ms | 330 ms | 200 ms |
| atacando-lado (emite `bomba` no quadro 3) | 6 | 620 ms | 330 ms | 200 ms |

**Janela de contra-ataque:** `pousado`: 640 ms (4 quadros)

## Movimento e como vencer
- Movimento: animação `andando` (4 quadros, 400 ms por ciclo); versão de lado `andando-lado`.
- Como vencer: Sair das marcas no chão; bater quando pousa. É o mais complexo e pode ficar para a versão 2.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 660×660 px, 11 animações, 54 quadros por camada.
- Animações: parado, andando, andando-lado, atacando, pousado, dano, morte, atacando-lado, pousado-lado, dano-lado, morte-lado.
- Vista de lado: andando-lado, atacando-lado, pousado-lado, dano-lado, morte-lado.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Morte de lado. Direitos do meme em disputa.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
