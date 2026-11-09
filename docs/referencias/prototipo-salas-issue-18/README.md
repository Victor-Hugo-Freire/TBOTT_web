# Protótipo das salas (issue #18), só referência

Cópia da rodada 5 (2026-11-08) do protótipo feito na pesquisa da issue #18. Ele desenha em canvas os 5 andares, as 9 salas especiais, a Sala do Chefe em luta e as pranchas de portas, minimapa, obstáculos, sala secreta, coletáveis e barra do chefe.

**Não faz parte do jogo.** Não é servido pelo Vite (está fora de `public/`) e nenhuma tela importa estes scripts. Serve para olhar e copiar ideias (cores, medidas, ordem de desenho) quando as salas forem implementadas em `src/pages/SalaInicial/scene/`.

## Como abrir

Os sprites já vêm embutidos nos `.js` (em base64), então a pasta funciona sozinha:

```bash
cd docs/referencias/prototipo-salas-issue-18
python -m http.server 8765
```

Abra `http://localhost:8765` e espere carregar. O botão "Baixar todos (PNG)" exporta cada sala em 1440×1024.

## Arquivos

- `index.html`: página com um cartão por sala e por prancha.
- `lib.js`: funções de desenho em canvas, sem imagens (paredes, piso, portas e enfeites, ícones do minimapa, obstáculos).
- `salas.js`: as 5 salas comuns, as 9 especiais e as pranchas (portas, secreta, minimapa, obstáculos, coletáveis, barra do chefe).
- `hud.js`: barra de vida do chefe, texto na fonte de pixels e pedestal com item.
- `fonte.js`: fonte de pixels do jogo (sem acento, `+` nem `%`).
- `sprite.js`, `chefe-sprite.js`, `itens-sprites.js`: imagens embutidas (Tung Tung de frente, Cinquecento Turbo, pedestais, itens, garfo e grão).
- `NOTAS.md`: histórico das rodadas e decisões (cópia sem mudanças; cita caminhos da pasta original).

Não vieram: a pasta `png/` (22 MB de exportações, que o botão acima gera de novo), `gerar-sprites.py` (lê a pasta da arte, fora deste repositório) e as versões antigas.

## Regras de design já decididas

- Sem placa com o nome do andar e sem placas de texto na parede.
- Sala especial é beco sem saída: liga a uma vizinha comum só, inclusive no minimapa.
- A sala secreta não dá pista no minimapa nem por som.
