# Efeitos: Tiramisu

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Pegar um grão de café.
- **Efeito principal:** Açúcar: por 2 s depois de pegar um grão, o golpe fica 25% mais rápido.
- **Efeito secundário ou custo:** Velocidade ×1,05. Custo: 4 grãos de café na Loja.
- **Duração:** 2 s por grão (renova).
- **Efeito visual:** `po-de-cacau`: pó de cacau caindo em volta dos pés, com brilhos dourados (6 quadros em laço, 600 ms), enquanto o açúcar dura.
- **Sinergias:** Chifre da Sorte: mais grãos, mais açúcar. Café Duplo: os dois aceleram, por gatilhos diferentes.
- **Riscos de bug ou de desequilíbrio:** Depende de moeda e de grão no chão (ainda não existem). Hoje o golpe dura 630 ms e a espera é de 430 ms: encurtar só a espera não muda nada, então este item mexe na duração do golpe, o que exige acelerar o sprite de ataque.
- **Como testar no jogo:** Comprar com 4 grãos (sem 4, não compra). Pegar um grão: golpe 630 → 473 ms por 2 s.
