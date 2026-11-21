# Créditos

## Arquivos de terceiros

Não há. Nenhuma imagem, fonte ou som de terceiros foi usado nos sprites de `public/sprites/` (exceto `characters/`, que não faz parte deste índice): todos foram desenhados por código pela equipe (`pesquisa-issue-16-sprites/_novo/`).

## Sistema de áudio

O sistema central implementado na Issue #35 utiliza a Web Audio API nativa dos navegadores.

### Avaliação prática de ZzFX/ZzFXM

Em 21/11/2026 foi realizada uma avaliação técnica e prática do ZzFX/ZzFXM sem incorporá-los ao projeto:

- foi consultado o pacote público `zzfx@1.4.0` no npm e foi feito `npm pack` em ambiente temporário para verificar arquivos, metadados e licença;
- foi registrada a licença MIT do ZzFX, com copyright de Frank Force (2019), em `../../THIRD_PARTY_LICENSES.md`;
- foi consultada a implementação pública do ZzFXM v2.0.4, cujo repositório declara licença MIT e copyright de Keith Clark (2020), também registrada em `../../THIRD_PARTY_LICENSES.md`;
- foram executados os testes específicos da implementação atual: `tests/audioManager.test.js` e `tests/audioUnlock.test.js`, com 20 testes aprovados e nenhuma falha;
- a avaliação verificou integração, limitações e licenças, mas não realizou uma sessão auditiva comparativa nem um benchmark perceptual no navegador.

ZzFX oferece síntese compacta de efeitos por parâmetros e ZzFXM adiciona uma faixa de música baseada nesses instrumentos. Porém, os testes práticos disponíveis neste projeto confirmaram que a Web Audio API já atende a criação de um contexto único, desbloqueio por interação, volumes separados, mute, cooldown, limite de vozes e troca/fade de música. A adoção das bibliotecas exigiria integrar APIs próprias e dependências adicionais sem efeitos específicos ou faixas atuais que justifiquem essa camada.

A Web Audio API nativa foi escolhida por permitir controle direto dos nós e grupos de ganho, volumes independentes, mute, interrupção de fontes e desbloqueio pelo navegador. ZzFX/ZzFXM não foram incorporados nem utilizados como código ou dependência no projeto; o registro acima apenas documenta a avaliação e suas licenças MIT.

Fontes consultadas:

- ZzFX: https://github.com/KilledByAPixel/ZzFX
- ZzFXM: https://github.com/KilledByAPixel/ZzFXM
- Licença do ZzFX: https://raw.githubusercontent.com/KilledByAPixel/ZzFX/master/LICENSE
- Licença do ZzFXM: https://raw.githubusercontent.com/KilledByAPixel/ZzFXM/master/LICENSE

## Personagens inspirados em memes

Segundo o relatório da arte (seção 9), os desenhos são interpretações próprias, mas o nome e a ideia de seis chefes vêm de memes de "brainrot italiano" criados por terceiros:

- Chimpanzini Bananini
- Ballerina Cappuccina
- Bombardiro Crocodilo
- Brr Brr Patapim (redesenhado a partir de uma imagem de referência, só como guia de proporções)
- Cappuccino Assassino
- Tralalero Tralala

O Cinquecento Turbo, a Nonna Lasagnona, os 10 inimigos e os itens são originais do projeto. A equipe ainda deve decidir se usa esses nomes e conceitos no trabalho entregue.
