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
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;
    const photo = document.getElementById("regPhoto").files[0];
    const msg = document.getElementById("regMsg");
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    msg.innerText = "Registering..."; // 👈 immediate feedback
    if (!emailPattern.test(email)) {
        msg.innerText = "Please enter valid email format";
        return;
    }
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
            email: document.getElementById("loginEmail").value.trim().toLowerCase(),
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
            homePage()
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
        if(data.image == null){
            document.getElementById("user_image").src ="https://res.cloudinary.com/dls79lzyn/image/upload/v1770363924/default_user_profile_bx8coo.jpg"
        }else{
            document.getElementById("user_image").src =data.image
        }
        
        document.getElementById("user_name").innerText = data.name||"Please Login";

    });

}



/* =========================
   LOAD PROFILE
========================= */
// function loadProfile() {
//     const token = localStorage.getItem("token");

//     if (!token) {
//         document.getElementById("profileData").innerText = "Not logged in";
//         return;
//     }

//     fetch(`${API}/profile`, {
//         headers: {
//             "Authorization": "Bearer " + token
//         }
//     })
//     .then(res => res.json())
//     .then(data => {
//         document.getElementById("profileData").innerText =
//             JSON.stringify(data, null, 2);
//     })
//     .catch(() => {
//         document.getElementById("profileData").innerText = "Failed to load profile";
//     });
// }

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

// ====FORGET PASSWORD CODE=====//
function forgotPassword() {

    const email = document.getElementById("forgotEmail").value;
    const forgetEmailmsg  = document.getElementById("forgotMsg")
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        forgetEmailmsg.innerText = "Please enter valid email format";
        return;
    }
    fetch(`${API}/forgot_password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("forgotMsg").innerText = data.message;
        document.getElementById("resetLink").href  = data.reset_link;
        document.getElementById("resetLink").style.display = "inline-block";
    })
    .catch(err => {
        console.log(err);
    });
}
// ======RESET PAGE CODE 

function resetPassword(){

    const token = document.getElementById("token").value;
    const password = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const msg = document.getElementById("resetMsg");

    if(!password || !confirm){
        msg.innerText = "All fields required";
        return;
    }

    if(password !== confirm){
        msg.innerText = "Passwords do not match";
        return;
    }

    fetch(`${API}/reset_password_page`, {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            token: token,
            password: password
        })
    })
    .then(res=>res.json())
    .then(data=>{
        msg.innerText = data.message;
    })
}