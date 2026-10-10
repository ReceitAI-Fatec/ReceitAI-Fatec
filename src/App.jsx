
import { useState } from 'react'

import IngredientSelect from './components/IngredientSelect'
import RecipeCard from './components/RecipeCard'
import recipes from './assets/recipes'
import RecipeFilters from './components/RecipeFilters'
import AppNavigation from './components/AppNavigation'
import RecipeDetails from './pages/RecipeDetails'
import AppHeader from './components/AppHeader'
import './App.css'

// ********************BOTAO TESTE*******************************//

import Button from '@mui/material/Button';
import Icon from '@mui/material/Icon';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';


function App() {
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
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
      !selectedCategory || recipe.category === selectedCategory

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

                  <div className="selected-summary">
                    {selectedIngredients.length === 0 ? (
                      <p>
                        Selecione ingredientes para descobrir suas receitas.
                      </p>
                    ) : (
                      <p>
                        Você selecionou {selectedIngredients.length}{' '}
                        {selectedIngredients.length === 1
                          ? 'ingrediente'
                          : 'ingredientes'}.
                      </p>
                    )}
                  </div>

                  {/* BOTÃO TESTE**********************/}
                  <Button variant="contained" endIcon={<SendIcon />} onClick={() => setActiveTab('recommendations')} sx={{
                    borderRadius: '10px', backgroundColor: '#2f6b45e3',
                    '&:hover': { backgroundColor: '#2F6B45', transform: 'scale(1.05)' }
                  }}>
                    Enviar
                  </Button>
                </section>

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