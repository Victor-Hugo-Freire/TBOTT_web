# Polpetta Sotterranea

- **Tipo:** inimigo da issue #16 · **id:** `polpetta-sotterranea`
- **Onde aparece:** ainda não definido (inimigo comum). Nada disto está no jogo: salas, inimigos e chefes ainda são proposta.

## Mecânica
Fica escondida (só o molho borbulha), emerge mordendo e afunda.

## Ataques: aviso e janela de contra-ataque
Os tempos saem do `polpetta-sotterranea.json` (soma de `ms`). "Aviso" é o tempo antes do primeiro quadro de acerto ou de projétil; "recuperação" é o tempo depois do último.

| animação | quadros | duração | aviso até o 1º acerto | recuperação depois do último acerto |
|---|---|---|---|---|
| escondida (emite `bolhas-molho` no quadro 0) | 4 | 560 ms | 0 ms | 420 ms |
| atacando | 4 | 390 ms | 110 ms | 210 ms |

**Janela de contra-ataque:** `emergindo`: 440 ms (4 quadros)

## Movimento e como vencer
- Movimento: não tem `andando`: fica no lugar e muda de estado (parado, escondida, emergindo, atacando, afundando).
- Como vencer: Não ficar parado sobre o molho; bater logo depois de emergir.

## Estado dos sprites
- Folha `pernas.png` + `tronco.png` (e `@1x`), célula 360×360 px, 7 animações, 29 quadros por camada.
- Animações: parado, escondida, emergindo, atacando, afundando, dano, morte.
- Vista de lado: não tem.
- Prévias em GIF na pasta `previas/`.

## Refino
Refino médio aplicado em 2026-11-07 (luz mais dura, base do corpo mais escura, desgaste e olhos mais fundos, sujeira na base). Detalhes em `NOTAS.md` desta pasta.

## O que falta
Vista de lado; morte própria.
Sem sombra no sprite (o jogo desenha). Nada foi testado no jogo.
