# Efeitos: Café Duplo

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Levar dano.
- **Efeito principal:** Cafeína: por 3 s depois de levar dano, anda 40% mais rápido, para fugir.
- **Efeito secundário ou custo:** Passivo: velocidade ×1,05. Sem custo.
- **Duração:** 3 s depois de cada dano (não acumula; renova).
- **Efeito visual:** `vapor-de-cafe`: baforadas de vapor marrom saindo dos pés enquanto a cafeína dura (5 quadros em laço, 450 ms).
- **Sinergias:** Tiramisu: os dois aceleram, por gatilhos diferentes (dano e grão), e não se anulam.
- **Riscos de bug ou de desequilíbrio:** A corrida coincide com a invencibilidade de 1000 ms: dá para atravessar inimigos. Depende de dano.
- **Como testar no jogo:** Levar dano: medir 260 → 382 u/s por 3 s, depois 273 u/s.
