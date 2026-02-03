// 🔹 CHANGE THIS TO YOUR RENDER URL
const API = "https://api-python-myhh.onrender.com";
//const API = "http://127.0.0.1:5000"
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
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const photo = document.getElementById("regPhoto").files[0];
    const msg = document.getElementById("regMsg");

    msg.innerText = "Registering..."; // 👈 immediate feedback

    if (!email || !password) {
        msg.innerText = "Email and password required";
        return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

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

// ========================
// Upload Photo
// ========================
function uploadProfilePhoto() {

    const fileInput = document.getElementById("photoInput");
    const message = document.getElementById("uploadMsg");
  
    if (fileInput.files.length === 0) {
      message.innerText = "Please select a photo";
      return;
    }
  
    const formData = new FormData();
    formData.append("photo", fileInput.files[0]);
  
    // 🔐 Token jo login ke baad mila tha
    const token = localStorage.getItem("token");
  
    if (!token) {
      message.innerText = "Please login first";
      return;
    }
  
    fetch(`${API}/upload_photo`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token
      },
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.photoUrl) {
        message.innerText = "Photo uploaded successfully ✅";
      } else {
        message.innerText = data.message || "Upload failed";
      }
    })
    .catch(err => {
      message.innerText = "Error uploading photo";
      console.error(err);
    });
  }