// Entrada exclusiva da prévia estática: apenas vitrine, busca, produto e sacola demonstrativa.
import { carregarCatalogo } from "./base.js";
import { iniciarCabecalho, iniciarMagneticos } from "./efeitos.js";
import { iniciarCortina, iniciarProgresso, iniciarToque } from "./fluidez.js";
import { montarLayout } from "./layout.js";
import { iniciarNuvem } from "./nuvem.js";
import { iniciarPetalas } from "./petalas.js";

const paginas = {
  inicio: () => import("./pagina-inicio.js"),
  categoria: () => import("./pagina-categoria.js"),
  busca: () => import("./pagina-busca.js"),
  produto: () => import("./pagina-produto.js"),
  sacola: () => import("./pagina-sacola-preview.js")
};

montarLayout();
iniciarCabecalho();
iniciarMagneticos();
iniciarProgresso();
iniciarToque();
iniciarCortina();

const pagina = document.body.dataset.pagina;
if (pagina === "inicio") iniciarPetalas();

let catalogo = null;
let erroCatalogo = null;
try {
  catalogo = await carregarCatalogo();
} catch (erro) {
  erroCatalogo = erro;
}

const modulo = paginas[pagina] ? await paginas[pagina]() : null;
function irParaCategoria(slug) {
  const link = document.createElement("a");
  link.href = "categoria.html?c=" + encodeURIComponent(slug);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

if (catalogo) iniciarNuvem(catalogo.categorias, modulo?.aoEscolherCategoria || irParaCategoria);
if (modulo) await modulo.iniciar({ catalogo, erroCatalogo });
