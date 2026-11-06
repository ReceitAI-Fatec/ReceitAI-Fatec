import { useCallback, useEffect, useRef, useState } from 'react'
import { sugerirReceita } from '../api'
import { describeError, toRecipe } from '../assets/aiRecipe'

// Quantos ingredientes faltam em cada bloco da tela de recomendações
export const TIERS = [0, 1, 2, 3]

const EMPTY_SLOT = { status: 'idle', recipe: null, error: '', history: [] }
// status: idle | queued | loading | success | error

// Gera uma receita por bloco, uma de cada vez (em computador sem GPU,
// pedidos em paralelo só deixariam tudo mais lento).
export function useRecipeSuggestions({
  pantry,
  categories,
  maxPreparationTime,
  diets,
}) {
  const key = JSON.stringify({
    ingredients: pantry.map((item) => item.value).sort(),
    categories: [...categories].sort(),
    maxPreparationTime,
    diets: [...diets].sort(),
  })

  // Resultados guardados por busca: voltar para uma busca antiga não gasta IA
  const [store, setStore] = useState({})
  const epoch = useRef(0)
  const controller = useRef(null)
  const chain = useRef(Promise.resolve())
  const storeRef = useRef(store)
  storeRef.current = store

  const slotsOf = (k) => store[k] ?? {}
  const slots = Object.fromEntries(
    TIERS.map((tier) => [tier, slotsOf(key)[tier] ?? EMPTY_SLOT]),
  )

  const update = useCallback((k, tier, change) => {
    setStore((current) => {
      const slot = current[k]?.[tier] ?? EMPTY_SLOT
      const next = typeof change === 'function' ? change(slot) : change
      return { ...current, [k]: { ...current[k], [tier]: { ...slot, ...next } } }
    })
  }, [])

  const settle = useCallback(
    (k, tier) =>
      update(k, tier, (slot) => ({
        status: slot.recipe ? 'success' : 'idle',
      })),
    [update],
  )

  // Para tudo o que está em andamento ou na fila
  const cancel = useCallback(() => {
    epoch.current += 1
    controller.current?.abort()
    controller.current = null
  }, [])

  // Mudou a despensa ou os filtros: a espera antiga não vale mais
  useEffect(() => {
    return () => cancel()
  }, [key, cancel])

  const enqueue = useCallback(
    (k, tier, request) => {
      const myEpoch = epoch.current
      update(k, tier, { status: 'queued', error: '' })

      chain.current = chain.current.then(async () => {
        if (epoch.current !== myEpoch) {
          settle(k, tier)
          return
        }

        const slot = storeRef.current[k]?.[tier] ?? EMPTY_SLOT
        const ctl = new AbortController()
        controller.current = ctl
        update(k, tier, { status: 'loading' })

        try {
          const data = await sugerirReceita(
            { ...request, faltantes: tier, evitar: slot.history.slice(-8) },
            { signal: ctl.signal },
          )
          const recipe = toRecipe(data, { diets: request.restricoes })

          update(k, tier, (current) => ({
            status: 'success',
            recipe,
            error: '',
            history: [...current.history, recipe.name],
          }))
        } catch (error) {
          if (ctl.signal.aborted) {
            settle(k, tier)
            return
          }

          console.error('Erro ao gerar receita com IA:', error)
          // Se já havia uma receita ("Rodar outra"), mantém ela e avisa do erro
          update(k, tier, (current) => ({
            status: current.recipe ? 'success' : 'error',
            error: describeError(error),
          }))
        }
      })
    },
    [update, settle],
  )

  const requestFor = () => ({
    ingredientes: pantry.map((item) => item.label),
    categorias: categories,
    tempoMax: maxPreparationTime,
    restricoes: diets,
  })

  // "Encontrar receitas": gera os blocos que ainda não têm receita
  function start() {
    if (pantry.length === 0) {
      return
    }

    const request = requestFor()

    for (const tier of TIERS) {
      const slot = slots[tier]

      if (slot.status === 'idle' || (slot.status === 'error' && !slot.recipe)) {
        enqueue(key, tier, request)
      }
    }
  }

  // "Rodar outra" (e "Tentar novamente") de um bloco
  function again(tier) {
    const slot = slots[tier]

    if (slot.status === 'queued' || slot.status === 'loading') {
      return
    }

    enqueue(key, tier, requestFor())
  }

  return { slots, start, again, cancel, key }
}
