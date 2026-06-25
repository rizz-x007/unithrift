// ======================================
// ELEMENTS  — all IDs match profile.html
// ======================================
const fullName         = document.getElementById("userName");
const emailEl          = document.getElementById("userEmail");
const phoneEl          = document.getElementById("userPhone");
const memberSinceEl   = document.getElementById("memberSince");
const studentBadge    = document.getElementById("studentBadge");
const profileForm      = document.getElementById("profileForm");
const verificationSummary = document.getElementById("verificationSummary");
const studentStatus   = document.getElementById("studentStatus");
const sellerStatus    = document.getElementById("sellerStatus");
const sellerAccessBox = document.getElementById("sellerAccessBox");
const listingContainer = document.getElementById("listingContainer");
const newListingBtn   = document.getElementById("newListingBtn");
const logoutBtn       = document.getElementById("logoutBtn");
const logoutAccountBtn = document.getElementById("logoutAccountBtn");
const themeToggle     = document.getElementById("themeToggle");
const loadingOverlay  = document.getElementById("loadingOverlay");
const avatarImg       = document.getElementById("userAvatar");
const avatarUpload    = document.getElementById("avatarUpload");

// ======================================
// GLOBAL STATE
// ======================================
let currentUser = null;

// ======================================
// LOADING OVERLAY CONTROLS
// ======================================
function showLoading() { loadingOverlay.style.display = "flex"; }
function hideLoading() { loadingOverlay.style.display = "none"; }

// ======================================
// DYNAMIC THEME ENGINE
// ======================================
// Initialize and apply saved theme on load
const savedTheme = localStorage.getItem("theme") || "dark-theme";
document.body.className = savedTheme;
updateThemeButtonIcon(savedTheme === "dark-theme");

themeToggle.addEventListener("click", () => {
    const isCurrentlyDark = document.body.classList.contains("dark-theme");
    const targetTheme = isCurrentlyDark ? "light-theme" : "dark-theme";
    
    document.body.className = targetTheme;
    localStorage.setItem("theme", targetTheme);
    updateThemeButtonIcon(!isCurrentlyDark);
});

function updateThemeButtonIcon(isDark) {
    if (isDark) {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i> Toggle Theme';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> Toggle Theme';
    }
}

// ======================================
// SESSION LOGOUT
// ======================================
function logout() {
    localStorage.removeItem("unithrift_session_token");
    window.location.href = "/";
}
logoutBtn.addEventListener("click", logout);
logoutAccountBtn.addEventListener("click", logout);

// ======================================
// INITIALIZATION APP ENTRY
// ======================================
// ======================================
// OAUTH CALLBACK — capture token from
// URL hash if redirected here from Google
// ======================================
(function handleOAuthCallback() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken) return;
    localStorage.setItem('unithrift_session_token', accessToken);
    if (refreshToken) localStorage.setItem('unithrift_refresh_token', refreshToken);
    // Remove the hash from the URL bar without reloading
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    console.log('✅ Google OAuth session captured.');
})();

// ======================================
// TOKEN REFRESH — silently renew an
// expired access token using the refresh token
// ======================================
async function tryRefreshToken() {
    const refreshToken = localStorage.getItem("unithrift_refresh_token");
    if (!refreshToken) return null;
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (!response.ok) return null;
        const result = await response.json();
        if (result.success && result.access_token) {
            localStorage.setItem('unithrift_session_token', result.access_token);
            if (result.refresh_token) localStorage.setItem('unithrift_refresh_token', result.refresh_token);
            return result.access_token;
        }
    } catch (err) {
        console.warn("Token refresh failed:", err);
    }
    return null;
}

async function initializeProfile() {
    try {
        showLoading();

        let token = localStorage.getItem("unithrift_session_token");
        if (!token) { window.location.href = "/"; return; }

        let response = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok && response.status !== 401) {
            throw new Error(`Server connection failed with status: ${response.status}`);
        }
        
        let result = await response.json();

        // If token expired, try refreshing once before giving up
        if (!result.success && result.message && result.message.toLowerCase().includes('expired')) {
            token = await tryRefreshToken();
            if (!token) {
                localStorage.removeItem("unithrift_session_token");
                window.location.href = "/";
                return;
            }
            response = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            result = await response.json();
        }

        if (!result.success) {
            localStorage.removeItem("unithrift_session_token");
            window.location.href = "/";
            return;
        }

        currentUser = { id: result.profile.id || "", email: result.email };

        await loadProfileData(result);
        await loadListings();

    } catch (err) {
        console.error("Init error:", err);
        alert("Failed to load profile. Please refresh.");
    } finally {
        hideLoading();
    }
}

initializeProfile();

