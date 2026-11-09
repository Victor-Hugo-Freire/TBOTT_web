// Sprites dos itens (issues #17 e #19) e dos consumíveis.
// Itens: public/sprites/items/<id>/. Consumíveis: public/sprites/items/consumables/<id>/.
// - path: folha do item numa camada só (o pedestal vem de roomSprites.js: depois da escala, a mesma célula de 300x384
//   e os pés no mesmo ponto)
// - icon: imagem parada do item, sem grade
// - variants: outras folhas da mesma entidade (efeito visual do item, porta trancada do garfo, grupos e preço do grão)
// A animação "coleta" já traz as faíscas do brilho de coleta.

// ATENÇÃO, convenção diferente do protagonista (characterSprites.js):
// - no protagonista, linha = direção (down, left, right, up) e coluna = quadro;
// - aqui, linha = ANIMAÇÃO (animations.<nome>.row) e coluna = quadro. A vista é de frente;
//   para o outro lado, espelhar na horizontal. Linhas "-lado" são a vista de lado olhando para a direita.
// Cada animação: row (linha da folha), frames (quantos quadros usa, a partir da coluna 0),
// durations (ms de cada quadro), hitFrames (quadros em que o golpe acerta, se houver) e
// emits ({ frame, effect }: quadro em que nasce um efeito de effectSprites.js, se houver).
// Pivô: os pés ficam em (feetX, frameHeight - feetPadding) da célula, iguais em todos os quadros.
// Escala: frameWidth, frameHeight, feetX e feetPadding estão em pixels do ARQUIVO. Com scale: 3 o arquivo é a
// versão @1x (1 px por pixel da grade da arte, 9x menos memória): desenhe 3x maior com imageSmoothingEnabled = false,
// que o resultado é idêntico, pixel a pixel, à folha grande. Os <id>.json ao lado dos PNGs estão em pixels da folha grande (3x).
// Gerado a partir desses <id>.json. Nenhuma tela usa estes dados ainda.

