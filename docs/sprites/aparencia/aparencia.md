# Aparência do Tung Tung com itens (sistema de camadas)

**Proposta para o Victor decidir. Nada disto está no jogo.** O Tung não foi redesenhado. Cada item visível é uma camada
**separada**, desenhada por cima ou por baixo do original, e o md5 do Tung (`fdd79671...`) foi conferido antes e depois.
Só existe 1 quadro por direção de cada item (mockup). Nenhum quadro completo foi produzido.

## Como funciona

- **5 slots:** cabeça, costas, bastão, pés e aura. No máximo **1 item por slot**.
- **Ordem de desenho** (de trás para a frente):
  1. aura (no chão);
  2. costas, quando ficam atrás do corpo (de frente e de lado);
  3. pernas (`pernas.png`);
  4. tronco (`andar.png`);
  5. costas, quando ficam na frente (vista de costas);
  6. bastão;
  7. cabeça.
- **Posição:** cada camada tem o tamanho da célula do tronco (296×259) e já vem desenhada no lugar do quadro 0. Nos outros quadros, o jogo soma o deslocamento medido em `ancoras.json`:
  - cabeça e costas: deslocamento da cabeça;
  - bastão: anel e ângulo;
  - aura: nada, porque os pés não se mexem.
- **Regra de prioridade quando 2 itens querem o mesmo slot** (hoje só acontece nas costas, entre a Concha Longa e o Elixir Elétrico):
  1. fica visível o de **maior raridade** (comum < incomum < especial, do Pacto e da Mamãe, < raro);
  2. se empatar, fica o **mais recente**.

  O efeito do item escondido continua valendo: a regra é só de aparência. Na prática, o Elixir (raro) ganha da Concha.

## Âncoras

Estão em `ancoras.md` e `ancoras.json`, medidas por `medir.py` na própria folha do jogo, nos 12 quadros do andar das 4 direções, mais ataque e dano. A prancha `previas/ancoras-medidas.png` mostra os pontos sobre os 48 quadros.

## Os 5 mockups (vistos em imagem, a 1× e a 4×, em 3 voltas)

| item | slot | frente | lado | costas | na escala da sala (0,4×) |
|---|---|---|---|---|---|
| Chifre da Sorte | cabeça | presilha no alto da cabeça, à direita da tela | atrás do rosto | à esquerda da tela | lê bem (vermelho sobre a cabeça) |
| Rolo de Bronze | bastão | ponteira de bronze com frisos na ponta do bastão | idem | idem | lê médio (bronze perto da cor do bastão) |
| Concha Longa | costas | só a concha, saindo atrás da cabeça | concha e cabo na diagonal, atrás | inteira, na diagonal, na frente das costas | lê melhor de todos |
| Caldo da Mamãe | aura | anel de caldo quente no chão e baforadas de vapor | idem | idem | lê bem (anel claro no piso escuro) |
| Elixir Elétrico | costas | **nada** (a cabeça esconde) | garrafinha inclinada atrás da cabeça, acima do bastão | em pé no meio das costas | lê mal: vira um ponto magenta |

Arquivos (em `previas/`):
- `mockup-<item>.png`: original em cima, com o item embaixo, nas 4 direções;
- `mockup-<item>-4x.png`: a direção mais útil, ampliada;
- `mockup-todos-os-slots.png`: chifre, rolo, elixir e caldo juntos, um por slot, também na escala da sala;
- `escala-da-sala.png`: colunas original, chifre, rolo, concha, caldo e elixir; linhas baixo, esquerda, direita e cima.

As camadas soltas estão em `sprites/<item>_<direção>.png`, com alfa binário, dentro da célula. O `elixir-eletrico_baixo.png` é vazio de propósito.

**O que mudou nas voltas:**
- **Volta 1 → 2:**
  - o chifre fino parecia uma pena;
  - o anel do rolo tinha virado um disco enorme (a espessura medida já inclui o contorno do bastão);
  - a concha ficava escondida embaixo do corpo (agora a concha fica para cima);
  - o anel do caldo era cortado pela borda de baixo da célula;
  - o Elixir de lado sumia atrás do braço.
