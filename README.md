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
| Sala inicial / nova partida             | `/jogo` | Protótipo implementado (Issue #10)   |
| Ranking                                 | `/ranking` | Tela provisória                  |
| Opções                                  | `/opcoes` | Tela provisória                   |
| Perfil do usuário                       | `/perfil` | Tela provisória                   |
| Seleção de personagem                   | `/selecao-personagem` | Tela provisória (leva ao jogo) |
| Cadastro e login                        | -       | A fazer                             |
| Jogo (combate, salas, inimigos e itens) | -       | A fazer                             |
| Vitória e derrota                       | -       | A fazer                             |

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
    Opcoes/          tela de opções (ainda sem configurações)
    SalaInicial/     sala inicial em canvas; scene/ desenha a sala, o personagem, a sombra e o debug
  components/        componentes usados por várias telas (CharacterSprite)
  data/              characterSprites.js (arquivo, quadros e direções de cada sprite)
  utils/             keyboard.js (teclas que avançam de tela), menuKeyboard.js (controles do menu), roomMovement.js (teclas, movimentação e paredes da sala), collision.js (colisão por retângulos), player.js (estado do personagem: andar, ataque e dano), spriteAnimation.js (quadro de cada animação) e pixelFont.js (fonte em pixel art)
  services/api.js    endereço da API e função apiRequest
  styles/global.css  cores, fonte e classes usadas por todas as telas
tests/               testes automatizados (node:test)
```

Componentes ficam em `src/components/`, cada um em sua pasta com o CSS (por exemplo, `CharacterSprite`, que mostra um personagem a partir da folha de sprites, e `CardUsuario`, o cartão com avatar e nome do menu principal). Os dados de cada sprite (arquivo, tamanho do quadro e direções) ficam em `src/data/characterSprites.js`.

Sprites ficam em `public/sprites/characters/` e são acessados por um endereço fixo, como `/sprites/characters/tung-tung-sahur.png`. Esse é o valor que o banco pode guardar em `sprite_path`; a imagem em si nunca vai para o banco. As folhas de andar, ataque e dano do Tung Tung Sahur ficam em `public/sprites/characters/tung-tung-sahur/`; o original `tung-tung-sahur.png` não é alterado.

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

O menu em `/menu` apresenta as opções **Continue**, **New game**, **Ranks** e **Options**, além dos controles de voltar à tela inicial e abrir o perfil do usuário. Como ainda não há salvamento de partidas, **Continue** permanece desabilitado. **New game** leva à seleção de personagem, tela provisória que tem o botão para começar a partida. Ranking e perfil levam a telas provisórias; **Options** abre a tela de opções, que ainda não tem configurações.

- **W:** percorre as opções para cima.
- **S:** percorre as opções para baixo. Ao sair do cartão do usuário ou do botão de voltar, retoma a última opção selecionada.
- **D:** seleciona o cartão do usuário.
- **A:** seleciona o botão para voltar à tela inicial.
- **Enter:** ativa a opção ou o controle selecionado.

Na sala, as setas atacam (veja a seção Sala inicial).

Também é possível usar o mouse ou outro dispositivo apontador para selecionar e ativar os botões. A lógica de mapeamento das teclas fica em `src/utils/menuKeyboard.js`.

## Sala inicial

Depois da seleção de personagem, `/jogo` mostra a sala de madeira e o personagem. Como a tela de seleção ainda não foi implementada, o protótipo usa o Tung Tung Sahur, único personagem com sprite disponível.

**Controles**

- **W**, **A**, **S** e **D** movem o personagem; segurar uma tecla mantém o movimento e as diagonais são aceitas (a velocidade não aumenta). As teclas valem pela posição física (`event.code`), em qualquer layout de teclado.
- **Setas** atacam com o bastão na direção da seta. Segurar repete o golpe; com duas setas apertadas, vale a última pressionada.
- **Esc:** retorna provisoriamente ao menu principal.
- **F3** (só em `npm run dev`): mostra as paredes, a caixa dos pés e a área do golpe. Não existe no build.

**Como funciona**

- **Canvas em tela cheia** (`SalaInicial.jsx` e `scene/`). A sala (1080x768 unidades) é desenhada por código, com escala uniforme (*contain*) e faixa na cor de fundo do jogo; nada é distorcido nem cortado. O canvas usa `devicePixelRatio`, e o personagem é desenhado com suavização alta, porque aparece reduzido. O jogo roda em `requestAnimationFrame`, sem renderizar o React a cada quadro.
- **Imagem de referência:** `docs/referencias/sala-inicial-vazia.png` serve só de referência de arte (as cores e as faixas foram medidas nela). Não é carregada pelo jogo nem entra no pacote.
- **Colisão** (`src/utils/collision.js`): retângulos. O personagem tem uma caixa de 44x18 u nos pés; as paredes (`ROOM_WALLS`) são retângulos. O movimento é resolvido no eixo X e depois no Y, com encaixe exato: o personagem desliza na parede e não treme. Os pés ficam em x de 25 a 1050 e y de 261 a 656. A mesma função serve depois para inimigos, portas e golpes.
- **Sombra:** elipse de 52x14 u sob os pés (`drawShadow.js`), só visual, fora da colisão.
- **Pés como referência:** a posição do personagem é o centro dos pés, e toda folha é desenhada a partir do ponto dos pés, então trocar de animação não faz o personagem "pular".

**Animações** (`src/data/characterSprites.js`)

| Animação | Quadros por direção | Tempo | Quadro |
| --- | --- | --- | --- |
| Andar | 4 | 1 quadro a cada 32,5 u andadas | 296x259 |
| Ataque | 8 | 630 ms (70, 90, 40, 40, 110, 80, 90 e 110) | 420x380 |
| Dano | 4 | 410 ms (70, 110, 110 e 120) | 296x259 |

- O quadro do andar depende da **distância andada**, e não do tempo: ao parar, ou ao empurrar a parede, volta ao quadro 0. Com "reduzir movimento" no sistema, o andar fica no quadro 0.
- Os quadros de pernas trocadas do andar foram gerados do original por recorte e espelho, sem desenhar nada novo: o rosto e a paleta não mudam.
- O ataque e o dano vêm da pesquisa de sprites e têm os pixels do original.

**Ataque**

- O golpe **trava o movimento** e não é cortado: dura 630 ms inteiros.
- A área do golpe só acerta nos quadros 2 a 4 (de 160 a 350 ms).
- O cooldown é de 430 ms, contado do **início** do golpe. Como o golpe (630 ms) é mais longo que o cooldown, **a cadência real é de 630 ms** (cerca de 1,6 golpe por segundo); o cooldown só limitaria algo se o golpe ficasse mais curto.
- Trocar de seta no meio do golpe só vale no golpe seguinte.

**Dano**

- Só existe o estado (`hurtPlayer` em `player.js`): o dano interrompe o golpe, trava o personagem por 410 ms e liga 1000 ms de invencibilidade. A prioridade é dano > ataque > andar. Nada dispara o dano no jogo ainda; isso fica para a issue de inimigos.

Valores para calibrar: a caixa dos pés (`PLAYER_FEET_BOX`), as paredes (`ROOM_WALLS`), a área do golpe (`ATTACK_HITBOXES`), o cooldown e a invencibilidade (`player.js`) e a sombra (`SHADOW`). A movimentação não requer biblioteca de jogo adicional.

## API

`src/services/api.js` centraliza o endereço (`API_URL`) e a função `apiRequest`, que usa `fetch` e lança um erro com a mensagem e o status da API quando algo falha:

```js
const { characters } = await apiRequest("/api/characters");
```

Nenhuma tela chama a API ainda. O navegador só conversa com a API; o banco nunca é acessado direto do front-end.

## Pendências

- Integrar a seleção de personagem à sala inicial e implementar as funcionalidades de ranking e perfil, que ainda são provisórias.
- Cadastro, login e sessão dependem das issues de autenticação (veja o README da TBOTT_api).
- Antes da primeira chamada à API, a TBOTT_api precisa liberar o CORS para o endereço do front-end. O pacote `cors` está instalado lá, mas ainda não é usado em `src/app.js`.
- Em celular e tablet sem teclado não há como avançar, porque a Issue #6 pede uma tecla. Definir se o toque também deve avançar.
- Os sprites dos outros dois personagens e os atributos entram quando forem definidos. A folha do Tung Tung Sahur já está em `public/sprites/characters/tung-tung-sahur.png` (4 direções × 4 quadros); falta preencher o `sprite_path` dele na TBOTT_api.