// Chave = id do item (nomes da renomeação v2)
export const ITEM_SPRITES = {
  'batuta-do-maestro': {
    id: 'batuta-do-maestro',
    path: '/sprites/items/batuta-do-maestro/batuta-do-maestro.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/batuta-do-maestro/batuta-do-maestro-icone.png',
    variants: {
      'notas-no-ritmo': {
        id: 'batuta-do-maestro-notas-no-ritmo',
        path: '/sprites/items/batuta-do-maestro/batuta-do-maestro-notas-no-ritmo.png',
        scale: 3,
        frameWidth: 64,
        frameHeight: 48,
        framesPerRow: 6,
        animations: {
          'notas-no-ritmo': { row: 0, frames: 6, durations: [90, 90, 90, 90, 90, 90] },
        },
      },
    },
  },
  'cafe-duplo': {
    id: 'cafe-duplo',
    path: '/sprites/items/cafe-duplo/cafe-duplo.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/cafe-duplo/cafe-duplo-icone.png',
    variants: {
      'vapor-de-cafe': {
        id: 'cafe-duplo-vapor-de-cafe',
        path: '/sprites/items/cafe-duplo/cafe-duplo-vapor-de-cafe.png',
        scale: 3,
        frameWidth: 36,
        frameHeight: 36,
        framesPerRow: 5,
        animations: {
          'vapor-de-cafe': { row: 0, frames: 5, durations: [90, 90, 90, 90, 90] },
        },
      },
    },
  },
  'caldo-da-mamae': {
    id: 'caldo-da-mamae',
    path: '/sprites/items/caldo-da-mamae/caldo-da-mamae.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/caldo-da-mamae/caldo-da-mamae-icone.png',
    variants: {
      'escudo-de-vapor': {
        id: 'caldo-da-mamae-escudo-de-vapor',
        path: '/sprites/items/caldo-da-mamae/caldo-da-mamae-escudo-de-vapor.png',
        scale: 3,
        frameWidth: 100,
        frameHeight: 44,
        framesPerRow: 6,
        animations: {
          'escudo-de-vapor': { row: 0, frames: 6, durations: [110, 110, 110, 110, 110, 110] },
        },
      },
    },
  },
  'chifre-da-sorte': {
    id: 'chifre-da-sorte',
    path: '/sprites/items/chifre-da-sorte/chifre-da-sorte.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/chifre-da-sorte/chifre-da-sorte-icone.png',
    variants: {
      'brilho-da-sorte': {
        id: 'chifre-da-sorte-brilho-da-sorte',
        path: '/sprites/items/chifre-da-sorte/chifre-da-sorte-brilho-da-sorte.png',
        scale: 3,
        frameWidth: 40,
        frameHeight: 40,
        framesPerRow: 5,
        animations: {
          'brilho-da-sorte': { row: 0, frames: 5, durations: [70, 70, 70, 70, 70] },
        },
      },
    },
  },
  'concha-longa': {
    id: 'concha-longa',
    path: '/sprites/items/concha-longa/concha-longa.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/concha-longa/concha-longa-icone.png',
    variants: {
      'poca-de-molho': {
        id: 'concha-longa-poca-de-molho',
        path: '/sprites/items/concha-longa/concha-longa-poca-de-molho.png',
        scale: 3,
        frameWidth: 64,
        frameHeight: 28,
        framesPerRow: 4,
        animations: {
          'poca-de-molho': { row: 0, frames: 4, durations: [120, 120, 120, 120] },
        },
      },
    },
  },
  'dente-de-tubarao': {
    id: 'dente-de-tubarao',
    path: '/sprites/items/dente-de-tubarao/dente-de-tubarao.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/dente-de-tubarao/dente-de-tubarao-icone.png',
    variants: {
      mordida: {
        id: 'dente-de-tubarao-mordida',
        path: '/sprites/items/dente-de-tubarao/dente-de-tubarao-mordida.png',
        scale: 3,
        frameWidth: 48,
        frameHeight: 40,
        framesPerRow: 5,
        animations: {
          mordida: { row: 0, frames: 5, durations: [50, 50, 60, 70, 70] },
        },
      },
    },
  },
  'elixir-eletrico': {
    id: 'elixir-eletrico',
    path: '/sprites/items/elixir-eletrico/elixir-eletrico.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/elixir-eletrico/elixir-eletrico-icone.png',
    variants: {
      faisca: {
        id: 'elixir-eletrico-faisca',
        path: '/sprites/items/elixir-eletrico/elixir-eletrico-faisca.png',
        scale: 3,
        frameWidth: 64,
        frameHeight: 64,
        framesPerRow: 6,
        animations: {
          faisca: { row: 0, frames: 6, durations: [30, 40, 50, 40, 30, 30] },
        },
      },
    },
  },
  mucarela: {
    id: 'mucarela',
    path: '/sprites/items/mucarela/mucarela.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/mucarela/mucarela-icone.png',
    variants: {
      'fios-de-queijo': {
        id: 'mucarela-fios-de-queijo',
        path: '/sprites/items/mucarela/mucarela-fios-de-queijo.png',
        scale: 3,
        frameWidth: 64,
        frameHeight: 32,
        framesPerRow: 5,
        animations: {
          'fios-de-queijo': { row: 0, frames: 5, durations: [80, 80, 80, 80, 80] },
        },
      },
    },
  },
  'palitos-de-pao': {
    id: 'palitos-de-pao',
    path: '/sprites/items/palitos-de-pao/palitos-de-pao.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/palitos-de-pao/palitos-de-pao-icone.png',
    variants: {
      estalo: {
        id: 'palitos-de-pao-estalo',
        path: '/sprites/items/palitos-de-pao/palitos-de-pao-estalo.png',
        scale: 3,
        frameWidth: 56,
        frameHeight: 44,
        framesPerRow: 5,
        animations: {
          estalo: { row: 0, frames: 5, durations: [60, 60, 60, 60, 60] },
        },
      },
    },
  },
  'parmesao-curado': {
    id: 'parmesao-curado',
    path: '/sprites/items/parmesao-curado/parmesao-curado.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/parmesao-curado/parmesao-curado-icone.png',
    variants: {
      lascas: {
        id: 'parmesao-curado-lascas',
        path: '/sprites/items/parmesao-curado/parmesao-curado-lascas.png',
        scale: 3,
        frameWidth: 56,
        frameHeight: 44,
        framesPerRow: 5,
        animations: {
          lascas: { row: 0, frames: 5, durations: [60, 60, 60, 60, 60] },
        },
      },
    },
  },
  'rolo-de-bronze': {
    id: 'rolo-de-bronze',
    path: '/sprites/items/rolo-de-bronze/rolo-de-bronze.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/rolo-de-bronze/rolo-de-bronze-icone.png',
    variants: {
      'impacto-de-bronze': {
        id: 'rolo-de-bronze-impacto-de-bronze',
        path: '/sprites/items/rolo-de-bronze/rolo-de-bronze-impacto-de-bronze.png',
        scale: 3,
        frameWidth: 80,
        frameHeight: 40,
        framesPerRow: 5,
        animations: {
          'impacto-de-bronze': { row: 0, frames: 5, durations: [70, 70, 70, 70, 70] },
        },
      },
    },
  },
  tiramisu: {
    id: 'tiramisu',
    path: '/sprites/items/tiramisu/tiramisu.png',
    scale: 3,
    frameWidth: 100,
    frameHeight: 128,
    feetX: 50,
    feetPadding: 10,
    framesPerRow: 6,
    animations: {
      pedestal: { row: 0, frames: 6, durations: [120, 120, 120, 120, 120, 120] },
      coleta: { row: 1, frames: 6, durations: [90, 90, 90, 160, 160, 120] },
    },
    icon: '/sprites/items/tiramisu/tiramisu-icone.png',
    variants: {
      'po-de-cacau': {
        id: 'tiramisu-po-de-cacau',
        path: '/sprites/items/tiramisu/tiramisu-po-de-cacau.png',
        scale: 3,
        frameWidth: 48,
        frameHeight: 40,
        framesPerRow: 6,
        animations: {
          'po-de-cacau': { row: 0, frames: 6, durations: [100, 100, 100, 100, 100, 100] },
        },
      },
    },
  },
}

