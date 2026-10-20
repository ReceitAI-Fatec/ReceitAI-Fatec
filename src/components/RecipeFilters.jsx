import './RecipeFilters.css'
import { CheckIcon } from './Icons'

const categories = [
  'Café da manhã',
  'Almoço',
  'Jantar',
  'Lanche',
]

const diets = [
  'Vegano',
  'Vegetariano',
  'Sem glúten',
  'Sem lactose',
  'Zero açúcar',
]

// O Figma mostra os rótulos com cada palavra em maiúscula ("Café da Manhã").
// Só o texto exibido muda; os valores usados nos filtros continuam iguais.
function formatLabel(text) {
  return text
    .split(' ')
    .map((word) =>
      word === 'da' ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}

function RecipeFilters({
  selectedCategory,
  onCategoryChange,
  maxPreparationTime,
  onPreparationTimeChange,
  selectedDiets,
  onDietChange,
}) {
  function toggleCategory(category) {
    if (selectedCategory.includes(category)) {
      onCategoryChange(
        selectedCategory.filter((item) => item !== category),
      )
    } else {
      onCategoryChange([...selectedCategory, category])
    }
  }

  function toggleDiet(diet) {
    if (selectedDiets.includes(diet)) {
      onDietChange(selectedDiets.filter((item) => item !== diet))
    } else {
      onDietChange([...selectedDiets, diet])
    }
  }

  return (
    <section className="filters-section">
      <div className="filters-heading">
        <h3>Do seu jeito</h3>

        <button
          type="button"
          className="clear-filters-button"
          onClick={() => {
            onCategoryChange([])
            onPreparationTimeChange('')
            onDietChange([])
          }}
        >
          Limpar filtros
        </button>
      </div>

      <p className="filters-description">
        Combine refeição, tempo e preferências.
      </p>

      <div className="filters-grid">
        <div className="filter-group">
          <span className="filter-label">Tipo de refeição</span>

          <div className="filter-options">
            {categories.map((category) => {
              const isSelected = selectedCategory.includes(category)

              return (
                <button
                  key={category}
                  type="button"
                  className={`filter-chip ${isSelected ? 'selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => toggleCategory(category)}
                >
                  {isSelected && <CheckIcon size={12} />}
                  {formatLabel(category)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="time-filter">Tempo de preparo</label>

          <select
            id="time-filter"
            value={maxPreparationTime}
            onChange={(event) =>
              onPreparationTimeChange(event.target.value)
            }
          >
            <option value="">Qualquer duração</option>
            <option value="15">Até 15 minutos</option>
            <option value="30">Até 30 minutos</option>
            <option value="60">Até 60 minutos</option>
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Restrições alimentares</span>

          <div className="filter-options">
            {diets.map((diet) => {
              const isSelected = selectedDiets.includes(diet)

              return (
                <button
                  key={diet}
                  type="button"
                  className={`filter-chip ${isSelected ? 'selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => toggleDiet(diet)}
                >
                  {isSelected && <CheckIcon size={12} />}
                  {formatLabel(diet)}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <p className="filters-note">
        As opções selecionadas são aplicadas juntas. Confira os rótulos dos
        produtos e adapte às suas necessidades.
      </p>
    </section>
  )
}

export default RecipeFilters
