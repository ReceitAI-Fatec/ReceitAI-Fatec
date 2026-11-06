"""ReceitAI - API (FastAPI + Ollama + PostgreSQL + faster-whisper).

Usados pelo front-end React:
  GET  /ingredientes        catálogo de ingredientes (fixos + os que as pessoas adicionaram)
  POST /ingredientes        adiciona um ingrediente novo; fica salvo no banco para a próxima vez
  POST /receitas/sugerir    UMA receita por chamada, faltando exatamente N ingredientes

Testes e demonstrações:
  POST /receitas/texto | /receitas/voz | /receitas/imagem      GET /health /demo /comparar
"""
import asyncio
import base64
import contextlib
import json
import os
import random
import re
import tempfile
import threading
import time
import unicodedata
import uuid

import httpx
import psycopg
from fastapi import FastAPI, File, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field, field_validator

OLLAMA = os.getenv("OLLAMA_URL", "http://ollama:11434")
LLM = os.getenv("LLM_MODEL", "qwen2.5:7b")
VISION = os.getenv("VISION_MODEL", "llava:7b")
WHISPER = os.getenv("WHISPER_MODEL", "small")
DB_URL = os.getenv("DATABASE_URL")
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if o.strip()
]

# Rótulos idênticos aos do front-end (RecipeFilters.jsx)
CATEGORIAS = ["Café da manhã", "Almoço", "Jantar", "Lanche"]
MAX_TENTATIVAS = 3
# A Cloudflare corta requisições com mais de ~100 s; não adianta insistir além disso
ORCAMENTO_SEGUNDOS = int(os.getenv("ORCAMENTO_SEGUNDOS", "240"))
LIMITE_INGREDIENTES_PROPRIOS = 500


