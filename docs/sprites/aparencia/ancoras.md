# Âncoras de aparência do Tung Tung (medidas no original)

Gerado por `medir.py` a partir de `andar.png` (tronco) e `pernas.png` do jogo, **só leitura**. O md5 do Tung
(`fdd79671a0800ab3597531b2dd7f0953`) é conferido no começo e no fim. Números em px da folha (célula 296×259; 1 pixel da grade = 3 px).
Os valores de todos os quadros estão em `ancoras.json`. A prancha `previas/ancoras-medidas.png` mostra os pontos
nos 48 quadros: amarelo = topo da cabeça, laranja = centro da cabeça, azul = costas, vermelho = anel do bastão, verde = pés.

## Quadro 0 de cada direção

| direção | topo da cabeça | centro da cabeça | largura da cabeça | costas | costas na frente do tronco? | anel do bastão | ângulo do bastão | pés |
|---|---|---|---|---|---|---|---|---|
| baixo | (148.0, 30) | (148.0, 108.5) | 157 | (146.8, 190.4) | não (atrás) | (240.2, 213.9) | -137.8° | (148, 241) |
| esquerda | (147.5, 34) | (147.5, 103.0) | 138 | (188.0, 183.7) | não (atrás) | (246.1, 160.8) | 141.9° | (148, 241) |
| direita | (147.0, 23) | (147.0, 94.5) | 143 | (105.0, 179.6) | não (atrás) | (39.4, 159.6) | 31.8° | (148, 241) |
| cima | (147.5, 27) | (147.5, 103.0) | 152 | (147.9, 187.0) | sim | (242.4, 155.3) | 137.2° | (148, 241) |

## Quanto as âncoras andam nos 12 quadros do andar

A cabeça e as costas andam juntas com o tronco (deslocamento da cabeça). O bastão balança: o anel muda de lugar e de ângulo.

| direção | cabeça dx (px) | cabeça dy (px) | ângulo do bastão |
|---|---|---|---|
| baixo | -3 a 3 | -5 a 0 | -145.8 a -129.9° |
| esquerda | 0 a 0 | -3 a 0 | 136.9 a 146.8° |
| direita | 0 a 0 | -3 a 0 | 27.6 a 37.5° |
| cima | -3 a 3 | -5 a 0 | 125.6 a 145.7° |

## Ataque e dano (só a cabeça; deslocamento em relação ao quadro 0 do andar)

| direção | ataque, 8 quadros (dx, dy) | dano, 4 quadros (dx, dy) |
|---|---|---|
| baixo | (0, -3) (0, -6) (0, 2) (0, 5) (0, 7) (0, 5) (0, 2) (0, 0) | (0, -4) (0, -8) (0, -4) (0, 0) |
| esquerda | (3, 0) (6, 0) (-2, 0) (-5, 0) (-7, 0) (-5, 0) (-2, 0) (0, 0) | (5, 0) (18, 18) (15, 4) (0, 0) |
| direita | (-3, 0) (-6, 0) (2, 0) (5, 0) (7, 0) (5, 0) (2, 0) (0, 0) | (-4, 0) (-18, 16) (-12, 3) (0, 0) |
| cima | (0, 3) (0, 6) (0, -2) (0, -5) (0, -7) (0, -5) (0, -2) (0, 0) | (0, 4) (0, 8) (0, 4) (0, 0) |

## Limites da medida

- **Pés:** vêm de `characterSprites.js` (feetX = 148, feetPadding = 18), não de medida. Cada pé anda no próprio ciclo de `pernas.png`
  (12 quadros), e a posição de cada pé por quadro **não** foi medida: o slot pés ficou sem item e sem mockup.
- **Mão do bastão:** não foi medida separadamente. O "anel" fica 24 px abaixo da ponta, seguindo o eixo do bastão.
- **Ataque:** o bastão dá a volta inteira e passa por cima da cabeça. A posição do bastão nos 32 quadros do ataque **não** foi medida
  (o método da ponta mais longe do corpo falha quando o bastão fica acima da cabeça).
- **Dano de lado:** no 2º quadro a cabeça recua e inclina. A busca chegou ao limite de 18 px, então esse valor é aproximado.
- **Costas de frente:** o ponto fica no corpo, atrás da cabeça. De frente, só aparece o que passa da silhueta.
