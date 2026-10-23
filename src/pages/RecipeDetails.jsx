/*import './RecipeDetails.css'

// ************ TESTE ICONE *****************
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessAlarmSharpIcon from '@mui/icons-material/AccessAlarmSharp';
import RestaurantMenuSharpIcon from '@mui/icons-material/RestaurantMenuSharp';


function RecipeDetails({ recipe, onBack }) {
if (!recipe) {
return null
}

return ( <main className="recipe-details"> <button
     type="button"
     className="back-button"
     onClick={onBack}
   >
← Voltar para recomendações </button>

  <header className="recipe-details-header">
    <span className="recipe-details-category">
      {recipe.category}
    </span>

    <h2>{recipe.name}</h2>

    <p>{recipe.description}</p>

    <div className="recipe-details-info">
      {/* <span>◷ {recipe.preparationTime} minutos</span>
      <span>♧ {recipe.servings} porção(ões)</span> */

      {/* ******************* TESTE ICONE ********************}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AccessAlarmSharpIcon sx={{ color: '#43A047', fontSize: 20 }} /> {recipe.preparationTime} minutos</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><RestaurantMenuSharpIcon sx={{ color: '#43A047', fontSize: 20 }} /> {recipe.servings} porção(ões)</span>
      <span>{recipe.compatibility}% de compatibilidade</span>
    </div>
  </header>

  <section className="recipe-details-section">
    <h3>Ingredientes</h3>

    {/* <p className="recipe-details-legend">
      <span>✓ Disponível</span>
      <span>○ Faltando</span>
    </p> */}

    {/* ********************* TESTE ICONE ************}
    
    <p className="recipe-details-legend">
      <span  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} > <CheckCircleIcon sx={{ color: '#43A047', fontSize: 15 }} /> Disponível</span>
      <span  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} > <CancelIcon sx={{ color: '#E53935', fontSize: 15 }} />Faltando</span>
    </p>

    <ul className="recipe-details-ingredients">
      {recipe.ingredients.map((ingredient) => {
        const isMissing =
          recipe.missingIngredients.includes(ingredient)

        return (
          // <li
          //   key={ingredient}
          //   className={isMissing ? 'ingredient-missing' : ''}
          // >
          //   <span aria-hidden="true">
          //     {isMissing ? '○' : '✓'}
          //   </span>

          //   {ingredient}

          //   {isMissing && <small>Faltando</small>}
          // </li>
          // ******TESTE ICONE*********
                <li
                  key={ingredient}
                  className={isMissing ? 'ingredient-missing' : ''}
                >
                  <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
  </section>

  <section className="recipe-details-section">
    <h3>Modo de preparo</h3>

        {recipe.preparationSteps ? ( <ol className="recipe-preparation-steps">
        {recipe.preparationSteps.map((step, index) => ( <li key={index}>{step}</li>
        ))} </ol>
        ) : ( <p className="recipe-details-placeholder">
            O modo de preparo desta receita ainda será cadastrado. </p>
        )}

   </section>

</main>

)
}

export default RecipeDetails*/}

import './RecipeDetails.css'
import AccessAlarmSharpIcon from '@mui/icons-material/AccessAlarmSharp'
import RestaurantMenuSharpIcon from '@mui/icons-material/RestaurantMenuSharp'
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CheckIcon,
} from '../components/Icons'
import formatLabel from '../assets/formatLabel'

const listFormatter = new Intl.ListFormat('pt-BR', {
  style: 'long',
  type: 'conjunction',
})

// "Arroz e tomate" / "Arroz, tomate e sal" (só a primeira palavra em maiúscula)
function formatPantryExtras(names) {
  const [first, ...others] = names
  return listFormatter.format([
    first,
    ...others.map((name) => name.toLowerCase()),
  ])
}

// Cada passo pode ser só um texto ("Corte a cebola.")
// ou um objeto: { title: 'Prepare os ingredientes', description: '...', minutes: 5 }
function normalizeStep(step) {
  return typeof step === 'string' ? { description: step } : step
}

