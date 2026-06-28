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
function showLoading() { if (loadingOverlay) loadingOverlay.style.display = "flex"; }
function hideLoading() { if (loadingOverlay) loadingOverlay.style.display = "none"; }

// ======================================
// DYNAMIC THEME ENGINE
// ======================================
const savedTheme = localStorage.getItem("theme") || "dark-theme";
document.body.className = savedTheme;
updateThemeButtonIcon(savedTheme === "dark-theme");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const isCurrentlyDark = document.body.classList.contains("dark-theme");
        const targetTheme = isCurrentlyDark ? "light-theme" : "dark-theme";
        
        document.body.className = targetTheme;
        localStorage.setItem("theme", targetTheme);
        updateThemeButtonIcon(!isCurrentlyDark);
    });
}

// Visual updates for theme icons
function updateThemeButtonIcon(isDark) {
    if (!themeToggle) return;
    themeToggle.innerHTML = isDark 
        ? '<i class="fas fa-moon"></i> Toggle Theme' 
        : '<i class="fas fa-sun"></i> Toggle Theme';
}

// ======================================
// SESSION LOGOUT (With Graceful Redirection Delay)
// ======================================
function logout() {
    localStorage.removeItem("unithrift_session_token");
    localStorage.removeItem("unithrift_refresh_token");
    // 50ms delay keeps browser extensions or background listeners from throwing runtime channel errors
    setTimeout(() => {
        window.location.href = "/";
    }, 50);
}
if (logoutBtn) logoutBtn.addEventListener("click", logout);
if (logoutAccountBtn) logoutAccountBtn.addEventListener("click", logout);

// ======================================
// OAUTH CALLBACK
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
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    console.log('✅ Google OAuth session captured.');
})();

// ======================================
// TOKEN REFRESH
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
        
        const result = await response.json().catch(() => ({ success: false }));
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

// ======================================
// APP INITIALIZATION ENTRY POINT
// ======================================
async function initializeProfile() {
    try {
        showLoading();

        let token = localStorage.getItem("unithrift_session_token");
        if (!token) { logout(); return; }

        let response = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Catch 401 token expirations safely before they can cause script drops
        if (response.status === 401) {
            console.warn("Access token expired. Attempting token rotation via refresh payload...");
            token = await tryRefreshToken();
            if (!token) { logout(); return; }
            
            response = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        
        if (!response.ok) {
            throw new Error(`Server connection failed with status: ${response.status}`);
        }
        
        // Secure error fallback parsing
        let result = await response.json().catch(() => ({ success: false }));

        if (!result.success) { logout(); return; }

        // Secure deep-checking logic for unprovisioned public profile rows
        if (!result.profile || Object.keys(result.profile).length === 0 || !result.profile.id) {
            console.log("⚠️ Profile missing in database rows. Auto-provisioning basic row sync...");
            const saveResponse = await fetch('/api/profile/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    college_name: "",
                    location_name: "",
                    address: ""
                })
            });
            
            if (saveResponse.ok) {
                const retryProfile = await fetch('/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                result = await retryProfile.json().catch(() => result);
            }
        }

        currentUser = { id: result.profile?.id || "", email: result.email };

        await loadProfileData(result);
        
        // Soft validation in case loadListings is bundled in a different asset file
        if (typeof loadListings === "function") {
            await loadListings();
        }

    } catch (err) {
        console.error("Init error:", err);
        alert("Failed to load profile cleanly. Please refresh.");
    } finally {
        hideLoading();
    }
}

// Kickstart execution loop
initializeProfile();

// ======================================
// LOAD PROFILE DATA INTO DOM
// ======================================
async function loadProfileData(accountData) {
    const profile = accountData.profile || {};

    if (fullName) fullName.textContent  = profile.username || accountData.username || "Student";
    if (emailEl) emailEl.textContent   = accountData.email  || "—";
    if (phoneEl) phoneEl.textContent   = profile.phone      || "Not added";

    if (profile.created_at && memberSinceEl) {
        const d = new Date(profile.created_at);
        memberSinceEl.textContent = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    if (profile.avatar_url && avatarImg) {
        avatarImg.src = profile.avatar_url;
    }

    if (studentBadge) {
        studentBadge.style.display = profile.student_verified ? "inline-flex" : "none";
    }

    const collegeInput = document.getElementById("college");
    const locationInput = document.getElementById("location");
    
    if (collegeInput) collegeInput.value = profile.college_name || "";
    if (locationInput) locationInput.value = profile.location_name || "";
}
