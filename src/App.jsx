/*import { useState } from 'react'
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

export default App*/

/* 2º versão, já funcionando /
import { useState, useEffect, useRef } from 'react'
import Button from '@mui/material/Button'

import IngredientSelect from './components/IngredientSelect'
import RecipeCard from './components/RecipeCard'
import recipes from './assets/recipes'
import RecipeFilters from './components/RecipeFilters'
import AppNavigation from './components/AppNavigation'
import RecipeDetails from './pages/RecipeDetails'
import AppHeader from './components/AppHeader'
import { ArrowRightIcon } from './components/Icons'
import RecommendationsSummary from './components/RecommendationsSummary'
import './App.css'

function App() {
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [selectedCategory, setSelectedCategory] = useState([])
  const [maxPreparationTime, setMaxPreparationTime] = useState('')
  const [selectedDiets, setSelectedDiets] = useState([])
  const [activeTab, setActiveTab] = useState('pantry')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  //novo
  const [visibleRecipesCount, setVisibleRecipesCount] = useState(4)
  const loadMoreRef = useRef(null)

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

  function removeCategory(category) {
    setSelectedCategory((current) =>
      current.filter((item) => item !== category),
    )
  }

  function removeDiet(diet) {
    setSelectedDiets((current) =>
      current.filter((item) => item !== diet),
    )
  }

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
              <div className="recommendations-page-heading">
                <div>
                  <span className="recommendations-eyebrow">
                    RECOMENDAÇÕES COM BASE NA SUA DESPENSA
                  </span>
                  <h1>Receitas para seu dia</h1>
                </div>

                
          <button
            type="button"
            className="edit-pantry-button"
            onClick={() => setActiveTab('pantry')}
            >
  
              <span aria-hidden="true" 
              style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>✎
              </span>
            Editar despensa
          </button>

              </div>

              <RecommendationsSummary
                ingredients={selectedIngredients}
                categories={selectedCategory}
                maxPreparationTime={maxPreparationTime}
                diets={selectedDiets}
                onRemoveCategory={removeCategory}
                onClearTime={() => setMaxPreparationTime('')}
                onRemoveDiet={removeDiet}
                onAdjustFilters={() => setActiveTab('pantry')}
              />

              <div className="recipes-heading">
                <p>
                  {sortedRecipes.length}{' '}
                  {sortedRecipes.length === 1 ? 'receita' : 'receitas'}
                  {' · da maior para a menor compatibilidade'}
                </p>
              </div>

              {sortedRecipes.length > 0 ? (
                <div className="recipes-grid">
                  {sortedRecipes.slice(0, visibleRecipesCount).map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onSelect={setSelectedRecipe}
                    />
                  ))}
                </div>
              ) : (
                <div className="recipes-empty-state">
                  <h2>Nenhuma receita encontrada</h2>
                  <p>
                    Tente remover algum filtro para ver outras sugestões.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory([])
                      setMaxPreparationTime('')
                      setSelectedDiets([])
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}

              <aside className="compatibility-explanation">
                <span
                  className="compatibility-info-icon"
                  aria-hidden="true"
                >
                  i
                </span>
                <div>
                  <strong>O que significa a compatibilidade?</strong>
                  <p>
                    A porcentagem indica quantos ingredientes da receita
                    você tem na despensa, com arredondamento. A compatibilidade
                    não considera quantidades; confira a lista antes de cozinhar.
                  </p>
                </div>
              </aside>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App*/


