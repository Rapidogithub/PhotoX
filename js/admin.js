document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
});

async function initAdmin() {
    // Show loading
    const menuList = document.getElementById('adminMenuList');
    if(menuList) menuList.innerHTML = "<div>Syncing from Supabase Database...</div>";

    await renderAdminMenu();
    await renderMetrics();
    await renderLiveStream();

    // Hook Supabase for Live Streaming Admin View!
    if(window.supabaseClient) {
        window.supabaseClient.channel('admin-channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
              renderMetrics();
              renderLiveStream();
          }).subscribe();
    }

    const addItemForm = document.getElementById('addItemForm');
    if(addItemForm) {
        addItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = addItemForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Adding to Database...';
            btn.disabled = true;

            const imageVal = document.getElementById('itemImage').value;
            const newItem = {
                name: document.getElementById('itemName').value,
                price: parseFloat(document.getElementById('itemPrice').value),
                category: document.getElementById('itemCategory').value,
                image: imageVal || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'
            };
            
            try {
                await window.addMenuItemDb(newItem);
                await renderAdminMenu();
                addItemForm.reset();
                if(typeof showToast === 'function') showToast(`Successfully added ${newItem.name}`);
            } catch (error) {
                alert("Failed to add menu item. Check console.");
            }
            
            btn.innerHTML = 'Add Menu Item';
            btn.disabled = false;
        });
    }
}

async function renderMetrics() {
    const orders = await getOrders() || [];
    const completedOrders = orders.filter(o => o.status === 'Completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    
    const adminRev = document.getElementById('adminRevenue');
    const adminOrders = document.getElementById('adminTotalOrders');
    
    if(adminRev) adminRev.textContent = `₹${totalRevenue.toFixed(2)}`;
    if(adminOrders) adminOrders.textContent = completedOrders.length;
}

async function renderLiveStream() {
    const streamContainer = document.getElementById('adminLiveStream');
    if(!streamContainer) return;
    
    const allOrders = await getOrders();
    const active = allOrders.filter(o => o.status !== 'Completed').sort((a,b) => new Date(b.time) - new Date(a.time));
    
    if(active.length === 0) {
        streamContainer.innerHTML = `<div style="color:var(--text-secondary); text-align:center;">Kitchen is fully clear. No pending orders.</div>`;
        return;
    }
    
    streamContainer.innerHTML = active.map(o => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 1rem; border-bottom: 1px dashed var(--border-color); background: var(--bg-color); border-radius: 8px; margin-bottom: 0.5rem; border-left: 4px solid var(--${o.status === 'Pending' ? 'danger' : (o.status === 'Preparing' ? 'warning' : 'success')});">
            <div>
                <strong style="color:var(--primary-color);">Order #${o.id}</strong> 
                <span style="font-size:0.85rem; color:var(--text-secondary); margin-left:8px;">${new Date(o.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                <div style="font-size: 0.9rem; font-weight: 500; margin-top: 4px;">📍 ${o.table_num}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">₹${Number(o.total).toFixed(2)}</div>
                <span class="status-badge status-${o.status}" style="font-size:0.75rem;">${o.status}</span>
            </div>
        </div>
    `).join('');
}

async function renderAdminMenu() {
    const list = document.getElementById('adminMenuList');
    const menu = await getMenu();

    if(menu.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                <h3>No items in menu</h3>
                <p>Use the form to add your first menu item.</p>
            </div>`;
        return;
    }

    list.innerHTML = menu.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 1.25rem; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); background: var(--bg-color); transition: transform 0.2s, box-shadow 0.2s;">
            <div style="display:flex; gap: 1rem; align-items: center;">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; box-shadow: var(--shadow-sm);">
                <div>
                    <strong style="color: var(--primary-color); font-size: 1.1rem;">${item.name}</strong> - <span style="font-weight: 700;">₹${Number(item.price).toFixed(2)}</span>
                    <div style="font-size:0.875rem; color:var(--text-secondary); margin-top: 0.2rem; text-transform: uppercase; font-weight: 600;">${item.category}</div>
                </div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${item.id}, '${item.name.replace(/'/g, "\\'")}')" title="Delete Item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        </div>
    `).join('');
}

window.deleteMenuItem = async function(id, name) {
    if(confirm(`Are you sure you want to delete ${name}?`)) {
        try {
            await window.deleteMenuItemDb(id);
            await renderAdminMenu();
            if(typeof showToast === 'function') showToast(`Deleted ${name}`);
        } catch (e) {
            alert("Error deleting item.");
        }
    }
};
