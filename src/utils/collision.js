// Colisão por retângulos. Uma caixa é { x, y, width, height }, com x e y no canto
// de cima à esquerda. Serve para paredes agora e, depois, para inimigos, portas e golpes.

// Duas caixas só se sobrepõem se invadem uma à outra: encostar na borda não conta.
export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

const LINE_STEP = 8 // u entre os pontos que isLineBlocked confere (bem menor que qualquer obstáculo)

// A linha reta de `from` até `to` passa por dentro de alguma das caixas? Confere um ponto a cada LINE_STEP u.
// As pontas não contam (são os pés de quem bate e de quem leva), e passar rente à borda também não.
// Serve para o golpe não atravessar obstáculo.
export function isLineBlocked(from, to, boxes) {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / LINE_STEP)
  for (let step = 1; step < steps; step++) {
    const x = from.x + ((to.x - from.x) * step) / steps
    const y = from.y + ((to.y - from.y) * step) / steps
    for (const box of boxes) {
      if (x > box.x && x < box.x + box.width && y > box.y && y < box.y + box.height) return true
    }
  }
  return false
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
