import './RecipeDetails.css'

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
      <span>♧ {recipe.servings} porção(ões)</span> */}

      {/* ******************* TESTE ICONE ******************** */}
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

    {/* ********************* TESTE ICONE ******************** */}
    
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

export default RecipeDetails
