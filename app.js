// Application State
let userData = {
    salary: 0,
    isLoggedIn: false
};

// Screen Navigation
function switchTab(tabId) {
    // Only allow switching tabs if logged in and salary is set
    if (!userData.isLoggedIn || userData.salary <= 0) return;

    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById('screen-' + tabId);
    if (targetScreen) targetScreen.classList.add('active');

    // Add active class to clicked nav item
    const activeNav = document.querySelector(`.nav-item[onclick="switchTab('${tabId}')"]`);
    if(activeNav) activeNav.classList.add('active');
}

// Auth Logic
function handleLogin() {
    // Basic simulation of login
    userData.isLoggedIn = true;
    
    // Hide login screen and show setup salary screen
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

    // Save salary
    userData.salary = salaryValue;
    
    // Update UI with the new salary
    updateDashboardUI();

    // Transition to Dashboard
    document.getElementById('screen-setup-salary').classList.remove('active');
    document.getElementById('screen-dashboard').classList.add('active');
    document.getElementById('main-nav').style.display = 'flex';
}

function updateDashboardUI() {
    // Update the balance amount (for this demo, we assume 0 expenses initially)
    const balanceAmounts = document.querySelectorAll('.balance-amount');
    balanceAmounts.forEach(el => {
        // Find the span for FCFA and update the number before it
        const span = el.querySelector('span');
        el.innerHTML = `${userData.salary.toLocaleString()} <span>FCFA</span>`;
    });

    // Update income detail
    const incomeDetail = document.querySelector('.balance-detail h4');
    if (incomeDetail) {
        incomeDetail.innerText = `${userData.salary.toLocaleString()} F`;
    }
}

// Modal Management
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Close modal when clicking outside of content
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if(e.target === this) {
            this.classList.remove('show');
        }
    });
});

// Init
console.log("Dudukan App Initialized");
