// Variáveis globais
let transactions = [];
let goals = {
    income: 0,
    expense: 0
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateDashboard();
    renderTransactions();
    renderChart();

    // Configurar data atual como padrão (se o campo existir)
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Configurar o formulário de transações
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addTransaction();
        });
    }
});

// Carregar dados do localStorage
function loadData() {
    const savedTransactions = localStorage.getItem('financialTransactions');
    const savedGoals = localStorage.getItem('financialGoals');
    
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
    
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
        const incomeGoalEl = document.getElementById('income-goal');
        const expenseLimitEl = document.getElementById('expense-limit');
        if (incomeGoalEl) incomeGoalEl.value = goals.income;
        if (expenseLimitEl) expenseLimitEl.value = goals.expense;
    }
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('financialTransactions', JSON.stringify(transactions));
    localStorage.setItem('financialGoals', JSON.stringify(goals));
    if (window.financialChart) {
        window.financialChart.refresh();
    }
}

// Adicionar nova transação
function addTransaction() {
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    
    if (!description || isNaN(amount) || amount <= 0 || !date) {
        showAlert('Por favor, preencha todos os campos corretamente.', 'error');
        return;
    }
    
    const transaction = {
        id: Date.now(), // ID único baseado no timestamp
        description,
        amount,
        type,
        category,
        date
    };
    
    transactions.push(transaction);
    saveData();
    updateDashboard();
    renderTransactions();
    renderChart();
    
    // Limpar formulário
    document.getElementById('transaction-form').reset();
    document.getElementById('date').valueAsDate = new Date();
    
    showAlert('Transação adicionada com sucesso!', 'success');
}

// Excluir transação
function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveData();
        updateDashboard();
        renderTransactions();
        renderChart();
        showAlert('Transação excluída com sucesso!', 'success');
    }
}

// Definir meta/limite
function setGoal(type) {
    const inputElement = type === 'income' ? 
        document.getElementById('income-goal') : 
        document.getElementById('expense-limit');
        
    if (!inputElement) return;

    const value = parseFloat(inputElement.value);
    
    if (isNaN(value) || value < 0) {
        showAlert('Por favor, insira um valor válido.', 'error');
        return;
    }
    
    goals[type] = value;
    saveData();
    updateDashboard();
    showAlert(`${type === 'income' ? 'Meta' : 'Limite'} definido com sucesso!`, 'success');
}

// Atualizar dashboard
function updateDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calcular totais
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const balance = totalIncome - totalExpenses;
    
    // Calcular totais do mês atual
    const monthIncome = transactions
        .filter(t => {
            if (t.type !== 'income') return false;
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
        
    const monthExpenses = transactions
        .filter(t => {
            if (t.type !== 'expense') return false;
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Atualizar UI (somente se os elementos existirem)
    const balanceEl = document.getElementById('current-balance');
    if (balanceEl) {
        balanceEl.textContent = `R$ ${balance.toFixed(2)}`;
        balanceEl.className = `balance ${balance >= 0 ? 'positive' : 'negative'}`;
    }

    const monthIncomeEl = document.getElementById('month-income');
    if (monthIncomeEl) monthIncomeEl.textContent = `R$ ${monthIncome.toFixed(2)}`;

    const monthExpensesEl = document.getElementById('month-expenses');
    if (monthExpensesEl) monthExpensesEl.textContent = `R$ ${monthExpenses.toFixed(2)}`;

    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl) lastUpdateEl.textContent = `Atualizado em: ${formatDate(now)}`;

    // Verificar metas
    if (goals.income > 0 && monthIncome >= goals.income) {
        showAlert('Parabéns! Você atingiu sua meta de receitas deste mês.', 'success');
    }
    
    if (goals.expense > 0 && monthExpenses >= goals.expense) {
        showAlert('Atenção! Você atingiu seu limite de despesas deste mês.', 'error');
    }
}

// Renderizar transações na tabela
function renderTransactions() {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return; // se não existe, não renderiza

    const typeFilter = document.getElementById('filter-type')?.value || 'all';
    const categoryFilter = document.getElementById('filter-category')?.value || 'all';
    const monthFilter = document.getElementById('filter-month')?.value || 'all';
    
    // Filtrar transações
    let filteredTransactions = transactions;
    
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    if (monthFilter !== 'all') {
        const month = parseInt(monthFilter);
        filteredTransactions = filteredTransactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === month;
        });
    }
    
    // Ordenar por data (mais recente primeiro)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    // Adicionar transações
    if (filteredTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma transação encontrada.</td></tr>';
        return;
    }
    
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDisplayDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${getCategoryName(transaction.category)}</td>
            <td class="${transaction.type === 'income' ? 'positive' : 'negative'}">
                R$ ${transaction.amount.toFixed(2)}
            </td>
            <td>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Excluir</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Filtrar transações
function filterTransactions() {
    renderTransactions();
}

// Limpar todos os dados
function clearAllData() {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
        transactions = [];
        goals = { income: 0, expense: 0 };
        saveData();
        updateDashboard();
        renderTransactions();
        renderChart();
        
        const incomeGoalEl = document.getElementById('income-goal');
        const expenseLimitEl = document.getElementById('expense-limit');
        if (incomeGoalEl) incomeGoalEl.value = '';
        if (expenseLimitEl) expenseLimitEl.value = '';
        
        showAlert('Todos os dados foram limpos.', 'success');
    }
}

// Exportar dados
function exportData() {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financas_${formatDateForExport(new Date())}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('Dados exportados com sucesso!', 'success');
}

// Mostrar alerta
function showAlert(message, type) {
    let alertBox = document.getElementById('alertBox');
    
    // Se não existir na página, cria dinamicamente
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.id = 'alertBox';
        alertBox.className = `alert alert-${type}`;
        alertBox.style.margin = "10px 0";
        document.body.prepend(alertBox);
    }

    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// Funções auxiliares
function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

function formatDisplayDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

function formatDateForExport(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function getCategoryName(category) {
    const categories = {
        'food': 'Alimentação',
        'transport': 'Transporte',
        'housing': 'Moradia',
        'health': 'Saúde',
        'education': 'Educação',
        'entertainment': 'Entretenimento',
        'other': 'Outros'
    };
    
    return categories[category] || category;
}
let financeChart = null; // variável global do gráfico

function renderChart() {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return; // só roda se existir o canvas na página

    // Agrupar receitas e despesas por mês
    const monthlyData = {};
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthYear = `${date.getMonth()+1}/${date.getFullYear()}`;
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            monthlyData[monthYear].income += t.amount;
        } else {
            monthlyData[monthYear].expense += t.amount;
        }
    });

    // Preparar labels e datasets
    const labels = Object.keys(monthlyData).sort((a, b) => {
        const [ma, ya] = a.split('/');
        const [mb, yb] = b.split('/');
        return new Date(ya, ma-1) - new Date(yb, mb-1);
    });

    const incomeData = labels.map(l => monthlyData[l].income);
    const expenseData = labels.map(l => monthlyData[l].expense);

    // Se já existe gráfico, destrói antes de recriar
    if (financeChart) {
        financeChart.destroy();
    }

    financeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.2)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Evolução Financeira Mensal'
                }
            }
        }
    });
}
