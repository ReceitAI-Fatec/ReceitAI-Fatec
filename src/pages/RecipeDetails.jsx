import './RecipeDetails.css'

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
      <span>◷ {recipe.preparationTime} minutos</span>
      <span>♧ {recipe.servings} porção(ões)</span>
      <span>{recipe.compatibility}% de compatibilidade</span>
    </div>
  </header>

  <section className="recipe-details-section">
    <h3>Ingredientes</h3>

    <p className="recipe-details-legend">
      <span>✓ Disponível</span>
      <span>○ Faltando</span>
    </p>

    <ul className="recipe-details-ingredients">
      {recipe.ingredients.map((ingredient) => {
        const isMissing =
          recipe.missingIngredients.includes(ingredient)

        return (
          <li
            key={ingredient}
            className={isMissing ? 'ingredient-missing' : ''}
          >
            <span aria-hidden="true">
              {isMissing ? '○' : '✓'}
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

export default RecipeDetails
