const API = "const API = "https://api-python-myhh.onrender.com";
";
let token = "";

function showTab(tab) {
    document.querySelectorAll(".card").forEach(c => c.classList.add("hidden"));
    document.getElementById(tab).classList.remove("hidden");
}

// REGISTER
function register() {
    fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: regEmail.value,
            password: regPassword.value
        })
    })
    .then(res => res.json())
    .then(data => {
        regMsg.innerText = data.message;
    });
}

// LOGIN
function login() {
    fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: loginEmail.value,
            password: loginPassword.value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem("token", data.token); // 🔐 save token
            window.location.href = "/dashboard";       // 🚀 redirect
        } else {
            loginMsg.innerText = data.message;
        }
    });
}
// PROFILE
function loadProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/";
        return;
    }

    fetch(`${API}/profile`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(data => {
        profileData.innerText = JSON.stringify(data, null, 2);
    });
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
}


