// Converte a resposta de POST /receitas/sugerir para o formato usado pelas
// telas (RecipeCard e RecipeDetails).

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Tira "1. " ou "2) " do começo, que a lista numerada da tela já mostra
function cleanStep(step) {
  return String(step)
    .trim()
    .replace(/^\d+\s*[.)-]\s*/, '')
}

// Lança Error('INVALID_RECIPE') se a IA devolver algo fora do formato.
export function toRecipe(apiRecipe, { diets = [] } = {}) {
  const hasShape =
    apiRecipe &&
    typeof apiRecipe.nome === 'string' &&
    apiRecipe.nome.trim() &&
    Array.isArray(apiRecipe.ingredientes) &&
    Array.isArray(apiRecipe.modo_preparo)

  if (!hasShape) {
    throw new Error('INVALID_RECIPE')
  }

  const items = apiRecipe.ingredientes.filter(
    (item) => item && typeof item.nome === 'string' && item.nome.trim(),
  )

  const steps = apiRecipe.modo_preparo
    .map(cleanStep)
    .filter(Boolean)
    .map(capitalize)

  if (items.length === 0 || steps.length === 0) {
    throw new Error('INVALID_RECIPE')
  }

  const ingredients = items.map((item) => item.nome.trim())

  const ingredientDetails = Object.fromEntries(
    items.map((item) => {
      const name = item.nome.trim()
      const quantity = String(item.quantidade ?? '').trim()
      return [name, quantity ? `${name} (${quantity})` : name]
    }),
  )

  const missingIngredients = Array.isArray(apiRecipe.faltantes)
    ? apiRecipe.faltantes
    : items.filter((item) => !item.disponivel).map((item) => item.nome.trim())

  const minutes = Math.round(Number(apiRecipe.tempo_minutos))
  const servings = Math.round(Number(apiRecipe.porcoes))

  return {
    id: apiRecipe.id ?? `ai-${Date.now()}`,
    name: apiRecipe.nome.trim(),
    description:
      apiRecipe.descricao || 'Receita criada pela IA a partir da sua despensa.',
    ingredients,
    ingredientDetails,
    missingIngredients,
    preparationTime: Number.isFinite(minutes) && minutes > 0 ? minutes : null,
    servings: Number.isFinite(servings) && servings > 0 ? servings : null,
    category: apiRecipe.categoria || 'Sugestão da IA',
    dietaryTags: diets,
    compatibility: Number.isFinite(apiRecipe.compatibilidade)
      ? apiRecipe.compatibilidade
      : Math.round(
          ((ingredients.length - missingIngredients.length) /
            ingredients.length) *
            100,
        ),
    image: '',
    preparationSteps: steps,
    generatedByAi: true,
  }
}

// Mensagem amigável para o usuário (o erro técnico vai para o console)
export function describeError(error) {
  if (error?.message === 'INVALID_RECIPE') {
    return 'A IA devolveu uma receita fora do formato esperado. Tente novamente.'
  }

  if (error instanceof TypeError) {
    return 'Não foi possível conectar ao servidor. Verifique se o back-end está ligado.'
  }

  // 422: o back-end explica (ex.: restrições incompatíveis com a despensa)
  if (error?.status === 422 && error.message) {
    return error.message
  }

  if ([502, 503, 504].includes(error?.status)) {
    return 'O servidor de IA não respondeu. Tente de novo em instantes.'
  }

  if (error?.status === 524) {
    return 'A IA demorou demais para responder. Tente de novo.'
  }

  return 'Algo deu errado ao criar a receita. Tente novamente.'
}

export function tierTitle(missing) {
  if (missing === 0) return 'Você já tem tudo'
  if (missing === 1) return 'Falta 1 ingrediente'
  return `Faltam ${missing} ingredientes`
}
