/*import Select from 'react-select'

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

function IngredientSelect({ selectedIngredients, onChange }) {
  return (
    <div className="ingredient-select">
      <label htmlFor="ingredients">
        Quais ingredientes você tem em casa?
      </label>

      <Select
        inputId="ingredients"
        isMulti
        options={ingredients}
        value={selectedIngredients}
        onChange={onChange}
        placeholder="Digite para buscar ingredientes..."
        noOptionsMessage={() => 'Nenhum ingrediente encontrado'}
        closeMenuOnSelect={false}
        isClearable
      />
    </div>
  )
}

export default IngredientSelect*/


import Select from 'react-select'

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

function IngredientSelect({ selectedIngredients, onChange }) {
  return (
    <div className="ingredient-select">
      <label htmlFor="ingredients">
        Quais ingredientes você tem em casa?
      </label>

      <Select
        inputId="ingredients"
        options={ingredients.filter(
          (ingredient) =>
            !selectedIngredients.some(
              (selected) => selected.value === ingredient.value,
            ),
        )}
        value={null}
        onChange={(ingredient) => {
          if (ingredient) {
            onChange([...selectedIngredients, ingredient])
          }
        }}
        placeholder="Digite para buscar ingredientes..."
        noOptionsMessage={() => 'Nenhum ingrediente encontrado'}
        isClearable
      />

      {selectedIngredients.length > 0 && (
        <div className="selected-ingredients">
          {selectedIngredients.map((ingredient) => (
            <span className="ingredient-tag" key={ingredient.value}>
              {ingredient.label}

              <button
                type="button"
                aria-label={`Remover ${ingredient.label}`}
                onClick={() =>
                  onChange(
                    selectedIngredients.filter(
                      (item) => item.value !== ingredient.value,
                    ),
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default IngredientSelect

