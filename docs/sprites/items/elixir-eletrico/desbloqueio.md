# Desbloqueio: Elixir Elétrico

Tudo aqui é proposta. **O personagem liberado fica "a definir pelo Victor"**: não foi desenhado e não existe no jogo nem no banco.

## Situação de hoje
- O README do TBOTT_web fala em **três** personagens jogáveis; só o Tung Tung Sahur existe (seed `characters` e sprites).
- A tabela `characters` da API é um catálogo público. **Não existe** tabela de desbloqueios por jogador, nem item, nem moeda. Este documento não propõe mudança na API.
- Não existem no jogo: coleta de item, a Adega Secreta, a tela de seleção com bloqueio.

## Qual personagem libera (a definir)
| opção | o que é | custo |
|---|---|---|
| A | o segundo personagem previsto no README (ainda sem nome) | precisa de nome, sprites e atributos |
| B | uma variante do Tung Tung, sem personagem novo | o Tung não pode ser redesenhado: só recorte e camadas |
| C | deixar o desbloqueio pronto no jogo e ligar o personagem depois | menor risco para o prazo |

Recomendação para 2/12: **C**, e escolher A ou B quando a equipe decidir.

## Em que momento libera
| opção | momento | observação |
|---|---|---|
| a | ao pegar o item | a mais simples |
| b | ao vencer o chefe do andar com o item | depende da luta de chefe |
| c | ao concluir a partida com o item | depende de o jogo ter fim |

Recomendação: **a** para a fatia jogável; **b** depois, se a equipe quiser mais desafio.

## O que precisa ser guardado
Que o jogador liberou o personagem, e quando. **Hoje não há onde guardar isso no servidor**; a decisão é da equipe e conversa com o salvamento (#10 e #34). Guardar só no navegador vale como provisório.

## Do que depende
A Adega Secreta existir (geração do mapa, #19 a #21), coleta de item e pedestal, tela de seleção com personagem bloqueado e o salvamento.