# --------------------------------------------------------------------------
# Texto: normalização e comparação de ingredientes
# --------------------------------------------------------------------------
def norm(texto: str) -> str:
    """minúsculo, sem acentos, só letras/números separados por espaço."""
    s = unicodedata.normalize("NFD", texto or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def radical(p: str) -> str:
    """Singular grosseiro: ovos->ovo, limoes->limao, tomates->tomate."""
    if p == "paes":
        return "pao"
    if len(p) > 4 and p.endswith(("oes", "aes")):
        return p[:-3] + "ao"
    if len(p) > 3 and p.endswith("s") and not p.endswith("ss"):
        return p[:-1]
    return p


def tokens(texto: str) -> list[str]:
    return [radical(t) for t in norm(texto).split()]


def chave(texto: str) -> str:
    """Identificador estável de um ingrediente: "Ovos" e "ovo" geram a mesma chave."""
    return " ".join(tokens(texto))


def _frase(texto: str) -> str:
    return " " + chave(texto) + " "


# palavras que descrevem preparo/corte e não mudam o ingrediente ("cebola picada")
MODIFICADORES = {
    radical(w)
    for w in (
        "picado picada ralado ralada fatiado fatiada cozido cozida cru crua fresco fresca "
        "em de do da dos das cubo cubos fatia fatias rodela rodelas batido batida amassado "
        "amassada maduro madura desfiado desfiada moido moida pedaco pedacos pequeno grande "
        "medio media inteiro inteira fino fina grosso grossa dente folha peito coxa sobrecoxa "
        "file suco raspa raspas integral desnatado"
    ).split()
}


def combina(nome_ing: str, nome_despensa: str) -> bool:
    """True se o ingrediente da receita é o mesmo item da despensa."""
    a, b = tokens(nome_ing), tokens(nome_despensa)
    if not a or not b:
        return False
    if a == b:
        return True
    if set(b) <= set(a):
        return all(t in MODIFICADORES for t in a if t not in b)
    return False


def parecida(a: str, b: str) -> bool:
    """Duas receitas com nomes praticamente iguais ("Arroz de ovo" x "Ovo com arroz")."""
    ligacoes = {"com", "e", "ao", "a", "o", "na", "no", "ao", "a"}
    ta = set(tokens(a)) - MODIFICADORES - ligacoes
    tb = set(tokens(b)) - MODIFICADORES - ligacoes
    if not ta or not tb:
        return norm(a) == norm(b)
    return len(ta & tb) / len(ta | tb) >= 0.75


def e_agua(nome: str) -> bool:
    """Água é o único item que consideramos sempre disponível."""
    return tokens(nome)[:1] == ["agua"]


# Itens "básicos": não contam como ingrediente principal da receita
BASICOS_CHAVES = {chave(x) for x in ("sal", "azeite", "óleo", "pimenta-do-reino", "pimenta", "vinagre", "água")}


# --------------------------------------------------------------------------
# Restrições alimentares (regras conservadoras: na dúvida, não marca)
# --------------------------------------------------------------------------
_CARNES = [
    "frango", "galinha", "carne", "boi", "bovina", "porco", "suíno", "bacon", "linguiça",
    "calabresa", "presunto", "peixe", "atum", "sardinha", "salmão", "tilápia", "bacalhau",
    "camarão", "lula", "polvo", "salsicha", "peru", "costela", "bife", "filé", "picanha",
    "alcatra", "patinho", "acém", "coxão", "paleta", "lombo", "pernil", "mortadela", "salame",
    "gelatina", "hambúrguer", "almôndega", "fígado", "caldo de carne", "caldo de galinha",
]
_LATICINIOS = [
    "leite", "queijo", "manteiga", "creme de leite", "iogurte", "requeijão", "nata",
    "mussarela", "muçarela", "parmesão", "ricota", "cream cheese", "coalhada", "cheddar",
    "provolone", "gorgonzola", "catupiry", "chantilly", "margarina",
]
_OVOS = ["ovo", "clara", "gema", "maionese", "merengue"]
_GLUTEN = [
    "trigo", "farinha de trigo", "macarrão", "pão", "farinha de rosca", "panko", "aveia",
    "cevada", "centeio", "malte", "cerveja", "biscoito", "bolacha", "torrada", "lasanha",
    "espaguete", "penne", "nhoque", "pizza", "empanado", "seitan", "shoyu", "molho de soja",
    "bulgur", "semolina", "cuscuz marroquino",
]
_ACUCAR = [
    "açúcar", "mel", "melado", "xarope", "geleia", "leite condensado", "chocolate", "goiabada",
    "doce de leite", "rapadura", "caramelo", "glucose", "calda",
]
REGRAS_DIETA = {
    "Vegano": [_frase(t) for t in _CARNES + _LATICINIOS + _OVOS + ["mel"]],
    "Vegetariano": [_frase(t) for t in _CARNES],
    "Sem glúten": [_frase(t) for t in _GLUTEN],
    "Sem lactose": [_frase(t) for t in _LATICINIOS],
    "Zero açúcar": [_frase(t) for t in _ACUCAR],
}
DESCRICAO_DIETA = {
    "Vegano": "sem nenhum ingrediente de origem animal (carne, peixe, ovo, leite, queijo, manteiga, mel)",
    "Vegetariano": "sem carne, peixe ou frutos do mar",
    "Sem glúten": "sem trigo, aveia, cevada, centeio, macarrão, pão ou farinha de rosca",
    "Sem lactose": "sem leite, queijo, manteiga, iogurte ou creme de leite",
    "Zero açúcar": "sem açúcar, mel ou outros adoçantes",
}


def viola(nome_ingrediente: str, dieta: str) -> bool:
    f = _frase(nome_ingrediente)
    return any(t in f for t in REGRAS_DIETA[dieta])


def dietas_atendidas(nomes: list[str]) -> list[str]:
    return [d for d in REGRAS_DIETA if not any(viola(n, d) for n in nomes)]


# --------------------------------------------------------------------------
# Ollama
# --------------------------------------------------------------------------
class ErroOllama(Exception):
    pass


async def ollama_chat(model, content, images=None, fmt=None, tentativa=0, timeout=300):
    """Uma chamada ao Ollama. Levanta ErroOllama em qualquer falha."""
    msg = {"role": "user", "content": content}
    if images:
        msg["images"] = images
    body = {
        "model": model,
        "messages": [msg],
        "stream": False,
        "options": {
            "num_predict": 900,
            "num_ctx": 4096,
            "temperature": min(0.3 + 0.15 * tentativa, 0.9),
            "repeat_penalty": 1.1,
            "top_p": 0.9,
            "seed": random.randint(1, 2**31 - 1),  # "rodar outra" precisa variar
        },
    }
    if fmt:
        body["format"] = fmt
    try:
        async with httpx.AsyncClient(timeout=timeout) as c:
            r = await c.post(f"{OLLAMA}/api/chat", json=body)
    except httpx.HTTPError as e:
        raise ErroOllama(f"{type(e).__name__}: {e}") from e
    if r.status_code != 200:
        raise ErroOllama(r.text)
    return r.json()["message"]["content"]


async def ollama_chat_com_retry(model, content, images=None, fmt=None):
    """Para os endpoints de teste: repete se o modelo entrar em loop."""
    ultimo = ""
    for t in range(MAX_TENTATIVAS):
        try:
            return await ollama_chat(model, content, images, fmt, tentativa=t)
        except ErroOllama as e:
            ultimo = str(e)
            if "repeat limit" not in ultimo:
                break
    raise HTTPException(502, f"Ollama: {ultimo}")


# --------------------------------------------------------------------------
# Banco (PostgreSQL): catálogo de ingredientes e histórico
# --------------------------------------------------------------------------
# (nome, básico). Os "básicos" aparecem no botão "Adicionar básicos" da tela.
INGREDIENTES_INICIAIS = [
    ("Arroz", False), ("Feijão", False), ("Ovo", False), ("Tomate", False),
    ("Cebola", False), ("Alho", False), ("Frango", False), ("Batata", False),
    ("Cenoura", False), ("Macarrão", False), ("Queijo", False), ("Leite", False),
    ("Alface", False), ("Limão", False), ("Banana", False), ("Aveia", False),
    ("Açúcar", False), ("Farinha de trigo", False), ("Manteiga", False),
    ("Sal", True), ("Azeite", True), ("Óleo", True), ("Pimenta-do-reino", True),
]

_schema_pronto = False
_schema_lock = threading.Lock()


def _conn():
    return psycopg.connect(DB_URL, connect_timeout=3, autocommit=True)


def garantir_schema():
    """Cria as tabelas (se não existirem) e cadastra os ingredientes iniciais."""
    global _schema_pronto
    if _schema_pronto or not DB_URL:
        return
    with _schema_lock:
        if _schema_pronto:
            return
        with _conn() as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS ingredientes ("
                "id serial PRIMARY KEY, nome text NOT NULL, chave text NOT NULL UNIQUE, "
                "basico boolean NOT NULL DEFAULT false, proprio boolean NOT NULL DEFAULT false, "
                "criado timestamptz NOT NULL DEFAULT now())"
            )
            conn.execute(
                "CREATE TABLE IF NOT EXISTS historico (id serial PRIMARY KEY, entrada text, "
                "receita jsonb, criado timestamptz DEFAULT now())"
            )
            for nome, basico in INGREDIENTES_INICIAIS:
                conn.execute(
                    "INSERT INTO ingredientes (nome, chave, basico) VALUES (%s, %s, %s) "
                    "ON CONFLICT (chave) DO NOTHING",
                    (nome, chave(nome), basico),
                )
        _schema_pronto = True


@contextlib.asynccontextmanager
async def lifespan(_app):
    if DB_URL:
        for _ in range(15):  # o banco pode demorar alguns segundos para ficar pronto
            try:
                await asyncio.to_thread(garantir_schema)
                break
            except Exception as e:
                print(f"[banco] aguardando: {type(e).__name__}: {e}", flush=True)
                await asyncio.sleep(2)
    yield


app = FastAPI(title="ReceitAI API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"]
)
_whisper = None


