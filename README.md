# MessConnect Prototype

A beginner-friendly Mess Feedback Management System built with React (Vite), Tailwind CSS, Node.js, Express, MongoDB Community Edition, Mongoose and Express sessions.

## Included use cases

- **UC-001:** Student/Admin login
- **UC-002:** Student submits a meal rating from 1 to 5
- **UC-003:** Student submits a complaint; new complaints start as `Pending`
- **UC-005:** Admin views all meal ratings and complaints
- **UC-008:** Student/Admin logout

Not included: registration, student history, complaint status editing, summary reports, or other use cases.

## Requirements

Install these before running the app:

1. Node.js LTS (includes npm): https://nodejs.org/
2. MongoDB Community Edition: https://www.mongodb.com/docs/manual/installation/

## macOS setup

### 1. Check Node.js

Open Terminal and run:

```bash
node -v
npm -v
```

If these commands are not found, install Node.js LTS from the official website above and reopen Terminal.

### 2. Install and start MongoDB Community Edition

Follow the official MongoDB Community Edition installation instructions for your macOS version and CPU (Apple Silicon or Intel):
https://www.mongodb.com/docs/manual/installation/

If you installed MongoDB using Homebrew, start it with the service name shown by your installation guide. A common command is:

```bash
brew services start mongodb-community
```

If that service name is not found, check the exact formula/version you installed. You can check whether MongoDB is responding with:

```bash
mongosh
```

At the MongoDB shell, type `exit` to leave. Keep MongoDB running while using MessConnect.

### 3. Open the project folder

Extract `messconnect.zip`. In Terminal, move into the extracted folder. For example, if it is in Downloads:

```bash
cd ~/Downloads/messconnect
```

Use the actual folder location if different.

### 4. Install Node packages

```bash
npm install
```

### 5. Create the environment file

Copy the example file:

```bash
cp .env.example .env
```

You can leave the MongoDB URI as-is for a local installation. For a real deployment, replace `SESSION_SECRET` with a long random secret and configure secure cookies/HTTPS.

### 6. Create the two allowlisted accounts

Make sure MongoDB is running, then run:

```bash
npm run seed
```

This creates or updates the two local MongoDB accounts permitted to log in. The server rejects all other email addresses even if a different account exists in the database.

| Role | Email | Password |
|---|---|---|
| Student | `24ucs023@lnmiit.ac.in` | `Student123!` |
| Admin / professor | `tanmaysharma@lnmiit.ac.in` | `Admin123!` |

These are prototype passwords, not proof that either mailbox is owned or verified. Change them before sharing the project, and do not use these credentials in a public deployment. This prototype uses an email allowlist only; it does not send an email link or OTP.

### 7. Build the React frontend and start the website

`npm install` also installs the frontend packages in `client/`. Build the frontend once (and again after changing anything in `client/`), then start the server:

```bash
npm run build
npm start
```

Open this URL in your browser:

http://localhost:3000

To stop the server, press `Control + C` in Terminal.

### Frontend development mode (optional)

While editing the React code, run the API and the Vite dev server in two terminals for instant reloads:

```bash
npm start            # terminal 1: API on http://localhost:3000
npm run dev:client   # terminal 2: React app on http://localhost:5173
```

Open http://localhost:5173. Vite forwards `/api` requests to the Express server.

## How to test the five use cases

1. Open `http://localhost:3000`.
2. Log in with `24ucs023@lnmiit.ac.in` and password `Student123!`.
3. Submit a meal rating: select a meal, date and rating from 1 to 5.
4. Submit a complaint with a category and description. It should be saved with `Pending` status.
5. Log out.
6. Log in with `tanmaysharma@lnmiit.ac.in` and password `Admin123!`.
7. Check that the admin page shows the meal rating and complaint you submitted.
8. Log out.
9. Optional access-control checks: try logging in with an email outside the allowlist (it should be rejected), then log in as Student and manually open `/admin`. The app should redirect the student to the student page, and the server also rejects admin-only data requests.

## Project structure

```text
messconnect/
├── server.js
├── seed.js
├── package.json
├── .env.example
├── models/
│   ├── User.js
│   ├── MealRating.js
│   └── Complaint.js
└── client/                 React frontend (Vite)
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx           routes + login state
        ├── api.js            fetch helper
        ├── index.css         Tailwind import + colour theme
        ├── components/       Layout, StarRating, Notice, Spinner
        └── pages/            Login, Student, Admin
```

## Notes

- Passwords are hashed with bcryptjs.
- Login state is stored in server-side sessions; session records are stored in MongoDB.
- Role checks happen on the server, not only in the UI.
- This is a local learning prototype, not a production-ready deployment. Before public deployment, use HTTPS, a strong secret, secure cookie settings, CSRF protection, rate limiting and a carefully configured database/network.
