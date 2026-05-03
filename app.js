// Application State
let userData = {
    salary: 0,
    isLoggedIn: false,
    expenses: [],
    incomes: [],
    budget: {
        alimentation: { spent: 0, total: 0 },
        transport: { spent: 0, total: 0 },
        logement: { spent: 0, total: 0 },
        dettes: { spent: 0, total: 0 },
        epargne: { spent: 0, total: 0 },
        imprevus: { spent: 0, total: 0 },
        personnel: { spent: 0, total: 0 }
    }
};

// Screen Navigation
function switchTab(tabId) {
    if (!userData.isLoggedIn || userData.salary <= 0) return;

    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));

    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    const targetScreen = document.getElementById('screen-' + tabId);
    if (targetScreen) targetScreen.classList.add('active');

    const activeNav = document.querySelector(`.nav-item[onclick="switchTab('${tabId}')"]`);
    if(activeNav) activeNav.classList.add('active');
}

// Auth Logic
function handleLogin() {
    userData.isLoggedIn = true;
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-setup-salary').classList.add('active');
}

function handleSetupSalary() {
    const salaryInput = document.getElementById('initial-salary');
    const salaryValue = parseFloat(salaryInput.value);

    if (isNaN(salaryValue) || salaryValue <= 0) {
        alert("Veuillez entrer un montant de salaire valide.");
        return;
    }

    userData.salary = salaryValue;
    
    // Auto-allocate budget (Basic logic)
    userData.budget.alimentation.total = salaryValue * 0.30;
    userData.budget.transport.total = salaryValue * 0.15;
    userData.budget.logement.total = salaryValue * 0.20;
    userData.budget.dettes.total = salaryValue * 0.15;
    userData.budget.epargne.total = salaryValue * 0.05;
    userData.budget.imprevus.total = salaryValue * 0.05;
    userData.budget.personnel.total = salaryValue * 0.10;

    updateUI();

    document.getElementById('screen-setup-salary').classList.remove('active');
    document.getElementById('screen-dashboard').classList.add('active');
    document.getElementById('main-nav').style.display = 'flex';
}

function updateUI() {
    // 1. Dashboard Update
    const totalExpenses = Object.values(userData.budget).reduce((acc, cat) => acc + cat.spent, 0);
    const resteAVivre = userData.salary - totalExpenses;

    const balanceAmountEl = document.querySelector('.balance-amount');
    if (balanceAmountEl) {
        balanceAmountEl.innerHTML = `${Math.round(resteAVivre).toLocaleString()} <span>FCFA</span>`;
    }

    const incomeDetailEl = document.querySelector('.balance-detail:first-child h4');
    if (incomeDetailEl) {
        incomeDetailEl.innerText = `${userData.salary.toLocaleString()} F`;
    }

    const expenseDetailEl = document.querySelector('.balance-detail:last-child h4');
    if (expenseDetailEl) {
        expenseDetailEl.innerText = `${totalExpenses.toLocaleString()} F`;
    }

    // 2. Budget Screen Update
    const usedPercentage = (totalExpenses / userData.salary) * 100;
    const circleInnerH2 = document.querySelector('.circle-inner h2');
    if (circleInnerH2) {
        circleInnerH2.innerText = `${Math.round(usedPercentage)}%`;
    }
    
    // Update category cards (this assumes a specific order in the DOM for this simplified demo)
    const categoryCards = document.querySelectorAll('#screen-budget .category-card');
    const categories = ['alimentation', 'transport', 'dettes', 'epargne']; // Match the HTML order
    
    categoryCards.forEach((card, index) => {
        const catKey = categories[index];
        if (catKey && userData.budget[catKey]) {
            const cat = userData.budget[catKey];
            const amountSpan = card.querySelector('.cat-amount');
            if (amountSpan) {
                amountSpan.innerText = `${cat.spent.toLocaleString()} / ${cat.total.toLocaleString()} F`;
            }
            const progressBar = card.querySelector('.progress');
            if (progressBar) {
                const perc = (cat.spent / cat.total) * 100 || 0;
                progressBar.style.width = `${Math.min(perc, 100)}%`;
            }
        }
    });

    // 3. Simulation Update
    const currentSalaryInput = document.querySelector('#screen-planning .form-group:first-of-type input');
    if (currentSalaryInput) {
        currentSalaryInput.value = userData.salary;
    }
}

// Modal Management
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if(e.target === this) this.classList.remove('show');
    });
});

console.log("Duduzan App Initialized");
