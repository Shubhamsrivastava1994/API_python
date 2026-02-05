// 🔹 CHANGE THIS TO YOUR RENDER URL
const API = "https://api-python-myhh.onrender.com";
//const API = "http://127.0.0.1:5000"

///Redirect to login page if logout hit 
window.onload = function () {
    const email = localStorage.getItem("email");
    if(!email){
        window.location.href = "/";
        return;
    }
    fetch(`/api/home_page?email=` + email)
    .then(res => res.json())
    .then(data => {
        document.getElementById("user_email").innerText = data.email;
    });

}

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
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const photo = document.getElementById("regPhoto").files[0];
    const msg = document.getElementById("regMsg");

    msg.innerText = "Registering..."; // 👈 immediate feedback

    if (!name.trim() || !email.trim() || !password.trim()) {
        msg.innerText = "Name,Email and password required";
        return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("name",name)

    if (photo) {
        formData.append("photo", photo);
    }

    fetch("/register", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        console.log("REGISTER RESPONSE:", data); // 👈 debug

        if (data.message) {
            msg.innerText = data.message;
        } else {
            msg.innerText = "Registered successfully";
        }

        // 👇 thoda delay taaki user message dekh le
        if (data.message === "User registered successfully") {
            setTimeout(() => {
                showTab("login");
            }, 1500);
        }
    })
    .catch(err => {
        console.error(err);
        msg.innerText = "Registration failed";
    });
}



/* =========================
   LOGIN
========================= */
function login() {
    document.getElementById("profileData").innerText=""
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
            // showTab("profile");
            //loadProfile();
        } else {
            document.getElementById("loginMsg").innerText = data.message;
        }
    })
    .catch(() => {
        document.getElementById("loginMsg").innerText = "Login failed";
    });
}

/* =========================
   LOAE HOME PAGE
========================= */

function homePage(){

    const email = document.getElementById("loginEmail").value;

    console.log("EMAIL SAVE:", email);

    localStorage.setItem("email", email);

    window.location.href = "/home_page";
}


window.onload = function () {

    const email = localStorage.getItem("email");

    console.log("EMAIL FROM LOCAL:", email);

    fetch(`/api/home_page?email=` + email)
    .then(res => res.json())
    .then(data => {

        console.log("API DATA:", data);
        document.getElementById("user_image").src =data.image
        document.getElementById("user_name").innerText = data.name;

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

/* =========================
   LOG OUT 
========================= */
function logout() {
    fetch(`${API}/logout`, {
        method: "POST"
    })
    .then(res => res.json())
    .then(data => {

        console.log(data);

        // remove saved login info
        localStorage.removeItem("email");
        // remove saved tokan 
        localStorage.removeItem("token");

        // redirect to login page
        window.location.href = "/";

    });

}


