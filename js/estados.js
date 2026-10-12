// Estados que toda tela precisa ter: carregando, erro com nova tentativa e vazio.
import { criar } from "./base.js";

export function mostrarErro(destino, mensagem, aoTentarDeNovo) {
  destino.replaceChildren();
  const caixa = criar("div", "estado estado-erro");
  caixa.setAttribute("role", "alert");
  caixa.appendChild(criar("h2", "", "Não foi possível carregar"));
  caixa.appendChild(criar("p", "", mensagem || "Algo deu errado. Tente de novo em instantes."));
  if (aoTentarDeNovo) {
    const botao = criar("button", "botao", "Tentar de novo");
    botao.type = "button";
    botao.addEventListener("click", aoTentarDeNovo);
    caixa.appendChild(botao);
  }
  destino.appendChild(caixa);
}

export function mostrarVazio(destino, titulo, texto, acao) {
  destino.replaceChildren();
  const caixa = criar("div", "estado");
  caixa.appendChild(criar("h2", "", titulo));
  if (texto) caixa.appendChild(criar("p", "", texto));
  if (acao) caixa.appendChild(acao);
  destino.appendChild(caixa);
}

export function criarLink(texto, href, classe = "botao") {
  const a = criar("a", classe, texto);
  a.href = href;
  return a;
}