def _linha_ingrediente(r) -> dict:
    return {"id": r[0], "valor": r[2], "nome": r[1], "basico": r[3], "proprio": r[4]}


def _exigir_banco():
    if not DB_URL:
        raise HTTPException(503, "Banco de dados não configurado (DATABASE_URL).")
    try:
        garantir_schema()
    except Exception as e:
        raise HTTPException(503, f"Banco de dados indisponível: {type(e).__name__}") from e


class NovoIngrediente(BaseModel):
    nome: str

    @field_validator("nome")
    @classmethod
    def _limpar(cls, v: str) -> str:
        v = re.sub(r"\s+", " ", v).strip()
        if not 2 <= len(v) <= 40:
            raise ValueError("O nome do ingrediente deve ter entre 2 e 40 caracteres.")
        if not v[0].isalnum() or any(not (c.isalnum() or c in " -'’.()") for c in v):
            raise ValueError("Use apenas letras, números, espaços e hífen no nome do ingrediente.")
        if sum(c.isalpha() for c in v) < 2 or not chave(v):
            raise ValueError("Digite o nome de um ingrediente.")
        return v[0].upper() + v[1:]


@app.get("/ingredientes")
def listar_ingredientes():
    _exigir_banco()
    with _conn() as conn:
        linhas = conn.execute(
            "SELECT id, nome, chave, basico, proprio FROM ingredientes ORDER BY id"
        ).fetchall()
    return [_linha_ingrediente(r) for r in linhas]


