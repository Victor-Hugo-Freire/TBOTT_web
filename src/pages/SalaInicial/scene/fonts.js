// Fonte das descrições dos itens (frase do banner e caixa de descrição): a Pixelify Sans, com minúsculas e acentos.
// Ela é declarada no SalaInicial.css (@font-face) e só carrega quando alguém pede: a tela chama loadDescriptionFont
// ao abrir. Enquanto não carrega, o canvas usa a fonte do sistema.
export const DESCRIPTION_FONT = '"Pixelify Sans", system-ui, sans-serif'

export function loadDescriptionFont() {
  // Sem a fonte (sem internet no build, por exemplo), o jogo segue com a do sistema
  document.fonts.load(`16px ${DESCRIPTION_FONT}`).catch(() => {})
}
