import './RecipeCard.css'

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

        <div className="recipe-info">
          <span>◷ {recipe.preparationTime} min</span>
          <span>♧ {recipe.servings} porção(ões)</span>
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
                <li
                  key={ingredient}
                  className={isMissing ? 'ingredient-missing' : ''}
                >
                  <span aria-hidden="true">
                    {isMissing ? '○' : '✓'}
                  </span>
                  {ingredient}
                  {isMissing && (
                    <small>Faltando</small>
                  )}
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