- **Volta 2 → 3:**
  - o chifre saía pela borda de cima da célula. Em cima da cabeça não cabe nada, porque o tronco começa a 23–34 px do topo e sobe até 5 px andando. Ele virou uma presilha na lateral de cima da cabeça;
  - o Elixir de lado ficava junto da mão do bastão e parecia estar na mão. Ele foi para trás da cabeça, inclinado.
- **Volta 3 → 4 (2026-11-09, revisão pedida pelo Victor; backup em `_novo\_backup\2026-11-09\itens\_comum\aparencia\`):**
  - o Elixir de lado ainda ficava na junção do braço com o bastão, porque a altura vinha do ponto das costas. A base agora fica na nuca, 5 pixels da grade abaixo do centro da cabeça, e a garrafa espia atrás da cabeça, longe do bastão;
  - a Concha de frente aparecia na altura da orelha, sem cabo à vista, e parecia um fone. O cabo de frente ficou mais longo e mais em pé, e a concha sai por cima do ombro, no canto da cabeça, com cerca de 1/3 escondido atrás dela;
  - as outras 17 camadas não mudaram (comparadas pixel a pixel com o backup);
  - as cores do Chifre (capa mostarda) e do Rolo (bronze claro) foram medidas e são as mesmas dos ícones dos itens, então não mudaram.

## Ataque e dano (conferidos na folha do jogo)

- **Ataque** (`ataque.png`, 8 quadros por direção):
  - a cabeça anda até 7 px (medido). A cabeça e as costas podem seguir esse deslocamento, que já está medido para os 32 quadros;
  - o bastão dá a volta inteira e passa por cima da cabeça. Um item no slot bastão precisaria de posição **e ângulo** novos em 32 quadros, e isso não foi medido.
- **Dano** (`dano.png`, 4 quadros):
  - o 1º quadro é o Tung inteiro branco (flash) e os outros são tingidos de vermelho, com recuo;
  - uma camada desenhada por cima ficaria com a cor normal e destoaria. O jogo teria de aplicar o mesmo tingimento nas camadas ou escondê-las durante o dano (410 ms).

## Custo (minha estimativa, sem medir no jogo)

| slot | desenhos | posição por quadro | ataque | dano |
|---|---|---|---|---|
| aura | 1 (igual nas 4 direções) | nenhuma: fica nos pés | igual | esconder ou tingir |
| cabeça | 4 (o lado pode ser espelhado: 3) | 48 do andar, **já medidos** | 32, **já medidos** (cabeça) | esconder ou tingir |
| costas | 4 (ou 3) | 48, **já medidos** | 32, já medidos | esconder ou tingir |
| bastão | 4, mais uma versão girada para cada ângulo: até 48 no andar e 32 no ataque | 48 medidos | 32 **não medidos** | esconder ou tingir |
| pés | não feito | cada pé anda no próprio ciclo: 48 posições **não medidas** | ? | ? |

No jogo, o código seria um `drawImage` por camada, com o deslocamento lido de uma tabela, na mesma função que já desenha as pernas e o tronco. Girar o desenho no canvas suaviza a pixel art, por isso o bastão precisaria de versões já giradas.

## Recomendação

1. **Versão 1 (fatia de 2/12): sem aparência.** O item aparece no pedestal, na coleta, no HUD e no efeito visual próprio, que já estão prontos.
2. **Se o Victor quiser uma só:** a **aura do Caldo da Mamãe**. É 1 desenho, não tem tabela por quadro, e lê bem na escala da sala.
3. **Versão 2:** cabeça (Chifre) e costas (Concha ou Elixir, pela regra de prioridade), com a tabela de deslocamento que já está medida, e escondidas no dano.
4. **Fora até segunda ordem:**
   - **bastão:** é o mais caro (ângulo por quadro e 32 quadros de ataque);
   - **pés:** posição de cada pé não medida.
5. **Elixir:** fica nas costas como está, mas lê mal no tamanho real. Se a ideia é mostrar que o jogador tem o item raro, uma aura de faíscas leria melhor. Isso é só uma ideia, não está desenhada.

## Como regenerar

Rodar `python -I medir.py` (grava as âncoras, `ancoras.md` e a prancha) e depois `python -I aparencia.py` (grava as camadas e os mockups) dentro desta pasta, com o Python do venv de `_ferramentas`. Os dois conferem o md5 do Tung no começo e no fim e não gravam nada fora desta pasta.
