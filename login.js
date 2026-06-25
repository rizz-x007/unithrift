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
    const current = phrases[phraseIndex];

    if (isDeleting) {
        animatedText.textContent = current.substring(0, charIndex - 1);
        charIndex--;
    } else {
        animatedText.textContent = current.substring(0, charIndex + 1);
        charIndex++;
    }

    if (!isDeleting && charIndex === current.length) {
        // Pause at end before deleting
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

toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isLoginVisible = loginForm.style.display !== "none";

    loginForm.style.display  = isLoginVisible ? "none" : "block";
    signupForm.style.display = isLoginVisible ? "block" : "none";
    formTitle.textContent    = isLoginVisible ? "Create Account" : "Welcome Back";
    toggleText.textContent   = isLoginVisible ? "Already have an account?" : "Don't have an account?";
    toggleBtn.textContent    = isLoginVisible ? "Login" : "Sign Up";

    clearMessages();
});

// ======================================
// PASSWORD VISIBILITY TOGGLES
// ======================================
document.getElementById("toggleLoginPw").addEventListener("click", () => {
    const pw = document.getElementById("loginPassword");
    pw.type = pw.type === "password" ? "text" : "password";
});

document.getElementById("toggleSignupPw").addEventListener("click", () => {
    const pw = document.getElementById("signupPassword");
    pw.type = pw.type === "password" ? "text" : "password";
});

// ======================================
// HELPERS
// ======================================
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.style.display = "block";
    el.style.color = "#f87171";
}

function showStatus(message, isSuccess = true) {
    statusMsg.textContent = message;
    statusMsg.style.color = isSuccess ? "#4ade80" : "#f87171";
    statusMsg.style.display = "block";
}

function clearMessages() {
    document.getElementById("loginError").style.display  = "none";
    document.getElementById("signupError").style.display = "none";
    statusMsg.style.display = "none";
}

function setButtonLoading(btnId, loading, defaultText) {
    const btn = document.getElementById(btnId);
    btn.disabled    = loading;
    btn.textContent = loading ? "Please wait..." : defaultText;
}

// ======================================
// LOGIN
// ======================================
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

        // Store session token and redirect
        localStorage.setItem("unithrift_session_token", result.token);
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

// ======================================
// SIGNUP
// ======================================
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

        // Switch to login form after short delay
        setTimeout(() => {
            signupForm.style.display = "none";
            loginForm.style.display  = "block";
            formTitle.textContent    = "Welcome Back";
            toggleText.textContent   = "Don't have an account?";
            toggleBtn.textContent    = "Sign Up";
            // Pre-fill the login email for convenience
            document.getElementById("loginIdentifier").value = username;
        }, 1500);

    } catch (err) {
        console.error("Signup error:", err);
        showError("signupError", "Network error. Please try again.");
    } finally {
        setButtonLoading("signupSubmitBtn", false, "Create Account");
    }
});

// ======================================
// GOOGLE LOGIN
// ======================================
document.getElementById("googleLoginBtn").addEventListener("click", async () => {
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

// ======================================
// AUTO-REDIRECT IF ALREADY LOGGED IN
// ======================================
(function checkExistingSession() {
    const token = localStorage.getItem("unithrift_session_token");
    if (token) {
        // Verify token is still valid before redirecting
        fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(result => {
            if (result.success) window.location.href = "/marketplace";
        })
        .catch(() => {
            // Token invalid or expired — clear it and stay on login
            localStorage.removeItem("unithrift_session_token");
        });
    }
})();