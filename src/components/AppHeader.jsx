import { SproutIcon } from './Icons'
import culinaria from '../assets/culinaria (1).png'


function AppHeader() {
  return (
    <header className="app-header">
      <a className="app-brand" href="/" aria-label="ReceitAi - início">
        <span className="app-brand-icon" aria-hidden="true">
          {/* <SproutIcon size={22} /> */}
          <img src={culinaria} alt="" className="app-brand-image" />
        </span>
        <span>ReceitAi</span>
      </a>

      <span className="app-tagline">Sua cozinha, seu ritmo.</span>
    </header>
  )
}

export default AppHeader
