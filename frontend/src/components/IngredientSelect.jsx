import { useEffect, useState } from 'react'
import { InfoIcon, PlusIcon, SearchIcon, XIcon } from './Icons'
import { criarIngrediente, listarIngredientes } from '../api'

// Lista usada só se o servidor não responder
const FALLBACK = [
  'Arroz', 'Feijão', 'Ovo', 'Tomate', 'Cebola', 'Alho', 'Frango', 'Batata',
  'Cenoura', 'Macarrão', 'Queijo', 'Leite', 'Alface', 'Limão', 'Banana',
  'Aveia', 'Sal', 'Azeite', 'Óleo', 'Pimenta-do-reino',
].map((label) => ({
  value: normalize(label),
  label,
  basico: ['Sal', 'Azeite', 'Óleo', 'Pimenta-do-reino'].includes(label),
}))

// Ignora acentos e maiúsculas: "feij" encontra "Feijão"
function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Sempre mostra no máximo 5 sugestões, para o quadro não mudar de tamanho
const MAX_SUGGESTIONS = 5

function IngredientSelect({ selectedIngredients, onChange }) {
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState(FALLBACK)
  const [offline, setOffline] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Catálogo salvo no banco (inclui o que as pessoas já adicionaram)
  useEffect(() => {
    const controller = new AbortController()

    listarIngredientes({ signal: controller.signal })
      .then((items) => {
        setCatalog(
          items.map((item) => ({
            value: item.valor,
            label: item.nome,
            basico: item.basico,
          })),
        )
        setOffline(false)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error('Erro ao carregar ingredientes:', error)
          setOffline(true)
        }
      })

    return () => controller.abort()
  }, [])

  const trimmedQuery = query.trim()

  const availableIngredients = catalog.filter(
    (ingredient) =>
      !selectedIngredients.some(
        (selected) => selected.value === ingredient.value,
      ),
  )

  const matchingIngredients = trimmedQuery
    ? availableIngredients.filter((ingredient) =>
        normalize(ingredient.label).includes(normalize(trimmedQuery)),
      )
    : availableIngredients

  const suggestions = matchingIngredients.slice(0, MAX_SUGGESTIONS)

  const hasExactMatch = catalog.some(
    (ingredient) => normalize(ingredient.label) === normalize(trimmedQuery),
  )
  const canCreate = trimmedQuery.length >= 2 && !hasExactMatch

  const missingBasics = catalog.filter(
    (ingredient) =>
      ingredient.basico &&
      !selectedIngredients.some((item) => item.value === ingredient.value),
  )

  function addIngredient(ingredient) {
    onChange([...selectedIngredients, ingredient])
    setQuery('')
    setMessage('')
  }

  function addBasics() {
    onChange([
      ...selectedIngredients,
      ...missingBasics.map(({ value, label }) => ({ value, label })),
    ])
  }

  // Ingrediente novo: salvo no banco para aparecer nas próximas vezes
  async function createIngredient() {
    if (!canCreate || saving) {
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const saved = await criarIngrediente(trimmedQuery)
      const item = { value: saved.valor, label: saved.nome, basico: saved.basico }

      setCatalog((current) =>
        current.some((entry) => entry.value === item.value)
          ? current
          : [...current, item],
      )

      if (!selectedIngredients.some((entry) => entry.value === item.value)) {
        addIngredient(item)
      } else {
        setQuery('')
      }
    } catch (error) {
      if (error instanceof TypeError || error.status >= 500) {
        // Sem servidor: usa só nesta sessão
        const label = trimmedQuery.charAt(0).toUpperCase() + trimmedQuery.slice(1)
        const item = { value: normalize(label), label, basico: false }

        setOffline(true)
        if (!selectedIngredients.some((entry) => entry.value === item.value)) {
          addIngredient(item)
        }
      } else {
        setMessage(error.message)
      }
    } finally {
      setSaving(false)
    }
  }

  function removeIngredient(ingredient) {
    onChange(
      selectedIngredients.filter((item) => item.value !== ingredient.value),
    )
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || !trimmedQuery) {
      return
    }

    event.preventDefault()

    // Enter adiciona a primeira sugestão; sem sugestões, cria o ingrediente
    if (suggestions.length > 0) {
      addIngredient(suggestions[0])
    } else {
      createIngredient()
    }
  }

  const total = selectedIngredients.length

  return (
    <div className="ingredient-select">
      <div className="ingredient-search">
        <div className="ingredient-suggestions">
          <div className="ingredient-suggestions-header">
            <span className="ingredient-suggestions-title">
              {trimmedQuery
                ? `Sugestões para “${trimmedQuery}”`
                : 'Sugestões'}
            </span>

            {suggestions.length > 0 && (
              <span className="ingredient-suggestions-hint">
                Toque para adicionar
              </span>
            )}
          </div>

          {suggestions.length > 0 ? (
            <div className="ingredient-suggestions-list">
              {suggestions.map((ingredient) => (
                <button
                  key={ingredient.value}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => addIngredient(ingredient)}
                >
                  {ingredient.label}
                  <PlusIcon size={13} />
                </button>
              ))}
            </div>
          ) : (
            <p className="ingredient-suggestions-empty">
              {trimmedQuery
                ? 'Nenhum ingrediente encontrado'
                : 'Você já adicionou todos os ingredientes'}
            </p>
          )}

          {canCreate && (
            <button
              type="button"
              className="add-new-ingredient"
              onClick={createIngredient}
              disabled={saving}
            >
              <PlusIcon size={13} />
              {saving ? 'Salvando…' : `Adicionar “${trimmedQuery}” como novo ingrediente`}
            </button>
          )}

          {message && (
            <p className="ingredient-message" role="alert">
              {message}
            </p>
          )}
        </div>

        <div className="ingredient-search-field">
          <SearchIcon size={16} />

          <input
            id="ingredients"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite para buscar ou adicionar ingredientes..."
            aria-label="Quais ingredientes você tem em casa?"
            autoComplete="off"
            maxLength={40}
          />

          {query && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setQuery('')}
            >
              <XIcon size={16} />
            </button>
          )}
        </div>

        {missingBasics.length > 0 && (
          <button
            type="button"
            className="add-basics-button"
            onClick={addBasics}
          >
            <PlusIcon size={13} />
            Adicionar básicos ({missingBasics.map((i) => i.label.toLowerCase()).join(', ')})
          </button>
        )}

        {offline && (
          <p className="ingredient-message">
            Sem conexão com o servidor: ingredientes novos não serão salvos.
          </p>
        )}
      </div>

      {/* Sempre ocupa espaço. Com 0 ingredientes fica invisível (vazio),
          assim o quadro não muda de tamanho ao adicionar o primeiro item. */}
      <div
        className={`pantry-list ${total === 0 ? 'is-empty' : ''}`}
        aria-hidden={total === 0 ? 'true' : undefined}
      >
        <div className="pantry-list-header">
          <span className="pantry-list-title">
            Na sua despensa · {total}{' '}
            {total === 1 ? 'ingrediente' : 'ingredientes'}
          </span>

          <button
            type="button"
            className="pantry-list-clear"
            onClick={() => onChange([])}
          >
            Limpar
          </button>
        </div>

        <div className="selected-ingredients">
          {selectedIngredients.map((ingredient) => (
            <span className="ingredient-tag" key={ingredient.value}>
              {ingredient.label}

              <button
                type="button"
                aria-label={`Remover ${ingredient.label}`}
                onClick={() => removeIngredient(ingredient)}
              >
                <XIcon size={14} />
              </button>
            </span>
          ))}
        </div>

        <p className="pantry-note">
          <InfoIcon size={14} />
          As quantidades são conferidas na receita.
        </p>
      </div>
    </div>
  )
}

export default IngredientSelect