@app.post("/ingredientes")
def criar_ingrediente(novo: NovoIngrediente, response: Response):
    """Adiciona ao catálogo. Se já existir (ex.: "Ovos" -> "Ovo"), devolve o existente."""
    _exigir_banco()
    k = chave(novo.nome)
    with _conn() as conn:
        total = conn.execute("SELECT count(*) FROM ingredientes WHERE proprio").fetchone()[0]
        if total >= LIMITE_INGREDIENTES_PROPRIOS:
            raise HTTPException(409, "Limite de ingredientes adicionados atingido.")
        linha = conn.execute(
            "INSERT INTO ingredientes (nome, chave, proprio) VALUES (%s, %s, true) "
            "ON CONFLICT (chave) DO NOTHING RETURNING id, nome, chave, basico, proprio",
            (novo.nome, k),
        ).fetchone()
        criado = linha is not None
        if not criado:
            linha = conn.execute(
                "SELECT id, nome, chave, basico, proprio FROM ingredientes WHERE chave = %s", (k,)
            ).fetchone()
    response.status_code = 201 if criado else 200
    return {**_linha_ingrediente(linha), "criado": criado}


@app.delete("/ingredientes/{ingrediente_id}", status_code=204)
def remover_ingrediente(ingrediente_id: int):
    """Só remove ingredientes adicionados por pessoas (os iniciais ficam)."""
    _exigir_banco()
    with _conn() as conn:
        r = conn.execute(
            "DELETE FROM ingredientes WHERE id = %s AND proprio RETURNING id", (ingrediente_id,)
        ).fetchone()
    if not r:
        raise HTTPException(404, "Ingrediente não encontrado ou não pode ser removido.")


def _gravar_historico(entrada: str, receita: dict):
    garantir_schema()
    with _conn() as conn:
        conn.execute(
            "INSERT INTO historico (entrada, receita) VALUES (%s, %s)", (entrada, Jsonb(receita))
        )


async def salvar_historico(entrada: str, receita: dict):
    if not DB_URL:
        return
    try:
        await asyncio.to_thread(_gravar_historico, entrada, receita)
    except Exception as e:  # o histórico nunca pode derrubar a resposta
        print(f"[historico] não gravou: {type(e).__name__}: {e}", flush=True)


# --------------------------------------------------------------------------
# /receitas/sugerir  (front-end)
# --------------------------------------------------------------------------
class Sugestao(BaseModel):
    ingredientes: list[str] = Field(min_length=1, max_length=40)
    faltantes: int = Field(default=0, ge=0, le=5)  # quantos ingredientes a pessoa NÃO tem
    categorias: list[str] = []
    tempo_max: int | None = Field(default=None, ge=5, le=600)
    restricoes: list[str] = []
    evitar: list[str] = Field(default=[], max_length=20)  # receitas já mostradas ("rodar outra")
    modelo: str | None = Field(default=None, max_length=80, pattern=r"^[\w.:/\-]+$")

    @field_validator("ingredientes", "evitar")
    @classmethod
    def _limpar(cls, v):
        limpos = [re.sub(r"\s+", " ", x).strip()[:60] for x in v]
        return [x for x in limpos if x]

    @field_validator("categorias")
    @classmethod
    def _categorias(cls, v):
        ruins = [x for x in v if x not in CATEGORIAS]
        if ruins:
            raise ValueError(f"categorias inválidas: {ruins}. Use: {CATEGORIAS}")
        return v

    @field_validator("restricoes")
    @classmethod
    def _restricoes(cls, v):
        ruins = [x for x in v if x not in REGRAS_DIETA]
        if ruins:
            raise ValueError(f"restrições inválidas: {ruins}. Use: {list(REGRAS_DIETA)}")
        return v


