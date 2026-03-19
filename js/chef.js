let lastOrderCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // Initial fetch
    await renderOrders(true, true);
    
    // Setup Supabase Realtime Subscription!
    if(window.supabaseClient) {
        window.supabaseClient.channel('custom-all-channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
                console.log('Realtime Order Event:', payload);
                // On any change, re-render orders beautifully without reloading the page
                renderOrders(false);
            }
          )
          .subscribe();
    } else {
        console.error("Supabase client not initialized.");
    }
});

function playDing() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio playback prevented by browser policy'));
}

async function renderOrders(animate = true, initialLoad = false) {
    if(initialLoad) {
        document.getElementById('colPending').innerHTML = "<div>Syncing WebSockets...</div>";
    }

    const allOrders = await getOrders();
    const orders = allOrders.filter(o => o.status !== 'Completed');
    
    let p = [], pr = [], r = [];
    orders.forEach(o => {
        if(o.status === 'Pending') p.push(o);
        else if(o.status === 'Preparing') pr.push(o);
        else if(o.status === 'Ready') r.push(o);
    });

    document.getElementById('countPending').textContent = p.length;
    document.getElementById('countPreparing').textContent = pr.length;
    document.getElementById('countReady').textContent = r.length;

    // Check ding
    if(!animate && orders.length > lastOrderCount && lastOrderCount !== 0) {
        playDing();
        if(typeof showToast === 'function') showToast("🔔 New Order Received!");
    }
    lastOrderCount = orders.length;

    const renderCard = (order) => `
        <div class="order-card" style="margin:0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; font-weight:800; font-size: 0.85rem;">
                <span style="color:var(--text-secondary);">#${order.id}</span>
                <span style="color:var(--text-secondary);">${new Date(order.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div style="font-size:1.1rem; font-weight: 800; margin-bottom:0.75rem; color:var(--primary-color); padding: 0.5rem; border: 1px dashed var(--border-color); border-radius: 8px;">
                📍 ${order.table_num || 'Takeaway'}
            </div>
            <ul style="list-style:none; margin-bottom: 1.25rem;">
                ${(order.items || []).map(item => `
                    <li style="border-bottom: 1px solid var(--border-color); padding: 6px 0;">
                        <span style="font-weight:800; color:var(--primary-color); margin-right: 6px;">${item.quantity}x</span> <span style="font-weight: 600;">${item.name}</span>
                    </li>
                `).join('')}
            </ul>
            ${order.status === 'Pending' ? `<button class="btn btn-sm" onclick="updateOrderStatus(${order.id}, 'Preparing')" style="width:100%; font-weight: bold; padding: 0.75rem; background:var(--warning); color:white; border:none; border-radius: 8px;">Start Preparing</button>` : ''}
            ${order.status === 'Preparing' ? `<button class="btn btn-sm" onclick="updateOrderStatus(${order.id}, 'Ready')" style="width:100%; font-weight: bold; padding: 0.75rem; background:var(--success); color:white; border:none; border-radius: 8px;">Mark Ready</button>` : ''}
            ${order.status === 'Ready' ? `<button class="btn btn-sm" onclick="updateOrderStatus(${order.id}, 'Completed')" style="width:100%; font-weight: bold; padding: 0.75rem; background:var(--danger); color:white; border:none; border-radius: 8px;">Complete & Serve</button>` : ''}
        </div>
    `;

    document.getElementById('colPending').innerHTML = p.map(renderCard).join('') || `<div style="color:var(--text-secondary); text-align:center; padding: 2rem 0;">No pending orders</div>`;
    document.getElementById('colPreparing').innerHTML = pr.map(renderCard).join('') || `<div style="color:var(--text-secondary); text-align:center; padding: 2rem 0;">Kitchen is clear</div>`;
    document.getElementById('colReady').innerHTML = r.map(renderCard).join('') || `<div style="color:var(--text-secondary); text-align:center; padding: 2rem 0;">No orders awaiting pickup</div>`;
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await window.updateOrderStatusDb(orderId, newStatus);
        // We don't necessarily even need to renderOrders() manually here, 
        // because the Supabase Realtime event will instantly trigger it for us!
        if(typeof showToast === 'function') {
            showToast(`Order marked as ${newStatus}`);
        }
    } catch(e) {
        alert("Failed to update status over network.");
    }
};
