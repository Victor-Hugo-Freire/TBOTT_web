# Efeitos: Dente de Tubarão

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Cada abate; e cada golpe num inimigo com metade da vida ou menos.
- **Efeito principal:** Frenesi: cada abate deixa o golpe 15% mais rápido por 4 s (acumula até 3 vezes, 45%). Golpes em inimigos com metade da vida ou menos causam dano dobrado.
- **Efeito secundário ou custo:** Custo: −1 de vida máxima, para sempre na partida. Não dá para pegar com 1 coração só.
- **Duração:** Frenesi: 4 s, renovado a cada abate. O resto vale a partida inteira.
- **Efeito visual:** `mordida`: mandíbula de dentes que se fecha sobre o inimigo ferido (5 quadros, 300 ms), no ponto do golpe.
- **Sinergias:** Rolo de Bronze: o dano da parede deixa o inimigo ferido mais rápido. Palitos de Pão: o frenesi soma com o golpe rápido do 4º.
- **Riscos de bug ou de desequilíbrio:** Com 3 cargas o golpe fica em ~350 ms; precisa desse limite. O custo pesa no fim do jogo. Depende de dano, vida e abates (ainda não existem).
- **Como testar no jogo:** Com 3 corações, pegar: ficam 2. Matar 3 inimigos seguidos: golpe 630 → ~350 ms; esperar 4 s: volta a 630. Com 1 coração, o pedestal não deixa pegar.