// ======================================
// LOAD PROFILE DATA INTO DOM
// ======================================
async function loadProfileData(accountData) {
    const profile = accountData.profile || {};

    // Header identity setup
    fullName.textContent  = profile.full_name || accountData.username || "Student";
    emailEl.textContent   = accountData.email  || "—";
    phoneEl.textContent   = profile.phone      || "Not added";

    // Format account lifespan timestamps safely
    if (profile.created_at) {
        const d = new Date(profile.created_at);
        memberSinceEl.textContent = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    // Dynamic Avatar render
    if (profile.avatar_url) {
        avatarImg.src = profile.avatar_url;
    }

    // Student Badge Display Matrix
    studentBadge.style.display = profile.student_verified ? "inline-flex" : "none";

    // Form inputs field hydration (Supports multi-alias backend variables keys seamlessly)
    document.getElementById("college").value  = profile.college_name  || profile.college  || "";
    document.getElementById("location").value = profile.location_name || profile.location || "";
    document.getElementById("address").value   = profile.address        || "";

    updateVerificationUI(profile);
}

// Refresh profile schema internally after mutations
async function loadProfile() {
    const token = localStorage.getItem("unithrift_session_token");
    const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
        const result = await response.json();
        if (result.success) {
            currentUser = { id: result.profile.id || "", email: result.email };
            await loadProfileData(result);
        }
    }
}

// ======================================
// DYNAMIC VERIFICATION UI & BADGES
// ======================================
function updateVerificationUI(profile) {
    const sv = profile.student_verified;
    const pv = profile.seller_verified;

    // Build the structural review summary lists 
    verificationSummary.innerHTML = `
        <div class="verification-list">
            <div class="ver-item">
                <div class="ver-icon"><i class="fas fa-graduation-cap"></i></div>
                <div class="ver-info">
                    <h4>Student Verification</h4>
                    <p>${sv ? "College ID approved" : "Upload your College ID below"}</p>
                </div>
                <span class="badge ${sv ? 'badge-success' : 'badge-pending'}">
                    ${sv ? 'Verified <i class="fas fa-check"></i>' : 'Pending <i class="fas fa-clock"></i>'}
                </span>
            </div>
            <div class="ver-item" style="margin-top:10px;">
                <div class="ver-icon"><i class="fas fa-id-card"></i></div>
                <div class="ver-info">
                    <h4>Seller Verification</h4>
                    <p>${pv ? "PAN & QR approved" : "Upload PAN & QR below"}</p>
                </div>
                <span class="badge ${pv ? 'badge-success' : 'badge-pending'}">
                    ${pv ? 'Verified <i class="fas fa-check"></i>' : 'Pending <i class="fas fa-clock"></i>'}
                </span>
            </div>
        </div>
    `;

    // Form Section Headers Badges Updates
    studentStatus.className = `badge ${sv ? 'badge-success' : 'badge-pending'}`;
    studentStatus.innerHTML = sv ? 'Verified ✅' : 'Pending ⏳';

    sellerStatus.className = `badge ${pv ? 'badge-success' : 'badge-pending'}`;
    sellerStatus.innerHTML = pv ? 'Verified ✅' : 'Pending ⏳';

    // Completeness validation checks
    const profileComplete =
        (profile.college_name || profile.college) &&
        (profile.location_name || profile.location) &&
        profile.address;

    if (sv && pv && profileComplete) {
        sellerAccessBox.innerHTML = `
            <div class="access-success" style="background:#052e16; border:1px solid #16a34a; border-radius:8px; padding:14px; color:#4ade80; font-weight:600;">
                ✅ You're all set — you can list and sell products!
            </div>`;
    } else {
        const missing = [];
        if (!profileComplete) missing.push("Complete your profile details");
        if (!sv)              missing.push("Student Verification");
        if (!pv)              missing.push("Seller Verification");

        sellerAccessBox.innerHTML = `
            <div class="access-warning" style="background:#1c0a00; border:1px solid #ea580c; border-radius:8px; padding:14px; color:#fb923c;">
                🔒 <strong>Selling Locked</strong>
                <ul style="margin:10px 0 0 18px; font-size:0.85rem;">
                    ${missing.map(m => `<li>${m}</li>`).join('')}
                </ul>
            </div>`;
    }
}

// ======================================
// FORM ENGINE: SAVE PROFILE DATA
// ======================================
profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        showLoading();
        const token = localStorage.getItem("unithrift_session_token");

        const college_name  = document.getElementById("college").value.trim();
        const location_name = document.getElementById("location").value.trim();
        const address       = document.getElementById("address").value.trim();

        const response = await fetch('/api/profile/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ college_name, location_name, address })
        });

        if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        alert("✅ Profile saved successfully!");
        await loadProfile();

    } catch (err) {
        console.error("Save profile error:", err);
        alert("❌ Failed to save profile: " + err.message);
    } finally {
        hideLoading();
    }
});

