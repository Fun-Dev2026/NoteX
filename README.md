# NoteX

A simple, **no‑login, shareable online notepad**. Type or paste text, get a unique link, and access the same note from any device.

---

## Features

- Plain textarea with no rich‑text formatting
- Auto‑generated or custom unique codes (shareable URLs)
- Autosave with debounce (updates are persisted automatically)
- **Refresh** button to sync the note across devices without a full page reload
- Action buttons: **Copy**, **Clear**, **Delete**, **New**, **Share**
- QR‑code generation for easy mobile sharing
- 30‑day auto‑expiry for inactive notes (Need to schedule Cron job)
- Fully responsive design (mobile, tablet, desktop)

---

## Tech Stack

- **Backend**: Flask (Python) with SQLite for storage
- **Frontend**: Vanilla HTML, CSS (custom design system), JavaScript

---

## Setup / Installation

```bash
# Clone the repository
git clone https://github.com/Fun-Dev2026/NoteX.git
cd NoteX

# Create a virtual environment
python -m venv venv
source venv/Scripts/activate   # Windows PowerShell
# or: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run locally
flask run
```

Open your browser at `http://127.0.0.1:5000`.

---

## Deployment

NoteX is intended for **self‑hosted** deployments. Run behind a reverse proxy or tunnel (e.g., Cloudflare Tunnel, Nginx, Apache). **Do not** use Flask’s built‑in development server in production.

---

## Project Structure

```
NoteX/
├─ app.py                # Flask application entry point
├─ notes.db              # SQLite database (generated at runtime)
├─ requirements.txt      # Python dependencies
├─ static/
│   ├─ script.js         # Front‑end logic
│   ├─ style.css         # Styling, includes responsive layout & footer
│   └─ favicon.svg      # Minimal SVG favicon
├─ templates/
│   └─ index.html       # Main HTML template (includes header, textarea, footer)
└─ README.md             # This file
```

---

## License / Credits

Designed and maintained by **WebComb** – <https://webcomb.net>.

*Feel free to fork, modify, and share!*
