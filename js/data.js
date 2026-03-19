// js/data.js
// Supabase Backend Integration

const supabaseUrl = 'https://ozqedgcehhtmtkyyzghh.supabase.co';
const supabaseKey = 'sb_publishable_mEh-oZqJehC9b_JWr67yvA_HIsKAMT-';

// Need to make sure supabase loaded
if (typeof supabase === 'undefined') {
    console.error("Supabase not loaded!");
}

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
window.supabaseClient = supabaseClient; // Export globally for realtime listeners

window.getMenu = async () => {
    const { data, error } = await supabaseClient.from('menu').select('*').order('id', { ascending: true });
    if (error) { console.error("Error fetching menu:", error); return []; }
    return data || [];
};

window.getOrders = async () => {
    const { data, error } = await supabaseClient.from('orders').select('*').order('id', { ascending: false });
    if (error) { console.error("Error fetching orders:", error); return []; }
    return data || [];
};

window.placeOrder = async (cart, total, tableNum) => {
    const newOrder = {
        items: cart,
        total: total,
        table_num: tableNum || 'Takeaway',
        status: 'Pending',
        time: new Date().toISOString()
    };
    
    const { data, error } = await supabaseClient.from('orders').insert([newOrder]).select();
    if (error) {
        console.error("Error placing order:", error);
        alert("Failed to place order securely. " + error.message);
        return null;
    }
    
    // Clear the cart
    localStorage.removeItem('poton_cart');
    
    return data && data[0] ? data[0] : newOrder;
};

// Admin Functions
window.addMenuItemDb = async (item) => {
    // Exclude 'id' so Supabase auto-generates it
    const { id, ...itemWithoutId } = item;
    const { error } = await supabaseClient.from('menu').insert([itemWithoutId]);
    if (error) { console.error("Error adding menu item:", error); throw error; }
};

window.deleteMenuItemDb = async (id) => {
    const { error } = await supabaseClient.from('menu').delete().eq('id', id);
    if (error) { console.error("Error deleting item:", error); throw error; }
};

// Chef Functions
window.updateOrderStatusDb = async (orderId, newStatus) => {
    const { error } = await supabaseClient.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { console.error("Error updating status:", error); throw error; }
};
