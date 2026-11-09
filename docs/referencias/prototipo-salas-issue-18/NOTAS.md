# Notas do protótipo das salas (issue #18)

As rodadas antigas (`versao-1` a `versao-3`) foram apagadas na limpeza de 2026-11-08 (estão na Lixeira). A raiz é a rodada 4.

## Rodada 4 (2026-11-07): portas, salas, garfo e grão

### Portas (`lib.js`, `door` e `enfeite`)
- Antes, quase todas as portas especiais tinham a **mesma silhueta retangular** e mudavam só de cor.
- Agora cada tipo tem um enfeite acima da verga, ligado ao ícone do minimapa (o mesmo ícone, maior, fica na pedra-chave):

| tipo | enfeite | ícone do minimapa |
|---|---|---|
| Sala do Chefe | ameias de castelo e duas pontas de ferro | coroa vermelha |
| Sala do Tesouro | cúpula de cloche dourada | cloche |
| Loja | placa redonda com o grão de café | grão |
| Sala do Pacto | barbatana e uma fileira de dentes na boca da porta | barbatana |
| Sala da Mamãe | coração e renda; aberta: cortinas de renda presas e luz quente | coração |
| Fliperama | letreiro de arcade com lâmpadas; trancada: funil maior com o grão entrando | bola |
| Palco | frontão dourado e cortinas presas nos cantos | máscara |
| Sala de Descanso | lua crescente | zz |
| Comum e Adega Secreta | sem enfeite (a Adega é secreta de propósito) | (nenhum) / garrafa |

- As portas de baixo e dos lados são a mesma peça girada, então o enfeite fica do lado de fora da parede (na faixa escura).

### Salas dos 5 andares (`lib.js`)
- Melhoria **leve**, sem mexer na geração do mapa:
  - saíram as **rachaduras** que o piso de concreto (Pastificio) e o de lajes tinham (rachaduras estão entre as coisas que o Victor descartou);
  - grão leve de poeira em todo piso;
  - luz de cima/esquerda (o canto de cima à esquerda clareia, o de baixo à direita escurece, como nos sprites);
  - sombra projetada dos obstáculos para baixo e para a direita.
- Nada de paredes em perspectiva, lâmpadas, desenhos a giz ou pedra fria.

### Garfo e grão
- A prancha de coletáveis e a Loja (etiquetas e sacas) usam os sprites refinados de `pesquisa-issue-16-sprites\_novo\itens\_comum\consumiveis\` (embutidos por `gerar-sprites.py`).
- O ícone 8×8 continua no minimapa e na pedra-chave das portas, porque ali o tamanho é outro.

### Minimapa
Os ícones das salas, das portas (pedra-chave e enfeite) e do minimapa são os mesmos 9 desenhos, e a porta trancada é o garfo na ligação. Não achei nada que destoasse.

## O que eu olhei de fato nesta rodada (imagem aberta e conferida)
- **1× (PNG inteiro):**
  - os 5 andares: Cantina, Cucina, Piazza, Pastificio, Porto;
  - as 9 especiais: Sala do Chefe, Sala do Tesouro, Loja, Pacto, Mamãe, Fliperama, Palco, Adega, Sala de Descanso;
  - a Sala do Chefe em luta;
  - as pranchas de portas, minimapa, obstáculos, secreta e coletáveis.
- **Ampliado (2×, recorte da prancha de portas):** Sala do Chefe fechada, Pacto aberta, Fliperama trancada, Sala de Descanso aberta, Mamãe aberta e Palco trancada.
- **Não olhei de novo:** a prancha da barra do chefe (não mudou nesta rodada; foi vista na rodada 3).

## Defeitos achados e corrigidos
1. A lua da Sala de Descanso era um arco e parecia a letra "C": virou um crescente cheio.
2. A Mamãe aberta mostrava um painel bege que parecia um quadro: virou vão escuro com luz quente e cortinas de renda.
3. Na prancha de coletáveis, o garfo ampliado 3× invadia o título e o contador: a escala agora segue a altura disponível.
4. Na Sala do Chefe em luta, o enfeite da porta de baixo aparecia atrás do nome do chefe: uma faixa de HUD escura passou a ficar atrás da barra (o enfeite ainda aparece escurecido atrás do nome).

## Rodada 5 (2026-11-08): sem placas, nomes curtos e uma porta por sala especial
Cópia de antes em `versao-4\`.

**O que mudou:**
- A placa com o nome do andar saiu de todas as salas (`wallDecor` só desenha os enfeites). A placa "NON DISTURBARE" da Sala de Descanso também saiu.
- Nomes novos em tudo: títulos, notas, legenda do minimapa, chaves internas (`chefe`, `tesouro`, `loja`, `fliperama`, `palco`, `descanso`, `mamae`) e nomes dos PNGs (`sala-especial-tesouro.png` etc.; a luta virou `sala-especial-chefe-em-luta.png`). Os PNGs de nome velho foram apagados (estão em `versao-4\png\`). O ícone da Mamãe continua com a chave `bem` em `ICON`.
- Itens nos pedestais com os ids novos: `cafe-duplo`, `tiramisu` (pedestal `loja`) e `elixir-eletrico`.
- Minimapa: sala especial é beco sem saída. Ela liga a **uma** vizinha comum só (de preferência uma já visitada; na ordem baixo, esquerda, direita, cima), e duas especiais vizinhas não se ligam.
- Pranchas: dois textos que passavam da borda com os nomes novos foram encurtados (garfo e barra do chefe). "a Fliperama" virou "o Fliperama".

**O que eu olhei (imagem aberta):**
- 1×: os 21 PNGs (5 andares, 9 especiais, a luta e as 6 pranchas). Nenhuma placa sobrou, nem a "NON DISTURBARE".
- Ampliado (2×): os 15 minimapas das salas, numa prancha só. Cada sala especial tem uma ligação só. Na Cantina, a ligação do tesouro é escura (sala ainda não visitada), mas está lá.
- Comparação com `versao-4\png\` (prancha `png-comparacao-rodada-5.png`, antes à esquerda e agora à direita, e diferença pixel a pixel):
  - nos 5 andares, só a área da placa mudou; na Cantina e na Cucina, também 32 px do minimapa (a ligação extra da especial);
  - na Sala de Descanso, só a placa "NON DISTURBARE";
  - na Loja, os ícones de grão (etiquetas e sacas), porque o grão refinado é de 07/11 20:57 e a exportação da rodada 4 é das 20:28;
  - as outras 8 especiais e a luta ficaram idênticas.
- Na prancha do minimapa, o exemplo "Ligações e portas" põe o tesouro e a coroa lado a lado. Como as duas são especiais, a coroa fica sem ligação, e isso é de propósito: especiais não se ligam entre si.

## Como regenerar os PNGs
1. Rodar `python -B gerar-sprites.py` (se os sprites mudarem).
2. Servir a pasta com `python -m http.server 8765` e abrir no navegador.
3. Esperar `body[data-pronto="1"]` e exportar os canvas (`toDataURL`), ou usar o botão "Baixar todos".

## Pendências
- Os pedestais do Pacto e da Mamãe ainda têm as caixas amarelas da rodada 2 (o pedido só pediu itens reais na Sala do Tesouro, Loja e Adega).
- Nada foi testado no jogo; a sala inicial do jogo (`drawRoom.js`) não mudou.
