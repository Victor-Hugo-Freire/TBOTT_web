# Sprites do jogo

Índice das imagens de `public/sprites/` e dos arquivos de dados em `src/data/`. Nenhuma tela usa ainda os sprites novos (inimigos, chefes, itens, efeitos, pedestais, HUD e aparência): por enquanto eles são só assets e dados.

A **aparência do Tung com itens** é uma proposta: camadas por cima do personagem (cabeça, costas, bastão e aura), desenhadas só no quadro 0 de cada direção e movidas pelas âncoras medidas. Se a equipe desistir, basta apagar `characters/tung-tung-sahur/aparencia/`, `src/data/appearanceSprites.js`, `docs/sprites/aparencia/` e os dois testes de aparência em `tests/sprites.test.js`. Os arquivos antigos de `characters/` não foram alterados.

## O que existe e onde fica

| categoria | imagens (`public/sprites/`) | dados (`src/data/`) | docs (`docs/sprites/`) |
|---|---|---|---|
| protagonista | `characters/` | `characterSprites.js` | (não tem) |
| aparência do Tung com itens (5 itens, proposta) | `characters/tung-tung-sahur/aparencia/` | `appearanceSprites.js` | `aparencia/` (`aparencia.md`, `ancoras.md`) |
| inimigos (10) | `enemies/<id>/` | `enemySprites.js` | `enemies/<id>.md` |
| chefes (8, com o final) | `bosses/<id>/` | `bossSprites.js` | `bosses/<id>.md` |
| itens (12) | `items/<id>/` | `itemSprites.js` (`ITEM_SPRITES`) | `items/<id>/` (`item.md`, `efeitos.md`, `status.md`) |
| consumíveis (garfo, grão de café) | `items/consumables/<id>/` | `itemSprites.js` (`CONSUMABLE_SPRITES`) | `items/consumables/<id>/<id>.md` |
| efeitos de inimigos e chefes (29) | `effects/<id>.png` (+ `efeitos.json`) | `effectSprites.js` | (não tem) |
| pedestais dos itens (4) | `rooms/pedestals/` | `roomSprites.js` | (não tem) |
| HUD (ícones do garfo e do grão) | `ui/` | `uiSprites.js` | (não tem) |

Salas, portas, minimapa e barra de vida dos chefes ainda **não existem como imagem**: veja `DIVERGENCIAS.md`.

## Nomes

- O id é em kebab-case, minúsculo, sem acento: `formaggino-saltellino`, `cinquecento-turbo`, `cafe-duplo`. É o mesmo na pasta, no arquivo, no JSON e na chave do arquivo de dados.
- Uma entidade por pasta. A folha principal é `<id>.png`; outras folhas da mesma entidade são `<id>-<variante>.png` na mesma pasta:
  - inimigos e chefes: `<id>-pernas.png` (camada de trás) e `<id>-tronco.png` (camada da frente), com a mesma grade;
  - itens: `<id>.png` (pedestal e coleta), `<id>-icone.png` e `<id>-<efeito>.png` (efeito visual do item);
  - consumíveis: `garfo-porta-trancada.png`, `grao-de-cafe-grupos.png`, `grao-de-cafe-preco.png`.

## Convenção das folhas (atenção)

- **Protagonista:** linha = direção (`down`, `left`, `right`, `up`), coluna = quadro.
- **Inimigos, chefes, itens e efeitos:** linha = **animação**, coluna = quadro. A vista é de frente; para o outro lado, espelhe na horizontal. As linhas `-lado` são a vista de lado olhando para a direita.

Cada animação nos dados tem `row`, `frames` (a partir da coluna 0), `durations` (ms de cada quadro) e, quando houver, `hitFrames` (quadros em que o golpe acerta) e `emits` (`{ frame, effect }`: o quadro em que nasce um efeito de `effectSprites.js`). Os pés ficam em `(feetX, frameHeight - feetPadding)` da célula, iguais em todos os quadros.

## Escala

Os números dos dados (`frameWidth`, `frameHeight`, `feetX`, `feetPadding`) estão em pixels do **arquivo**. O campo `scale` diz quanto ampliar:

- `scale: 3`: o arquivo é a versão `@1x` da arte (1 px por pixel da grade). Desenhe 3× maior com `ctx.imageSmoothingEnabled = false`. O resultado é idêntico, pixel a pixel, à folha grande (conferido nas 63 folhas), e usa 9× menos memória: a folha grande do Tralalero tem 6720×15960 px, cerca de 430 MB por camada depois de aberta pelo navegador.
- `scale: 1`: efeitos, ícones, HUD, pedestais e as folhas de grupos e preço do grão, que só existem no tamanho final.

## Os `.json` ao lado dos PNGs

São cópias exatas dos JSONs da arte (md5 igual), então guardam os nomes e as medidas do pipeline:

- as medidas estão em pixels da folha grande (3×); divida por 3 para a `@1x`;
- `camadas` e `arquivo` citam os nomes de lá: `pernas.png` → `<id>-pernas.png`, `tronco.png` → `<id>-tronco.png`, `<id>_sheet.png` → `<id>.png`, `<efeito>_sheet.png` → `<item>-<efeito>.png`;
- o `id` das folhas de efeito dos itens é só o do efeito (`po-de-cacau`); nos dados ele vira `tiramisu-po-de-cacau`.

O jogo deve ler os arquivos de `src/data/`, não esses JSONs.

## Origem

Arte gerada por código, fora deste repositório: `pesquisa-issue-16-sprites/_novo/` (inimigos, chefes, efeitos, itens, consumíveis e pedestais). As cópias foram feitas sem alterar nenhum pixel.

## Como adicionar um sprite novo

1. Copie a folha `@1x` (ou a imagem final, se não houver `@1x`) para `public/sprites/<categoria>/<id>/<id>.png`, sem filtro nem redimensionamento, e o JSON da arte para `<id>.json` ao lado.
2. Acrescente a entrada em `src/data/<categoria>Sprites.js` com `id`, `path` (ou `layers`), `scale`, `frameWidth`, `frameHeight`, `framesPerRow`, os pés e `animations`, em pixels do arquivo.
3. Copie ou crie o resumo em `docs/sprites/<categoria>/<id>.md` (se faltar descrição, escreva "a definir").
4. Rode `npm test`: `tests/sprites.test.js` confere o tamanho do PNG, as linhas, os quadros, as durações, os efeitos citados e os ids.
