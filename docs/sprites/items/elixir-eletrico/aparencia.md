# Aparência no Tung Tung: Elixir Elétrico

**Decisão ainda não tomada.** A escolha é do Victor. A recomendação é que a primeira versão **não** mude a aparência do personagem.

O estudo completo, com todos os itens visíveis, as âncoras medidas no original e o custo, está em
`../../_comum/aparencia/aparencia.md`. Este arquivo resume o que vale para o Elixir.

## O que a foto mostra
- Garrafa PET preta de 1 litro, comprida e estreita.
- Tampa preta, rótulo magenta com um alienígena e um raio amarelo, base de pés.
- No ícone do TBOTT ela tem 14×37 pixels da grade, quase a altura da cabeça do Tung.

## Onde ela fica no Tung (2026-11-08)
- **Slot costas**, como camada separada. O Tung não é redesenhado.
- A garrafa foi desenhada de novo, menor, com **6×14 pixels da grade**. Ficaram a faixa magenta e o raio; o alienígena não cabe nesse tamanho.
- **Na mão: descartado.** No tamanho do ícone, a garrafa cobre o olho e o braço. De lado, uma versão pequena junto da mão do bastão parece estar sendo segurada.

| direção | como fica |
|---|---|
| frente | **não aparece**: a cabeça esconde as costas |
| esquerda / direita | inclinada atrás da cabeça, metade para fora da silhueta, acima do bastão |
| costas | em pé no meio das costas, na frente do corpo |

**Mockups:**
- `../../_comum/aparencia/previas/mockup-elixir-eletrico.png` (4 direções);
- `mockup-elixir-eletrico-4x.png`;
- `escala-da-sala.png` (última coluna).

**Camadas:** `../../_comum/aparencia/sprites/elixir-eletrico_<direção>.png`.

## Avaliação (vista em imagem)
- **A 1× e a 4×:** lê como garrafa (rótulo magenta e raio). Não cobre rosto, olhos nem bastão.
- **Na escala da sala (0,4×):** vira um ponto magenta. É o item que **pior** se lê entre os 5 mockups.
- **Conflito:** a Concha Longa também usa o slot costas. Pela regra de prioridade (raridade, depois o mais recente), o Elixir (raro) fica visível.

## Custo, se for feito
- **Desenhos:** 3 (lado, costas e o lado espelhado). A frente fica vazia.
- **Posição:** segue o deslocamento da cabeça, que já está medido em `ancoras.json`: 48 quadros do andar e 32 do ataque.
- **Dano:** esconder durante o dano (o Tung pisca branco e vermelho e a camada destoaria).
- **Quadros novos do Tung:** **0**.

## Recomendação
1. **Versão 1: sem mudar a aparência.** O Elixir já aparece no pedestal, na coleta, no HUD e na faísca.
2. **Versão 2:** a garrafinha nas costas, como no mockup, se o Victor aceitar que de frente ela não aparece.
3. **Ideia, não desenhada:** se a intenção é mostrar que o jogador tem o item raro, uma aura de faíscas nos pés leria melhor no tamanho real.
