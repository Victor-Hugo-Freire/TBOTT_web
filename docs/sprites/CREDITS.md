# Créditos

## Arquivos de terceiros

Não há. Nenhuma imagem, fonte ou som de terceiros foi usado nos sprites de `public/sprites/` (exceto `characters/`, que não faz parte deste índice): todos foram desenhados por código pela equipe (`pesquisa-issue-16-sprites/_novo/`).

## Sistema de áudio

O sistema central implementado na Issue #35 utiliza apenas a Web Audio API nativa dos navegadores.

ZzFX e ZzFXM foram considerados, mas não há registro neste projeto de uma avaliação prática com testes comparativos, benchmark ou protótipo sonoro. Portanto, não foram atribuídos resultados que não tenham sido realizados. Como bibliotecas de síntese e padrões prontos, ZzFX/ZzFXM poderiam reduzir código para certos efeitos e oferecer conveniência; em contrapartida, adicionariam dependências ou integrações adicionais e abstrações próprias sobre o áudio.

A Web Audio API nativa foi escolhida por permitir controle direto de nós, grupos de ganho, volumes de música e efeitos, mute, interrupção de fontes e desbloqueio pelo navegador sem novas dependências. Sua principal desvantagem é exigir mais infraestrutura no gerenciador. Neste projeto essa infraestrutura permaneceu concentrada em uma única implementação e o requisito não pediu músicas ou efeitos específicos, por isso os ganhos esperados das bibliotecas não justificaram sua inclusão sem uma avaliação prática registrada.

ZzFX e ZzFXM não foram incorporados nem utilizados como código ou dependência. Portanto, não há atribuição ou licença adicional a registrar para essas bibliotecas.

## Personagens inspirados em memes

Segundo o relatório da arte (seção 9), os desenhos são interpretações próprias, mas o nome e a ideia de seis chefes vêm de memes de "brainrot italiano" criados por terceiros:

- Chimpanzini Bananini
- Ballerina Cappuccina
- Bombardiro Crocodilo
- Brr Brr Patapim (redesenhado a partir de uma imagem de referência, só como guia de proporções)
- Cappuccino Assassino
- Tralalero Tralala

O Cinquecento Turbo, a Nonna Lasagnona, os 10 inimigos e os itens são originais do projeto. A equipe ainda deve decidir se usa esses nomes e conceitos no trabalho entregue.
