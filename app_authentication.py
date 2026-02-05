from bson import ObjectId
from functools import wraps
from flask import Flask, request, jsonify
from pymongo import MongoClient
import bcrypt
import jwt
import os
import cloudinary
import cloudinary.uploader
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from flask import render_template
from flask_cors import CORS





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
# 🔹 MONGODB
# =========================
client = MongoClient(os.getenv("MONGO_URI"))

db = client.Shubham_dbs
users = db.users
# ==============cloudnearary config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# =========================
# 🔹 REGISTER API
# =========================
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

    # 🔐 password hash
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

    # 📸 PHOTO UPLOAD (optional)
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

   
# ==============html=====
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/home_page")
def home_page():
    return render_template("home_page.html")
# =====================
# Fetch user details for home page
@app.route("/api/home_page")
def home_page_api():

    email = request.args.get("email")

    print("EMAIL FROM API:", email)

    user = db.users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "email": user["email"],
        "image":user["profilePhoto"]["url"],
        "name":user["name"],
    })


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
        "user_email": user_data["email"],
        "profile_image":user_data["profilePhoto"]["url"]
    }), 200

# ============================
# logout API

@app.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully"})

# =========================
# 🔹 LOGIN API
# =========================
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


# =========================
# 🔹 PROTECTED API
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
