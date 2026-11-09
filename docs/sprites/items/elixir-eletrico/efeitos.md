# Efeitos: Elixir Elétrico

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** O 3º golpe seguido que acerta um inimigo (sem errar nem levar dano no meio).
- **Efeito principal:** O golpe solta um raio: dano extra 2 no inimigo atingido, e o raio salta para até 2 inimigos a até 120 u, com dano 1 em cada.
- **Efeito secundário ou custo:** Passivo: velocidade ×1,10 e golpe ×0,90 (mais rápido). Libera um personagem (ver `desbloqueio.md`). Sem custo.
- **Duração:** Raio instantâneo (animação de 220 ms). O passivo vale a partida inteira. A contagem zera ao errar um golpe ou levar dano.
- **Efeito visual:** `faisca`: estrela de impacto, 5 raios em zigue-zague e o anel da área (6 quadros, 220 ms), no ponto do impacto; nos inimigos do salto, a mesma folha em escala menor.
- **Sinergias:** Batuta do Maestro: o 4º golpe no ritmo pode ser também o 3º acerto seguido, e os dois disparam juntos. Palitos de Pão: o golpe rápido do 4º ajuda a encadear acertos.
- **Riscos de bug ou de desequilíbrio:** É o item mais forte: o salto pode limpar salas de inimigos pequenos (por isso, no máximo 2 saltos e 120 u). Depende de dano e inimigos, que ainda não existem.
- **Como testar no jogo:** (1) Acertar 3 seguidos: no 3º, raio e salto para até 2 inimigos próximos. (2) Errar ou levar dano: a contagem zera. (3) Medir velocidade 260 → 286 u/s e golpe 630 → 567 ms.
