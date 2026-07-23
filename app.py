import os
import re
import secrets
import sqlite3
import time
from flask import Flask, jsonify, redirect, render_template, request, url_for

app = Flask(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "notes.db")
MAX_CONTENT_LENGTH = 200000
CODE_REGEX = re.compile(r"^[a-zA-Z0-9_-]{1,100}$")
EXPIRY_MS = 30 * 24 * 60 * 60 * 1000  # 30 days in milliseconds

# Unambiguous characters for random code generation (excluding 0, O, 1, l, I)
UNAMBIGUOUS_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"

def generate_random_code(length=8):
    return "".join(secrets.choice(UNAMBIGUOUS_ALPHABET) for _ in range(length))

def get_cutoff_ms():
    return int(time.time() * 1000) - EXPIRY_MS

def is_expired(updated_at):
    return updated_at is not None and updated_at < get_cutoff_ms()

def cleanup_expired_notes(conn):
    cutoff = get_cutoff_ms()
    cursor = conn.execute("DELETE FROM notes WHERE updated_at IS NOT NULL AND updated_at < ?", (cutoff,))
    return cursor.rowcount

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                code TEXT PRIMARY KEY,
                content TEXT DEFAULT '',
                updated_at INTEGER
            )
        """)

init_db()

@app.route("/")
def home():
    code = generate_random_code(8)
    return redirect(url_for("view_note", code=code))

@app.route("/<code>")
def view_note(code):
    if not CODE_REGEX.match(code):
        return "Invalid code format", 400
    return render_template("index.html", code=code)


@app.route("/api/note/<code>", methods=["GET"])
def get_note(code):
    if not CODE_REGEX.match(code):
        return jsonify({"error": "Invalid code format"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT content, updated_at FROM notes WHERE code = ?", (code,))
        row = cursor.fetchone()

        if row:
            if is_expired(row["updated_at"]):
                conn.execute("DELETE FROM notes WHERE code = ?", (code,))
                conn.commit()
                return jsonify({"content": ""})
            return jsonify({"content": row["content"]})

    return jsonify({"content": ""})


@app.route("/api/note/<code>", methods=["POST"])
def save_note(code):
    if not CODE_REGEX.match(code):
        return jsonify({"error": "Invalid code format"}), 400

    data = request.get_json(silent=True)
    if data is None or "content" not in data:
        return jsonify({"error": "Missing content in request body"}), 400

    content = data["content"]
    if not isinstance(content, str):
        return jsonify({"error": "Content must be a string"}), 400

    if len(content) > MAX_CONTENT_LENGTH:
        return jsonify({"error": "Content exceeds maximum length"}), 400

    updated_at = int(time.time() * 1000)

    with get_db() as conn:
        conn.execute("""
            INSERT INTO notes (code, content, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
                content = excluded.content,
                updated_at = excluded.updated_at
        """, (code, content, updated_at))
        conn.commit()

    return jsonify({"success": True, "updated_at": updated_at})

@app.route("/api/note/<code>", methods=["DELETE"])
def delete_note(code):
    if not CODE_REGEX.match(code):
        return jsonify({"error": "Invalid code format"}), 400

    with get_db() as conn:
        conn.execute("DELETE FROM notes WHERE code = ?", (code,))
        conn.commit()

    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)


