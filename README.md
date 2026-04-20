# NQM

NQM is a Quality Management web app built with a Django REST backend and a React (Vite) frontend. It focuses on Business Units and provides modules for Documents, Incidents, and Non-Conformance tracking.

## Modules
- DMS (Document Management): controlled documents with versioning and approvals.
- IR (Incident Reporting): incident intake, severity, and corrective actions.
- NC (Non-Conformance): non-conformances with CAPA fields.

## Tech Stack
- Backend: Django 6 + Django REST Framework + SimpleJWT + django-filter + django-cors-headers
- Frontend: React 19 + Vite + MUI
- Database: SQLite (local dev)

## Project Structure
- `backend/`: Django project settings and URLs
- `accounts/`, `core/`, `dms/`, `ir/`, `nc/`: Django apps
- `frontend/`: React app
- `manage.py`: Django entrypoint

## Quick Start (Backend)

### Prerequisites
- Python 3.12+ (matches the local `venv/`)

### Setup
From the repo root:

```powershell
# Optional: use the existing venv
.\venv\Scripts\Activate.ps1

# If you prefer a new venv instead:
# python -m venv venv
# .\venv\Scripts\Activate.ps1

# Install backend deps (if needed)
# pip install django djangorestframework djangorestframework-simplejwt django-filter django-cors-headers xhtml2pdf reportlab

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The backend runs on `http://127.0.0.1:8000`.

### Auth Endpoints
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`

## Quick Start (Frontend)

### Prerequisites
- Node.js 20+ and npm

### Setup
```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on `http://127.0.0.1:5173` and is configured for CORS in `backend/settings.py`.

## Notes
- File uploads are used by the DMS module. For local dev, consider adding `MEDIA_ROOT` and `MEDIA_URL` in `backend/settings.py` to control where files are stored.
- Business Units are central to all modules; create or seed them before using the UI.
