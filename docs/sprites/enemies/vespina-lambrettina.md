# Vespina Lambrettina

- **Tipo:** inimigo da issue #16 · **id:** `vespina-lambrettina`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Acelera soltando fumaça (aviso), faz curvas fechadas e dá a ferroada em mergulho; a fumaça fica na sala.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `vespina-lambrettina.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| acelerando (emite `fumaca` no quadro 1) | 4 | 560 ms | 140 ms | 280 ms |
| atacando | 5 | 500 ms | 220 ms | 120 ms |
| acelerando-lado (emite `fumaca` no quadro 1) | 4 | 560 ms | 140 ms | 280 ms |
| atacando-lado | 5 | 500 ms | 220 ms | 120 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (4 quadros, 320 ms por ciclo); versão de lado `andando-lado`.
- Como vencer: Sair da linha do mergulho; bater logo depois da ferroada.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×360 px, 12 animações, 52 quadros por camada.
- Animações: parado, andando, andando-lado, acelerando, curva, atacando, dano, morte, acelerando-lado, atacando-lado, dano-lado, morte-lado.
- Vista de lado: andando-lado, acelerando-lado, atacando-lado, dano-lado, morte-lado.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Morte própria.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
