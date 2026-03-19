document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Profile
    const profile = JSON.parse(localStorage.getItem('poton_profile')) || { name: '', email: '', phone: '' };
    document.getElementById('accName').value = profile.name;
    document.getElementById('accEmail').value = profile.email;
    document.getElementById('accPhone').value = profile.phone;

    // 2. Load Address smartly
    const updateAddressDisplay = () => {
        const currentLoc = localStorage.getItem('poton_location');
        const accAddress = document.getElementById('accAddress');
        if (accAddress) {
            if (currentLoc) {
                accAddress.textContent = currentLoc;
                accAddress.style.color = 'var(--primary-color)';
                accAddress.style.fontWeight = '600';
            } else {
                accAddress.textContent = "No address set. Click Edit to map.";
                accAddress.style.color = 'var(--text-secondary)';
                accAddress.style.fontWeight = '400';
            }
        }
    };
    updateAddressDisplay();
    
    // Listen to modal updates
    const observer = new MutationObserver(updateAddressDisplay);
    if(document.getElementById('locText')) {
        observer.observe(document.getElementById('locText'), { childList: true, characterData: true, subtree: true });
    }

    // 3. Save Profile
    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const p = {
            name: document.getElementById('accName').value.trim(),
            email: document.getElementById('accEmail').value.trim(),
            phone: document.getElementById('accPhone').value.trim()
        };
        localStorage.setItem('poton_profile', JSON.stringify(p));
        
        const btn = document.querySelector('#profileForm button');
        btn.innerHTML = 'Saved Successfully!';
        btn.style.background = 'var(--accent-color)';
        setTimeout(() => {
            btn.innerHTML = 'Save Profile';
            btn.style.background = ''; // revert to default
        }, 2000);
    });
    
    // 4. Dark Mode Switch
    const darkModeToggle = document.getElementById('darkModeToggle');
    if(darkModeToggle) {
        const toggleSlider = darkModeToggle.nextElementSibling.querySelector('span');
        
        // Sync states initially
        const isDark = document.body.classList.contains('dark-theme');
        darkModeToggle.checked = isDark;
        if(isDark) {
            toggleSlider.style.transform = 'translateX(22px)';
            darkModeToggle.nextElementSibling.style.backgroundColor = "var(--accent-color)";
        }

        // Toggle Event
        darkModeToggle.addEventListener('change', (e) => {
            if(e.target.checked) {
                localStorage.setItem('poton_theme', 'dark');
                document.body.classList.add('dark-theme');
                toggleSlider.style.transform = 'translateX(22px)';
                darkModeToggle.nextElementSibling.style.backgroundColor = "var(--accent-color)";
            } else {
                localStorage.setItem('poton_theme', 'light');
                document.body.classList.remove('dark-theme');
                toggleSlider.style.transform = 'translateX(0)';
                darkModeToggle.nextElementSibling.style.backgroundColor = "var(--border-color)";
            }
        });
    }
});
