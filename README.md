# TBOTT Web

Front-end do **The Binding of Tung Tung (TBOTT)**, jogo web roguelike inspirado em _The Binding of Isaac_, com personagens, artes e regras próprias. É um projeto da disciplina de Análise e Projeto de Sistemas do curso Técnico Integrado em Informática para a Internet da UTFPR, campus Campo Mourão.

O jogo consome a [TBOTT_api](https://github.com/Victor-Hugo-Freire/TBOTT_api), que entrega o catálogo de personagens e o ranking e guarda perfis e partidas. O cadastro e o login usarão o Supabase Auth.

**Tecnologias:** React 19, Vite 8, React Router 7 (`react-router-dom`), CSS, Canvas 2D, `fetch` nativo, ESLint e `node:test`. Gerenciador de pacotes: npm.

## O jogo

- Três personagens jogáveis, com atributos iniciais que podem ser diferentes. Hoje só um deles tem sprites.
- Combate com um bastão, usado para atacar inimigos próximos.
- Ranking pelo **menor tempo** de conclusão da partida.
- Salas, mapas, inimigos e itens ainda estão em definição.

O protótipo das telas está no [Figma](https://www.figma.com/design/tUj2NnhhX4oMT2PdN4vm63/Prototipo-The-Binding-of-Tung-Tung). Ele é a referência visual: a tela não deve ganhar elementos que o protótipo não tem.

## Telas

| Tela                                    | Rota    | Situação                            |
| --------------------------------------- | ------- | ----------------------------------- |
| Inicial                                 | `/`     | Pronta (Issue #6)                   |
| Menu principal                          | `/menu` | Protótipo implementado (Issue #7)    |
| Jogo: andares e salas                   | `/jogo` | Run jogável sem inimigos (Issues #19, #20 e #21) |
| Ranking                                 | `/ranking` | Implementada                     |
| Opções                                  | `/opcoes` | Implementada (Issue #15)           |
| Perfil do usuário                       | `/perfil` | Tela provisória                   |
| Seleção de personagem                   | `/selecao-personagem` | Protótipo implementado (Issue #8) |
| Entrar (login e cadastro)               | `/entrar` | Implementada (Issue #14)          |
| Jogo (inimigos, itens e vida)           | -       | A fazer                             |
| Derrota                                 | -       | A fazer (a vitória é o aviso de fim da run) |

Só a Inicial e a tela de entrar são públicas: as demais exigem login e levam para `/entrar` quem não está logado (`RotaProtegida`). Se a API responder 401 no meio do jogo, o jogador volta para `/entrar` com o aviso de sessão expirada.

Endereços desconhecidos voltam para a tela inicial.

## Estrutura

```
src/
  main.jsx           ponto de entrada: monta o React e carrega os estilos globais
  App.jsx            liga o roteador (BrowserRouter)
  routes/            AppRoutes.jsx (lista de rotas) e paths.js (endereço de cada tela)
  pages/             uma pasta por tela, com nome em português (JSX + CSS)
    Inicial/         tela inicial; scene/ desenha a cena animada no canvas
    MenuPrincipal/   menu principal e telas provisórias (MenuDestino)
    Opcoes/          volumes, tela cheia e controles do jogo
    sessaoPersonagem/ seleção de personagem: carrossel com os personagens vindos da API
    SalaInicial/     o jogo em canvas (a pasta mantém o nome antigo); scene/ desenha tudo:
                     drawScene.js (a sala atual e a transição), drawRoom.js + themes.js, drawWallPattern.js,
                     drawFloorPattern.js e drawWallDecor.js (temas), drawSpecialRooms.js (cenário das salas especiais),
                     drawObstacles.js, drawDoors.js, drawDrum.js, drawPlayer.js, drawFloorBanner.js (faixa),
                     drawHud.js, drawTimer.js e drawDebug.js (F3)
  components/        componentes usados por várias telas (CharacterSprite, BotaoVoltar)
  data/              characterSprites.js (arquivo, quadros e direções de cada sprite), uiSprites.js (ícones do HUD)
                     e roomLayouts.json (os 21 layouts de sala)
  utils/             teclado (keyboard.js, menuKeyboard.js), sala (roomMovement.js, collision.js), personagem (player.js, spriteAnimation.js),
                     run (random.js, floorGenerator.js, roomLayout.js, roomObstacles.js, doors.js, run.js), progress.js
                     e canvas.js e pixelFont.js (desenho)
  services/api.js    endereço da API e função apiRequest
  styles/global.css  cores, fonte e classes usadas por todas as telas
tests/               testes automatizados (node:test)
```

Componentes ficam em `src/components/`, cada um em sua pasta com o CSS (por exemplo, `CharacterSprite`, que mostra um personagem a partir da folha de sprites, e `CardUsuario`, o cartão com avatar e nome do menu principal). Os dados de cada sprite (arquivo, tamanho do quadro e direções) ficam em `src/data/characterSprites.js`.

Sprites ficam em `public/sprites/characters/` e são acessados por um endereço fixo, como `/sprites/characters/tung-tung-sahur.png`. Esse é o valor que o banco pode guardar em `sprite_path`; a imagem em si nunca vai para o banco. O jogo carrega as folhas de andar, ataque e dano do Tung Tung Sahur de `public/sprites/characters/tung-tung-sahur/`. O `tung-tung-sahur.png` da raiz não é carregado pelo jogo: fica reservado para o `sprite_path`.

### Como adicionar uma tela

1. Crie `src/pages/NomeDaTela/NomeDaTela.jsx` (e o `.css`, se precisar).
2. Coloque o endereço em `src/routes/paths.js`.
3. Registre a rota em `src/routes/AppRoutes.jsx`.
4. Para navegar até ela: `const navigate = useNavigate()` e depois `navigate(ROUTES.nomeDaTela)`.

## Configuração

Requer Node.js 20.19+ ou 22.12+ (exigência do Vite 8).

```powershell
cd TBOTT_web
npm install
Copy-Item .env.example .env
```

O `.env` não vai para o GitHub e define `VITE_API_URL`, o endereço da TBOTT*api (padrão: `http://localhost:8000`). \*\*Toda variável `VITE*`fica visível no navegador:** nunca coloque`DATABASE_URL`, senhas ou chaves secretas (como `SUPABASE_SECRET_KEY`) no front-end.

## Comandos

| Comando           | O que faz                                                 |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | servidor de desenvolvimento em `http://localhost:5173`    |
| `npm run build`   | gera o build de produção em `dist/`                       |
| `npm run preview` | serve o build localmente, para conferir antes de publicar |
| `npm run lint`    | verifica o código com o ESLint                            |
| `npm test`        | roda os testes de `tests/`                                |

## Tela inicial

O cenário (vila à noite, título e mensagem) é **desenhado em código**, em um canvas de 360×256 pixels ampliado com `image-rendering: pixelated`. O Tung Tung Sahur usa a folha `tung-tung-sahur-piscar.png` (4 quadros: aberto, meio, fechado, meio), com os tempos definidos em `src/data/characterSprites.js`. Ele é mostrado pelo `CharacterSprite` por cima do canvas, na mesma escala da cena.

- **Animações:** lâmpada piscando, vaga-lumes, sangue escorrendo do título, personagem respirando e piscando e mensagem pulsando. Com "reduzir movimento" ativo no sistema, a cena fica parada.
- **Responsiva:** na proporção do protótipo (1440×1024) mostra exatamente o frame. Telas mais largas ou mais altas ganham mais cenário, sem cortar título, personagem e mensagem e sem barras de rolagem.
- **Teclado:** qualquer tecla comum (letras, números, Enter, Espaço, setas…) leva a `/menu`. **Não avançam:** F1 a F12, Ctrl, Alt, Shift e Windows sozinhas, combinações com Ctrl, Alt ou Windows, Tab, Esc, teclas de trava (Caps Lock etc.) e tecla segurada. O comportamento normal do navegador continua; o F5, por exemplo, recarrega a página.

A regra das teclas fica em `src/utils/keyboard.js`. O listener existe só enquanto a tela inicial está aberta e é removido no primeiro aperto válido, para não navegar duas vezes.

- **Transição:** depois da tecla, a tela dá um clarão rápido e escurece com um leve zoom (cerca de 0,5 s); a navegação acontece quando essa animação termina, e o menu surge do escuro. Com "reduzir movimento", a troca é imediata.

## Menu principal

O menu em `/menu` apresenta as opções **Continue**, **New game**, **Ranks** e **Options**, além dos controles de voltar à tela inicial e abrir o perfil do usuário. Como ainda não há salvamento de partidas, **Continue** permanece desabilitado. **New game** leva à seleção de personagem (veja a seção Seleção de personagem). Ranking e perfil levam a telas provisórias; **Options** abre a tela de opções, que ainda não tem configurações.

- **W:** percorre as opções para cima.
- **S:** percorre as opções para baixo. Ao sair do cartão do usuário ou do botão de voltar, retoma a última opção selecionada.
- **D:** seleciona o cartão do usuário.
- **A:** seleciona o botão para voltar à tela inicial.
- **Enter:** ativa a opção ou o controle selecionado.

Na sala, as setas atacam (veja a seção Andares e salas).

Também é possível usar o mouse ou outro dispositivo apontador para selecionar e ativar os botões. A lógica de mapeamento das teclas fica em `src/utils/menuKeyboard.js`.

Em todas as telas com a seta de voltar (`BotaoVoltar`), a tecla **Esc** volta para a tela anterior; com o formulário de login aberto, o Esc é ignorado.

## Opções

A tela `/opcoes`, acessível pelo item **Options** do menu principal, permite ajustar o volume da música e dos efeitos sonoros, alternar a tela cheia e consultar os controles do jogo.

- **Volume da música** e **efeitos sonoros:** controles deslizantes de 0% a 100%. As preferências são salvas neste navegador em `localStorage` (`tbott.options`), com a leitura e a validação em `src/utils/options.js` e restauradas ao abrir a tela novamente. Se o navegador não permitir ler ou gravar o armazenamento, a tela informa o erro.
- **Fullscreen:** alterna entre tela cheia e janela e mostra o estado atual. A tela cheia ativada pelo F11 do navegador não é detectada e aparece como "Off".
- **Controls:** abre a lista de comandos usados na sala: **W/A/S/D** para mover, **setas** para atacar, **R** (segurando) para recomeçar a run e **Esc** para voltar ao menu.
- **Teclado:** **W/S** ou **↑/↓** percorrem os itens; **Enter** ativa botões; **←/→** ajustam o volume quando o controle deslizante está selecionado. **A/←** seleciona o botão de voltar e **D/→** seleciona o cartão do usuário. Também é possível operar a tela com mouse ou outro dispositivo apontador.

Os volumes ficam salvos localmente, mas ainda não alteram a reprodução de áudio: música e efeitos sonoros ainda não estão implementados no jogo.

## Seleção de personagem

A tela `/selecao-personagem` busca os personagens em `GET /api/characters` (pelo `apiRequest`) e os mostra em um carrossel de até três cartões: o do meio é o atual e os laterais ficam ao fundo. As setas `<` e `>` e os indicadores trocam de personagem, e clicar no cartão do meio o seleciona. O botão **Começar Jogo** só habilita depois de selecionar e leva a `/jogo`, enviando o personagem escolhido em `location.state.character`. Enquanto a API responde aparece "Carregando personagens..."; se ela falhar ou vier vazia, a tela mostra a mensagem de erro ou "Sem personagens disponíveis no momento." Também há o botão de voltar ao menu e o cartão do usuário, que leva ao perfil.

O código fica em `src/pages/sessaoPersonagem/`. Os cartões ainda não mostram o sprite do personagem.

## Andares e salas

Depois da seleção de personagem, `/jogo` abre a run: 5 andares gerados por uma seed, com todas as salas, portas e obstáculos. Ainda não há inimigos, itens nem vida: o jogador atravessa as salas, chega à sala do chefe e bate no tambor para seguir. No andar 5 a run termina e o tempo vai para o ranking.

A tela recebe o personagem escolhido em `location.state.character` (sem ele, usa o Tung Tung Sahur), mas só aproveita o nome, no `aria-label` do canvas. O desenho é sempre o do Tung Tung Sahur, único personagem com sprite disponível. **Aviso:** quando os outros personagens ganharem sprite, é em `SalaInicial.jsx` e em `scene/` (`sheets.js` e `drawPlayer.js`) que o desenho deve passar a seguir o personagem escolhido.

**Controles**

- **W**, **A**, **S** e **D** movem o personagem; segurar uma tecla mantém o movimento e as diagonais são aceitas (a velocidade não aumenta). Com teclas opostas seguradas (A e D, ou W e S), vale a última apertada. As teclas valem pela posição física (`event.code`), em qualquer layout de teclado.
- **Setas** atacam com o bastão na direção da seta. Segurar repete o golpe; com duas setas apertadas, vale a última pressionada.
- **R (segurando 1 s):** recomeça a run, como no Isaac. A tela escurece enquanto a tecla é segurada; ao completar, começa outra run no andar 1, com outra seed, a vida cheia e o tempo zerado, e ela é salva por cima da anterior. Soltar antes desfaz. Não vale durante a morte nem depois do fim da run (`updateRestartHold` em `src/utils/run.js`).
- **Esc:** retorna provisoriamente ao menu principal.
- **F3** (só em `npm run dev`): mostra a camada de teste (veja abaixo). Não existe no build.

**Os 5 andares** (`FLOORS` em `src/utils/floorGenerator.js`)

| Andar | Nome na faixa | Salas no mapa | Obstáculos: bloco, sai com o bastão, piso e especial |
| --- | --- | --- | --- |
| 1 | CANTINA | 9 a 10 | barril, garrafão, vinho, barril deitado |
| 2 | CUCINA | 9 a 11 | balcão, saco de farinha, azeite, chapa quente |
| 3 | PIAZZA | 10 a 12 | Vespa, caixote de tomate, sorvete, mesa de café |
| 4 | PASTIFICIO | 10 a 12 | máquina, roda de parmesão, massa crua, esteira |
| 5 | PORTO | 11 a 13 | caixote de peixe, armadilha de lagosta, poça, rede |

Cada andar tem a sua parede, o seu piso e os seus enfeites (`scene/themes.js`); a Cantina é a sala de sempre, sem enfeites.

**Geração por seed** (`random.js` e `floorGenerator.js`)

- A run guarda uma seed só. Cada andar usa uma seed derivada dela e do número do andar (`mixSeed`), então a mesma seed gera sempre os mesmos 5 andares.
- O sorteio usa contas de inteiros (`mulberry32`), que dão o mesmo resultado em qualquer navegador. `Math.random` só aparece para criar a seed de uma run nova (`createRunSeed`).
- O mapa segue o artigo do Boris the Brave sobre a geração de andares do _The Binding of Isaac_: grade de 9 x 8 casas, sala inicial na coluna 4, linha 3, e uma fila que cria salas vizinhas ao acaso. Uma casa só recebe sala se tiver no máximo um vizinho ocupado, então o mapa nunca fecha um laço.
- Se o andar não tiver becos sem saída suficientes para o chefe, o tesouro e a loja, ele é gerado de novo (o número de tentativas aparece no F3).

**Tipos de sala e onde aparecem**

| Sala | Andares | Regra |
| --- | --- | --- |
| Inicial | todos | No meio da grade; é onde a faixa do andar aparece. |
| Comum | todos | As outras salas do mapa. |
| Chefe | todos | O beco mais distante da inicial. Tem o tambor. |
| Tesouro e loja | todos | Outros becos, sorteados (obrigatórios). |
| Palco | 2 a 5 | Se sobrar beco. |
| Fliperama | todos | 1 chance em 3, se sobrar beco. |
| Descanso | todos | 1 chance em 4, se sobrar beco. |
| Adega secreta | 2 a 5 | 1 chance em 2, ao lado de uma sala comum a 3 ou mais salas da inicial. Escondida. |
| Pacto ou Mamãe | 1 a 4 | 1 chance em 2, ao lado da sala do chefe; a porta aparece com a sala do chefe limpa. |

As salas especiais usam a paleta e o cenário delas em qualquer andar (`scene/drawSpecialRooms.js`). A função de cada uma (comprar, pacto, dormir...) ainda não existe.

**Layouts** (`src/data/roomLayouts.json` e `src/utils/roomLayout.js`)

- Cada layout é uma grade de 13 x 7 letras sobre o piso: `.` chão, `#` bloco, `o` sai com o bastão (quebra ou, no Pastificio, rola), `~` piso, `*` especial do andar, `X` cenário de sala especial, `D` tambor, `i` ponto de inimigo e `t` ponto de item (nesses dois pontos ainda não aparece nada).
- A letra diz o papel e o andar escolhe o obstáculo: o mesmo layout serve nos 5 andares. A adega usa sempre os obstáculos da Cantina.
- São 21 layouts: 1 inicial, 10 comuns (vazios, leves, médios e cheios, até 12 obstáculos), 2 de tesouro, 1 de chefe e 1 de cada sala especial.
- As casas da frente das portas ficam sempre vazias. Ao sortear o layout, uma busca com a caixa real dos pés confere que dá para ir de cada porta a todas as outras e a todos os pontos; layout que não passa não é usado naquela sala.

**As 7 mecânicas dos obstáculos** (`src/utils/roomObstacles.js`)

| Mecânica | Obstáculos | O que faz |
| --- | --- | --- |
| Sólido | barril, balcão, Vespa, mesa, máquina, caixote de peixe | Bloqueia. |
| Quebrável | garrafão, saco, caixote de tomate, lagosta | Bloqueia e some com 1 golpe. |
| Rolante | barril deitado, roda de parmesão | Com 1 golpe, rola na direção do golpe e quebra ao bater. |
| Escorregadio | vinho, azeite, sorvete, poça | Em cima, o personagem tem inércia: acelera e freia devagar e continua deslizando (cerca de 65 u) depois de soltar a tecla. Ao sair, a sobra de velocidade some em até 0,2 s. Bater numa parede ou obstáculo tira a velocidade daquele eixo. |
| Quente | chapa | Encostar queima: toca a animação de dano e tira meio coração (no máximo uma vez por segundo). |
| Grudento | massa crua, rede | Em cima, anda a 50%. |
| Esteira | esteira | Empurra para a direita, mais devagar que o andar. As setas andam na mesma velocidade do empurrão (paradas, mas visíveis, com "reduzir movimento"). |

Obstáculo quebrado não volta quando o jogador sai e entra de novo na sala.

**Portas e transição** (`src/utils/doors.js` e `scene/drawDoors.js`)

- Uma porta em cada lado que tem sala vizinha. O desenho segue o tipo da sala especial do outro lado (ou da própria sala especial). Entre o chefe e o pacto (ou a mamãe), a porta é a do pacto (ou da mamãe) dos dois lados. A porta abre quando a sala está limpa; como ainda não há inimigos, toda sala fica limpa ao entrar.
- Para atravessar, os pés encostam na parede dentro do vão e o jogador continua apertando para aquele lado.
- A câmera desliza 350 ms na direção da porta, com a sala antiga saindo e a nova entrando. Com "reduzir movimento" no sistema, a tela escurece e clareia já na sala nova. O jogador surge do outro lado, um pouco para dentro da porta.

**Adega secreta: como achar**

1. De longe, a parede é igual às outras.
2. De perto (até 1 casa da porta escondida), aparece a marca: três riscos de giz, um tijolo solto e poeira.
3. Três golpes do bastão na marca abrem a parede: no 1º ela fica trincada (e passa a aparecer de longe), no 3º vira uma porta. Os golpes ficam guardados na sala.

**Tambor e fim da run**

- O tambor fica no centro da sala do chefe. Cada golpe conta uma batida e escreve "TUNG" acima dele (TUNG, TUNG TUNG, TUNG TUNG TUNG).
- Na 3ª batida a tela escurece, o próximo andar é gerado e o jogador surge no centro da sala inicial, com a faixa do andar.
- No andar 5, a run termina em vitória: o contador para, o progresso é salvo uma última vez e o jogo envia `POST /api/runs` com o personagem, o tempo (`durationMs`) e `status: 'victory'`. A API grava a run e apaga o progresso. Depois disso a sala não salva mais nada.
- Um aviso aparece sobre a tela escura: "Fim da run", o tempo, se o envio deu certo e o botão **Voltar ao menu**. Se o envio falhar, aparece **Tentar de novo**; o progresso continua salvo, marcado como run encerrada, e o Continue reabre esse aviso (a run não pode ser jogada de novo nem enviada duas vezes sozinha). Só os botões do aviso aceitam o mouse. Enquanto o tempo está sendo enviado, o botão e o Esc não saem da sala (o menu leria o progresso antes de a API apagá-lo).
- Abrir `/jogo` sem partida salva (por exemplo, depois do fim da run) volta para o menu, em vez de começar uma partida que ninguém pediu.

**Vida e morte** (`src/utils/health.js`, `run.js` e `player.js`)

- O personagem tem **3 corações**, contados em meios corações (`MAX_HEALTH = 6`). Batida de inimigo e obstáculo que machuca tiram **meio coração** (`DAMAGE_LIGHT`); explosões e ataques mais pesados tiram **1 coração** (`DAMAGE_HEAVY`). Hoje só a chapa quente machuca.
- Depois de cada dano ele fica invencível por 1 s. A vida continua de uma sala para outra, de um andar para outro e no progresso salvo.
- Sem vida, toca a **animação de morte** (`morte.png`, 1390 ms): o bastão escapa da mão, ele tomba de lado como árvore cortada, quica e fica deitado, com lascas de madeira. É diferente da morte dos inimigos de propósito (o corpo não achata, o rosto não muda e não há poeira). Com "reduzir movimento", ele já aparece deitado. Durante a morte os controles são ignorados e o contador para.
- Meio segundo depois, aparece o aviso **"Você morreu"**, com o que o matou ("O Tung Tung Sahur morreu para a chapa quente.") e o tempo, sobre a sala escurecida (ele continua caído ao fundo). O jogo envia `POST /api/runs` com `status: 'defeat'`: a API grava a derrota e apaga o progresso. O botão leva ao menu. Se o envio falhar, vale o mesmo **Tentar de novo** da vitória.
- A causa da morte é o id do obstáculo (e, depois, do inimigo ou do chefe); o texto fica em `getDeathCauseLabel`.

**Faixa e HUD**

- Ao chegar à sala inicial de cada andar, uma faixa de tinta preta atravessa a sala com o nome do andar (`scene/drawFloorBanner.js`). Ela entra, fica cerca de 2 s e sai, sem travar o movimento; com "reduzir movimento", só aparece e some.
- No canto de cima à esquerda, na altura do contador de tempo, ficam os **corações** de vida (`scene/drawHearts.js`): de madeira, como o corpo do Tung Tung, desenhados por código a partir de `src/data/heartPixels.js` (cheio, meio e vazio). Logo abaixo deles ficam os contadores de grão de café e de garfo (`scene/drawHud.js`): ícone em múltiplo inteiro da arte de 20 x 20 e o número ao lado, na `NUMBER_FONT` (`src/utils/pixelFont.js`, dígitos de 4 x 6 feitos no projeto, a mesma do contador de tempo). A run começa com 00 grão e 01 garfo, e eles ainda não mudam.
- O leitor de tela anuncia o nome do andar ao chegar a cada andar.

**F3: camada de teste** (`scene/drawDebug.js`, só em `npm run dev`)

- Na sala: sólidos em vermelho (paredes e obstáculos que bloqueiam), vão das portas (verde aberta, laranja fechada ou escondida), onde o golpe acerta a parede da adega (magenta), os pontos `i` e `t` do layout, a caixa dos pés e a área do golpe.
- No canto direito: seed, andar, sala atual (id, tipo e layout), tentativas da geração e o mapa 9 x 8 com uma letra por sala (I inicial, . comum, C chefe, T tesouro, L loja, P palco, F fliperama, D descanso, A adega, X pacto e M mamãe), com a atual em amarelo e as visitadas em branco. O mapa mostra também a adega.

**O que é salvo no progresso** (`src/utils/progress.js`)

- A seed, o andar, a sala atual (id na grade), a posição dos pés, o tempo e o personagem, a cada 5 s e ao sair da sala.
- As salas já visitadas do andar (`visitedRoomIds`, ids `col-row`). A fonte única é `room.visited`, o campo que o mapa do F3 lê (e o minimapa do jogo vai ler). Save antigo sem a lista marca só a sala atual.
- A partida nova da seleção é salva sem seed; a sala cria a seed ao abrir e salva na hora. O jogo só começa depois de ler o progresso.
- O estado das salas (`roomStates`): os obstáculos quebrados e as batidas na parede da adega e no tambor. O que quebrou não volta ao continuar a run, e a adega aberta continua aberta. O que está rolando conta como quebrado na hora do golpe (ele sempre quebra no fim).
- A vida (`health`, em meios corações) e, se a run acabou em derrota, o que matou o personagem (`deathCause`).

**Como funciona**

- **Canvas em tela cheia** (`SalaInicial.jsx` e `scene/`). A sala (1600x853 unidades) é desenhada por código no estilo do protótipo (painéis, viga, tijolos, piso de tábuas, rodapé e paredes laterais de pedra), com escala uniforme, e a área de andar é sempre a mesma em qualquer tela. Abaixo da sala a tela mostra mais uma faixa de rodapé (`ROOM_VIEW_BOTTOM_EXTRA`, 44 u), onde ficam os enfeites da porta de baixo: assim ela aparece inteira e dá para ver que sala fica ali. Quando a tela é larga demais para mostrar tudo, o corte é só em cima, no máximo 46 u (`ROOM_VIEW_TOP_CROP`, em `scene/view.js`); o contador e o HUD descem junto com a borda da tela. Em tela mais larga que a sala, as paredes laterais continuam até a borda da tela, escurecendo aos poucos (nunca chegam ao preto); a coluna junto do piso é um degradê, e o piso recebe a sombra das paredes e uma vinheta nos cantos, para dar profundidade. Parado por 120 ms, o personagem fica de frente (a espera evita que ele pisque de frente ao trocar de tecla). No alto, um contador (`HH:MM:SS.cc`, `scene/drawTimer.js`) conta o tempo de jogo da run; ele para com a janela sem foco, quando o personagem morre e no fim da run. O canvas usa `devicePixelRatio`, e o personagem é desenhado com suavização alta, porque aparece reduzido. O jogo roda em `requestAnimationFrame`, sem renderizar o React a cada quadro.
- **Imagem de referência:** `docs/referencias/sala-inicial-vazia.png` serve só de referência de arte (as cores e as faixas foram medidas nela). Não é carregada pelo jogo nem entra no pacote.
- **Colisão** (`src/utils/collision.js`): retângulos. O personagem tem uma caixa de 52x21 u nos pés (44x18 vezes `PLAYER_SCALE`, 1,18, em `roomMovement.js`; a mesma escala vale para o desenho, a sombra e a área do golpe); as paredes (`ROOM_WALLS`) são retângulos. O movimento é resolvido no eixo X e depois no Y, com encaixe exato: o personagem desliza na parede e não treme. Na sala de 1600 u, os pés ficam em x de 144 a 1456 e y de 294 a 786, então o corpo e o bastão nunca saem da sala, nem em tela estreita. A mesma função serve depois para inimigos, portas e golpes.
- **Pés como referência:** a posição é o centro dos pés e toda folha é desenhada a partir deles, então trocar de animação não faz o personagem "pular". A sombra (`drawShadow.js`) é só visual.

**Animações** (`src/data/characterSprites.js`)

| Animação | Quadros por direção | Tempo | Quadro |
| --- | --- | --- | --- |
| Pernas (atrás do tronco) | 12 + 1 parado | 1 quadro a cada 6,67 u andadas (ciclo de 80 u, 6,5 passos por segundo) | 296x259 |
| Andar (tronco) | 12 | igual ao das pernas | 296x259 |
| Ataque | 8 | 630 ms (70, 90, 40, 40, 110, 80, 90 e 110) | 420x380 |
| Dano | 4 | 410 ms (70, 110, 110 e 120) | 296x259 |
| Morte (uma linha só, sempre de frente) | 12 | 1390 ms (100, 80, 100, 90, 80, 70, 60, 120, 120, 120, 150 e 300) | 600x400 |

- O quadro do andar depende da **distância andada**, e não do tempo: ao parar (depois de 120 ms), ou ao empurrar a parede, as pernas voltam ao quadro parado. Com "reduzir movimento" no sistema, o andar fica parado.
- O personagem é desenhado em **duas camadas**: as pernas (`pernas.png`) atrás e o tronco (`andar.png` ou `ataque.png`) na frente. Por isso as pernas continuam andando durante o golpe.
- O tronco (cabeça, corpo, braço e bastão) vem do original, sem as pernas; no andar ele dá um quique por passo (7 px de lado, 9 px de frente e de costas) e o bastão balança com atraso. De lado, o pé apoiado anda para trás em linha reta, como o chão passando, e o outro volta pelo ar; de frente e de costas, um pé fica no chão e o outro sobe. De frente e de costas o jogo ainda inclina o corpo até 3° a cada passo (`WALK_TILT_DEGREES` em `player.js`). As pernas foram desenhadas por código com o mesmo material do tronco (grade de 3 px, tom, grão e contorno de 9 px): o rosto e a paleta não mudam.
- O ataque, o dano e a morte vêm da pesquisa de sprites e têm os pixels do original (o ataque sem as pernas e o último quadro do dano com a pose parada nova). A morte gira o corpo; o último quadro, deitado, é uma rotação exata de 90°.

**Ataque**

- O golpe **deixa o personagem um pouco mais lento** (80% da velocidade, `ATTACK_MOVE_SPEED`) e não é cortado: dura 630 ms inteiros.
- A área do golpe só acerta nos quadros 2 a 4 (de 160 a 350 ms).
- O cooldown é de 430 ms, contado do **início** do golpe. Como o golpe (630 ms) é mais longo que o cooldown, **a cadência real é de 630 ms** (cerca de 1,6 golpe por segundo); o cooldown só limitaria algo se o golpe ficasse mais curto.
- Trocar de seta no meio do golpe só vale no golpe seguinte.

**Dano**

- `hurtPlayer` (em `player.js`) cuida da animação: o dano interrompe o golpe, trava o personagem por 410 ms e liga 1000 ms de invencibilidade. A prioridade é morte > dano > ataque > andar. Quem tira a vida é a run (`run.js`, veja "Vida e morte"). Por enquanto só a chapa quente dispara o dano; os inimigos ficam para outras issues.

Valores para calibrar: `PLAYER_FEET_BOX`, `ROOM_WALLS`, `ATTACK_HITBOXES`, o cooldown e a invencibilidade (`player.js`). Não há biblioteca de jogo.

## API

`src/services/api.js` centraliza o endereço (`API_URL`) e a função `apiRequest`, que usa `fetch` e lança um erro com a mensagem e o status da API quando algo falha:

```js
const { characters } = await apiRequest("/api/characters");
```

A seleção de personagem usa `/api/characters`, o jogo lê e salva `/api/progress` e envia o fim da run em `POST /api/runs`, e a tela de ranking lê `/api/ranking`. O navegador só conversa com a API; o banco nunca é acessado direto do front-end.

## Pendências

- Fazer a sala inicial usar o personagem escolhido na seleção (hoje ela sempre desenha o Tung Tung Sahur) e implementar as funcionalidades de ranking e perfil, que ainda são provisórias.
- Cadastro, login e sessão dependem das issues de autenticação (veja o README da TBOTT_api).
- Antes da primeira chamada à API, a TBOTT_api precisa liberar o CORS para o endereço do front-end. O pacote `cors` está instalado lá, mas ainda não é usado em `src/app.js`.
- Em celular e tablet sem teclado não há como avançar, porque a Issue #6 pede uma tecla. Definir se o toque também deve avançar.
- Andares e salas: minimapa; inimigos, itens e chefe (a vida já existe, mas só a chapa quente a tira); trancas das portas com garfo e grão (hoje todas abertas); a função de cada sala especial (comprar, pacto, prato da mamãe, sorteio do fliperama, ondas do palco e dormir na rede); a animação do aviso de morte e o que fazer depois dela (hoje o aviso leva ao menu).
- Os sprites dos outros dois personagens e os atributos entram quando forem definidos. Falta preencher o `sprite_path` do Tung Tung Sahur na TBOTT_api (a imagem reservada é `/sprites/characters/tung-tung-sahur.png`).
