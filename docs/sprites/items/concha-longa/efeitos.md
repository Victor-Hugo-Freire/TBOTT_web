# Efeitos: Concha Longa

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Cada golpe (acertando ou não).
- **Efeito principal:** Respingo de molho: o golpe deixa uma poça de molho por 2 s; inimigos dentro dela andam 50% mais devagar.
- **Efeito secundário ou custo:** Área do golpe ×1,15. Sem custo.
- **Duração:** Cada poça dura 2 s (no máximo 3 ao mesmo tempo).
- **Efeito visual:** `poca-de-molho`: poça vermelha que cresce, com bolhas e manjericão (4 quadros, 480 ms).
- **Sinergias:** Muçarela: inimigo lento na poça e preso pelos fios fica parado mais tempo. Batuta do Maestro: com o inimigo lento, fica mais fácil manter o ritmo.
- **Riscos de bug ou de desequilíbrio:** O manjericão separa esta poça do molho da Polpetta. Depende de lentidão (ainda não existe).
- **Como testar no jogo:** Golpear o chão 4 vezes: só 3 poças ficam. Inimigo de teste anda metade da velocidade dentro da poça.
