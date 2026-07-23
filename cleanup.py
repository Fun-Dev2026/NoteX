import sqlite3
from app import DB_PATH, cleanup_expired_notes

def main():
    conn = sqlite3.connect(DB_PATH)
    try:
        deleted_count = cleanup_expired_notes(conn)
        conn.commit()
        print(f"Cleaned up {deleted_count} expired note(s).")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
