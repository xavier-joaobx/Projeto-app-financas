// Lista de transações
let transacoes = JSON.parse(localStorage.getItem("transacoes")) || [];
let metas = JSON.parse(localStorage.getItem("metas")) || [];

// Atualiza dashboard
function atualizarDashboard() {
  let receitas = transacoes.filter(t => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valor, 0);

  let despesas = transacoes.filter(t => t.tipo === "despesa")
    .reduce((acc, t) => acc + t.valor, 0);

  let saldo = receitas - despesas;

  if (document.getElementById("saldo"))
    document.getElementById("saldo").textContent = "R$ " + saldo.toFixed(2);
  if (document.getElementById("receitas"))
    document.getElementById("receitas").textContent = "R$ " + receitas.toFixed(2);
  if (document.getElementById("despesas"))
    document.getElementById("despesas").textContent = "R$ " + despesas.toFixed(2);
}

// Renderiza transações
function renderizarTransacoes() {
  if (!document.getElementById("listaTransacoes")) return;
  let lista = document.getElementById("listaTransacoes");
  lista.innerHTML = "";
  transacoes.forEach((t, i) => {
    let li = document.createElement("li");
    li.textContent = `${t.descricao} - R$ ${t.valor.toFixed(2)} (${t.tipo})`;
    lista.appendChild(li);
  });
}

// Renderiza metas
function renderizarMetas() {
  if (!document.getElementById("listaMetas")) return;
  let lista = document.getElementById("listaMetas");
  lista.innerHTML = "";
  metas.forEach(m => {
    let li = document.createElement("li");
    li.textContent = `${m.meta} - R$ ${m.valor.toFixed(2)}`;
    lista.appendChild(li);
  });
}

// Eventos de formulário
document.addEventListener("DOMContentLoaded", () => {
  atualizarDashboard();
  renderizarTransacoes();
  renderizarMetas();

  let formT = document.getElementById("formTransacao");
  if (formT) {
    formT.addEventListener("submit", e => {
      e.preventDefault();
      let descricao = document.getElementById("descricao").value;
      let valor = parseFloat(document.getElementById("valor").value);
      let tipo = document.getElementById("tipo").value;
      transacoes.push({ descricao, valor, tipo });
      localStorage.setItem("transacoes", JSON.stringify(transacoes));
      atualizarDashboard();
      renderizarTransacoes();
      formT.reset();
    });
  }

  let formM = document.getElementById("formMeta");
  if (formM) {
    formM.addEventListener("submit", e => {
      e.preventDefault();
      let meta = document.getElementById("meta").value;
      let valor = parseFloat(document.getElementById("valorMeta").value);
      metas.push({ meta, valor });
      localStorage.setItem("metas", JSON.stringify(metas));
      renderizarMetas();
      formM.reset();
    });
  }
});

