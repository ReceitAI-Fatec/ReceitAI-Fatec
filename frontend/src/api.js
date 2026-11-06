// Cliente da API do ReceitAI.
// Em desenvolvimento o Vite faz proxy de /api -> back-end (vite.config.js);
// em produção o nginx faz o mesmo (nginx.conf). Assim não há problema de CORS.
// Para apontar para outro servidor, defina VITE_API_URL (ex.: http://192.168.0.10:8000).
const BASE = import.meta.env.VITE_API_URL ?? '/api'

// FastAPI devolve `detail` como texto, ou como lista quando a validação falha
function textoDoErro(detail) {
  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => String(item?.msg ?? '').replace(/^Value error, /, ''))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

async function pedir(caminho, opcoes) {
  const resposta = await fetch(`${BASE}${caminho}`, opcoes)

  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status}`

    try {
      const corpo = await resposta.json()
      mensagem = textoDoErro(corpo.detail) || mensagem
    } catch {
      // resposta sem JSON (ex.: página de erro do nginx)
    }

    const erro = new Error(mensagem)
    erro.status = resposta.status
    throw erro
  }

  return resposta.json()
}

// Retorna { nome, ingredientes: [], modo_preparo: [], tempo_minutos }
// opcoes: { modelo, signal } — signal (AbortController) permite cancelar a espera.
export function gerarReceitaPorTexto(
  ingredientes,
  restricoes = [],
  { modelo, signal } = {},
) {
  return pedir('/receitas/texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredientes,
      restricoes,
      ...(modelo ? { modelo } : {}),
    }),
    signal,
  })
}

// audio: Blob/File (ex.: gravado com MediaRecorder). Retorna { transcricao, receita }
export function gerarReceitaPorVoz(audio, { signal } = {}) {
  const form = new FormData()
  form.append('audio', audio, audio.name || 'gravacao.webm')
  return pedir('/receitas/voz', { method: 'POST', body: form, signal })
}

// imagem: File. Retorna { ingredientes_detectados, receita }
export function gerarReceitaPorImagem(imagem, { signal } = {}) {
  const form = new FormData()
  form.append('imagem', imagem, imagem.name || 'foto.jpg')
  return pedir('/receitas/imagem', { method: 'POST', body: form, signal })
}

export function verificarSaude() {
  return pedir('/health')
}

// Catálogo de ingredientes (compartilhado, salvo no banco)
// Retorna [{ id, valor, nome, basico, proprio }]
export function listarIngredientes({ signal } = {}) {
  return pedir('/ingredientes', { signal })
}

// Adiciona um ingrediente novo. Retorna { id, valor, nome, basico, proprio, criado }
export function criarIngrediente(nome) {
  return pedir('/ingredientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome }),
  })
}

// UMA receita que falta exatamente `faltantes` ingredientes.
// `evitar`: nomes de receitas já mostradas (para o "Rodar outra" variar).
export function sugerirReceita(
  { ingredientes, faltantes, categorias, tempoMax, restricoes, evitar },
  { signal } = {},
) {
  return pedir('/receitas/sugerir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ingredientes,
      faltantes,
      categorias,
      restricoes,
      evitar,
      ...(tempoMax ? { tempo_max: Number(tempoMax) } : {}),
    }),
    signal,
  })
}
