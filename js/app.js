// === CONFIG SUPABASE ===
const SUPABASE_URL = "https://pkxypmwvhqsdybrmerex.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreHlwbXd2aHFzZHlicm1lcmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTA1OTQsImV4cCI6MjA3MzcyNjU5NH0.H1SFE_iP5sXy-JABYpHZo8wI1XckBC9hu2bEFXhHUvI";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let transactions = [];
let financeChart = null;

// === LOGIN / CADASTRO / LOGOUT ===
async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert("Erro no cadastro: " + error.message);
  else alert("Conta criada! Verifique seu email.");
}

async function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert("Erro no login: " + error.message);
  else {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById("login-status").textContent = "Logado como " + email;
    showApp();
  }
}

async function signOut() {
  await supabase.auth.signOut();
  document.getElementById("login-status").textContent = "Deslogado";
  hideApp();
}

// Mostrar app se logado
function showApp() {
  if (document.getElementById("dashboard")) {
    document.getElementById("dashboard").style.display = "block";
    loadTransactions();
  }
  if (document.getElementById("transactions")) {
    document.getElementById("transactions").style.display = "block";
    document.getElementById("list-section").style.display = "block";
    loadTransactions();
  }
}

// Esconder app se deslogado
function hideApp() {
  if (document.getElementById("dashboard")) {
    document.getElementById("dashboard").style.display = "none";
  }
  if (document.getElementById("transactions")) {
    document.getElementById("transactions").style.display = "none";
    document.getElementById("list-section").style.display = "none";
  }
}



// === CRUD TRANSAÇÕES ===
async function addTransaction() {
  const description = document.getElementById("description").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const dateStr = document.getElementById("date").value; // já vem "YYYY-MM-DD"
 


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("transacoes")
    .insert([{ user_id: user.id, description, amount, type, category, date: dateStr }]);

  if (error) console.error(error);
  else loadTransactions();

}

async function deleteTransaction(id) {
  const { error } = await supabase.from("transacoes").delete().eq("id", id);
  if (error) console.error(error);
  loadTransactions();
}

async function loadTransactions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("transacoes")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }
     transactions = data.map(t => ({
    ...t,
    date: t.date.includes("T") ? t.date.split("T")[0] : t.date
  }));


  renderTransactions();
  updateDashboard();
  renderChart();
//const dateInput = document.getElementById('date');
//    if (dateInput) {
//        dateInput.valueAsDate = new Date();
 //   }
}

function formatDisplayDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}

// === RENDER TABLE ===
function renderTransactions() {
  const tbody = document.getElementById("transactions-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  transactions.forEach(t => {
    const row = document.createElement("tr");
    row.innerHTML = `
<td>${formatDisplayDate(t.date)}</td>
      <td>${t.description}</td>
      <td>${t.category}</td>
      <td class="${t.type === "income" ? "positive" : "negative"}">R$ ${t.amount.toFixed(2)}</td>
      <td><button class="delete-btn" onclick="deleteTransaction(${t.id})">Excluir</button></td>
    `;
    tbody.appendChild(row);
  });
}

// === DASHBOARD ===
function updateDashboard() {
  if (!document.getElementById("dashboard")) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const monthIncome = transactions.filter(t => new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear && t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpenses = transactions.filter(t => new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear && t.type === "expense").reduce((s, t) => s + t.amount, 0);

//  document.getElementById("current-balance").textContent = `R$ ${balance.toFixed(2)}`;
const balanceEl = document.getElementById('current-balance');
    if (balanceEl) {
        balanceEl.textContent = `R$ ${balance.toFixed(2)}`;
        balanceEl.className = `balance ${balance >= 0 ? 'positive' : 'negative'}`;
    }
  document.getElementById("month-income").textContent = `R$ ${monthIncome.toFixed(2)}`;
  document.getElementById("month-expenses").textContent = `R$ ${monthExpenses.toFixed(2)}`;
  document.getElementById("last-update").textContent = `Atualizado em: ${now.toLocaleDateString("pt-BR")}`;
}



// === CHART ===
function renderChart() {
  const ctx = document.getElementById("financeChart");
  if (!ctx) return;

  const monthlyData = {};
  transactions.forEach(t => {
    const date = new Date(t.date);
    const key = `${date.getMonth()+1}/${date.getFullYear()}`;
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
    if (t.type === "income") monthlyData[key].income += t.amount;
    else monthlyData[key].expense += t.amount;
  });

  const labels = Object.keys(monthlyData).sort((a,b)=>{
    const [ma, ya] = a.split("/");
    const [mb, yb] = b.split("/");
    return new Date(ya, ma-1) - new Date(yb, mb-1);
  });

  const incomeData = labels.map(l => monthlyData[l].income);
  const expenseData = labels.map(l => monthlyData[l].expense);

  if (financeChart) financeChart.destroy();

  financeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Receitas", data: incomeData, borderColor: "#27ae60", backgroundColor: "rgba(39,174,96,0.2)", fill: true },
        { label: "Despesas", data: expenseData, borderColor: "#e74c3c", backgroundColor: "rgba(231,76,60,0.2)", fill: true }
      ]
    }
  });
}

// === EVENTOS ===
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("transaction-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      addTransaction();
      form.reset();
    });
  }

  document.getElementById("btnLogin")?.addEventListener("click", signIn);
  document.getElementById("btnCadastro")?.addEventListener("click", signUp);
  document.getElementById("btnLogout")?.addEventListener("click", signOut);

  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      document.getElementById('login-container').style.display = 'none';
      document.getElementById("login-status").textContent = "Logado como " + data.user.email;
      showApp();
    } else {
      hideApp();
    }
  });
});
