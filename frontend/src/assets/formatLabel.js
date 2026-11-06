// Exibe os rótulos com cada palavra em maiúscula ("Café da Manhã", "Sem Lactose").
// Só o texto exibido muda; os valores usados nos filtros continuam iguais.
export default function formatLabel(text) {
  return text
    .split(' ')
    .map((word) =>
      word === 'da' ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}