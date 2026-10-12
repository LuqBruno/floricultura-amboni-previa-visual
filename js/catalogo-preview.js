// Catálogo estático de demonstração baseado no seed de desenvolvimento do projeto.
// Não contém produtos, preços ou estoque confirmados pela Floricultura Amboni.
const categorias = [
  { slug: "buques", nome: "Buquês e ramalhetes", frase: "", tom: "creme", imagem: "assets/buque-conceito.webp" },
  { slug: "cestas", nome: "Cestas", frase: "", tom: "oliva", imagem: "assets/cesta-conceito.webp" },
  { slug: "flores-funebres", nome: "Flores fúnebres", frase: "", tom: "creme", imagem: "assets/flores-funebres-conceito.webp" }
];

const produto = (id, categoria, nome, descricao, dados) => {
  const variacoes = dados.map(([rotulo, cor, tamanho, precoCentavos, estoque], i) => ({
    id: id * 100 + i + 1,
    rotulo,
    cor,
    tamanho,
    precoCentavos,
    estoque,
    imagem: null,
    disponivel: estoque > 0 && precoCentavos !== null
  }));
  const disponiveis = variacoes.filter((v) => v.disponivel);
  const base = disponiveis.length ? disponiveis : variacoes.filter((v) => v.precoCentavos !== null);
  const precos = base.map((v) => v.precoCentavos);
  const precoCentavos = precos.length ? Math.min(...precos) : null;
  return {
    id,
    categoria,
    nome,
    descricao,
    imagem: null,
    exemplo: true,
    preparoMinutos: null,
    precoCentavos,
    aPartirDe: precos.length > 0 && Math.max(...precos) !== precoCentavos,
    disponivel: disponiveis.length > 0,
    variacoes
  };
};

export const catalogoPreview = {
  categorias,
  produtos: [
    produto(1, "buques", "Buquê de exemplo 1", "Produto de exemplo para testar o site. A descrição real vem do catálogo da loja.", [
      ["Branco · Médio", "Branco", "Médio", 10000, 5],
      ["Branco · Grande", "Branco", "Grande", 15000, 3],
      ["Rosa · Médio", "Rosa", "Médio", 10000, 4],
      ["Rosa · Grande", "Rosa", "Grande", 15000, 0]
    ]),
    produto(2, "buques", "Buquê de exemplo 2", "Produto de exemplo, sem variações.", [["Padrão", null, null, 12000, 8]]),
    produto(3, "buques", "Buquê de exemplo 3 (esgotado)", "Exemplo para testar o bloqueio de item esgotado.", [["Padrão", null, null, 9000, 0]]),
    produto(4, "cestas", "Cesta de exemplo 1", "Produto de exemplo para testar tamanhos.", [
      ["Pequena", null, "Pequena", 13000, 6],
      ["Grande", null, "Grande", 22000, 2]
    ]),
    produto(5, "cestas", "Cesta de exemplo 2", "Produto de exemplo, sem variações.", [["Padrão", null, null, 18000, 5]]),
    produto(6, "flores-funebres", "Arranjo de exemplo 1", "Produto de exemplo.", [["Padrão", null, null, 25000, 4]]),
    produto(7, "flores-funebres", "Arranjo de exemplo 2", "Produto de exemplo para testar tamanhos.", [
      ["Médio", null, "Médio", 20000, 3],
      ["Grande", null, "Grande", 32000, 1]
    ]),
    produto(8, "flores-funebres", "Arranjo de exemplo 3 (preço a confirmar)", "Exemplo de item sem preço definido: não pode ser comprado.", [["Padrão", null, null, null, 5]])
  ]
};
