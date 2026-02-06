from bson import ObjectId
from functools import wraps
from flask import Flask, request, jsonify
from pymongo import MongoClient
import bcrypt
import jwt
import resend
import os
import cloudinary
import cloudinary.uploader
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from flask import render_template
from flask_cors import CORS
import secrets
import smtplib
from email.message import EmailMessage
import threading



# =========================
# 🔹 LOAD ENV
# =========================
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("❌ SECRET_KEY not found in environment variables")

# =========================
# 🔹 APP INIT
# =========================
app = Flask(__name__)
CORS(app)
# =========================

# =========================
# 🔹 MONGODB CONNECTION
# =========================
client = MongoClient(os.getenv("MONGO_URI"))

# ========================
# Collection Details
# ========================
db = client.Shubham_dbs
users = db.users

# ========================
# S3 CONFIG Or Cloud For 
# Profile Photo Storage
# =======================
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# ==========================
# 🔹 USER REGISTER API START
# ==========================

@app.route("/register", methods=["POST"])
def register():

    email = request.form.get("email")
    password = request.form.get("password")
    name = request.form.get("name")
    photo = request.files.get("photo")  # optional

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    # password hash conversion
    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    user_data = {
        "name":name,
        "email": email,
        "password": hashed_password,
        "createdAt": datetime.now(timezone.utc)
    }

    # PHOTO UPLOAD (optional)
    if photo:
        if not photo.mimetype.startswith("image/"):
            return jsonify({"message": "Invalid image format"}), 400

        upload_result = cloudinary.uploader.upload(
            photo,
            folder="profile_photos"
        )

        user_data["profilePhoto"] = {
            "url": upload_result["secure_url"],
            "public_id": upload_result["public_id"]
        }

    users.insert_one(user_data)

    return jsonify({"message": "User registered successfully"}), 201

# ==========================
# 🔹 USER REGISTER API END
# ==========================
   
# ========================
# PAGE RENDER CONFIG/API
# ========================

# ==MAIN INDEX HTML RENDERING===============
@app.route("/")
def home():
    return render_template("index.html")

# ==DASHBOARD RENDERING===================
@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

# ==HOME PAGE RENDERING===================
@app.route("/home_page")
def home_page():
    return render_template("home_page.html")

# ==FORGOT PASSWORD PAGE RENDERING======
@app.route("/forgot_password_page")
def forgot_password_page():
    return render_template("forgot_password_page.html")

# ==RESET PAGE RENDERING================
@app.route("/reset_password/<token>", methods=["GET"])
def reset_password(token):
    return render_template("reset_password.html", token=token)

# ===============================
# Fetch user details for home page
# ==============================
@app.route("/api/home_page")
def home_page_api():

    email = request.args.get("email")

    print("EMAIL FROM API:", email)

    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # return jsonify({
    #     "email": user["email"],
    #     "image":user["profilePhoto"]["url"],
    #     "name":user["name"],
    # })
    return jsonify({
    "email": user["email"],
    "image": (user.get("profilePhoto") or {}).get("url"),
    "name": user["name"],
})


# == API TO SHOW USER DETAILS ON USER PROFILE=======
@app.route("/user_profile", methods=["GET"])
def loadProfile2():
    email = request.args.get("email")
    # print("✅ /user_profile API HIT", email)

    if not email:
        return jsonify({"error": "Email required"}), 400

    user_data = users.find_one({"email": email})

    if not user_data:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
    "message": "Profile loaded",
    "user_email": user_data.get("email"),
    "profile_image": user_data.get("profilePhoto", {}).get("url", "https://res.cloudinary.com/dls79lzyn/image/upload/v1770363924/default_user_profile_bx8coo.jpg")
}), 200



# ============================
# LOGOUT API 
# ============================
@app.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully"})

# ===========================
# 🔹 LOGIN API
# ===========================
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"message": "Invalid email or password"}), 401

    token = jwt.encode(
        {
            "user_id": str(user["_id"]),
            "exp": datetime.now(timezone.utc) + timedelta(hours=2)
        },
        SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({
        "message": "Login successful",
        "token": token
    }), 200


# ===================================================
# 🔹 FORGET PASSWORD_API TRIGGER RESET LINK ON EMAIL
# ===================================================
@app.route("/forgot_password", methods=["POST"])
def forgot_password():

    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found"}), 404

    reset_token = secrets.token_urlsafe(32)
    expiry_time = expiry_time = datetime.now(timezone.utc) + timedelta(minutes=15)


    users.update_one(
        {"email": email},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expiry": expiry_time
            }
        }
    )
    reset_link = f"https://api-python-myhh.onrender.com/reset_password/{reset_token}" 
    # reset_link = f"http://127.0.0.1:5000/reset_password/{reset_token}"

    try:
    #   send_reset_email(email, reset_link)
        threading.Thread(
            target=send_reset_email,
            args=(email, reset_link)
        ).start()

    except Exception as e:
      print("Email sending failed:", str(e))

    
    return jsonify({
        "message": "Reset password link sent to your email"
    }), 200


