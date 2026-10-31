// Colisão por retângulos. Uma caixa é { x, y, width, height }, com x e y no canto
// de cima à esquerda. Serve para paredes agora e, depois, para inimigos, portas e golpes.

// Duas caixas só se sobrepõem se invadem uma à outra: encostar na borda não conta.
export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

// Move a caixa em X e encaixa na borda do sólido; depois faz o mesmo em Y.
// Resolver um eixo de cada vez faz o personagem deslizar na parede (sem tremer),
// e o encaixe é exato: encostado na parede, a posição não muda de um quadro para o outro.
export function moveAndCollide(box, dx, dy, solids) {
  const { width, height } = box
  let { x, y } = box

  x += dx
  if (dx !== 0) {
    for (const solid of solids) {
      if (overlaps({ x, y, width, height }, solid)) x = dx > 0 ? solid.x - width : solid.x + solid.width
    }
  }

  y += dy
  if (dy !== 0) {
    for (const solid of solids) {
      if (overlaps({ x, y, width, height }, solid)) y = dy > 0 ? solid.y - height : solid.y + solid.height
    }
  }

  return { x, y, width, height }
}
