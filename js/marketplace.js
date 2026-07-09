// ======================================
// ELEMENTS
// ======================================
const productsContainer = document.getElementById("productsContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const categoryFilter = document.getElementById("categoryFilter");
const conditionFilter = document.getElementById("conditionFilter");
const applyFilters = document.getElementById("applyFilters");
const themeToggle = document.getElementById("themeToggle");
const profileBtn = document.getElementById("profileBtn");
const cartBtn = document.getElementById("cartBtn");
const sellBtn = document.getElementById("sellBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const cartModal = document.getElementById("cartModal");
const cartItems = document.getElementById("cartItems");
const closeCart = document.getElementById("closeCart");
const cartBadge = document.getElementById("cartBadge");
const cartFooter = document.getElementById("cartFooter");
const placeOrderBtn = document.getElementById("placeOrderBtn");

// ======================================
// GLOBAL DATA
// ======================================
let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentUserId = null; // Saved globally to avoid API spamming

// ======================================
// LOADING
// ======================================
function showLoading() { loadingOverlay.style.display = "flex"; }
function hideLoading() { loadingOverlay.style.display = "none"; }

// ======================================
// CART FUNCTIONS
// ======================================
function saveCart() { 
    localStorage.setItem("cart", JSON.stringify(cart)); 
    updateCartBadge();
}

function updateCartBadge() {
    if (!cartBadge) return;
    if (cart.length > 0) {
        cartBadge.textContent = cart.length;
        cartBadge.style.display = "flex";
    } else {
        cartBadge.style.display = "none";
    }
}

function openCart() {
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="empty-cart">Empty Cart</div>`;
        cartFooter.style.display = "none";
    } else {
        cartFooter.style.display = "block";

        cart.forEach(item => {
            const div = document.createElement("div");
            div.classList.add("cart-item");
            div.innerHTML = `
                <img src="${item.image_url || 'https://via.placeholder.com/150'}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <div>
                        <h3>${item.title}</h3>
                        <p class="cart-item-desc">${item.description || 'No product description available for this item.'}</p>
                    </div>
                    <div class="cart-item-meta">
                        <span class="price" style="margin: 0; font-size: 1.1rem;">₹${item.price}</span>
                        <button class="remove-cart-btn" data-id="${item.id}">Remove</button>
                    </div>
                </div>
            `;
            cartItems.appendChild(div);
        });

        // --- STEP 1: CALCULATE THE NEW TOTALS ---
        let subtotalItemsCost = 0;
        cart.forEach(item => {
            subtotalItemsCost += Number(item.price);
        });

        // Compute the 25% shipping rule
        const shippingFee = subtotalItemsCost * 0.25;
        const ultimateTotal = subtotalItemsCost + shippingFee;

        // --- STEP 2: INJECT THE BREAKDOWN DISPLAY BOX ---
        let dynamicSummaryBox = document.getElementById("cartSummaryBreakdown");

        if (!dynamicSummaryBox) {
            dynamicSummaryBox = document.createElement("div");
            dynamicSummaryBox.id = "cartSummaryBreakdown";
            dynamicSummaryBox.style.cssText =
                "padding:12px 4px;font-size:0.9rem;border-bottom:1px solid var(--border);margin-bottom:14px;line-height:1.6;";

            if (cartFooter && placeOrderBtn) {
                cartFooter.insertBefore(dynamicSummaryBox, placeOrderBtn);
            }
        }

        dynamicSummaryBox.innerHTML = `
            <div style="display:flex;justify-content:space-between;">
                <span>Total Items:</span>
                <strong>${cart.length}</strong>
            </div>

            <div style="display:flex;justify-content:space-between;">
                <span>Items Cost:</span>
                <strong>₹${subtotalItemsCost.toLocaleString('en-IN')}</strong>
            </div>

            <div style="display:flex;justify-content:space-between;">
                <span>Shipping Cost (25%):</span>
                <strong>₹${shippingFee.toLocaleString('en-IN')}</strong>
            </div>

            <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px dashed var(--border);font-size:1.1rem;color:var(--accent);font-weight:700;">
                <span>Order Total:</span>
                <span>₹${ultimateTotal.toLocaleString('en-IN')}</span>
            </div>
        `;

        // --- STEP 3: UPDATE THE BUTTON TEXT ---
        if (placeOrderBtn) {
            placeOrderBtn.textContent = "Proceed to Payment";
        }

        attachRemoveButtons();
    }

    cartModal.style.display = "flex";
}

function attachRemoveButtons() {
    document.querySelectorAll(".remove-cart-btn").forEach(btn => {
        btn.removeEventListener("click", handleRemoveItem); // Clean cleanup
        btn.addEventListener("click", handleRemoveItem);
    });
}

function handleRemoveItem(e) {
    const id = e.target.dataset.id;
    cart = cart.filter(item => item.id != id);
    saveCart();
    openCart();
}

placeOrderBtn.addEventListener("click", () => {
    cartModal.style.display = "none";
    window.location.href = "/checkout";
});

closeCart.addEventListener("click", () => { cartModal.style.display = "none"; });
cartBtn.addEventListener("click", openCart);

// ======================================
// LOAD PRODUCTS & USER SESSION (Via API)
// ======================================
async function initSessionAndProducts() {
    try {
        showLoading();

        // 1. Fetch user session profile info exactly once on page load
        const token = localStorage.getItem("unithrift_session_token");
        if (token) {
            try {
                const r = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } });
                const d = await r.json();
                if (d.success) currentUserId = d.profile?.id;
            } catch (_) {}
        }

        // 2. Fetch all products
        const response = await fetch('/api/products');
        const result = await response.json();

        if (!result.success) throw new Error(result.message);

        allProducts = result.products || [];
        renderProducts(allProducts);
    } catch (err) {
        console.error(err);
        productsContainer.innerHTML = `<div class="empty-state">Failed to load products</div>`;
    } finally {
        hideLoading();
    }
}

// ======================================
// RENDER PRODUCTS
// ======================================
function renderProducts(products) {
    productsContainer.innerHTML = "";
    if (products.length === 0) {
        productsContainer.innerHTML = `<div class="empty-state">No products found</div>`;
        return;
    }

    products.forEach(product => {
        const isSold    = !!product.is_sold;
        const isOwner   = currentUserId && product.user_id === currentUserId;
        const card = document.createElement("div");
        card.classList.add("product-card");
        if (isSold) card.classList.add("product-card--sold");

        card.innerHTML = `
            <div class="product-image-wrap">
                <img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}" class="product-image" onerror="this.src='https://placehold.co/600x400?text=UniThrift'">
                ${isSold ? '<div class="sold-badge">SOLD</div>' : ''}
            </div>
            <div class="product-content">
                <h3>${escapeHtml(product.title)}</h3>
                <p class="category">${escapeHtml(product.category)}</p>
                <p class="condition">${escapeHtml(product.condition)}</p>
                <div class="price">₹${Number(product.price).toLocaleString('en-IN')}</div>
                <button class="view-btn" data-id="${product.id}">View Details</button>
                ${!isSold ? `<button class="add-cart-btn" data-id="${product.id}">Add To Cart</button>` : `<button class="add-cart-btn" disabled style="opacity:0.4;cursor:not-allowed;">Sold Out</button>`}
                ${isOwner && !isSold ? `<button class="mark-sold-btn" data-id="${product.id}">Mark as Sold</button>` : ''}
            </div>
        `;
        productsContainer.appendChild(card);
    });

    attachViewButtons();
    attachCartButtons();
    attachMarkSoldButtons();
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function attachViewButtons() {
    document.querySelectorAll(".view-btn").forEach(button => {
        button.onclick = () => { window.location.href = `/product?id=${button.dataset.id}`; };
    });
}

function attachCartButtons() {
    document.querySelectorAll(".add-cart-btn").forEach(button => {
        if (button.disabled) return;
        button.onclick = () => {
            const product = allProducts.find(p => p.id == button.dataset.id);
            if (cart.some(p => p.id == product.id)) return alert("Item already in cart");
            cart.push(product);
            saveCart();
            alert("Added to cart");
        };
    });
}

function attachMarkSoldButtons() {
    document.querySelectorAll(".mark-sold-btn").forEach(button => {
        button.onclick = async () => {
            if (!confirm("Mark this listing as sold? This cannot be undone.")) return;
            const token = localStorage.getItem("unithrift_session_token");
            button.textContent = "Marking...";
            button.disabled = true;
            try {
                const res = await fetch(`/api/products/${button.dataset.id}/sold`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);
                
                const idx = allProducts.findIndex(p => p.id == button.dataset.id);
                if (idx !== -1) allProducts[idx].is_sold = true;
                renderProducts(allProducts);
            } catch (err) {
                alert("Failed: " + err.message);
                button.textContent = "Mark as Sold";
                button.disabled = false;
            }
        };
    });
}

// ======================================
// SEARCH & FILTERS
// ======================================
function searchProducts() {
    const query = searchInput.value.toLowerCase().trim();
    renderProducts(allProducts.filter(p => p.title.toLowerCase().includes(query)));
}

searchBtn.addEventListener("click", searchProducts);
searchInput.addEventListener("keyup", e => { if (e.key === "Enter") searchProducts(); });

applyFilters.addEventListener("click", () => {
    const cat = categoryFilter.value;
    const con = conditionFilter.value;
    renderProducts(allProducts.filter(p => (!cat || p.category === cat) && (!con || p.condition === con)));
});

// ======================================
// THEME & ACTIONS
// ======================================
themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-theme");
    document.body.classList.toggle("dark-theme", !isDark);
    document.body.classList.toggle("light-theme", isDark);
    localStorage.setItem("theme", isDark ? "light-theme" : "dark-theme");
});

profileBtn.addEventListener("click", () => { window.location.href = '/profile'; });

sellBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("unithrift_session_token");
    if (!token) return window.location.href = '/';

    const response = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } });
    const { success, profile } = await response.json();

    if (!success || !profile.seller_verified) {
        alert("Complete your seller verification first.");
        window.location.href = '/profile';
    } else {
        window.location.href = '/sell';
    }
});

// ======================================
// INIT
// ======================================
const savedTheme = localStorage.getItem("theme") || "dark-theme";
document.body.classList.remove("dark-theme", "light-theme");
document.body.classList.add(savedTheme);

initSessionAndProducts();
updateCartBadge();