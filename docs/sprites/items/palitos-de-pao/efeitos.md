# Efeitos: Palitos de Pão

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** A cada 4º golpe (acertando ou não).
- **Efeito principal:** Crocante: o 4º golpe sai 40% mais rápido (630 → 378 ms) e solta um estalo que empurra os inimigos a até 60 u.
- **Efeito secundário ou custo:** Sem custo.
- **Duração:** Só aquele golpe; a contagem recomeça.
- **Efeito visual:** `estalo`: anel curto e farelos de pão espalhando (5 quadros, 300 ms), em volta do Tung.
- **Sinergias:** Elixir Elétrico e Batuta do Maestro: o golpe rápido ajuda a encadear acertos e ritmo. Dente de Tubarão: soma com o frenesi.
- **Riscos de bug ou de desequilíbrio:** Hoje o golpe dura 630 ms e a espera é de 430 ms: encurtar só a espera não muda nada, então este item mexe na duração do golpe, o que exige acelerar o sprite de ataque. O empurrão depende de colisão de inimigos.
- **Como testar no jogo:** Contar 4 golpes: o 4º dura ~378 ms e mostra o estalo; o 5º volta a 630 ms.
