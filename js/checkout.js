// SET YOUR ACTUAL RESTAURANT COORDINATES HERE!
const RESTAURANT_LAT = 19.0760; // Example: Mumbai (Change to yours)
const RESTAURANT_LNG = 72.8777;

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.floor(R * c); 
}

document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('poton_cart')) || [];
    
    // Redirect if direct link with empty cart
    if(cart.length === 0) {
        window.location.href = 'menu.html';
        return;
    }

    const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxes = itemTotal * 0.05; // 5% mock tax
    const deliveryFee = 40.00;
    const finalTotal = itemTotal + taxes + deliveryFee;

    document.getElementById('checkoutTotal').textContent = `₹${finalTotal.toFixed(2)}`;

    // Payment Selection
    window.selectPayment = function(element) {
        document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
        element.classList.add('active');
    };

    // Hydrate address from location if present
    const tableNumInput = document.getElementById('tableNum');
    const savedLoc = localStorage.getItem('poton_location');
    if(tableNumInput && savedLoc) {
        tableNumInput.value = savedLoc;
    }

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if(placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
            let tableNum = tableNumInput ? tableNumInput.value.trim() : "";
            if (!tableNum) tableNum = savedLoc || "Takeaway";

            // FAKE ORDER PREVENTION SYSTEM (Geofence)
            const userLat = localStorage.getItem('poton_lat');
            const userLng = localStorage.getItem('poton_lng');
            
            if (userLat && userLng) {
                const distance = getDistanceInMeters(parseFloat(userLat), parseFloat(userLng), RESTAURANT_LAT, RESTAURANT_LNG);
                if (distance > 200) { // 200 meters threshold
                    const override = confirm(`🛑 SECURITY ALERT: You appear to be ${distance} meters away! Are you sure you are here? (Press OK to test anyway)`);
                    if(!override) return; // Block the fake order!
                    tableNum += ` | ⚠️ FAKE RISK (${distance}m away)`;
                } else {
                    tableNum += ` | ✅ Verified In-Store`;
                }
            } else {
                tableNum += ` | ❓ No GPS Proof`;
            }
            
            // Append Special Instructions
            const specialNotes = localStorage.getItem('poton_notes');
            if(specialNotes && specialNotes.trim()) {
                tableNum += ` | 📝 Note: ${specialNotes}`;
            }

            placeOrderBtn.innerHTML = `<svg class="spin" style="animation: spin 1s linear infinite;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Connecting to Kitchen...`;
            placeOrderBtn.disabled = true;

            setTimeout(async () => {
                const order = await placeOrder(cart, finalTotal, tableNum);
                if (order && order.id) {
                    // Clear state
                    localStorage.removeItem('poton_cart');
                    localStorage.removeItem('poton_notes');
                    
                    window.location.href = `confirmation.html?id=${order.id}`;
                } else {
                    placeOrderBtn.innerHTML = 'Try Again';
                    placeOrderBtn.disabled = false;
                }
            }, 500);
        });
    }
});
