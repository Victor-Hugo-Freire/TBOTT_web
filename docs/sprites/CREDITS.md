# Créditos

## Arquivos de terceiros

Não há. Nenhuma imagem, fonte ou som de terceiros foi usado nos sprites de `public/sprites/` (exceto `characters/`, que não faz parte deste índice): todos foram desenhados por código(`pesquisa-issue-16-sprites/_novo/`).

## Fonte das descrições dos itens

O jogo usa uma fonte de terceiros: a **Pixelify Sans** (Copyright 2021 The Pixelify Sans Project Authors, https://github.com/eifetx/Pixelify-Sans), sob a SIL Open Font License 1.1. O arquivo está em `public/fonts/PixelifySans.ttf` e a licença ao lado, em `public/fonts/PixelifySans-OFL.txt`. Ela é a fonte de todas as telas (`src/styles/global.css`, só no peso 400) e também da frase do banner e da caixa de descrição dos itens no canvas, que precisam de letras minúsculas e acentos (a fonte em pixel do jogo, `src/utils/pixelFont.js`, só tem maiúsculas sem acento). Foi baixada do repositório google/fonts em 2026-11-20.

## Sistema de áudio

O sistema central implementado na Issue #35 usa a Web Audio API nativa por meio de um único `AudioManager`, responsável pelo contexto, desbloqueio, ganhos de efeitos/música, mute, vozes e limpeza de recursos.

### Avaliação prática de ZzFX/ZzFXM

Em 21/11/2026 foram realizadas uma investigação técnica e uma integração experimental controlada.

**Versões e fontes oficiais confirmadas**

- ZzFX `1.4.0`, por Frank Force: https://github.com/KilledByAPixel/ZzFX
- ZzFXM `v2.0.3`, por Keith Clark: https://github.com/keithclark/ZzFXM
- Licença MIT do ZzFX: https://raw.githubusercontent.com/KilledByAPixel/ZzFX/master/LICENSE
- Licença MIT do ZzFXM: https://raw.githubusercontent.com/keithclark/ZzFXM/v2.0.3/LICENSE

ZzFXM não é identificado como pacote npm oficial e não utiliza o fork `KilledByAPixel/ZzFXM` como fonte original. A demonstração usa o formato e os conceitos da versão original `v2.0.3` e não incorpora arquivos de reprodução que criem um contexto próprio.

**Experimento implementado**

A página `/__experimentos/zzfx` existe somente em `npm run dev`, fora do menu e das rotas protegidas. Ela permite repetir Ataque, Dano, Coleta e Interface, ajustar frequência/release/volume e comparar parâmetros originais e ajustados. Também reproduz uma sequência curta experimental de ZzFXM.

A geração usa dois adaptadores puros em `src/audio/zzfxExperimental.js` e `src/audio/zzfxmExperimental.js`: ZzFX gera `Float32Array` sem tocar diretamente; ZzFXM gera os canais esquerdo/direito e os adaptadores convertem todos os samples em `AudioBuffer` no contexto fornecido pelo `AudioManager`. Nenhum adaptador chama `new AudioContext`, `zzfx()`, `zzfxP()` ou uma API equivalente de reprodução própria.

**Resultados técnicos verificados**

- ZzFX `1.4.0` possui `ZZFX.buildSamples(...)` e gera `Float32Array` sem reproduzir; o pacote completo cria um `AudioContext` na inicialização de sua variante completa, mas o experimento não importa essa variante em runtime.
- ZzFXM usa o formato oficial de instrumentos, padrões e sequência e gera dois canais de samples finitos.
- Os efeitos experimentais têm durações, formas e parâmetros diferentes.
- Os testes específicos geraram, validaram e converteram efeitos e música no contexto fornecido pelo gerenciador.
- A página usa os ganhos de efeitos/música, mute e desbloqueio já existentes.
- O teste auditivo humano ainda não foi realizado pela pessoa que implementa e não é possível afirmar subjetivamente qualidade sonora sem ouvi-la.

**Limitações e decisões**

ZzFX pode ser integrado com samples próprios, mas requer o uso de `ZZFX.buildSamples(...)` para não reproduzir num contexto separado. ZzFXM não possui integração npm estável reconhecida e usa uma API baseada em arquivos JavaScript globais na origem oficial; por isso o experimento adapta o formato v2.0.3 em vez de carregar `zzfxP()`, `zzfxX` ou outro mecanismo que criaria seu próprio contexto.

ZzFX e ZzFXM não são adotados definitivamente pelo jogo normal. A infraestrutura só fica disponível pela página experimental em desenvolvimento. Os testes preexistentes do `AudioManager` continuam separados da avaliação técnica das bibliotecas e não são usados como evidência de qualidade subjetiva.

**Licenciamento**

O ZzFX é licenciado MIT por Frank Force (Copyright 2019). O ZzFXM é licenciado MIT por Keith Clark (Copyright 2020). Os textos integrais estão em `../../THIRD_PARTY_LICENSES.md`. Como nenhuma versão foi incorporada ao bundle de produção, o arquivo apenas registra a avaliação e as atribuições; se o código MIT adaptado for incorporado definitivamente, os avisos completos também deverão permanecer no pacote distribuído.

**Procedimento de avaliação humana pendente**

Abra `http://localhost:5173/__experimentos/zzfx` com `npm run dev`. Compare Ataque, Dano e Coleta repetidamente, ajuste cada parâmetro e registre volume percebido, clareza, contraste, adequação ao TBOTT e tempo de ajuste. Teste mute, cada volume e reprodução da música ZzFXM. As conclusões subjetivas não foram preenchidas automaticamente por esta implementação.

## Personagens inspirados em memes

Segundo o relatório da arte (seção 9), os desenhos são interpretações próprias, mas o nome e a ideia de seis chefes vêm de memes de "brainrot italiano" criados por terceiros:

- Chimpanzini Bananini
- Ballerina Cappuccina
- Bombardiro Crocodilo
- Brr Brr Patapim (redesenhado a partir de uma imagem de referência, só como guia de proporções)
- Cappuccino Assassino
- Tralalero Tralala

O Cinquecento Turbo, a Nonna Lasagnona, os 10 inimigos e os itens são originais do projeto.