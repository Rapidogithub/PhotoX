document.addEventListener('DOMContentLoaded', () => {
    renderCart();
});

function renderCart() {
    const cartContainer = document.getElementById('cartContainer');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTaxes = document.getElementById('cartTaxes');
    const cartTotal = document.getElementById('cartTotal');
    const cartSummary = document.getElementById('cartSummary');
    const cart = JSON.parse(localStorage.getItem('poton_cart')) || [];
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <h3 style="margin-top: 1rem;">Your cart is empty</h3>
                <p>Looks like you haven't added anything yet.</p>
                <a href="menu.html" class="btn btn-secondary" style="margin-top: 1.5rem;">Browse Menu</a>
            </div>`;
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }

    if (cartSummary) cartSummary.style.display = 'block';

    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item" style="animation-delay: ${index * 0.1}s">
            <div class="cart-item-info">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 style="color: var(--primary-color);">${item.name}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">₹${Number(item.price).toFixed(2)}</p>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="cart-qty-controls">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <span style="font-weight: 700; width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                </div>
                <button class="delete-btn" onclick="removeItem(${index})" title="Remove">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        </div>
    `).join('');

    const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxes = itemTotal * 0.05; // 5% mock tax
    const deliveryFee = 40.00; // Flat INR 40
    
    if (cartSubtotal) cartSubtotal.textContent = `₹${itemTotal.toFixed(2)}`;
    if (cartTaxes) cartTaxes.textContent = `₹${taxes.toFixed(2)}`;
    if (cartTotal) cartTotal.textContent = `₹${(itemTotal + taxes + deliveryFee).toFixed(2)}`;
    
    // Recover notes
    const savedNotes = localStorage.getItem('poton_notes');
    if (savedNotes && document.getElementById('cartNotes')) {
        document.getElementById('cartNotes').value = savedNotes;
    }
}

window.updateQuantity = function(index, change) {
    let cart = JSON.parse(localStorage.getItem('poton_cart')) || [];
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
    }
    localStorage.setItem('poton_cart', JSON.stringify(cart));
    renderCart();
    if(typeof updateCartCount === 'function') updateCartCount(true);
};

window.removeItem = function(index) {
    let cart = JSON.parse(localStorage.getItem('poton_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('poton_cart', JSON.stringify(cart));
    renderCart();
    if(typeof updateCartCount === 'function') updateCartCount(true);
};
