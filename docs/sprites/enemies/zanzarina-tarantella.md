# Zanzarina Tarantella

- **Tipo:** inimigo da issue #16 · **id:** `zanzarina-tarantella`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Dança no ar e mergulha com o ferrão.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `zanzarina-tarantella.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| atacando | 5 | 480 ms | 210 ms | 110 ms |

**Janela de contra-ataque:** não há uma animação própria de vulnerabilidade; vale a recuperação depois do golpe (tabela acima).

## Movimento e como vencer
- Movimento: animação `andando` (4 quadros, 440 ms por ciclo); só de frente (para o outro lado, espelhar).
- Como vencer: Acertar o alvo em movimento no fim do mergulho.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×360 px, 5 animações, 22 quadros por camada.
- Animações: parado, andando, atacando, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Sem refino: é a versão da quarta rodada (31/10).

## O que falta
Vista de lado.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