// Garfo (abre porta trancada) e grão de café (moeda). No preço, o quadro N-1 é o preço N.
export const CONSUMABLE_SPRITES = {
  garfo: {
    id: 'garfo',
    path: '/sprites/items/consumables/garfo/garfo.png',
    scale: 3,
    frameWidth: 44,
    frameHeight: 44,
    feetX: 22,
    feetPadding: 4,
    framesPerRow: 5,
    animations: {
      chao: { row: 0, frames: 4, durations: [140, 140, 140, 140] },
      aparecer: { row: 1, frames: 5, durations: [70, 70, 70, 90, 90] },
      coleta: { row: 2, frames: 5, durations: [60, 60, 70, 70, 90] },
    },
    icon: '/sprites/items/consumables/garfo/garfo-icone.png',
    variants: {
      'porta-trancada': {
        id: 'garfo-porta-trancada',
        path: '/sprites/items/consumables/garfo/garfo-porta-trancada.png',
        scale: 3,
        frameWidth: 64,
        frameHeight: 64,
        feetX: 32,
        feetPadding: 32,
        framesPerRow: 8,
        animations: {
          'porta-trancada': { row: 0, frames: 8, durations: [110, 110, 120, 120, 110, 120, 140, 160] },
        },
      },
    },
  },
  'grao-de-cafe': {
    id: 'grao-de-cafe',
    path: '/sprites/items/consumables/grao-de-cafe/grao-de-cafe.png',
    scale: 3,
    frameWidth: 44,
    frameHeight: 44,
    feetX: 22,
    feetPadding: 4,
    framesPerRow: 6,
    animations: {
      chao: { row: 0, frames: 6, durations: [110, 110, 110, 110, 110, 110] },
      aparecer: { row: 1, frames: 5, durations: [70, 70, 70, 90, 90] },
      coleta: { row: 2, frames: 5, durations: [60, 60, 70, 70, 90] },
    },
    icon: '/sprites/items/consumables/grao-de-cafe/grao-de-cafe-icone.png',
    variants: {
      grupos: {
        id: 'grao-de-cafe-grupos',
        path: '/sprites/items/consumables/grao-de-cafe/grao-de-cafe-grupos.png',
        scale: 1,
        frameWidth: 132,
        frameHeight: 132,
        feetX: 66,
        feetPadding: 12,
        framesPerRow: 3,
        animations: {
          grupos: { row: 0, frames: 3, durations: [1000, 1000, 1000] },
        },
      },
      preco: {
        id: 'grao-de-cafe-preco',
        path: '/sprites/items/consumables/grao-de-cafe/grao-de-cafe-preco.png',
        scale: 1,
        frameWidth: 72,
        frameHeight: 48,
        framesPerRow: 9,
        animations: {
          preco: { row: 0, frames: 9, durations: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000] },
        },
      },
    },
  },
}
