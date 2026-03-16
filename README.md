# SeismoNepal (Fresh Start)

This project has been reset and rebuilt with:

- Backend: Django + SQLite
- Admin Web Portal + Client Web Portal
- Username/password login and user data storage
- Client profile setup
- SMTP email + Twilio SMS alert integration
- Real-time website scraping for earthquake data
- Mobile app frontend: React Native (Expo)
- JWT auth + real-time Expo push notifications with vibration feedback

## Project Structure

- `backend/` Django API + web portal
- `frontend-mobile/` React Native client app
- `.venv/` Python virtual environment

## Backend Setup (Django + SQLite)

1. Create/activate virtual environment:
   - `python3 -m venv .venv`
   - `source .venv/bin/activate`
2. Install dependencies:
   - `pip install -r backend/requirements.txt`
3. Configure env:
   - `cp backend/.env.example backend/.env`
   - Fill SMTP and Twilio keys.
4. Run migrations:
   - `cd backend`
   - `../.venv/bin/python manage.py migrate`
5. Create admin superuser:
   - `../.venv/bin/python manage.py createsuperuser`
6. Start backend:
   - `../.venv/bin/python manage.py runserver`

### Backend URLs

- Django admin: `http://127.0.0.1:8000/admin/`
- Web portal login: `http://127.0.0.1:8000/portal/login/`
- Auth API:
  - `POST /api/accounts/register/`
  - `POST /api/accounts/login/`
  - `GET/PATCH /api/accounts/profile/`
   - `POST /api/accounts/jwt/token/`
   - `POST /api/accounts/jwt/refresh/`
- Alerts API:
  - `GET /api/alerts/`
  - `POST /api/alerts/send/`
   - `POST /api/alerts/device-token/`
- Scraper API:
  - `GET /api/scraper/events/`
  - `POST /api/scraper/run/`

## Frontend Setup (React Native)

1. `cd frontend-mobile`
2. `npm install`
3. Start app:
   - `npm run ios` or `npm run android` or `npm run web`

### API Base URL for mobile

Edit `frontend-mobile/App.tsx` and change `API_BASE_URL` as needed:

- iOS simulator: `http://127.0.0.1:8000`
- Android emulator often needs host mapping like `http://10.0.2.2:8000`
- Physical device: use your computer LAN IP

## Notes

- Admin users can edit/remove users via `/portal/admin/`.
- Client users can update profile via `/portal/client/` and mobile app.
- Mobile app registers Expo device token and receives push notifications for `app` alerts.
- SMS/email delivery depends on valid Twilio/SMTP credentials.