# EMAIL NOTIFICATION SEND FUNCTION WHEN PASSWORD RESET SUCCESSFULLY 

# def send_reset_email(to_email, reset_link):

#     msg = EmailMessage()

#     msg["Subject"] = "🔐 Reset Your Password"
#     msg["From"] = os.getenv("EMAIL_USER")   # ENV variable
#     msg["To"] = to_email

#     # Plain text fallback
#     msg.set_content(f"""
# Hi,

# Click the link below to reset your password:

# {reset_link}

# This link will expire in 15 minutes.

# If you did not request this, please ignore this email.

# Auth System
# """)

#     # HTML email
#     msg.add_alternative(f"""
#     <div style="font-family: Arial; background:#f4f6f8; padding:20px;">

#         <div style="
#             max-width:500px;
#             margin:auto;
#             background:white;
#             padding:25px;
#             border-radius:10px;
#             box-shadow:0 0 10px rgba(0,0,0,0.1);
#         ">

#             <h2 style="color:#007bff;">🔐 Password Reset Request</h2>

#             <p>Hello 👋,</p>

#             <p>We received a request to reset your password.</p>

#             <div style="text-align:center; margin:20px 0;">
#                 <a href="{reset_link}"
#                    style="
#                        display:inline-block;
#                        background:#007bff;
#                        color:white;
#                        padding:12px 20px;
#                        text-decoration:none;
#                        border-radius:6px;">
#                     Reset Password
#                 </a>
#             </div>

#             <p style="color:#dc3545;">
#                 ⏰ This link will expire in 15 minutes.
#             </p>

#             <div style="
#                 background:#f8f9fa;
#                 padding:15px;
#                 border-radius:8px;
#                 margin-top:15px;">
#                 If you did not request this password reset,
#                 please ignore this email.
#             </div>

#             <p style="color:#888; font-size:12px;">
#                 This is an automated message. Please do not reply.
#             </p>

#         </div>

#     </div>
#     """, subtype="html")

#     try:

#         # ✅ TLS SMTP (Render compatible)
#         server = smtplib.SMTP("smtp.gmail.com", 587)
#         server.starttls()

#         server.login(
#             os.getenv("EMAIL_USER"),
#             os.getenv("EMAIL_PASS")
#         )

#         server.send_message(msg)
#         server.quit()

#         print("✅ Reset email sent")

#     except Exception as e:
#         print("❌ Email error:", e)

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = 587

SMTP_LOGIN = os.getenv("SMTP_LOGIN")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

FROM_EMAIL = os.getenv("FROM_EMAIL")

# ===============================
# PASSWORD RESET EMAIL
# ===============================

def send_reset_email(to_email, reset_link):

    print("EMAIL FUNCTION CALLED")

    msg = EmailMessage()

    msg["Subject"] = "🔐 Password Reset Request"
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email

    # Plain text fallback
    msg.set_content(f"""
Hi,

Click below to reset password:

{reset_link}

Link expires in 15 minutes.
""")

    # HTML template
    msg.add_alternative(f"""
    <div style="font-family: Arial; background:#f4f6f8; padding:20px;">
        <div style="max-width:500px;margin:auto;background:white;padding:25px;border-radius:10px;">
            <h2 style="color:#007bff;">🔐 Password Reset Request</h2>

            <p>Hello 👋,</p>

            <p>We received a request to reset your password.</p>

            <div style="text-align:center; margin:20px 0;">
                <a href="{reset_link}"
                   style="background:#007bff;color:white;padding:12px 20px;text-decoration:none;border-radius:6px;">
                    Reset Password
                </a>
            </div>

            <p style="color:#dc3545;">
                ⏰ This link will expire in 15 minutes.
            </p>
        </div>
    </div>
    """, subtype="html")

    try:

        print("Connecting SMTP...")

        # 🔥 timeout added (VERY IMPORTANT)
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:

            print("Connected SMTP")

            server.set_debuglevel(1)

            print("Starting TLS...")
            server.starttls()

            print("Logging in SMTP...")
            server.login(SMTP_LOGIN, SMTP_PASSWORD)

            print("Sending email...")
            server.send_message(msg)

        print("✅ EMAIL SENT SUCCESS")

    except Exception as e:
        print("❌ EMAIL ERROR:", e)



# ===============================
# ASYNC THREAD HELPER
# ===============================

def send_async(func, *args):

    threading.Thread(
        target=func,
        args=args,
        daemon=True
    ).start()


  
# =============================================================
# RESET PASSWORD PAGE API TO TAKE NEW PASSWORD AND UPDATE IN DB
# =============================================================

