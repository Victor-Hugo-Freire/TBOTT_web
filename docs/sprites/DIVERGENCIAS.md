# Divergências e pendências

Encontradas no inventário de 2026-11-09, ao trazer a arte para o TBOTT_web. Nenhuma arte foi corrigida nem desenhada nesta etapa.

## Tamanhos

- As 65 folhas descritas pelos 47 JSONs (inimigos e chefes, uma por camada; itens e seus efeitos; consumíveis) e as 29 folhas de efeitos têm exatamente `frameWidth × framesPerRow` por `frameHeight × linhas`. Todas são RGBA.
- As 63 `@1x` têm exatamente 1/3 da folha grande e, ampliadas 3× sem suavizar, são idênticas a ela (0 pixels diferentes).
- **Nenhuma divergência de tamanho.**

## Formato diferente do modelo "uma folha por entidade"

- Inimigos e chefes têm **duas camadas** com a mesma grade (pernas atrás, tronco na frente), como o protagonista. Viraram `<id>-pernas.png` e `<id>-tronco.png`, e os dados usam `layers` em vez de `path`.
- Entraram as versões `@1x` (decisão do Victor em 2026-11-09): as folhas grandes ocupariam cerca de 3,2 GB de memória abertas no navegador (só o Tralalero, 858 MB), contra 352 MB das `@1x`. Os dados trazem `scale: 3`.
- Os `.json` copiados guardam os nomes e as medidas do pipeline da arte (ver `README.md`).

## Faltam como imagem (salas, portas, minimapa, HUD)

O protótipo da issue #18 (`prototipos-salas-issue-18/`, rodada 5) **desenha** salas, portas, minimapa e barra do chefe por código (canvas, `lib.js` e `hud.js`). Os PNGs da pasta `png/` não servem como asset:

- `sala-*.png` e `sala-especial-*.png` são capturas da tela inteira, com minimapa, obstáculos e um quadro parado do Tung Tung embutidos;
- `prancha-*.png` são pranchas de apresentação, com títulos e textos.

Pendências:

1. **Fundos e elementos das salas** (piso, paredes e obstáculos dos 5 andares e das 9 salas especiais): não existem como PNG separado.
2. **Portas** (comum e 9 tipos especiais × aberta, fechada, trancada): não existem como PNG separado.
3. **Minimapa** (salas, jogador, ícones das salas especiais): não existe como PNG separado.
4. **Barra de vida dos chefes:** existe só no protótipo (`hud.js`), desenhada por código.

Para trazer essas peças é preciso decidir o recorte (peça por peça, tamanhos, estados) e exportá-las do protótipo. Isso ficou para outra tarefa. Uma cópia do protótipo, que abre sozinha, está em `docs/referencias/prototipo-salas-issue-18/`.

## Itens e consumíveis

- **Garfo e grão de café:** contorno fino de 1 pixel, e não o contorno do kit dos itens. É um desvio de estilo ainda não aprovado pelo Victor. Os dois foram integrados normalmente.
- **Pedestal da Sala da Mamãe:** não existe (`pedestal-base`, `-loja`, `-pacto` e `-adega` existem). Pelas notas do protótipo, os pedestais do Pacto e da Mamãe ainda aparecem como caixas amarelas nas salas.
- **Coração (vida):** não existe como sprite; só como ícone 8×8 no protótipo.
- As folhas `grao-de-cafe-grupos` e `grao-de-cafe-preco` não têm `@1x` e entraram no tamanho final (`scale: 1`).

## Aparência do Tung com itens

- Só existe o **quadro 0** de cada direção; nos outros quadros o jogo desloca a camada pelas âncoras (`appearanceSprites.js`).
- **Bastão (Rolo de Bronze):** no andar o ângulo muda até 8 graus e a camada não gira; no golpe o bastão dá a volta inteira e isso não foi medido. Proposta: esconder o slot bastão durante o golpe.
- **Dano:** o Tung fica branco e depois vermelho; as camadas teriam de ser escondidas ou tingidas igual.
- **Pés:** slot não feito (a posição de cada pé por quadro não foi medida).
- **Elixir Elétrico:** de frente não aparece (a cabeça esconde) e, no tamanho da sala, lê como um ponto magenta.
- **Revisão de 2026-11-09:** o Elixir de lado saiu da junção do braço com o bastão (agora espia atrás da cabeça) e a Concha de frente saiu da altura da orelha (agora aparece por cima do ombro). As cores do Chifre (capa mostarda) e do Rolo (bronze claro) parecem apagadas, mas foram medidas e são as mesmas dos ícones dos itens; não mudaram. As baforadas do Caldo parecem pedrinhas brancas: é gosto, não defeito, e ficaram como estão.

## Pendências da arte (relatório da issue #16, seção 8)

- Vista de lado só em cinco personagens (Cannolo, Vespina, Cinquecento, Bombardiro, Tralalero). O Tralalero não tem `morte-lado` nem mergulho de lado.
- Mortes genéricas: as mortes específicas da Nonna e do Tralalero não foram feitas.
- A animação `clones` do Cappuccino Assassino é só uma pose com dois fantasmas; os clones de verdade não foram feitos.
- O segmento de "pauta" musical do Tralalero não foi feito (o relatório sugere usar `nota-musical`).
- A Nonna tem só a primeira transição de camada desenhada; as outras reutilizam `perde-camada`.
- Sombras não estão nos sprites.