/*22/10 
import { useState, useEffect, useRef } from 'react'
import Button from '@mui/material/Button'

import IngredientSelect from './components/IngredientSelect'
import RecipeCard from './components/RecipeCard'
import recipes from './assets/recipes'
import RecipeFilters from './components/RecipeFilters'
import AppNavigation from './components/AppNavigation'
import RecipeDetails from './pages/RecipeDetails'
import AppHeader from './components/AppHeader'
import { ArrowRightIcon } from './components/Icons'
import RecommendationsSummary from './components/RecommendationsSummary'
import './App.css'

function App() {
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [selectedCategory, setSelectedCategory] = useState([])
  const [maxPreparationTime, setMaxPreparationTime] = useState('')
  const [selectedDiets, setSelectedDiets] = useState([])
  const [activeTab, setActiveTab] = useState('pantry')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const [visibleRecipesCount, setVisibleRecipesCount] = useState(4)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef(null)

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
    const matchesIngredients =
      availableIngredients.length === 0 ||
      recipe.ingredients.some((ingredient) =>
        availableIngredients.includes(ingredient),
      )

    const matchesCategory =
      selectedCategory.length === 0 ||
      selectedCategory.includes(recipe.category)

    const matchesTime =
      !maxPreparationTime ||
      recipe.preparationTime <= Number(maxPreparationTime)

    const matchesDiet = selectedDiets.every((diet) =>
      recipe.dietaryTags.includes(diet),
    )

    return (
      matchesIngredients &&
      matchesCategory &&
      matchesTime &&
      matchesDiet
    )
  })

  const sortedRecipes = [...filteredRecipes].sort(
    (a, b) => b.compatibility - a.compatibility,
  )

  // Reinicia a lista quando os filtros mudam.
  useEffect(() => {
    setVisibleRecipesCount(4)
    setIsLoadingMore(false)
  }, [selectedCategory, maxPreparationTime, selectedDiets, selectedIngredients])

  // Exibe um carregamento breve antes de revelar as próximas receitas.
  useEffect(() => {
    if (!isLoadingMore) {
      return
    }

    const timer = setTimeout(() => {
      setVisibleRecipesCount((current) =>
        Math.min(current + 4, sortedRecipes.length),
      )
      setIsLoadingMore(false)
    }, 450)

    return () => clearTimeout(timer)
  }, [isLoadingMore, sortedRecipes.length])

  // Detecta quando o usuário chega ao final da lista.
  useEffect(() => {
    const element = loadMoreRef.current

    if (
      !element ||
      activeTab !== 'recommendations' ||
      selectedRecipe ||
      isLoadingMore ||
      visibleRecipesCount >= sortedRecipes.length
    ) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoadingMore(true)
        }
      },
      {
        rootMargin: '100px',
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [
    activeTab,
    selectedRecipe,
    isLoadingMore,
    visibleRecipesCount,
    sortedRecipes.length,
  ])

  function removeCategory(category) {
    setSelectedCategory((current) =>
      current.filter((item) => item !== category),
    )
  }

  function removeDiet(diet) {
    setSelectedDiets((current) =>
      current.filter((item) => item !== diet),
    )
  }

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
              <div className="recommendations-page-heading">
                <div>
                  <span className="recommendations-eyebrow">
                    RECOMENDAÇÕES COM BASE NA SUA DESPENSA
                  </span>
                  <h1>Receitas para seu dia</h1>
                </div>

                <button
                  type="button"
                  className="edit-pantry-button"
                  onClick={() => setActiveTab('pantry')}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      transform: 'scaleX(-1)',
                    }}
                  >
                    ✎
                  </span>
                  Editar despensa
                </button>
              </div>

              <RecommendationsSummary
                ingredients={selectedIngredients}
                categories={selectedCategory}
                maxPreparationTime={maxPreparationTime}
                diets={selectedDiets}
                onRemoveCategory={removeCategory}
                onClearTime={() => setMaxPreparationTime('')}
                onRemoveDiet={removeDiet}
                onAdjustFilters={() => setActiveTab('pantry')}
              />

              <div className="recipes-heading">
                <p>
                  {sortedRecipes.length}{' '}
                  {sortedRecipes.length === 1 ? 'receita' : 'receitas'}
                  {' encontradas · da maior para a menor compatibilidade'}
                </p>
              </div>

              {sortedRecipes.length > 0 ? (
                <>
                  <div className="recipes-grid">
                    {sortedRecipes
                      .slice(0, visibleRecipesCount)
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          recipe={recipe}
                          onSelect={setSelectedRecipe}
                        />
                      ))}
                  </div>

                  {isLoadingMore && (
                    <p
                      role="status"
                      aria-live="polite"
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#587653',
                        fontSize: '14px',
                      }}
                    >
                      Carregando mais receitas...
                    </p>
                  )}

                  {visibleRecipesCount < sortedRecipes.length && (
                    <div
                      ref={loadMoreRef}
                      aria-hidden="true"
                      style={{ height: '20px' }}
                    />
                  )}
                </>
              ) : (
                <div className="recipes-empty-state">
                  <h2>Nenhuma receita encontrada</h2>
                  <p>
                    Tente remover algum filtro para ver outras sugestões.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory([])
                      setMaxPreparationTime('')
                      setSelectedDiets([])
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}

              <aside className="compatibility-explanation">
                <span
                  className="compatibility-info-icon"
                  aria-hidden="true"
                >
                  i
                </span>
                <div>
                  <strong>O que significa a compatibilidade?</strong>
                  <p>
                    A porcentagem indica quantos ingredientes da receita
                    você tem na despensa, com arredondamento. A compatibilidade
                    não considera quantidades; confira a lista antes de cozinhar.
                  </p>
                </div>
              </aside>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App*/ 

