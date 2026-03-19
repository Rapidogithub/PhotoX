document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menuGrid');
    const categoryFilters = document.getElementById('categoryFilters');
    const searchInput = document.getElementById('searchInput');
    
    let menuItems = [];
    let currentCategory = 'All';
    let searchQuery = '';
    let categories = ['All'];

    async function init() {
        // Parse URL params for pre-selected category
        const urlParams = new URLSearchParams(window.location.search);
        currentCategory = urlParams.get('category') || 'All';
        
        // Show loading state
        if(menuGrid) menuGrid.innerHTML = `<div style="text-align:center;width:100%;margin-top:2rem;">Loading menu from server...</div>`;
        
        menuItems = await getMenu();
        
        // Extract unique categories
        categories = ['All', ...new Set(menuItems.map(item => item.category))];
        
        renderCategories();
        renderMenu();
    }

    const renderCategories = () => {
        if (!categoryFilters) return;
        categoryFilters.innerHTML = categories.map(cat => `
            <button class="category-btn ${cat === currentCategory ? 'active' : ''}" data-cat="${cat}">
                ${cat}
            </button>
        `).join('');

        // Event listeners
        const btns = categoryFilters.querySelectorAll('.category-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentCategory = e.target.dataset.cat;
                renderCategories();
                renderMenu();
            });
        });
    };

    const renderMenu = () => {
        // Filter logic
        let filtered = menuItems;
        if (currentCategory !== 'All') {
            filtered = filtered.filter(item => item.category === currentCategory);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query));
        }

        if(filtered.length === 0) {
            menuGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <h3>No items found</h3>
                    <p>Try adjusting your search or category filter.</p>
                </div>`;
            return;
        }

        menuGrid.innerHTML = filtered.map((item, index) => `
            <div class="menu-card" style="animation-delay: ${index * 0.05}s">
                <div class="menu-img-container">
                    <img src="${item.image}" alt="${item.name}" class="menu-img">
                </div>
                <div class="menu-info">
                    <span class="menu-category">${item.category}</span>
                    <h3 class="menu-title">${item.name}</h3>
                    <div class="menu-price-row">
                        <span class="menu-price">₹${Number(item.price).toFixed(2)}</span>
                        <button class="add-to-cart-btn btn-click" onclick="addToCart(event, ${item.id})" title="Add to Cart">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderMenu();
        });
    }

    init();
});

// Since addToCart is purely localStorage local state, we don't need to await here!
window.addToCart = async function(event, itemId) {
    const btn = event.currentTarget || event.target.closest('.add-to-cart-btn');
    if (btn) {
        btn.classList.add('added');
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
            btn.classList.remove('added');
            btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
        }, 800);
    }

    const menuItems = await window.getMenu(); // Always valid fetch or cached later if needed
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    let cart = JSON.parse(localStorage.getItem('poton_cart')) || [];
    const existing = cart.find(i => i.id === itemId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    localStorage.setItem('poton_cart', JSON.stringify(cart));
    
    if(typeof updateCartCount === 'function') {
        updateCartCount(true);
    }
    
    if(typeof showToast === 'function') {
        showToast(`Added ${item.name} to cart`);
    } else {
        alert(`Added ${item.name} to cart!`);
    }
};
