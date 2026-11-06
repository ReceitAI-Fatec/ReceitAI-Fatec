import { useEffect, useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'

import RecipeCard from './RecipeCard'
import { TIERS } from '../hooks/useRecipeSuggestions'
import { tierTitle } from '../assets/aiRecipe'
import './RecipeTiers.css'

function Elapsed({ running }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) {
      return
    }

    const startedAt = Date.now()
    const timer = setInterval(() => {
      setSeconds(Math.round((Date.now() - startedAt) / 1000))
    }, 500)

    return () => clearInterval(timer)
  }, [running])

  return running ? `${seconds}s` : ''
}

function TierSubtitle({ tier }) {
  if (tier === 0) return 'Só com o que está na sua despensa (e água)'
  if (tier === 1) return 'Compre só mais 1 item'
  return `Compre mais ${tier} itens`
}

// Um bloco por quantidade de ingredientes que faltam (0, 1, 2 e 3),
// cada um com a receita criada pela IA e o botão "Rodar outra".
function RecipeTiers({ slots, onAgain, onCancel, onSelect }) {
  const busy = TIERS.some(
    (tier) => slots[tier].status === 'loading' || slots[tier].status === 'queued',
  )

  return (
    <>
      {busy && (
        <div className="tiers-intro" role="status" aria-live="polite">
          <p>
            A IA cria uma receita de cada vez. Isso pode levar de alguns
            segundos a poucos minutos por receita.
          </p>
          <button
            type="button"
            className="ai-recipe-button is-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      )}

      {TIERS.map((tier) => {
        const slot = slots[tier]
        const waiting = slot.status === 'queued'
        const loading = slot.status === 'loading'

        return (
          <section
            className="tier"
            key={tier}
            aria-label={tierTitle(tier)}
            data-tier={tier}
          >
            <div className="tier-heading">
              <h2>{tierTitle(tier)}</h2>
              <span>
                <TierSubtitle tier={tier} />
              </span>
            </div>

            {slot.status === 'idle' && (
              <div className="ai-recipe-box">
                <p>Nenhuma receita criada neste bloco ainda.</p>
                <button
                  type="button"
                  className="ai-recipe-button"
                  onClick={() => onAgain(tier)}
                >
                  Gerar receita
                </button>
              </div>
            )}

            {(waiting || loading) && (
              <div
                className="ai-recipe-box is-loading"
                role="status"
                aria-live="polite"
              >
                <CircularProgress size={22} sx={{ color: '#2f6b45' }} />
                <div>
                  <strong>
                    {waiting ? (
                      'Na fila…'
                    ) : (
                      <>
                        Criando sua receita… <Elapsed running={loading} />
                      </>
                    )}
                  </strong>
                  <p>
                    {waiting
                      ? 'Esta receita será criada logo depois da anterior.'
                      : 'Conferindo ingredientes e modo de preparo.'}
                  </p>
                </div>
              </div>
            )}

            {slot.status === 'error' && (
              <div className="ai-recipe-box is-error" role="alert">
                <div>
                  <strong>Não foi possível gerar a receita</strong>
                  <p>{slot.error}</p>
                </div>
                <button
                  type="button"
                  className="ai-recipe-button"
                  onClick={() => onAgain(tier)}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {slot.status === 'success' && slot.recipe && (
              <>
                <div className="ai-recipe-result">
                  <RecipeCard recipe={slot.recipe} onSelect={onSelect} />
                </div>

                <div className="ai-recipe-result-actions">
                  <button
                    type="button"
                    className="ai-recipe-button is-secondary"
                    onClick={() => onAgain(tier)}
                  >
                    Rodar outra
                  </button>

                  {slot.error && (
                    <p className="ai-recipe-inline-error" role="alert">
                      {slot.error}
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        )
      })}
    </>
  )
}

export default RecipeTiers
