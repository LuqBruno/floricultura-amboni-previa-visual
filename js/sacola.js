// Sacola da demonstração. Guarda somente IDs fictícios e quantidades nesta aba do navegador.
// A validação usa catálogo estático local e não conversa com nenhum servidor.
import { catalogoPreview } from "./catalogo-preview.js";

const CHAVE = "amboni-sacola-previa-v1";
const MAX_QUANTIDADE = 99;

let itens = lerArmazenado();

function valido(i) {
  return i && Number.isInteger(i.variacaoId) && i.variacaoId > 0 && Number.isInteger(i.quantidade) && i.quantidade > 0;
}

function lerArmazenado() {
  try {
    const lista = JSON.parse(sessionStorage.getItem(CHAVE) || "[]");
    return Array.isArray(lista) ? lista.filter(valido).map((i) => ({ variacaoId: i.variacaoId, quantidade: Math.min(i.quantidade, MAX_QUANTIDADE) })) : [];
  } catch (e) {
    return [];
  }
}

function gravar() {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch (e) {
    // Sem armazenamento: a sacola vale só enquanto este módulo estiver na memória.
  }
  window.dispatchEvent(new CustomEvent("sacola:mudou"));
}

// A sessão fica restrita à aba da prévia.

export const lista = () => itens.map((i) => ({ ...i }));
export const totalDeItens = () => itens.reduce((soma, i) => soma + i.quantidade, 0);
export const quantidadeDe = (variacaoId) => (itens.find((i) => i.variacaoId === variacaoId) || { quantidade: 0 }).quantidade;

export function definir(variacaoId, quantidade) {
  const n = Math.max(0, Math.min(MAX_QUANTIDADE, Math.floor(quantidade)));
  const existente = itens.find((i) => i.variacaoId === variacaoId);
  if (n === 0) itens = itens.filter((i) => i.variacaoId !== variacaoId);
  else if (existente) existente.quantidade = n;
  else itens.push({ variacaoId, quantidade: n });
  gravar();
}

export const remover = (variacaoId) => definir(variacaoId, 0);

export function limpar() {
  itens = [];
  gravar();
}

// Confere a sacola demonstrativa inteiramente no navegador.
export async function validar(candidata = itens) {
  if (!Array.isArray(candidata) || candidata.length > 50) throw new Error("Não foi possível atualizar esta sacola de demonstração.");
  const pedido = new Map();
  for (const item of candidata) {
    if (!valido(item)) throw new Error("Item de demonstração inválido.");
    pedido.set(item.variacaoId, Math.min(MAX_QUANTIDADE, (pedido.get(item.variacaoId) || 0) + item.quantidade));
  }

  const porVariacao = new Map();
  for (const produto of catalogoPreview.produtos) {
    for (const variacao of produto.variacoes) porVariacao.set(variacao.id, { produto, variacao });
  }
  const linhas = [...pedido].map(([id, quantidadePedida]) => {
    const achado = porVariacao.get(id);
    if (!achado) return { variacaoId: id, status: "inexistente", mensagem: "Este item não faz parte da demonstração.", quantidade: 0, quantidadePedida, subtotalCentavos: 0 };
    const { produto, variacao } = achado;
    const categoria = catalogoPreview.categorias.find((item) => item.slug === produto.categoria);
    const base = {
      variacaoId: id,
      produtoId: produto.id,
      produtoNome: produto.nome,
      rotulo: variacao.rotulo,
      imagem: variacao.imagem || produto.imagem || categoria?.imagem || null,
      exemplo: true,
      precoCentavos: variacao.precoCentavos,
      estoque: variacao.estoque,
      quantidadePedida
    };
    if (variacao.estoque <= 0) return { ...base, status: "indisponivel", mensagem: "Item indisponível nesta demonstração.", quantidade: 0, subtotalCentavos: 0 };
    if (variacao.precoCentavos === null) return { ...base, status: "sem_preco", mensagem: "Preço demonstrativo não informado.", quantidade: 0, subtotalCentavos: 0 };
    const quantidade = Math.min(quantidadePedida, variacao.estoque);
    return {
      ...base,
      status: quantidade < quantidadePedida ? "ajustado" : "ok",
      mensagem: quantidade < quantidadePedida ? `Demonstração limitada a ${quantidade} ${quantidade === 1 ? "unidade" : "unidades"}.` : null,
      quantidade,
      subtotalCentavos: quantidade * variacao.precoCentavos
    };
  });
  const compraveis = linhas.filter((linha) => linha.status === "ok" || linha.status === "ajustado");
  return {
    itens: linhas,
    subtotalCentavos: compraveis.reduce((soma, linha) => soma + linha.subtotalCentavos, 0),
    limpa: linhas.length > 0 && linhas.every((linha) => linha.status === "ok")
  };
}

// Ajusta a sacola guardada ao que o servidor respondeu: quantidades reduzidas ao estoque e itens que não existem mais.
export function reconciliar(resposta) {
  const avisos = [];
  for (const linha of resposta.itens) {
    if (linha.status === "ajustado") {
      definir(linha.variacaoId, linha.quantidade);
      avisos.push(`${linha.produtoNome}: ${linha.mensagem}`);
    } else if (linha.status === "inexistente") {
      remover(linha.variacaoId);
      avisos.push("Um item foi retirado da sacola porque não está mais disponível.");
    }
  }
  return avisos;
}

// Adiciona só depois de o servidor confirmar preço, estoque e disponibilidade.
// Devolve { adicionado, quantidade, mensagem }.
export async function adicionarConferindo(variacaoId, quantidade) {
  const candidata = lista();
  const existente = candidata.find((i) => i.variacaoId === variacaoId);
  if (existente) existente.quantidade += quantidade;
  else candidata.push({ variacaoId, quantidade });

  const resposta = await validar(candidata);
  const linha = resposta.itens.find((i) => i.variacaoId === variacaoId);
  if (!linha || (linha.status !== "ok" && linha.status !== "ajustado")) {
    return { adicionado: false, mensagem: (linha && linha.mensagem) || "Este item não pode ser adicionado agora." };
  }
  const jaTinha = quantidadeDe(variacaoId);
  if (linha.quantidade <= jaTinha) {
    return { adicionado: false, mensagem: "Você já tem todas as unidades disponíveis na sacola." };
  }
  definir(variacaoId, linha.quantidade);
  return { adicionado: true, quantidade: linha.quantidade, mensagem: linha.status === "ajustado" ? linha.mensagem : null };
}
