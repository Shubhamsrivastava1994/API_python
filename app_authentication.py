from flask import Flask, request, jsonify
from pymongo import MongoClient
import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from flask import render_template


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

# =========================
# 🔹 MONGODB
# =========================
client = MongoClient(
    "mongodb+srv://shubham_new:shubham_new@cluster0.89snqls.mongodb.net/"
)
db = client.Shubham_dbs
users = db.users

# =========================
# 🔹 REGISTER API
# =========================
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True)

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    users.insert_one({
        "email": email,
        "password": hashed_password
    })

    return jsonify({"message": "User registered successfully"}), 201
# ==============html=====
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")
# ============================

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
