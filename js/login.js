// ======================================
// TYPING ANIMATION
// ======================================
const phrases = [
    "Buy & Sell on Campus",
    "Your Student Marketplace",
    "Verified. Safe. Affordable.",
    "Give Old Items New Life 🌱",
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
const animatedText = document.getElementById("animated-text");

function typeEffect() {
    if (!animatedText) return;
    const current = phrases[phraseIndex];

    if (isDeleting) {
        animatedText.textContent = current.substring(0, charIndex - 1);
        charIndex--;
    } else {
        animatedText.textContent = current.substring(0, charIndex + 1);
        charIndex++;
    }

    if (!isDeleting && charIndex === current.length) {
        setTimeout(() => { isDeleting = true; }, 1800);
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
    }

    const speed = isDeleting ? 50 : 90;
    setTimeout(typeEffect, speed);
}
typeEffect();

// ======================================
// FORM TOGGLE (Login ↔ Sign Up)
// ======================================
const loginForm    = document.getElementById("loginForm");
const signupForm   = document.getElementById("signupForm");
const formTitle    = document.getElementById("formTitle");
const toggleBtn    = document.getElementById("toggleBtn");
const toggleText   = document.getElementById("toggleText");
const statusMsg    = document.getElementById("statusMsg");

if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const isLoginVisible = loginForm.style.display !== "none";

        if (loginForm) loginForm.style.display  = isLoginVisible ? "none" : "block";
        if (signupForm) signupForm.style.display = isLoginVisible ? "block" : "none";
        if (formTitle) formTitle.textContent    = isLoginVisible ? "Create Account" : "Welcome Back";
        if (toggleText) toggleText.textContent   = isLoginVisible ? "Already have an account?" : "Don't have an account?";
        if (toggleBtn) toggleBtn.textContent    = isLoginVisible ? "Login" : "Sign Up";

        clearMessages();
    });
}

// ======================================
// PASSWORD VISIBILITY TOGGLES
// ======================================
const toggleLoginPw = document.getElementById("toggleLoginPw");
if (toggleLoginPw) {
    toggleLoginPw.addEventListener("click", () => {
        const pw = document.getElementById("loginPassword");
        if (pw) pw.type = pw.type === "password" ? "text" : "password";
    });
}

const toggleSignupPw = document.getElementById("toggleSignupPw");
if (toggleSignupPw) {
    toggleSignupPw.addEventListener("click", () => {
        const pw = document.getElementById("signupPassword");
        if (pw) pw.type = pw.type === "password" ? "text" : "password";
    });
}

// ======================================
// HELPERS
// ======================================
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = "block";
        el.style.color = "#f87171";
    }
}

function showStatus(message, isSuccess = true) {
    if (!statusMsg) return;
    statusMsg.textContent = message;
    statusMsg.style.color = isSuccess ? "#4ade80" : "#f87171";
    statusMsg.style.display = "block";
}

function clearMessages() {
    const loginErr = document.getElementById("loginError");
    const signupErr = document.getElementById("signupError");
    if (loginErr) loginErr.style.display  = "none";
    if (signupErr) signupErr.style.display = "none";
    if (statusMsg) statusMsg.style.display = "none";
}

function setButtonLoading(btnId, loading, defaultText) {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.disabled    = loading;
        btn.textContent = loading ? "Please wait..." : defaultText;
    }
}

// ======================================
// LOGIN
// ======================================
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessages();

        const loginIdentifier = document.getElementById("loginIdentifier").value.trim();
        const password        = document.getElementById("loginPassword").value;

        if (!loginIdentifier || !password) {
            return showError("loginError", "Please fill in all fields.");
        }

        setButtonLoading("loginSubmitBtn", true, "Login");

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginIdentifier, password })
            });

            const result = await response.json();

            if (!result.success) {
                showError("loginError", result.message || "Login failed. Check your credentials.");
                return;
            }

            // CRITICAL FIX: Explicitly save session AND refresh tokens identically to your router structure
            localStorage.setItem("unithrift_session_token", result.token);
            if (result.refresh_token) {
                localStorage.setItem("unithrift_refresh_token", result.refresh_token);
            }
            
            showStatus("✅ " + (result.message || "Logged in! Redirecting..."));

            setTimeout(() => {
                window.location.href = "/marketplace";
            }, 800);

        } catch (err) {
            console.error("Login error:", err);
            showError("loginError", "Network error. Please try again.");
        } finally {
            setButtonLoading("loginSubmitBtn", false, "Login");
        }
    });
}

// ======================================
// SIGNUP
// ======================================
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessages();

        const username = document.getElementById("signupUsername").value.trim();
        const email    = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirm  = document.getElementById("signupConfirm").value;

        if (!username || !email || !password || !confirm) {
            return showError("signupError", "Please fill in all fields.");
        }

        if (username.length < 3) {
            return showError("signupError", "Username must be at least 3 characters.");
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return showError("signupError", "Username can only contain letters, numbers, and underscores.");
        }

        if (password.length < 6) {
            return showError("signupError", "Password must be at least 6 characters.");
        }

        if (password !== confirm) {
            return showError("signupError", "Passwords do not match.");
        }

        setButtonLoading("signupSubmitBtn", true, "Create Account");

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (!result.success) {
                showError("signupError", result.message || "Signup failed. Please try again.");
                return;
            }

            showStatus("✅ " + (result.message || "Account created! You can now log in."));

            setTimeout(() => {
                if (signupForm) signupForm.style.display = "none";
                if (loginForm) loginForm.style.display  = "block";
                if (formTitle) formTitle.textContent    = "Welcome Back";
                if (toggleText) toggleText.textContent   = "Don't have an account?";
                if (toggleBtn) toggleBtn.textContent    = "Sign Up";
                
                const loginIdInput = document.getElementById("loginIdentifier");
                if (loginIdInput) loginIdInput.value = username;
            }, 1500);

        } catch (err) {
            console.error("Signup error:", err);
            showError("signupError", "Network error. Please try again.");
        } finally {
            setButtonLoading("signupSubmitBtn", false, "Create Account");
        }
    });
}

// ======================================
// GOOGLE LOGIN
// ======================================
const googleLoginBtn = document.getElementById("googleLoginBtn");
if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
        try {
            const response = await fetch('/api/auth/google', { method: 'POST' });
            const result   = await response.json();

            if (!result.success || !result.url) {
                throw new Error(result.message || "Google auth failed.");
            }

            window.location.href = result.url;

        } catch (err) {
            console.error("Google auth error:", err);
            showStatus("❌ Google login failed. Please try again.", false);
        }
    });
}

// ======================================
// AUTO-REDIRECT ENGINE (FIXED VULNERABILITY)
// ======================================
(async function checkExistingSession() {
    const token = localStorage.getItem("unithrift_session_token");
    if (!token) return;

    try {
        const response = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // FIX: Explicitly intercept 401 Unauthorized codes or bad parses right away
        if (response.status === 401 || !response.ok) {
            console.warn("Session token validation failed or returned 401. Clearing tracking cache...");
            localStorage.removeItem("unithrift_session_token");
            localStorage.removeItem("unithrift_refresh_token");
            return;
        }

        const result = await response.json();
        if (result.success) {
            console.log("🚀 Valid session detected. Forwarding to application context...");
            window.location.href = "/marketplace";
        } else {
            localStorage.removeItem("unithrift_session_token");
            localStorage.removeItem("unithrift_refresh_token");
        }
    } catch (err) {
        console.error("Session intercept verification offline:", err);
    }
})();