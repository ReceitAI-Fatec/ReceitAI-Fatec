import { SproutIcon } from './Icons'

function AppHeader() {
  return (
    <header className="app-header">
      <a className="app-brand" href="/" aria-label="ReceitAi - início">
        <span className="app-brand-icon" aria-hidden="true">
          <SproutIcon size={22} />
        </span>
        <span>ReceitAi</span>
      </a>

      <span className="app-tagline">Sua cozinha, seu ritmo.</span>
    </header>
  )
}

export default AppHeader
