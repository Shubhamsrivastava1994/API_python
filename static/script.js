// 🔹 CHANGE THIS TO YOUR RENDER URL
const API = "https://api-python-myhh.onrender.com";
//const API = "http://127.0.0.1:5000"

///Redirect to login page if logout hit 
window.onload = function () {
    const email = localStorage.getItem("email");
    if (!email) {
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
    formData.append("name", name)

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
    document.getElementById("profileData").innerText = ""
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

function homePage() {

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
            if (data.image == null) {
                document.getElementById("user_image").src = "https://res.cloudinary.com/dls79lzyn/image/upload/v1770363924/default_user_profile_bx8coo.jpg"
            } else {
                document.getElementById("user_image").src = data.image
            }

            document.getElementById("user_name").innerText = data.name || "Please Login";
            document.getElementById("user_dashboard").innerHTML = data.bio;
            document.getElementById("cover_image").src = data.cover_photo
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
    const forgetEmailmsg = document.getElementById("forgotMsg")
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
            // if (data.reset_link) {
            //     document.getElementById("resetLink").href = data.reset_link;
            //     document.getElementById("resetLink").style.display = "inline-block";
            // }
        })
        .catch(err => {
            console.log(err);
        });
}
// ======RESET PAGE CODE 

function resetPassword() {

    const token = document.getElementById("token").value;
    const password = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const msg = document.getElementById("resetMsg");

    if (!password || !confirm) {
        msg.innerText = "All fields required";
        return;
    }

    if (password !== confirm) {
        msg.innerText = "Passwords do not match";
        return;
    }

    fetch(`${API}/reset_password_page`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token: token,
            password: password
        })
    })
        .then(res => res.json())
        .then(data => {
            msg.innerText = data.message;
        })
}
////////////homepage
// profile photo preview
document.getElementById("photoUpload").addEventListener("change", function (e) {

    const file = e.target.files[0];

    if (file) {
        document.getElementById("user_image").src =
            URL.createObjectURL(file);
            document.getElementById("photoStatus").innerText="Photo Uploading..."
        uploadImageInDB()
    }

});
function uploadImageInDB() {
    //alert("photo updated ")
    const profile_image = document.getElementById("photoUpload").files[0]
    const image_data = new FormData()
    image_data.append("profile_image", profile_image);
    fetch(`${API}/upload_profile_image`, {
        method: "POST",
        headers: {
            "Authorization": localStorage.getItem("token")
        },
        body: image_data
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById("photoStatus").innerText = data.message;
        })

}
// cover preview
document.getElementById("coverUpload").addEventListener("change", function (e) {

    const file = e.target.files[0];

    if (file) {
        document.getElementById("cover_image").src =
            URL.createObjectURL(file);
        coverImageInDB()
    }
});

function coverImageInDB() {
    //alert("photo updated ")
    const cover_image =document.getElementById("coverUpload").files[0]
    const cover_image_data = new FormData()
    cover_image_data.append("cover_image", cover_image);
    fetch(`${API}/upload_cover_image`, {
        method: "POST",
        headers: {
            "Authorization": localStorage.getItem("token")
        },
        body: cover_image_data
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message)
            //document.getElementById("coverPhotoStatus").innerText = data.message;
        })

}


function updateProfile() {
    const formData = new FormData();
    formData.append("username", document.getElementById("username").value);
    formData.append("bio", document.getElementById("bio").value);
    // const photo = document.getElementById("pop_up_profile_photo").files[0]
    // const cover_photo = document.getElementById("pop_up_cover_photo").files[0];
    // if (photo) {
    //     formData.append("photo", photo);
    // }
    // if (cover_photo) {
    //     formData.append("cover_photo", cover_photo);
    // }
    fetch("/update_profile", {
        method: "POST",
        headers: {
            "Authorization": localStorage.getItem("token")
        },
        body: formData
    })
        .then(async res => {

            const text = await res.text();
            console.log("RAW RESPONSE:", text);

            return JSON.parse(text);

        })
        .then(data => {
            alert(data.message);
            window.location.reload();

        });

}

function getLocation(){

    if(navigator.geolocation){

        navigator.geolocation.getCurrentPosition(async function(position){

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Reverse geocoding API
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );

            const data = await response.json();

            const city =
                data.address.city ||
                data.address.town ||
                data.address.village;

            const country = data.address.country;

            document.getElementById("location").value =
                city + ", " + country;

        });

    }
}

