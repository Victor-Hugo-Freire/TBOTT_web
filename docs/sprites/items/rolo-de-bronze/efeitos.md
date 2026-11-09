# Efeitos: Rolo de Bronze

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Cada golpe que acerta; e o inimigo bater numa parede ou obstáculo.
- **Efeito principal:** Achatador: o golpe empurra o inimigo com força (120 u); se ele bater numa parede ou obstáculo, leva dano extra 2.
- **Efeito secundário ou custo:** Com um chefe na sala, o golpe causa +1 de dano. Sem custo.
- **Duração:** Instantâneo.
- **Efeito visual:** `impacto-de-bronze`: onda de choque cor de bronze no chão e lascas pulando, onde o inimigo bate (5 quadros, 350 ms).
- **Sinergias:** Parmesão Curado: as lascas alcançam o inimigo empurrado. Dente de Tubarão: o dano da parede deixa o inimigo ferido.
- **Riscos de bug ou de desequilíbrio:** Empurrar pode jogar inimigos para longe e alongar a sala. Depende de dano, empurrão e colisão de inimigos.
- **Como testar no jogo:** Golpear um inimigo perto da parede: ele bate e leva +2; longe dela: só o empurrão.