def schema_receita(categorias: list[str]) -> dict:
    return {
        "type": "object",
        "properties": {
            "nome": {"type": "string"},
            "descricao": {"type": "string"},
            "categoria": {"type": "string", "enum": categorias},
            "tempo_minutos": {"type": "integer"},
            "porcoes": {"type": "integer"},
            "ingredientes": {
                "type": "array",
                "minItems": 2,
                "maxItems": 12,
                "items": {
                    "type": "object",
                    "properties": {
                        "nome": {"type": "string"},
                        "quantidade": {"type": "string"},
                    },
                    "required": ["nome", "quantidade"],
                },
            },
            "modo_preparo": {
                "type": "array",
                "minItems": 3,
                "maxItems": 10,
                "items": {"type": "string"},
            },
        },
        "required": [
            "nome", "descricao", "categoria", "tempo_minutos", "porcoes",
            "ingredientes", "modo_preparo",
        ],
    }


def montar_prompt(s: Sugestao, despensa: list[str], categorias: list[str], min_uso: int, motivo: str = "") -> str:
    n = s.faltantes
    if n == 0:
        regra_extras = (
            "A receita NÃO pode ter nenhum ingrediente fora da lista. Água é permitida e não conta."
        )
    else:
        plural = "ingredientes" if n > 1 else "ingrediente"
        regra_extras = (
            f"A receita deve ter EXATAMENTE {n} {plural} que NÃO {'estão' if n > 1 else 'está'} na lista "
            f"(chamados de extras): nem a mais, nem a menos. Escolha extras comuns, fáceis de achar em "
            f"mercado no Brasil e que combinem de verdade com o prato. Água é permitida e não conta como extra."
        )
    linhas = [
        "Você é um chef de cozinha brasileiro experiente. Crie UMA receita real, simples e que funciona "
        "de verdade, em português do Brasil.",
        "",
        f"INGREDIENTES QUE A PESSOA TEM EM CASA: {'; '.join(despensa)}.",
        "",
        "REGRAS (siga todas):",
        f"1. Use pelo menos {min_uso} ingrediente(s) da lista (não conte sal, azeite, óleo e pimenta). "
        "Não precisa usar todos: use só os que combinam entre si.",
        f"2. {regra_extras}",
        "3. Tudo que não está na lista conta como extra, inclusive sal, açúcar, óleo, azeite, manteiga, "
        "temperos, pimenta, caldos e farinhas. Só use esses itens se estiverem na lista ou se forem um dos "
        "extras permitidos.",
        '4. Para ingredientes da lista, escreva o nome exatamente como está na lista (singular, sem '
        'preparo, ex.: "Ovo", "Cebola") e ponha a quantidade e o preparo no campo "quantidade" '
        '(ex.: "2 unidades", "1 cebola média picada", "1 xícara").',
        "5. A receita precisa fazer sentido culinário: nada de açúcar em prato salgado nem misturas "
        "estranhas. Prefira pratos conhecidos da cozinha brasileira ou caseira.",
        "6. Liste TODOS os ingredientes usados, com quantidades realistas para a quantidade de porções.",
        '7. "modo_preparo": de 4 a 8 passos curtos, na ordem certa, sem numeração, com tempo e ponto de '
        "cozimento quando importar. Todo ingrediente listado deve aparecer em algum passo, e nenhum passo "
        "pode citar ingrediente que não esteja na lista de ingredientes (exceto água).",
        '8. "tempo_minutos": tempo total realista, número inteiro'
        + (f", no máximo {s.tempo_max}." if s.tempo_max else "."),
        f'9. "categoria": escolha uma entre {", ".join(categorias)}. "descricao": uma frase curta e '
        'apetitosa. "porcoes": número inteiro de 1 a 6.',
    ]
    if s.restricoes:
        linhas.append(
            "10. Restrições obrigatórias: "
            + "; ".join(f"{d} ({DESCRICAO_DIETA[d]})" for d in s.restricoes)
            + "."
        )
    if s.evitar:
        linhas.append("Não repita nem faça variações destas receitas já sugeridas: " + "; ".join(s.evitar) + ".")
    linhas += [
        "",
        "Como contar os extras (só para entender a regra, não copie): se a lista é 'Arroz; Ovo' e a "
        "receita usa Arroz, Ovo, Cebola e Sal, os extras são Cebola e Sal, ou seja, 2 extras.",
    ]
    if motivo:
        linhas += ["", f"ATENÇÃO: sua resposta anterior foi rejeitada porque {motivo}. Corrija exatamente isso."]
    linhas += ["", "Responda apenas com o JSON no formato pedido."]
    return "\n".join(linhas)


