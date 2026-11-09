# Efeitos: Batuta do Maestro

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Golpe no ritmo: apertar o ataque até 150 ms depois de o golpe anterior acabar.
- **Efeito principal:** Ritmo: golpe no ritmo causa +1 de dano e mostra uma nota; 4 golpes seguidos no ritmo soltam uma onda sonora que acerta todos a até 80 u.
- **Efeito secundário ou custo:** Invencibilidade +200 ms. Sem custo.
- **Duração:** A contagem do ritmo zera ao errar o tempo.
- **Efeito visual:** `notas-no-ritmo`: notas douradas subindo e, no 4º golpe, um anel de som (6 quadros, 540 ms).
- **Sinergias:** Elixir Elétrico: o 4º golpe no ritmo pode ser também o 3º acerto seguido. Palitos de Pão: o 4º golpe rápido muda o tempo do ritmo (atrapalha: cuidado).
- **Riscos de bug ou de desequilíbrio:** Precisa de um sinal claro do tempo (a nota). Como o golpe (630 ms) é mais longo que a espera (430 ms), o ritmo conta do fim do golpe. Depende de dano.
- **Como testar no jogo:** Atacar de novo assim que o golpe acaba: as notas aparecem; o 4º solta a onda. Atacar fora do tempo: zera.