// ======================================
// FILESYSTEM MUTATION: AVATAR UPLOAD
// ======================================
avatarUpload.addEventListener("change", async () => {
    const file = avatarUpload.files[0];
    if (!file) return;

    // Instantly map client side preview
    const reader = new FileReader();
    reader.onload = e => { avatarImg.src = e.target.result; };
    reader.readAsDataURL(file);

    try {
        showLoading();
        const token = localStorage.getItem("unithrift_session_token");

        // Fixed: Use FormData instead of custom Base64 JSON objects
        const formData = new FormData();
        formData.append("avatar", file);

        const response = await fetch('/api/profile/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Content-Type is intentionally left blank so the browser configures multi-part boundary rules automatically
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Server returned HTTP code ${response.status}`);

        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        avatarImg.src = result.url;
        alert("✅ Profile picture updated!");

    } catch (err) {
        console.error("Avatar upload error:", err);
        alert("❌ Avatar upload failed: " + err.message);
    } finally {
        hideLoading();
    }
});

// ======================================
// STUDENT VERIFICATION SUBMISSION
// ======================================
document.getElementById("verifyStudentBtn").addEventListener("click", async () => {
    const file = document.getElementById("collegeId").files[0];
    if (!file) return alert("Please select your College ID file first.");

    try {
        showLoading();
        const token = localStorage.getItem("unithrift_session_token");

        // Fixed: Switched from Base64 serialization to highly optimized standard raw binary streams
        const formData = new FormData();
        formData.append("collegeId", file);

        const response = await fetch('/api/profile/verify/student', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Server rejected request with status code ${response.status}`);

        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        alert("✅ College ID uploaded! Verification is under review.");
        await loadProfile();

    } catch (err) {
        console.error("Student verification error:", err);
        alert("❌ Upload failed: " + err.message);
    } finally {
        hideLoading();
    }
});

// ======================================
// SELLER VERIFICATION SUBMISSION
// ======================================
document.getElementById("sellerVerifyBtn").addEventListener("click", async () => {
    const panCard   = document.getElementById("panCard").files[0];
    const paymentQr = document.getElementById("paymentQr").files[0];

    if (!panCard)   return alert("Please select your PAN Card file.");
    if (!paymentQr) return alert("Please select your Payment QR file.");

    try {
        showLoading();
        const token = localStorage.getItem("unithrift_session_token");

        // Fixed: Reconstructed submission architecture from structured nested base64 objects into flat structural forms
        const formData = new FormData();
        formData.append("panCard", panCard);
        formData.append("paymentQr", paymentQr);

        const response = await fetch('/api/profile/verify/seller', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error(`Server tracking block hit with validation error code: ${response.status}`);

        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        alert("✅ Seller documents submitted! Verification is under review.");
        await loadProfile();

    } catch (err) {
        console.error("Seller verification error:", err);
        alert("❌ Submission failed: " + err.message);
    } finally {
        hideLoading();
    }
});

// ======================================
// DATA LAYER: DISPLAY USER LISTINGS
// ======================================
async function loadListings() {
    try {
        const token = localStorage.getItem("unithrift_session_token");
        const response = await fetch('/api/profile/my-listings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const products = result.products || [];
        listingContainer.innerHTML = "";

        if (products.length === 0) {
            listingContainer.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1; text-align:center; padding:40px; opacity:0.5;">
                    <i class="fas fa-box-open" style="font-size:2rem;"></i>
                    <p style="margin-top:10px;">No listings yet. Create your first one!</p>
                </div>`;
            return;
        }

        products.forEach(product => {
            const aiBadge = product.is_ai_verified
                ? `<span style="position:absolute;top:10px;left:10px;background:#10b981;color:#fff;font-weight:800;font-size:10px;padding:4px 8px;border-radius:4px;z-index:5;">✨ AI VERIFIED</span>`
                : '';

            const imgSrc = product.image_url || "https://placehold.co/600x400?text=UniThrift";

            listingContainer.innerHTML += `
                <div class="listing-card" style="position:relative; border-radius:10px; overflow:hidden; background:#1e1e2e;">
                    ${aiBadge}
                    <img src="${imgSrc}" alt="${product.title}" style="width:100%;height:160px;object-fit:cover;">
                    <div class="listing-info" style="padding:14px;">
                        <h3 style="margin:0 0 4px; font-size:0.95rem; font-weight:600; color:#ffffff;">${product.title}</h3>
                        <p style="color:#a78bfa; font-weight:700; margin:0 0 10px;">₹${product.price}</p>
                        <div style="display:flex; gap:8px;">
                            <button onclick="window.location.href='/product?id=${product.id}'"
                                style="flex:1; padding:6px; border:1px solid #6d28d9; background:transparent; color:#a78bfa; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </div>
                </div>`;
        });

    } catch (err) {
        console.error("Load listings error:", err);
        listingContainer.innerHTML = `<p style="opacity:0.5; grid-column:1/-1;">Could not load listings.</p>`;
    }
}

// ======================================
// ROUTER NAVIGATION LINK ROUTING
// ======================================
newListingBtn.addEventListener("click", () => { window.location.href = "/sell"; });