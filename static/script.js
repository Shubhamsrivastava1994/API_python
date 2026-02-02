// 🔹 CHANGE THIS TO YOUR RENDER URL
const API = "https://api-python-myhh.onrender.com";

/* =========================
   TAB SWITCH FUNCTION
========================= */
function showTab(tab) {
    document.querySelectorAll(".card").forEach(card => {
        card.classList.add("hidden");
    });

    const active = document.getElementById(tab);
    if (active) {
        active.classList.remove("hidden");
    }
}

/* =========================
   REGISTER
========================= */
function register() {
    fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: document.getElementById("regEmail").value,
            password: document.getElementById("regPassword").value
        })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("regMsg").innerText = data.message;
        showTab("login");
    })
    .catch(err => {
        document.getElementById("regMsg").innerText = "Register failed";
    });
}

/* =========================
   LOGIN
========================= */
function login() {
    fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: document.getElementById("loginEmail").value,
            password: document.getElementById("loginPassword").value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem("token", data.token);
            document.getElementById("loginMsg").innerText = "Login successful ✅";
            showTab("profile");
            loadProfile();
        } else {
            document.getElementById("loginMsg").innerText = data.message;
        }
    })
    .catch(() => {
        document.getElementById("loginMsg").innerText = "Login failed";
    });
}

/* =========================
   LOAD PROFILE
========================= */
function loadProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        document.getElementById("profileData").innerText = "Not logged in";
        return;
    }

    fetch(`${API}/profile`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("profileData").innerText =
            JSON.stringify(data, null, 2);
    })
    .catch(() => {
        document.getElementById("profileData").innerText = "Failed to load profile";
    });
}
