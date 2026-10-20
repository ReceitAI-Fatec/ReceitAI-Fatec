import { useState } from 'react'
import Button from '@mui/material/Button'

import IngredientSelect from './components/IngredientSelect'
import RecipeCard from './components/RecipeCard'
import recipes from './assets/recipes'
import RecipeFilters from './components/RecipeFilters'
import AppNavigation from './components/AppNavigation'
import RecipeDetails from './pages/RecipeDetails'
import AppHeader from './components/AppHeader'
import { ArrowRightIcon } from './components/Icons'
import './App.css'

function App() {
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [selectedCategory, setSelectedCategory] = useState([])
  const [maxPreparationTime, setMaxPreparationTime] = useState('')
  const [selectedDiets, setSelectedDiets] = useState([])
  const [activeTab, setActiveTab] = useState('pantry')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const availableIngredients = selectedIngredients.map(
    (ingredient) => ingredient.label,
  )

  const recipesWithCompatibility = recipes.map((recipe) => {
    const availableCount = recipe.ingredients.filter((ingredient) =>
      availableIngredients.includes(ingredient),
    ).length

    const compatibility = Math.round(
      (availableCount / recipe.ingredients.length) * 100,
    )

    const missingIngredients = recipe.ingredients.filter(
      (ingredient) => !availableIngredients.includes(ingredient),
    )

    return {
      ...recipe,
      compatibility,
      missingIngredients,
    }
  })

  const filteredRecipes = recipesWithCompatibility.filter((recipe) => {
    const matchesCategory =
      selectedCategory.length === 0 ||
      selectedCategory.includes(recipe.category)

    const matchesTime =
      !maxPreparationTime ||
      recipe.preparationTime <= Number(maxPreparationTime)

    const matchesDiet = selectedDiets.every((diet) =>
      recipe.dietaryTags.includes(diet),
    )

    return matchesCategory && matchesTime && matchesDiet
  })

  const sortedRecipes = [...filteredRecipes].sort(
    (a, b) => b.compatibility - a.compatibility,
  )

  return (
    <main className="app-container">
      <AppHeader />

      <AppNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSelectedRecipe(null)
        }}
      />

      {selectedRecipe ? (
        <RecipeDetails
          recipe={selectedRecipe}
          onBack={() => setSelectedRecipe(null)}
        />
      ) : (
        <>
          {activeTab === 'pantry' && (
            <>
              <section className="pantry-intro">
                <span>SUA COZINHA COMEÇA AQUI</span>
                <h2>O próximo prato já está na sua despensa.</h2>
                <p>
                  Selecione o que você tem e encontre receitas que combinam
                  com a sua rotina.
                </p>
              </section>

              <div className="pantry-layout">
                <section className="search-section">
                  <h2>O que você tem em casa?</h2>

                  <p className="section-description">
                    Adicione os ingredientes. Inclua também os básicos,
                    como sal e azeite.
                  </p>

                  <IngredientSelect
                    selectedIngredients={selectedIngredients}
                    onChange={setSelectedIngredients}
                  />

                  <div className="search-actions">
                    <Button
                      variant="contained"
                      endIcon={<ArrowRightIcon size={18} />}
                      onClick={() => setActiveTab('recommendations')}
                      fullWidth
                      sx={{
                        py: 1.2,
                        borderRadius: '8px',
                        backgroundColor: '#2f6b45',
                        color: '#ffffff',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: '#27583a',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      Encontrar receitas
                    </Button>
                  </div>
                </section>

                <div className="pantry-aside">
                  <section className="pantry-filters">
                    <RecipeFilters
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                      maxPreparationTime={maxPreparationTime}
                      onPreparationTimeChange={setMaxPreparationTime}
                      selectedDiets={selectedDiets}
                      onDietChange={setSelectedDiets}
                    />
                  </section>

                  <div className="pantry-tip">
                    <strong>
                      Mais ingredientes em casa, maior compatibilidade.
                    </strong>
                    <p>
                      O percentual compara a quantidade de ingredientes que
                      você tem com o total da receita.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'recommendations' && (
            <section className="recipes-section">
              <div className="recipes-heading">
                <h2>Receitas para você</h2>
                <p>
                  {selectedIngredients.length === 0
                    ? 'Explore nossas sugestões fictícias.'
                    : 'Ordenadas pelas que combinam melhor com seus ingredientes.'}
                </p>
              </div>

              <div className="recipes-grid">
                {sortedRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onSelect={setSelectedRecipe}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App

