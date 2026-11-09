# Efeitos: Caldo da Mamãe

Tudo aqui é proposta para o Victor avaliar. Vida, dano, sorte, moeda, lentidão, empurrão e item coletável **ainda não existem** no jogo; o que depende deles está marcado.

- **Gatilho:** Entrar numa sala com inimigos; e a vida cair para 1 coração.
- **Efeito principal:** Escudo de vapor: ao entrar numa sala com inimigos, o próximo dano é anulado (1 por sala). Colo de mãe: quando a vida cai para 1 coração, cura 2 corações na hora (1 vez por andar).
- **Efeito secundário ou custo:** Ao pegar: +1 de vida máxima e cura toda a vida. Sem custo.
- **Duração:** O escudo dura até o primeiro dano na sala. O colo de mãe recarrega a cada andar.
- **Efeito visual:** `escudo-de-vapor`: anel de vapor no chão em volta dos pés, com baforadas subindo dos lados (6 quadros em laço, 660 ms), enquanto o escudo está ativo; some quando anula um dano.
- **Sinergias:** Muçarela: as duas dão vida máxima. Café Duplo: o dano anulado NÃO dispara a corrida do café (para não dobrar a proteção).
- **Riscos de bug ou de desequilíbrio:** Forte demais em sala com um inimigo só (o escudo anula o único golpe). Depende de vida, dano e inimigos (ainda não existem).
- **Como testar no jogo:** Entrar numa sala com inimigos: aparece o anel; levar um golpe: não perde vida e o anel some. Ficar com 1 coração: cura 2, e só de novo no andar seguinte.
