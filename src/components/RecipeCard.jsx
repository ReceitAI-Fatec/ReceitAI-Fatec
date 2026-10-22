/*import './RecipeCard.css'

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessAlarmSharpIcon from '@mui/icons-material/AccessAlarmSharp'
import RestaurantMenuSharpIcon from '@mui/icons-material/RestaurantMenuSharp'

function RecipeCard({ recipe, onSelect }) {
  return (
    <article
      className="recipe-card"
      onClick={() => onSelect(recipe)}
    >
      <div className="recipe-card-image">
        <span className="recipe-category">{recipe.category}</span>
      </div>

      <div className="recipe-card-content">
        <div className="recipe-card-heading">
          <h3>{recipe.name}</h3>
          <span className="recipe-compatibility">
            {recipe.compatibility}%
          </span>
        </div>

        <p className="recipe-description">
          {recipe.description}
        </p>

        {/* *************** TESTE ICONE }
        <div className="recipe-info">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AccessAlarmSharpIcon sx={{ color: '#43A047', fontSize: 20 }} /> {recipe.preparationTime} minutos</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><RestaurantMenuSharpIcon sx={{ color: '#43A047', fontSize: 20 }} /> {recipe.servings} porção(ões)</span>
        </div>

        <div className="recipe-tags">
          {recipe.dietaryTags.map((tag) => (
            <span className="recipe-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className="recipe-ingredients">
          <h4>Ingredientes</h4>

          <ul>
            {recipe.ingredients.map((ingredient) => {
              const isMissing = recipe.missingIngredients.includes(
                ingredient,
              )

              return (
                // ******TESTE ICONE*********
                <li
                  key={ingredient}
                  className={isMissing ? 'ingredient-missing' : ''}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} aria-hidden="true">
                    {isMissing ? (
                      <CancelIcon sx={{ color: '#E53935', fontSize: 15 }} />
                    ) : (
                      <CheckCircleIcon sx={{ color: '#43A047', fontSize: 15 }} />
                    )}
                  </span>

                  {ingredient}

                  {isMissing && <small>Faltando</small>}
                </li>
              )
            })}

          </ul>
        </div>
      </div>
    </article>
  )
}

export default RecipeCard*/

import './RecipeCard.css'
import AccessAlarmSharpIcon from '@mui/icons-material/AccessAlarmSharp'
import RestaurantMenuSharpIcon from '@mui/icons-material/RestaurantMenuSharp'
import { ArrowRightIcon, CheckIcon } from './Icons'
import formatLabel from '../assets/formatLabel'

// "Limão" / "Limão e Sal" / "Limão, Sal e Alho"
const listFormatter = new Intl.ListFormat('pt-BR', {
  style: 'long',
  type: 'conjunction',
})

const metaIconStyle = { color: '#2f6b45', fontSize: 16 }

function RecipeCard({ recipe, onSelect }) {
  const totalIngredients = recipe.ingredients.length
  const missingCount = recipe.missingIngredients.length
  const availableCount = totalIngredients - missingCount
  const isComplete = missingCount === 0

  return (
    <article className="recipe-card">
      <div className="recipe-card-content">
        <h3>{recipe.name}</h3>

        <p className="recipe-card-meta">
          <span className="recipe-card-meta-item">
            <AccessAlarmSharpIcon sx={metaIconStyle} />
            {recipe.preparationTime} min
          </span>

          <span aria-hidden="true">·</span>

          <span className="recipe-card-meta-item">
            <RestaurantMenuSharpIcon sx={metaIconStyle} />
            {recipe.servings} {recipe.servings === 1 ? 'porção' : 'porções'}
          </span>

          <span aria-hidden="true">·</span>

          <span>{formatLabel(recipe.category)}</span>
        </p>

        {recipe.dietaryTags.length > 0 && (
          <p className="recipe-card-tags">
            {recipe.dietaryTags.map((tag) => formatLabel(tag)).join(' · ')}
          </p>
        )}

        <div className="recipe-card-progress-info">
          <span>
            {availableCount} de {totalIngredients} ingredientes na sua despensa
          </span>

          <span className="recipe-card-compat">
            {isComplete && <CheckIcon size={14} />}
            {recipe.compatibility}% compatível
          </span>
        </div>

        <div
          className="recipe-card-progress"
          role="progressbar"
          aria-valuenow={recipe.compatibility}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Compatibilidade com a sua despensa"
        >
          <span style={{ width: `${recipe.compatibility}%` }} />
        </div>

        {isComplete ? (
          <div className="recipe-card-status is-ready">
            <span className="recipe-card-status-label">Já pode preparar</span>
            <p>Nada! Você tem todos os ingredientes.</p>
          </div>
        ) : (
          <div className="recipe-card-status is-missing">
            <span className="recipe-card-status-label">
              {missingCount === 1 ? 'Falta comprar' : 'Faltam comprar'} ·{' '}
              {missingCount}
            </span>
            <p>{listFormatter.format(recipe.missingIngredients)}</p>
          </div>
        )}

        <button
          type="button"
          className="recipe-card-button"
          onClick={() => onSelect(recipe)}
        >
          Ver receita
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </article>
  )
}

export default RecipeCard