def classificar_ingredientes(brutos, despensa: list[str]) -> list[dict]:
    """Casa cada ingrediente da receita com a despensa e junta duplicados."""
    vistos, saida = set(), []
    for i in brutos if isinstance(brutos, list) else []:
        if not isinstance(i, dict):
            continue
        nome = re.sub(r"\s+", " ", str(i.get("nome", ""))).strip()
        if not nome:
            continue
        canon = next((d for d in despensa if combina(nome, d)), None)
        final = canon or (nome[:1].upper() + nome[1:])
        k = norm(final)
        if k in vistos:
            continue
        vistos.add(k)
        saida.append(
            {
                "nome": final,
                "quantidade": re.sub(r"\s+", " ", str(i.get("quantidade", ""))).strip(),
                "disponivel": bool(canon) or e_agua(nome),
                "_da_lista": bool(canon),
            }
        )
    return saida


def _passos(bruto) -> list[str]:
    lista = bruto if isinstance(bruto, list) else []
    passos = [re.sub(r"^\s*\d+\s*[\.\)\-:]\s*", "", str(p)).strip() for p in lista]
    return [p for p in passos if p]


def _nao_citados(ings: list[dict], passos: list[str]) -> list[str]:
    """Ingredientes listados que nenhum passo menciona."""
    vocab = {t for p in passos for t in tokens(p)}
    saida = []
    for i in ings:
        if e_agua(i["nome"]):
            continue
        centrais = [t for t in tokens(i["nome"]) if t not in MODIFICADORES]
        if centrais and not any(t in vocab for t in centrais):
            saida.append(i["nome"])
    return saida