import { useState, useEffect, useRef } from 'react'
import Button from '@mui/material/Button'

import IngredientSelect from './components/IngredientSelect'
import RecipeCard from './components/RecipeCard'
import recipes from './assets/recipes'
import RecipeFilters from './components/RecipeFilters'
import AppNavigation from './components/AppNavigation'
import RecipeDetails from './pages/RecipeDetails'
import AppHeader from './components/AppHeader'
import { ArrowRightIcon } from './components/Icons'
import RecommendationsSummary from './components/RecommendationsSummary'
import './App.css'

function App() {
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [selectedCategory, setSelectedCategory] = useState([])
  const [maxPreparationTime, setMaxPreparationTime] = useState('')
  const [selectedDiets, setSelectedDiets] = useState([])
  const [activeTab, setActiveTab] = useState('pantry')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  const [visibleRecipesCount, setVisibleRecipesCount] = useState(4)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef(null)

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
    const matchesIngredients =
      availableIngredients.length === 0 ||
      recipe.ingredients.some((ingredient) =>
        availableIngredients.includes(ingredient),
      )

    const matchesCategory =
      selectedCategory.length === 0 ||
      selectedCategory.includes(recipe.category)

    const matchesTime =
      !maxPreparationTime ||
      recipe.preparationTime <= Number(maxPreparationTime)

    const matchesDiet = selectedDiets.every((diet) =>
      recipe.dietaryTags.includes(diet),
    )

    return (
      matchesIngredients &&
      matchesCategory &&
      matchesTime &&
      matchesDiet
    )
  })

  const sortedRecipes = [...filteredRecipes].sort(
    (a, b) => b.compatibility - a.compatibility,
  )

  // Reinicia a lista quando os filtros mudam.
  /*useEffect(() => {
    setVisibleRecipesCount(4)
    setIsLoadingMore(false)
  }, [selectedCategory, maxPreparationTime, selectedDiets, selectedIngredients])
*/
  // Reinicia a lista quando os filtros mudam.
  // (Ajuste de estado durante a renderização, em vez de useEffect:
  // evita o aviso "Calling setState synchronously within an effect".)
  const [previousFilters, setPreviousFilters] = useState({
    selectedCategory,
    maxPreparationTime,
    selectedDiets,
    selectedIngredients,
  })

  if (
    previousFilters.selectedCategory !== selectedCategory ||
    previousFilters.maxPreparationTime !== maxPreparationTime ||
    previousFilters.selectedDiets !== selectedDiets ||
    previousFilters.selectedIngredients !== selectedIngredients
  ) {
    setPreviousFilters({
      selectedCategory,
      maxPreparationTime,
      selectedDiets,
      selectedIngredients,
    })
    setVisibleRecipesCount(4)
    setIsLoadingMore(false)
  }
  // Exibe um carregamento breve antes de revelar as próximas receitas.
  useEffect(() => {
    if (!isLoadingMore) {
      return
    }

    const timer = setTimeout(() => {
      setVisibleRecipesCount((current) =>
        Math.min(current + 4, sortedRecipes.length),
      )
      setIsLoadingMore(false)
    }, 450)

    return () => clearTimeout(timer)
  }, [isLoadingMore, sortedRecipes.length])

  // Detecta quando o usuário chega ao final da lista.
  useEffect(() => {
    const element = loadMoreRef.current

    if (
      !element ||
      activeTab !== 'recommendations' ||
      selectedRecipe ||
      isLoadingMore ||
      visibleRecipesCount >= sortedRecipes.length
    ) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoadingMore(true)
        }
      },
      {
        rootMargin: '100px',
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [
    activeTab,
    selectedRecipe,
    isLoadingMore,
    visibleRecipesCount,
    sortedRecipes.length,
  ])

  // (tela 3) Ao abrir uma receita, volta para o topo da página.
  useEffect(() => {
    if (selectedRecipe) {
      window.scrollTo({ top: 0 })
    }
  }, [selectedRecipe])

  function removeCategory(category) {
    setSelectedCategory((current) =>
      current.filter((item) => item !== category),
    )
  }

  function removeDiet(diet) {
    setSelectedDiets((current) =>
      current.filter((item) => item !== diet),
    )
  }

  return (
    <main className="app-container">
      <AppHeader />

      {/* (tela 3) A navegação não aparece na tela de detalhes */}
      {!selectedRecipe && (
        <AppNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setSelectedRecipe(null)
          }}
        />
      )}

      {selectedRecipe ? (
        <RecipeDetails
          recipe={selectedRecipe}
          pantryIngredients={availableIngredients} // (tela 3)
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
              <div className="recommendations-page-heading">
                <div>
                  <span className="recommendations-eyebrow">
                    RECOMENDAÇÕES COM BASE NA SUA DESPENSA
                  </span>
                  <h1>Receitas para seu dia</h1>
                </div>

                <button
                  type="button"
                  className="edit-pantry-button"
                  onClick={() => setActiveTab('pantry')}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      transform: 'scaleX(-1)',
                    }}
                  >
                    ✎
                  </span>
                  Editar despensa
                </button>
              </div>

              <RecommendationsSummary
                ingredients={selectedIngredients}
                categories={selectedCategory}
                maxPreparationTime={maxPreparationTime}
                diets={selectedDiets}
                onRemoveCategory={removeCategory}
                onClearTime={() => setMaxPreparationTime('')}
                onRemoveDiet={removeDiet}
                onAdjustFilters={() => setActiveTab('pantry')}
              />

              <div className="recipes-heading">
                <p>
                  {sortedRecipes.length}{' '}
                  {sortedRecipes.length === 1 ? 'receita' : 'receitas'}
                  {' encontradas · da maior para a menor compatibilidade'}
                </p>
              </div>

              {sortedRecipes.length > 0 ? (
                <>
                  <div className="recipes-grid">
                    {sortedRecipes
                      .slice(0, visibleRecipesCount)
                      .map((recipe) => (
                        <RecipeCard
                          key={recipe.id}
                          recipe={recipe}
                          onSelect={setSelectedRecipe}
                        />
                      ))}
                  </div>

                  {isLoadingMore && (
                    <p
                      role="status"
                      aria-live="polite"
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#587653',
                        fontSize: '14px',
                      }}
                    >
                      Carregando mais receitas...
                    </p>
                  )}

                  {visibleRecipesCount < sortedRecipes.length && (
                    <div
                      ref={loadMoreRef}
                      aria-hidden="true"
                      style={{ height: '20px' }}
                    />
                  )}
                </>
              ) : (
                <div className="recipes-empty-state">
                  <h2>Nenhuma receita encontrada</h2>
                  <p>
                    Tente remover algum filtro para ver outras sugestões.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory([])
                      setMaxPreparationTime('')
                      setSelectedDiets([])
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}

              <aside className="compatibility-explanation">
                <span
                  className="compatibility-info-icon"
                  aria-hidden="true"
                >
                  i
                </span>
                <div>
                  <strong>O que significa a compatibilidade?</strong>
                  <p>
                    A porcentagem indica quantos ingredientes da receita
                    você tem na despensa, com arredondamento. A compatibilidade
                    não considera quantidades; confira a lista antes de cozinhar.
                  </p>
                </div>
              </aside>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App


