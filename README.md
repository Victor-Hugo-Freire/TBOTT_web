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
| Nova partida                            | `/jogo` | Tela provisória                     |
| Ranking                                 | `/ranking` | Tela provisória                  |
| Opções                                  | `/opcoes` | Tela provisória                   |
| Perfil do usuário                       | `/perfil` | Tela provisória                   |
| Seleção de personagem                   | -       | A fazer                             |
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
    MenuPrincipal/   menu principal e destinos provisórios das opções
  components/        componentes usados por várias telas (CharacterSprite)
  data/              characterSprites.js (arquivo, quadros e direções de cada sprite)
  utils/             keyboard.js (teclas que avançam de tela), menuKeyboard.js (controles do menu) e pixelFont.js (fonte em pixel art)
  services/api.js    endereço da API e função apiRequest
  styles/global.css  cores, fonte e classes usadas por todas as telas
tests/               testes automatizados (node:test)
```

Componentes usados por mais de uma tela ficam em `src/components/` (por exemplo, `CharacterSprite`, que mostra um personagem a partir da folha de sprites). Os dados de cada sprite (arquivo, tamanho do quadro e direções) ficam em `src/data/characterSprites.js`.

Sprites ficam em `public/sprites/characters/` e são acessados por um endereço fixo, como `/sprites/characters/tung-tung-sahur.png`. Esse é o valor que o banco pode guardar em `sprite_path`; a imagem em si nunca vai para o banco.

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

O menu em `/menu` apresenta as opções **Continue**, **New game**, **Ranks** e **Options**, além dos controles de voltar à tela inicial e abrir o perfil do usuário. Como ainda não há salvamento de partidas, **Continue** permanece desabilitado. As opções de jogo, ranking, opções e perfil levam a telas provisórias enquanto as respectivas funcionalidades não são implementadas.

- **W / ↑:** percorre as opções para cima.
- **S / ↓:** percorre as opções para baixo. Ao sair do cartão do usuário ou do botão de voltar, retoma a última opção selecionada.
- **D / →:** seleciona o cartão do usuário.
- **A / ←:** seleciona o botão para voltar à tela inicial.
- **Enter:** ativa a opção ou o controle selecionado.

Também é possível usar o mouse ou outro dispositivo apontador para selecionar e ativar os botões. A lógica de mapeamento das teclas fica em `src/utils/menuKeyboard.js`.

## API

`src/services/api.js` centraliza o endereço (`API_URL`) e a função `apiRequest`, que usa `fetch` e lança um erro com a mensagem e o status da API quando algo falha:

```js
const { characters } = await apiRequest("/api/characters");
```

Nenhuma tela chama a API ainda. O navegador só conversa com a API; o banco nunca é acessado direto do front-end.

## Pendências

- Implementar as telas e funcionalidades de nova partida, ranking, opções e perfil; atualmente são destinos provisórios do menu.
- Cadastro, login e sessão dependem das issues de autenticação (veja o README da TBOTT_api).
- Antes da primeira chamada à API, a TBOTT_api precisa liberar o CORS para o endereço do front-end. O pacote `cors` está instalado lá, mas ainda não é usado em `src/app.js`.
- Em celular e tablet sem teclado não há como avançar, porque a Issue #6 pede uma tecla. Definir se o toque também deve avançar.
- Os sprites dos outros dois personagens e os atributos entram quando forem definidos. A folha do Tung Tung Sahur já está em `public/sprites/characters/tung-tung-sahur.png` (4 direções × 4 quadros); falta preencher o `sprite_path` dele na TBOTT_api.
