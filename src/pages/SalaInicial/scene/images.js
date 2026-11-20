// Imagens já pedidas ao navegador, por caminho: cada uma carrega uma vez só, na primeira vez que é desenhada.
const images = {}

export function getImage(path) {
  if (!images[path]) {
    images[path] = new Image()
    images[path].src = path
  }
  return images[path]
}

// A imagem já pode ser desenhada? (ainda carregando, ou com erro, não desenha nada)
export function isImageReady(image) {
  return image.complete && image.naturalWidth > 0
}
