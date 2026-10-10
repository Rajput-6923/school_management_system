# EduFlow School Management System

The React 19, Vite, TypeScript, Tailwind CSS frontend in `src/` uses the Laravel application at the repository root for authentication and persistent school data. Browser requests use Laravel session cookies and CSRF protection; no API secret is stored in the frontend.

## Local Setup

1. Configure the Laravel database connection in the repository-root `.env`, then run these commands from the repository root:

   ```sh
   php artisan migrate
   php artisan school:create-admin
   php artisan serve --port=8000
   ```

   The administrator command prompts for a name, email, and password; it does not store credentials in the frontend or in source control.

2. In a separate terminal, install and start the React app:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

3. Open `http://localhost:3000`. Vite proxies `/api` requests to Laravel at `http://127.0.0.1:8000`.

## API and Data

All frontend modules read and write Laravel-backed records: students, teachers, classes, subjects, attendance, exams, results, fee invoices and payments, timetable slots, notices, and school settings. The React app preserves existing browser data and offers it for a one-time import when the school-record database is empty. JSON import is additive; records with existing IDs are left unchanged.

API routes live under `/api`. Login and logout use Laravel's session guard. All write requests initialize and send Laravel's CSRF token. There is no public registration route; create an administrator with `php artisan school:create-admin`. User roles are `Admin`, `Teacher`, `Bursar`, and `Student`, with read/write access enforced by the API.

## Checks

From the repository root:

```sh
php artisan test --compact tests/Feature/SchoolApiTest.php
```

From `frontend/`:

```sh
npm run lint
npm run build
```
