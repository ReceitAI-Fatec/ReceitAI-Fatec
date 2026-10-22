import './RecommendationsSummary.css'
import { CheckIcon, XIcon } from './Icons'
import formatLabel from '../assets/formatLabel'

function RecommendationsSummary({
  ingredients,
  categories,
  maxPreparationTime,
  diets,
  onRemoveCategory,
  onClearTime,
  onRemoveDiet,
  onAdjustFilters,
}) {
  const hasFilters =
    categories.length > 0 || Boolean(maxPreparationTime) || diets.length > 0

  return (
    <section className="recs-summary" aria-label="Resumo da sua busca">
      <div className="recs-summary-row">
        <span className="recs-summary-label is-strong">
          Sua despensa · {ingredients.length}
        </span>

        <div className="recs-chips">
          {ingredients.length === 0 ? (
            <span className="recs-empty">Nenhum ingrediente selecionado</span>
          ) : (
            ingredients.map((ingredient) => (
              <span className="recs-chip" key={ingredient.value}>
                <CheckIcon size={12} />
                {ingredient.label}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="recs-summary-row">
        <span className="recs-summary-label">Filtros aplicados</span>

        <div className="recs-chips">
          {!hasFilters && (
            <span className="recs-empty">Nenhum filtro aplicado</span>
          )}

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="recs-chip"
              aria-label={`Remover filtro ${formatLabel(category)}`}
              onClick={() => onRemoveCategory(category)}
            >
              {formatLabel(category)}
              <XIcon size={12} />
            </button>
          ))}

          {maxPreparationTime && (
            <button
              type="button"
              className="recs-chip"
              aria-label={`Remover filtro até ${maxPreparationTime} minutos`}
              onClick={onClearTime}
            >
              Até {maxPreparationTime} min
              <XIcon size={12} />
            </button>
          )}

          {diets.map((diet) => (
            <button
              key={diet}
              type="button"
              className="recs-chip"
              aria-label={`Remover filtro ${formatLabel(diet)}`}
              onClick={() => onRemoveDiet(diet)}
            >
              {formatLabel(diet)}
              <XIcon size={12} />
            </button>
          ))}
        </div>

        <button type="button" className="recs-adjust" onClick={onAdjustFilters}>
          Ajustar filtros
        </button>
      </div>
    </section>
  )
}

export default RecommendationsSummary