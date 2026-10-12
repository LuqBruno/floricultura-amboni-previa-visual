// Busca e filtros do catálogo. Usa só o que o servidor já entrega: nome, descrição, categoria, cor, tamanho,
// preço e disponibilidade. Nada aqui decide preço ou estoque: o filtro apenas esconde ou mostra produtos.

export const ORDENS = [
  ["padrao", "Ordem da loja"],
  ["menor-preco", "Menor preço"],
  ["maior-preco", "Maior preço"],
  ["nome", "Nome, de A a Z"]
];

export const semAcento = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const MAX_BUSCA = 80;

export const estadoVazio = () => ({ q: "", categoria: "", cor: "", disponiveis: false, ordem: "padrao" });

// Lê o estado a partir do endereço (?q=rosa&c=buques&cor=Rosa&disp=1&ordem=menor-preco). Valores estranhos viram vazio.
export function lerEstado(params, { categorias = [], cores = [] } = {}) {
  const estado = estadoVazio();
  estado.q = (params.get("q") || "").replace(/\s+/g, " ").trim().slice(0, MAX_BUSCA);
  const c = params.get("c") || "";
  if (categorias.some((x) => x.slug === c)) estado.categoria = c;
  const cor = params.get("cor") || "";
  if (cores.includes(cor)) estado.cor = cor;
  estado.disponiveis = params.get("disp") === "1";
  const ordem = params.get("ordem") || "";
  if (ORDENS.some(([v]) => v === ordem)) estado.ordem = ordem;
  return estado;
}

export function paraParams(estado, { categoriaFixa = null, base = new URLSearchParams() } = {}) {
  const p = new URLSearchParams(base);
  const definir = (chave, valor) => (valor ? p.set(chave, valor) : p.delete(chave));
  definir("q", estado.q);
  if (!categoriaFixa) definir("c", estado.categoria);
  definir("cor", estado.cor);
  definir("disp", estado.disponiveis ? "1" : "");
  definir("ordem", estado.ordem !== "padrao" ? estado.ordem : "");
  return p;
}

export const temFiltro = (estado, { categoriaFixa = null } = {}) =>
  Boolean(estado.q || estado.cor || estado.disponiveis || estado.ordem !== "padrao" || (!categoriaFixa && estado.categoria));

// Cores que existem nas variações do catálogo, sem repetir ("Rosa" e "rosa" contam uma vez), em ordem alfabética.
export function coresDoCatalogo(produtos) {
  const vistas = new Map();
  for (const p of produtos) {
    for (const v of p.variacoes || []) {
      if (v.cor && !vistas.has(semAcento(v.cor))) vistas.set(semAcento(v.cor), v.cor);
    }
  }
  return [...vistas.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function textoPesquisavel(produto, categoria) {
  const partes = [produto.nome, produto.descricao, categoria && categoria.nome];
  for (const v of produto.variacoes || []) partes.push(v.cor, v.tamanho, v.rotulo);
  return semAcento(partes.filter(Boolean).join(" "));
}

const temCor = (produto, cor, soDisponiveis) =>
  (produto.variacoes || []).some((v) => semAcento(v.cor) === semAcento(cor) && (!soDisponiveis || v.disponivel));

// Preço nulo ("a confirmar") vai sempre para o fim nas ordens por preço.
function comparador(ordem) {
  if (ordem === "nome") return (a, b) => a.nome.localeCompare(b.nome, "pt-BR");
  if (ordem === "menor-preco" || ordem === "maior-preco") {
    const sinal = ordem === "menor-preco" ? 1 : -1;
    return (a, b) => {
      if (a.precoCentavos == null && b.precoCentavos == null) return 0;
      if (a.precoCentavos == null) return 1;
      if (b.precoCentavos == null) return -1;
      return sinal * (a.precoCentavos - b.precoCentavos);
    };
  }
  return null;
}

// Todas as palavras digitadas precisam aparecer (sem diferenciar acento nem maiúscula).
export function filtrar(produtos, categorias, estado) {
  const porSlug = new Map(categorias.map((c) => [c.slug, c]));
  const palavras = semAcento(estado.q).split(" ").filter(Boolean);
  let lista = produtos.filter((p) => {
    if (estado.categoria && p.categoria !== estado.categoria) return false;
    if (estado.cor) {
      if (!temCor(p, estado.cor, estado.disponiveis)) return false;
    } else if (estado.disponiveis && !p.disponivel) return false;
    if (palavras.length) {
      const texto = textoPesquisavel(p, porSlug.get(p.categoria));
      if (!palavras.every((palavra) => texto.includes(palavra))) return false;
    }
    return true;
  });
  const comparar = comparador(estado.ordem);
  if (comparar) lista = [...lista].sort(comparar); // sort estável: empates mantêm a ordem da loja
  return lista;
}