@app.route("/reset_password_page", methods=["POST"])
def reset_password_page():

    if not request.is_json:
        return jsonify({"message": "Invalid request"}), 400

    data = request.get_json()

    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return jsonify({"message": "Invalid request"}), 400

    user = users.find_one({"reset_token": token})

    if not user:
        return jsonify({"message": "Invalid or expired token"}), 400

    
    expiry = user.get("reset_token_expiry")

    if not expiry:
        return jsonify({"message": "Invalid token"}), 400

    
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expiry:
        return jsonify({"message": "Reset link expired"}), 400

    # 🔐 password hash
    hashed = bcrypt.hashpw(
        new_password.encode("utf-8"),
        bcrypt.gensalt()
    )

    #  password update + token remove
    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": hashed},
            "$unset": {
                "reset_token": "",
                "reset_token_expiry": ""
            }
        }
    )
    # Sending email notfication when password reset successfully
    # password_reset_confirmation_notification(user["email"])
    threading.Thread(
       target=password_reset_confirmation_notification,
       args=(user["email"],),
       daemon=True
    ).start()
    return jsonify({
        "message": "Password reset successful. Please login."
    }), 200


# def password_reset_confirmation_notification(email):

#     msg = EmailMessage()

#     msg["Subject"] = "✅ Password Reset Successful"
#     msg["From"] = os.getenv("EMAIL_USER")   # ENV variable
#     msg["To"] = email

#     # Plain text fallback
#     msg.set_content("""
# Hi,

# Your password has been updated successfully.

# If you did not request this, please ignore this email.

# Thanks,
# Auth System
# """)

#     # HTML email
#     msg.add_alternative(f"""
#     <div style="font-family: Arial; background:#f4f6f8; padding:20px;">

#         <div style="
#             max-width:500px;
#             margin:auto;
#             background:white;
#             padding:25px;
#             border-radius:10px;
#             box-shadow:0 0 10px rgba(0,0,0,0.1);
#         ">

#             <h2 style="color:#28a745;">✅ Password Reset Successful</h2>

#             <p>Hello 👋,</p>

#             <p>Your password has been <b>updated successfully</b>.</p>

#             <div style="
#                 background:#f8f9fa;
#                 padding:15px;
#                 border-radius:8px;
#                 margin:15px 0;">
#                 If you did not request this change,
#                 please secure your account immediately.
#             </div>

#             <p style="color:#888; font-size:12px;">
#                 This is an automated message. Please do not reply.
#             </p>

#         </div>

#     </div>
#     """, subtype="html")

#     try:

#         # ✅ SMTP TLS version (Render friendly)
#         server = smtplib.SMTP("smtp.gmail.com", 587)
#         server.starttls()

#         server.login(
#             os.getenv("EMAIL_USER"),
#             os.getenv("EMAIL_PASS")
#         )

#         server.send_message(msg)
#         server.quit()

#         print("✅ Confirmation email sent")

#     except Exception as e:
#         print("❌ Email error:", e)

def password_reset_confirmation_notification(email):

    msg = EmailMessage()

    msg["Subject"] = "✅ Password Reset Successful"
    msg["From"] = FROM_EMAIL
    msg["To"] = email

    # Plain text fallback
    msg.set_content("""
Hi,

Your password has been updated successfully.

If you did not request this, please ignore this email.

Thanks,
Auth System
""")

    # HTML email
    msg.add_alternative(f"""
    <div style="font-family: Arial; background:#f4f6f8; padding:20px;">
        <div style="
            max-width:500px;
            margin:auto;
            background:white;
            padding:25px;
            border-radius:10px;
            box-shadow:0 0 10px rgba(0,0,0,0.1);
        ">

            <h2 style="color:#28a745;">✅ Password Reset Successful</h2>

            <p>Hello 👋,</p>

            <p>Your password has been <b>updated successfully</b>.</p>

            <div style="
                background:#f8f9fa;
                padding:15px;
                border-radius:8px;
                margin:15px 0;">
                If you did not request this change,
                please secure your account immediately.
            </div>

            <p style="color:#888; font-size:12px;">
                This is an automated message. Please do not reply.
            </p>

        </div>
    </div>
    """, subtype="html")

    try:

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_LOGIN, SMTP_PASSWORD)
            server.send_message(msg)

        print("✅ Confirmation email sent")

    except Exception as e:
        print("❌ Email error:", e)
# =========================
# 🔹 PROTECTED API JWT ENCODING 
# =========================
@app.route("/profile", methods=["GET"])
def profile():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"message": "Authorization header missing"}), 401

    try:
        # Supports: "Bearer <token>"
        token = auth_header.split(" ")[1] if " " in auth_header else auth_header

        decoded = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )
        return jsonify({
            "message": "Welcome!",
            "user_id": decoded["user_id"]
        })

    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401


# =========================
# 🔹 RUN
# =========================
if __name__ == "__main__":
    app.run(debug=True)
