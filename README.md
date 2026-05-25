# FlowDesk – IT Ticket Management

**FlowDesk** is a lightweight, self-hosted ticket management system for IT support teams. Built with **Flask**, **SQLAlchemy**, and **SQLite**, it runs without external dependencies and keeps each team's data isolated in independent workspaces — with member authentication, comments, sequential ticket numbering, and built-in CSRF/XSS protection.

---

## Features

- **Full Ticket Management** — Create, edit, complete, and delete tickets with title, description, assignees, priority, and due date.
- **Customizable Categories** — Organize tickets by category with custom colors and SVG icons (Infrastructure, Software, Network, etc.).
- **Search and Filters** — Quickly find tickets by status, priority, category, or keyword.
- **Activity History** — Clear visual separation between completed and cancelled tickets.
- **Multi-Workspace Support** — Create independent workspaces for different teams or projects, each with its own link and isolated database.
- **Member Authentication** — The workspace manager creates members with name and password (securely hashed with `werkzeug`). Every action can be logged with its author.
- **Comment System** — Discuss each ticket with your team directly on the ticket page.
- **Sequential Ticket Numbering** — Each workspace has its own ticket numbering (`#1`, `#2`, `#3`...), just like professional helpdesk systems.
- **Built-in Security:**
  - CSRF protection on all write operations.
  - XSS sanitization on the frontend and validation on the backend.
  - Passwords are always hashed — never stored in plain text.
- **Responsive Dark UI** — Dark theme, dynamic modals, and interactions built with vanilla JavaScript — no frontend frameworks required.

---

## Installation

### Prerequisites

- Python 3.9 or higher
- pip
- Docker (optional)

### 1. Clone the repository

```bash
git clone https://github.com/Sarc120p/flowdesk.git
cd flowdesk
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

```bash
flask run
```

The application will be available at `http://localhost:5000`.

### Running with Docker

```bash
docker compose up --build
```

---

## Project Structure

```
flowdesk/
├── app.py              # Application entry point
├── models.py           # Data models (SQLAlchemy)
├── routes/             # Routes organized by module
├── templates/          # HTML templates (Jinja2)
├── static/             # CSS, JS, and assets
└── requirements.txt    # Project dependencies
```

---

## Tech Stack

| Technology | Role |
|---|---|
| Python 3.9+ | Main language |
| Flask 3.0 | Web framework |
| SQLAlchemy | ORM |
| SQLite | Database |
| Werkzeug | Password hashing and utilities |
| JavaScript (vanilla) | Frontend interactivity |

---

## Security

FlowDesk was built with security practices in mind from the start:

- **CSRF** — All write operations are protected against Cross-Site Request Forgery.
- **XSS** — User input is sanitized on the frontend and validated on the backend.
- **Passwords** — Never stored in plain text; uses secure hashing via `werkzeug.security`.

---

## Contributing

Contributions are welcome. For significant changes, please open an issue first to discuss what you'd like to modify.

1. Fork the repository.
2. Create a branch for your feature (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a Pull Request.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
