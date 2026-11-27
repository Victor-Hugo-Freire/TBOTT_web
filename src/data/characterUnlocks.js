// Os ids dos personagens e do item que libera um deles (os mesmos da API: tabela characters e catálogo de itens)
export const SAHUR_ID = 'tung-tung-sahur'
export const SABOR_ID = 'tung-tung-sabor'
export const GOD_ID = 'tung-tung-god'
export const ELIXIR_ITEM_ID = 'elixir-eletrico'

// Como cada personagem é liberado: o Sabor ao pegar o Elixir Elétrico (que só existe em 5% das runs) e o God ao vencer
// o jogo com o Sahur. O Sahur já começa liberado.

// Dica de como liberar cada personagem bloqueado (mostrada no card da tela de seleção).
// O Tung Tung Sahur já começa liberado e não aparece aqui.
export const UNLOCK_HINTS = {
  'tung-tung-sabor': 'Pegue o Elixir Elétrico',
  'tung-tung-god': 'Vença o jogo com o Tung Tung Sahur',
}
