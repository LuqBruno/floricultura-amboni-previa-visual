// Confirmação visual de inclusão na sacola, sem complemento ou captura de dados.
import { animate, criar, reduz } from "./base.js";
import * as sacola from "./sacola.js";

export function mostrarAdicionado({ produto, variacao, quantidade, origem }) {
  let janela = document.getElementById("folha-adicionado");
  if (!janela) {
    janela = criar("dialog", "folha");
    janela.id = "folha-adicionado";
    janela.setAttribute("aria-labelledby", "folha-titulo");
    document.body.appendChild(janela);
    janela.addEventListener("click", (evento) => evento.target === janela && janela.close());
  }

  const corpo = criar("div", "folha-corpo");
  const fechar = criar("button", "folha-fechar");
  fechar.type = "button";
  fechar.setAttribute("aria-label", "Fechar");
  fechar.textContent = "×";
  fechar.addEventListener("click", () => janela.close());
  const cabeca = criar("div", "folha-cabeca");
  cabeca.append(criar("span", "folha-marca", "✓"));
  const textos = criar("div");
  textos.append(criar("h2", "", "Adicionado à sacola de demonstração"));
  const detalhe = variacao?.rotulo && variacao.rotulo !== "Padrão" ? ` · ${variacao.rotulo}` : "";
  textos.appendChild(criar("p", "folha-item", `${quantidade}× ${produto.nome}${detalhe}`));
  cabeca.appendChild(textos);

  const acoes = criar("div", "folha-acoes");
  const ver = criar("a", "botao", `Ver sacola (${sacola.totalDeItens()} ${sacola.totalDeItens() === 1 ? "item" : "itens"})`);
  ver.href = "sacola.html";
  ver.autofocus = true;
  const continuar = criar("button", "botao botao-claro", "Continuar explorando");
  continuar.type = "button";
  continuar.addEventListener("click", () => janela.close());
  acoes.append(ver, continuar);
  corpo.append(fechar, cabeca, criar("p", "aviso", "Interação demonstrativa: nenhum pedido ou pagamento será criado."), acoes);
  janela.replaceChildren(corpo);
  if (!janela.open) {
    janela.addEventListener("close", () => origem?.isConnected && origem.focus(), { once: true });
    janela.showModal();
  }
  if (!reduz) animate(corpo, { y: [36, 0], opacity: [0.4, 1] }, { type: "spring", stiffness: 320, damping: 30 });
}