def validar_e_formatar(bruto: str, s: Sugestao, categorias: list[str], min_uso: int):
    """Devolve (receita, None) se válida, ou (None, motivo_da_rejeição)."""
    try:
        d = json.loads(bruto)
    except (json.JSONDecodeError, TypeError):
        return None, "a resposta não era um JSON válido"
    if not isinstance(d, dict):
        return None, "o formato estava inesperado"

    nome = re.sub(r"\s+", " ", str(d.get("nome", ""))).strip()
    if len(nome) < 3:
        return None, "faltou o nome da receita"
    repetida = next((x for x in s.evitar if parecida(nome, x)), None)
    if repetida:
        return None, f'"{nome}" é igual ou parecida com "{repetida}", que já foi sugerida; crie um prato diferente'

    categoria = str(d.get("categoria", "")).strip()
    if categoria not in categorias:
        return None, f"a categoria deve ser uma entre {', '.join(categorias)}"

    try:
        tempo = int(d.get("tempo_minutos"))
    except (TypeError, ValueError):
        return None, "tempo_minutos era inválido"
    if tempo < 1:
        return None, "tempo_minutos era inválido"
    if s.tempo_max and tempo > s.tempo_max:
        return None, f"levou {tempo} min, mas o máximo é {s.tempo_max} min"

    try:
        porcoes = max(1, min(12, int(d.get("porcoes"))))
    except (TypeError, ValueError):
        porcoes = 2

    ings = classificar_ingredientes(d.get("ingredientes"), s.ingredientes)
    if len(ings) < 2:
        return None, "faltaram ingredientes"

    principais = [i for i in ings if i["_da_lista"] and chave(i["nome"]) not in BASICOS_CHAVES]
    if len(principais) < min_uso:
        return None, f"usou só {len(principais)} ingrediente(s) da lista, mas precisa usar pelo menos {min_uso}"

    extras = [i["nome"] for i in ings if not i["disponivel"]]
    if len(extras) != s.faltantes:
        achados = ", ".join(extras) if extras else "nenhum"
        if s.faltantes == 0:
            dica = "use somente ingredientes da lista (e água)"
        else:
            dica = f"deve ter exatamente {s.faltantes} extra(s): tire ou acrescente para fechar essa conta"
        return None, f"a receita tem {len(extras)} ingrediente(s) fora da lista ({achados}); {dica}"

    for dieta in s.restricoes:
        for i in ings:
            if viola(i["nome"], dieta):
                return None, f'"{i["nome"]}" não é compatível com a restrição {dieta}'

    passos = _passos(d.get("modo_preparo"))
    if len(passos) < 3:
        return None, "faltaram passos no modo de preparo"
    ausentes = _nao_citados(ings, passos)
    if len(ausentes) > max(1, len(ings) // 3):
        return None, f"estes ingredientes não aparecem no modo de preparo: {', '.join(ausentes)}"

    disponiveis = sum(1 for i in ings if i["disponivel"])
    return (
        {
            "id": uuid.uuid4().hex[:12],
            "nome": nome,
            "descricao": re.sub(r"\s+", " ", str(d.get("descricao", ""))).strip(),
            "categoria": categoria,
            "tempo_minutos": tempo,
            "porcoes": porcoes,
            "restricoes": dietas_atendidas([i["nome"] for i in ings]),
            "ingredientes": [
                {"nome": i["nome"], "quantidade": i["quantidade"], "disponivel": i["disponivel"]}
                for i in ings
            ],
            "faltantes": extras,
            "compatibilidade": int(100 * disponiveis / len(ings) + 0.5),
            "modo_preparo": passos,
        },
        None,
    )


@app.post("/receitas/sugerir")
async def sugerir(s: Sugestao):
    categorias = s.categorias or CATEGORIAS
    modelo = s.modelo or LLM

    # Ingredientes da despensa que a restrição proíbe (ex.: Ovo para quem é vegano) não entram
    despensa = [i for i in s.ingredientes if not any(viola(i, d) for d in s.restricoes)]
    principais = [i for i in despensa if chave(i) not in BASICOS_CHAVES]
    if not principais:
        raise HTTPException(
            422,
            "Nenhum dos ingredientes escolhidos (além de básicos como sal e azeite) combina com as "
            "restrições selecionadas. Adicione outros ingredientes ou retire alguma restrição.",
        )
    min_uso = min(2, len(principais))

    inicio = time.monotonic()
    motivo, ultimo_erro, falhas_ollama, tentativas = "", "", 0, 0

    for t in range(MAX_TENTATIVAS):
        restante = ORCAMENTO_SEGUNDOS - (time.monotonic() - inicio)
        if t > 0 and restante < 20:
            break
        tentativas += 1
        try:
            bruto = await ollama_chat(
                modelo,
                montar_prompt(s, despensa, categorias, min_uso, motivo),
                fmt=schema_receita(categorias),
                tentativa=t,
                timeout=max(30, min(300, restante)),
            )
        except ErroOllama as e:
            ultimo_erro = str(e)
            if "not found" in ultimo_erro.lower():
                raise HTTPException(
                    502, f"Modelo '{modelo}' não está instalado no Ollama. Rode: ollama pull {modelo}"
                )
            falhas_ollama += 1
            motivo = "a geração travou em repetição; seja objetivo"
            continue
        receita, rejeicao = validar_e_formatar(bruto, s, categorias, min_uso)
        if receita:
            await salvar_historico(
                json.dumps(s.model_dump(exclude={"evitar"}), ensure_ascii=False), receita
            )
            return receita
        motivo = rejeicao

    if falhas_ollama == tentativas:
        raise HTTPException(502, f"Ollama: {ultimo_erro}")
    raise HTTPException(
        422,
        f"Não consegui gerar uma receita que atenda a tudo ({motivo}). "
        "Tente de novo ou use outros ingredientes.",
    )


# --------------------------------------------------------------------------
# Endpoints de teste (texto / voz / imagem) - resposta simples
# --------------------------------------------------------------------------
SCHEMA_SIMPLES = {
    "type": "object",
    "properties": {
        "nome": {"type": "string"},
        "ingredientes": {"type": "array", "items": {"type": "string"}},
        "modo_preparo": {"type": "array", "items": {"type": "string"}},
        "tempo_minutos": {"type": "integer"},
    },
    "required": ["nome", "ingredientes", "modo_preparo", "tempo_minutos"],
}


class Entrada(BaseModel):
    ingredientes: list[str]
    restricoes: list[str] = []
    modelo: str | None = None


async def gerar_receita_simples(texto: str, restricoes=(), modelo=None):
    prompt = (
        "Você é um chef. Com base no texto abaixo, sugira UMA receita em português do Brasil. "
        "Responda apenas JSON com as chaves: nome, ingredientes (lista), modo_preparo (lista de passos), "
        "tempo_minutos. Use somente ingredientes citados, mais água. "
        "Não use açúcar em pratos salgados.\n"
        f"Restrições: {', '.join(restricoes) or 'nenhuma'}\nTexto: {texto}"
    )
    saida = await ollama_chat_com_retry(modelo or LLM, prompt, fmt=SCHEMA_SIMPLES)
    try:
        receita = json.loads(saida)
    except json.JSONDecodeError:
        receita = {"bruto": saida}
    await salvar_historico(texto, receita)
    return receita


@app.post("/receitas/texto")
async def por_texto(e: Entrada):
    return await gerar_receita_simples(", ".join(e.ingredientes), e.restricoes, e.modelo)


@app.post("/receitas/voz")
async def por_voz(audio: UploadFile = File(...)):
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel

        _whisper = WhisperModel(WHISPER, device="cpu", compute_type="int8")
    sufixo = os.path.splitext(audio.filename or ".wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=sufixo) as f:
        f.write(await audio.read())
        f.flush()
        segs, _ = _whisper.transcribe(f.name, language="pt")
        texto = " ".join(s.text.strip() for s in segs)
    return {"transcricao": texto, "receita": await gerar_receita_simples(texto)}


@app.post("/receitas/imagem")
async def por_imagem(imagem: UploadFile = File(...)):
    b64 = base64.b64encode(await imagem.read()).decode()
    lista = await ollama_chat_com_retry(
        VISION,
        "Liste em português, separados por vírgula, os ingredientes visíveis nesta foto. Apenas a lista.",
        images=[b64],
    )
    return {"ingredientes_detectados": lista, "receita": await gerar_receita_simples(lista)}


# --------------------------------------------------------------------------
# Saúde e páginas de demonstração
# --------------------------------------------------------------------------
@app.get("/health")
def health():
    out = {"api": "ok"}
    try:
        with psycopg.connect(DB_URL, connect_timeout=3) as conn:
            conn.execute("SELECT 1")
        out["db"] = "ok"
    except Exception as e:
        out["db"] = f"erro: {e}"
    try:
        r = httpx.get(f"{OLLAMA}/api/tags", timeout=5)
        out["ollama"] = "ok"
        out["modelos"] = [m["name"] for m in r.json().get("models", [])]
    except Exception as e:
        out["ollama"] = f"erro: {e}"
    return out


def _pagina(nome: str):
    caminho = os.path.join(os.path.dirname(__file__), nome)
    if not os.path.exists(caminho):
        raise HTTPException(404, f"{nome} não encontrada")
    return FileResponse(caminho)


@app.get("/demo")
def demo():
    return _pagina("demo.html")


@app.get("/comparar")
def comparar():
    return _pagina("comparar.html")
