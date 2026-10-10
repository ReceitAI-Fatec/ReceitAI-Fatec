import './RecipeCard.css'

// ************ TESTE ICONE *****************
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessAlarmSharpIcon from '@mui/icons-material/AccessAlarmSharp';
import RestaurantMenuSharpIcon from '@mui/icons-material/RestaurantMenuSharp';


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

        {/* <div className="recipe-info">
          <span>◷  {recipe.preparationTime} min</span>
          <span>♧ {recipe.servings} porção(ões)</span>
        </div>
         */}

        {/* *************** TESTE ICONE ************* */}
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
                // <li
                //   key={ingredient}
                //   className={isMissing ? 'ingredient-missing' : ''}
                // >
                //   <span aria-hidden="true">
                //     {isMissing ? '○' : '✓'}
                //   </span>
                //   {ingredient}
                //   {isMissing && (
                //     <small>Faltando</small>
                //   )}
                // </li>

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

export default RecipeCard