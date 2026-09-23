# Developer Onboarding Guide

This document helps a new developer understand the backend for the Tender Portal, how the project is structured, how to run it locally, and how to work safely with the authentication, tender, and reminder features.

## 1. Project Purpose

This repository is the backend API for a tender management portal. It supports:

- User registration and login
- Admin approval flow for new users
- Role-based access control
- Tender creation, updates, retrieval, and deletion
- Vertical-based visibility for user-specific tender access
- Deadline reminder emails for active tenders nearing expiry
- MongoDB persistence for users and tenders

## 2. Tech Stack

- Node.js 18
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing
- Nodemailer for email sending
- node-cron for scheduled reminders
- Docker and Docker Compose for local environment setup

## 3. Repository Structure

```text
.
├── config/
│   └── db.js                 MongoDB connection helper
├── controllers/
│   ├── authController.js     Auth logic: register, login, approval, password reset
│   └── tenderController.js   Tender CRUD logic and authorization filters
├── middleware/
│   └── authMiddleware.js     JWT validation and admin-only access checks
├── models/
│   ├── User.js               User schema
│   └── Tender.js             Tender schema
├── routes/
│   ├── authRoutes.js         Auth endpoints
│   └── tenderRoutes.js       Tender endpoints
├── utils/
│   ├── mailer.js             SMTP email transport helper
│   ├── reminderJob.js        Scheduled reminder cron job
│   └── checkAndSendDeadlineReminder.js Deadline reminder logic
├── checkDuplicates.js         Utility for identifying duplicate tender numbers
├── server.js                 Express app entry point
├── Dockerfile                Backend container config
├── docker-compose.yml        Local stack for API + MongoDB
├── .gitignore                Ignores .env and node_modules
├── package.json              Dependencies and scripts
├── package-lock.json         Lock file
├── README.md                 Project documentation
└── .env                      Local environment configuration (not committed)
```

## 4. Runtime Flow

The app starts in `server.js`:

- loads environment variables with `dotenv`
- connects to MongoDB through `config/db.js`
- enables JSON parsing and CORS
- mounts API routes at:
  - `/api/auth`
  - `/api/tenders`

### Request flow

1. Request enters Express.
2. `middleware/authMiddleware.js` validates JWT for protected routes.
3. Controller handles business logic.
4. Mongoose models interact with MongoDB.
5. Additional email or reminder logic may run from `utils/*`.

## 5. Main Features and Responsibilities

### Authentication and users

Files involved:

- `controllers/authController.js`
- `routes/authRoutes.js`
- `models/User.js`
- `middleware/authMiddleware.js`

What they do:

- Register users
- Handle login and JWT issuance
- Support password reset
- Approve users through an admin workflow
- Restrict admin-only routes
- Store user roles and allowed vertical access

User roles:

- `admin`
- `user`

Important details:

- The first registered user becomes the admin account.
- New users are created as `isApproved: false` unless they are the first admin.
- Admin users can approve others and assign `allowedVerticals`.

### Tender management

Files involved:

- `controllers/tenderController.js`
- `routes/tenderRoutes.js`
- `models/Tender.js`

What they do:

- Create tender records
- List tenders
- Read a single tender
- Update tender details
- Delete tenders
- Enforce user access restrictions using allowed verticals

Rules:

- Regular users only see tenders matching their allowed verticals.
- Admin users can manage all tenders.
- `TenderNumber` is unique in the schema.
- `createdBy` stores the user who created the tender.

### Reminder emails

Files involved:

- `utils/checkAndSendDeadlineReminder.js`
- `utils/mailer.js`
- `utils/reminderJob.js`

What they do:

- Check whether a tender deadline is within 48 hours
- Send email reminders to the admin user
- Avoid duplicate reminder emails using `DeadlineReminderSent`
- Run a cron job hourly to detect upcoming deadlines

Reminder logic:

- Only active tenders are checked.
- Only tenders with a valid deadline are evaluated.
- If the deadline is within 48 hours, an email is sent.
- The reminder flag is set to avoid repeated sends.

## 6. Local Setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB instance or Docker/Compose
- SMTP configuration if email reminders are enabled

### Clone and install

```bash
git clone https://github.com/krishnalasya0425/Tender-portal-backend.git
cd Tender-portal-backend
npm install
```

