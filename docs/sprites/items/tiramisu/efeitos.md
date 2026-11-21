# Efeitos: Tiramisu

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Cada golpe que acerta (decisão do Victor, 2026-11-20: os grãos só caem no fim da sala ou pelo Chifre, então o gatilho antigo, pegar um grão, quase nunca aconteceria).
- **Efeito principal:** Açúcar: por 2 s depois de um golpe que acerta, o golpe fica 25% mais rápido e o Tung anda 20% mais rápido (os 20% foram pedidos pelo Victor e ainda não estão no catálogo da API). Cada acerto renova os 2 s: acertando em sequência, fica rápido o tempo todo.
- **Efeito secundário ou custo:** Custo: 4 grãos de café na Loja.
- **Duração:** 2 s depois do último acerto (renova a cada acerto).
- **Efeito visual:** `po-de-cacau`: pó de cacau caindo em volta dos pés, com brilhos dourados (6 quadros em laço, 600 ms), enquanto o açúcar dura.
- **Sinergias:** Elixir Elétrico e Batuta do Maestro: o golpe mais rápido ajuda a manter a sequência e o ritmo. Café Duplo: os dois aceleram, por gatilhos diferentes.
- **Riscos de bug ou de desequilíbrio:** Só a compra depende de grão (Loja, etapa 5). Hoje o golpe dura 630 ms e a espera é de 430 ms: encurtar só a espera não muda nada, então este item mexe na duração do golpe, o que exige acelerar o sprite de ataque.
- **Como testar no jogo:** Comprar com 4 grãos (sem 4, não compra). Acertar o alvo de treino (F3 + T): golpe 630 → 504 ms enquanto continuar acertando; 2 s sem acertar, volta a 630.
