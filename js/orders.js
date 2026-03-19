document.addEventListener('DOMContentLoaded', async () => {
    const ordersContainer = document.getElementById('ordersContainer');
    ordersContainer.innerHTML = `<div style="text-align:center;width:100%;margin-top:2rem;">Fetching your order history...</div>`;
    
    // In a real app we would filter by user_id. Here we render all orders matching our local ID if we wanted, or simply all orders as a mock.
    // For MVP, we will render all orders, or filter gracefully if need be.
    const orders = await getOrders();

    if(orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <h3 style="margin-top: 1rem;">No orders yet</h3>
                <p>When you place an order, it will appear here.</p>
                <a href="index.html" class="btn btn-secondary" style="margin-top: 1.5rem;">Explore Restaurants</a>
            </div>`;
        return;
    }

    ordersContainer.innerHTML = orders.map((order, index) => `
        <div style="background: var(--surface-color); padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border-color); margin-bottom: 1.5rem; animation: fadeIn 0.4s ease-out; animation-delay: ${index * 0.05}s;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 1rem;">
                <div>
                    <strong style="color: var(--primary-color);">Order #${order.id}</strong>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">${new Date(order.time).toLocaleString()}</div>
                </div>
                <div class="status-badge status-${order.status}" style="font-size: 0.75rem;">${order.status}</div>
            </div>
            
            <div style="margin-bottom: 1rem;">
                ${(order.items || []).map(i => `<div style="font-size: 0.95rem; margin-bottom: 0.25rem;">${i.quantity}x ${i.name}</div>`).join('')}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; color: var(--primary-color);">
                <span>Total</span>
                <span>₹${Number(order.total).toFixed(2)}</span>
            </div>
            
            ${order.status !== 'Completed' ? `<a href="confirmation.html?id=${order.id}" class="btn btn-secondary btn-full btn-sm" style="margin-top: 1rem;">Track Order</a>` : ''}
        </div>
    `).join('');
});
