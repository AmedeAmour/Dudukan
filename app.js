// Screen Navigation
function switchTab(tabId) {
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
    document.getElementById('screen-' + tabId).classList.add('active');

    // Add active class to clicked nav item
    const activeNav = document.querySelector(`.nav-item[onclick="switchTab('${tabId}')"]`);
    if(activeNav) activeNav.classList.add('active');
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
