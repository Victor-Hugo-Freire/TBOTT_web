# Efeitos: Muçarela

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Cada golpe que acerta.
- **Efeito principal:** Puxa-puxa: fios de queijo prendem o inimigo atingido por 0,8 s (ele não anda nem ataca).
- **Efeito secundário ou custo:** +1 de vida máxima. Sem custo.
- **Duração:** 0,8 s por golpe; o mesmo inimigo só pode ser preso de novo depois de 2 s (nos chefes, 0,3 s).
- **Efeito visual:** `fios-de-queijo`: fios brancos esticando do golpe até o inimigo e arrebentando (5 quadros, 400 ms).
- **Sinergias:** Concha Longa: inimigo preso dentro da poça. Dente de Tubarão: preso, ele leva as mordidas de ferido.
- **Riscos de bug ou de desequilíbrio:** Prender chefes deixaria a luta fácil, por isso 0,3 s neles. Depende de vida e de inimigos.
- **Como testar no jogo:** Acertar um inimigo de teste: ele para por 0,8 s; acertar de novo em menos de 2 s: não prende.
