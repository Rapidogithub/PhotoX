// Auto-apply Dark Theme Immediately
if (localStorage.getItem('poton_theme') === 'dark') {
    document.body.classList.add('dark-theme');
}

// Global toast notification system
function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        ${message}
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Current Path Logic
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a:not(.cart-icon)');
    const mobileNavLinks = document.querySelectorAll('.mobile-bottom-nav a');
    
    [...navLinks, ...mobileNavLinks].forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href.startsWith(currentPath)) {
            link.classList.add('active');
        }
    });

    // Location Hydration
    const savedLoc = localStorage.getItem('poton_location');
    const locTextSpan = document.getElementById('locText');
    if(locTextSpan && savedLoc) {
        locTextSpan.textContent = savedLoc;
    } else if (locTextSpan) {
        locTextSpan.textContent = "Select Location";
    }

    // Mock QR Scan button
    const scanQrBtn = document.getElementById('scanQrBtn');
    if (scanQrBtn) {
        scanQrBtn.addEventListener('click', () => {
            showToast('Camera initialized: Point at QR code on table');
        });
    }

    updateCartCount();
});

// Updates cart quantity with a nice pop animation
function updateCartCount(animate = false) {
    const cartCountEls = document.querySelectorAll('.cart-count');
    const cart = JSON.parse(localStorage.getItem('poton_cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    cartCountEls.forEach(el => {
        if (animate && el.textContent != totalItems) {
            el.classList.add('bump');
            setTimeout(() => el.classList.remove('bump'), 200);
        }
        el.textContent = totalItems;
        if (totalItems === 0) {
            el.style.display = 'none';
        } else {
            el.style.display = 'flex';
        }
    });

    // Update Floating Sticky Cart if exists
    const floatingCart = document.getElementById('floatingCart');
    const floatingCartCount = document.getElementById('floatingCartCount');
    if (floatingCart && floatingCartCount) {
        floatingCartCount.textContent = totalItems;
        if (totalItems > 0) {
            floatingCart.classList.add('visible');
        } else {
            floatingCart.classList.remove('visible');
        }
    }
}

// Location Modal Logic
window.openLocationModal = function() {
    const modal = document.getElementById('locationModal');
    if(modal) {
        modal.style.display = 'flex';
        // Google Places Autocomplete has been disabled because Google blocked the legacy API for this new API Key.
        // It now acts as a flawless, crash-free manual entry field.
    }
};

window.closeLocationModal = function() {
    const modal = document.getElementById('locationModal');
    if(modal) modal.style.display = 'none';
};

window.detectGPSLocation = function() {
    const btnText = document.getElementById('gpsBtnText');
    if(btnText) btnText.innerHTML = 'Locating Satellite...';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Fix: Store coords securely for checkout anti-fake logic IMMEDIATELY before API call!
            localStorage.setItem('poton_lat', lat);
            localStorage.setItem('poton_lng', lng);
            localStorage.setItem('poton_location', `GPS Active`);
            
            const locTextSpan = document.getElementById('locText');
            if(locTextSpan) locTextSpan.textContent = `GPS Active`;

            // Reverse Geocode
            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyC2D0IKgMZefbUqnKkKV9rrRKOc7k__dNI`)
                .then(res => res.json())
                .then(data => {
                    if(data.results && data.results[0]) {
                        const realAddress = data.results[0].formatted_address;
                        localStorage.setItem('poton_location', realAddress);
                        if(locTextSpan) locTextSpan.textContent = realAddress;
                    }
                    closeLocationModal();
                    if(typeof showToast === 'function') showToast("GPS Verified Location ✅");
                    if(btnText) btnText.innerHTML = 'Use Current GPS Location';
                })
                .catch(e => {
                    console.error("Google Geocode failed, but GPS coords saved:", e);
                    closeLocationModal();
                    if(typeof showToast === 'function') showToast("GPS Saved (Address lookup failed) ✅");
                    if(btnText) btnText.innerHTML = 'Use Current GPS Location';
                });
        }, (err) => {
            alert('Please enable location permissions in your browser or device settings! Ensure Location is turned ON.');
            if(btnText) btnText.innerHTML = 'Use Current GPS Location';
        }, { enableHighAccuracy: true });
    } else {
        alert("Geolocation not supported by this browser.");
        if(btnText) btnText.innerHTML = 'Use Current GPS Location';
    }
};

window.saveManualLocation = function() {
    const input = document.getElementById('manualLocationInput');
    if(input && input.value.trim() !== '') {
        const loc = input.value.trim();
        // Clear secure GPS to prevent GPS bypassing (anti fake-order system)
        localStorage.removeItem('poton_lat');
        localStorage.removeItem('poton_lng');
        
        localStorage.setItem('poton_location', loc);
        const locTextSpan = document.getElementById('locText');
        if(locTextSpan) locTextSpan.textContent = loc;
        closeLocationModal();
        if(typeof showToast === 'function') showToast("Location updated manually");
    } else {
        if(typeof showToast === 'function') showToast("Please enter a valid location");
    }
};
