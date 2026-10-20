import { useState } from 'react'
import { InfoIcon, PlusIcon, SearchIcon, XIcon } from './Icons'

const ingredients = [
  { value: 'arroz', label: 'Arroz' },
  { value: 'feijao', label: 'Feijão' },
  { value: 'ovo', label: 'Ovo' },
  { value: 'tomate', label: 'Tomate' },
  { value: 'cebola', label: 'Cebola' },
  { value: 'alho', label: 'Alho' },
  { value: 'frango', label: 'Frango' },
  { value: 'batata', label: 'Batata' },
  { value: 'cenoura', label: 'Cenoura' },
  { value: 'macarrao', label: 'Macarrão' },
  { value: 'queijo', label: 'Queijo' },
  { value: 'leite', label: 'Leite' },
]

// Ignora acentos e maiúsculas: "feij" encontra "Feijão"
function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

// Sempre mostra no máximo 5 sugestões, para o quadro não mudar de tamanho
const MAX_SUGGESTIONS = 5

function IngredientSelect({ selectedIngredients, onChange }) {
  const [query, setQuery] = useState('')

  const trimmedQuery = query.trim()

  const availableIngredients = ingredients.filter(
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

  function addIngredient(ingredient) {
    onChange([...selectedIngredients, ingredient])
    setQuery('')
  }

  function removeIngredient(ingredient) {
    onChange(
      selectedIngredients.filter((item) => item.value !== ingredient.value),
    )
  }

  function handleKeyDown(event) {
    // Enter adiciona a primeira sugestão
    if (event.key === 'Enter' && trimmedQuery && suggestions.length > 0) {
      event.preventDefault()
      addIngredient(suggestions[0])
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
        </div>

        <div className="ingredient-search-field">
          <SearchIcon size={16} />

          <input
            id="ingredients"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite para buscar ingredientes..."
            aria-label="Quais ingredientes você tem em casa?"
            autoComplete="off"
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

