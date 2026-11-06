function AppNavigation({ activeTab, onTabChange }) {
return ( <nav className="app-navigation" aria-label="Navegação principal">
<button
type="button"
className={activeTab === 'pantry' ? 'active' : ''}
onClick={() => onTabChange('pantry')}
aria-current={activeTab === 'pantry' ? 'page' : undefined}
>
Despensa </button>

  <button
    type="button"
    className={activeTab === 'recommendations' ? 'active' : ''}
    onClick={() => onTabChange('recommendations')}
    aria-current={activeTab === 'recommendations' ? 'page' : undefined}
  >
    Recomendações
  </button>
</nav>

)
}

export default AppNavigation