### Environment variables

Create a `.env` file in the root of the project:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/tenderdb
JWT_SECRET=replace-with-a-strong-secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password-or-app-password
```

Notes:

- `.env` is ignored by Git.
- `MONGO_URI` is required for DB connectivity.
- `JWT_SECRET` is required for auth token validation.
- Email variables are required if reminder emails should work.

### Start the application

```bash
npm start
```

This starts the Express server with `node server.js`.

### Health check

```bash
curl http://localhost:5001/test
```

Expect a JSON response like:

```json
{ "status": "ok Edgefo" }
```

## 7. Docker Setup

The project includes a Docker setup for running the API and MongoDB together.

### Start with Docker Compose

```bash
docker compose up --build
```

This starts:

- backend container on port `5001`
- MongoDB container on port `27017`

Environment configured by Compose:

```text
MONGO_URI=mongodb://mongodb:27017/tenderdb
```

Stop it with:

```bash
docker compose down
```

## 8. Typical Development Workflow

### Before working on a feature

1. Pull the latest code.
2. Review the relevant route and controller files.
3. Check the model schema before adding fields.
4. Confirm whether the work affects auth, tender access rules, or reminders.

### Common tasks

#### Add a new API endpoint

- Create or modify the relevant route in `routes/*.js`
- Add handler logic in the matching controller file
- Add or update appropriate model fields if needed
- Ensure authorization checks are added where required

#### Modify access logic

- Check `middleware/authMiddleware.js`
- Review `controllers/tenderController.js` filtering logic
- Verify user allowed vertical constraints and role checks

#### Change tender schema

- Update `models/Tender.js`
- Review all controllers and CRUD logic for field usage
- Be careful with existing database data and validation changes

#### Change reminder logic

- Review `utils/checkAndSendDeadlineReminder.js`
- Confirm SMTP configuration in `.env`
- Verify cron behavior in `utils/reminderJob.js`

## 9. Important Notes for Contributors

- Do not commit `.env` values or secrets.
- Be careful when changing role logic; it affects user access across the app.
- Respect the `allowedVerticals` permission system when updating tender access rules.
- Keep API behavior consistent with existing patterns in controllers and routes.
- Use Mongoose validation and schema constraints intentionally.
- If you add new fields to the tender schema, update all relevant controller logic.

## 10. Common Operations

### Check for duplicate tender numbers

```bash
node checkDuplicates.js
```

This utility scans the MongoDB data for duplicate `TenderNumber` values.

### Reset or troubleshoot local environment

```bash
rm -rf node_modules
npm install
```

If MongoDB is failing, verify the URI and whether the Mongo service is running.

## 11. Suggested Coding Practices

- Keep controllers thin and focused.
- Prefer model validation and schema constraints over ad hoc checks.
- Add permission checks before returning sensitive data.
- Log meaningful errors when debugging, but avoid exposing internals in production responses.
- Test critical flows like login, approval, tender listing, and deadline reminders before merging.

## 12. First Tasks for New Developers

A good onboarding path is:

1. Read `server.js`
2. Read `routes/authRoutes.js` and `routes/tenderRoutes.js`
3. Read `middleware/authMiddleware.js`
4. Read `controllers/authController.js` and `controllers/tenderController.js`
5. Read `models/User.js` and `models/Tender.js`
6. Trace one login flow and one tender CRUD flow end-to-end
7. Run the app locally and verify the `/test` endpoint
8. Validate the reminder logic using the configured email setup

## 13. Support and Troubleshooting

If a route returns unauthorized or forbidden responses:

- confirm the JWT is present in the `Authorization` header
- verify `JWT_SECRET` matches across environments
- confirm the user is approved and has the correct role

If MongoDB connection fails:

- verify `MONGO_URI`
- confirm the Mongo service is running
- confirm Docker containers are started if using Compose

If emails are not sending:

- verify SMTP credentials in `.env`
- confirm `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_USER` values
- check the email account for app-password or security restrictions

## 14. Summary

This backend is a Node.js + Express + MongoDB service for managing tender-related data. The major domains are:

- authentication and authorization
- user approval and vertical permissions
- tender CRUD and access control
- automatic deadline reminders via email cron jobs

Once the environment is properly configured, the application is straightforward to develop and extend.