function RecipeDetails({ recipe, onBack, pantryIngredients = [] }) {
  if (!recipe) {
    return null
  }

  const missingIngredients = recipe.missingIngredients ?? []
  const totalIngredients = recipe.ingredients.length
  const availableIngredients = recipe.ingredients.filter(
    (ingredient) => !missingIngredients.includes(ingredient),
  )

  // Quantidades são opcionais: recipe.ingredientDetails = { Ovo: '2 ovos', ... }
  const ingredientDetails = recipe.ingredientDetails
  const describe = (ingredient) => ingredientDetails?.[ingredient] ?? ingredient

  // Ingredientes que o usuário tem na despensa, mas que não entram nesta receita
  const pantryExtras = pantryIngredients.filter(
    (ingredient) => !recipe.ingredients.includes(ingredient),
  )

  const steps = recipe.preparationSteps?.map(normalizeStep)
  const servingsLabel = recipe.servings === 1 ? 'porção' : 'porções'

  return (
    <article className="recipe-details">
      <button type="button" className="back-button" onClick={onBack}>
        <ArrowLeftIcon size={14} />
        Voltar para recomendações
      </button>

      <header className="recipe-details-header">
        <span className="recipe-details-eyebrow">{recipe.category}</span>

        <h1>{recipe.name}</h1>

        <p className="recipe-details-description">{recipe.description}</p>

        {recipe.dietaryTags.length > 0 && (
          <ul className="recipe-details-tags">
            {recipe.dietaryTags.map((tag) => (
              <li className="recipe-details-tag" key={tag}>
                <CheckIcon size={12} />
                {formatLabel(tag)}
              </li>
            ))}
          </ul>
        )}

        <div className="recipe-details-info">
          <div className="recipe-details-info-item">
            <AccessAlarmSharpIcon sx={{ color: '#2f6b45', fontSize: 24 }} />
            <div>
              <strong>{recipe.preparationTime} min</strong>
              <span className="recipe-details-info-label">Tempo total</span>
            </div>
          </div>

          <div className="recipe-details-info-item">
            <RestaurantMenuSharpIcon
              sx={{ color: '#2f6b45', fontSize: 24 }}
            />
            <div>
              <strong>
                {recipe.servings} {servingsLabel}
              </strong>
              <span className="recipe-details-info-label">
                Rendimento médio
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="recipe-details-layout">
        <aside className="recipe-ingredients-card">
          <h2>Ingredientes</h2>

          <p className="recipe-ingredients-subtitle">
            Para {recipe.servings} {servingsLabel}
            {ingredientDetails && ' · confira as quantidades'}
          </p>

          <p className="recipe-ingredients-have">
            <CheckCircleIcon size={14} />
            Você tem · {availableIngredients.length} de {totalIngredients}{' '}
            {totalIngredients === 1 ? 'ingrediente' : 'ingredientes'}
          </p>

          {availableIngredients.length > 0 ? (
            <ul className="recipe-ingredients-list">
              {availableIngredients.map((ingredient) => (
                <li key={ingredient}>
                  <CheckIcon size={14} />
                  {describe(ingredient)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="recipe-ingredients-empty">
              Nenhum ingrediente desta receita está na sua despensa ainda.
            </p>
          )}

          {missingIngredients.length > 0 && (
            <div className="recipe-missing">
              <p className="recipe-missing-title">
                <ShoppingBasketOutlinedIcon sx={{ fontSize: 16 }} />
                {missingIngredients.length === 1
                  ? 'Falta 1 ingrediente'
                  : `Faltam ${missingIngredients.length} ingredientes`}
              </p>

              <ul>
                {missingIngredients.map((ingredient) => (
                  <li key={ingredient}>{describe(ingredient)}</li>
                ))}
              </ul>
            </div>
          )}

          {pantryExtras.length > 0 && (
            <p className="recipe-ingredients-note">
              {formatPantryExtras(pantryExtras)}{' '}
              {pantryExtras.length === 1 ? 'está' : 'estão'} na sua despensa,
              mas não {pantryExtras.length === 1 ? 'entra' : 'entram'} nesta
              receita.
            </p>
          )}
        </aside>

        <section className="recipe-steps">
          <h2>Modo de preparo</h2>

          {steps ? (
            <ol className="recipe-steps-list">
              {steps.map((step, index) => (
                <li className="recipe-step" key={index}>
                  <span className="recipe-step-number" aria-hidden="true">
                    {index + 1}
                  </span>

                  <div>
                    {step.title && (
                      <h3 className="recipe-step-title">{step.title}</h3>
                    )}

                    <p
                      className={`recipe-step-text ${
                        step.title ? '' : 'is-plain'
                      }`}
                    >
                      {step.description}
                    </p>

                    {step.minutes && (
                      <span className="recipe-step-time">
                        {step.minutes} min
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="recipe-details-placeholder">
              O modo de preparo desta receita ainda será cadastrado.
            </p>
          )}

          <p className="recipe-details-note">
            As restrições consideram os ingredientes desta receita. Confira
            rótulos e possíveis substituições de acordo com suas necessidades.
          </p>
        </section>
      </div>
    </article>
  )
}

export default RecipeDetails