
import './RecipeFilters.css'

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

function RecipeFilters({
  selectedCategory,
  onCategoryChange,
  maxPreparationTime,
  onPreparationTimeChange,
  selectedDiets,
  onDietChange,
}) {
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
        <h3>Filtrar receitas</h3>
        <button
          type="button"
          className="clear-filters-button"
          onClick={() => {
            onCategoryChange('')
            onPreparationTimeChange('')
            onDietChange([])
          }}
        >
          Limpar filtros
        </button>
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <span className="filter-label">Tipo de refeição</span>

          <div className="filter-options">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-chip ${
                  selectedCategory === category ? 'selected' : ''
                }`}
                aria-pressed={selectedCategory === category}
                onClick={() =>
                  onCategoryChange(
                    selectedCategory === category ? '' : category,
                  )
                }
              >
                {category}
              </button>
            ))}
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
            {diets.map((diet) => (
              <button
                key={diet}
                type="button"
                className={`filter-chip ${
                  selectedDiets.includes(diet) ? 'selected' : ''
                }`}
                aria-pressed={selectedDiets.includes(diet)}
                onClick={() => toggleDiet(diet)}
              >
                {diet}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default RecipeFilters