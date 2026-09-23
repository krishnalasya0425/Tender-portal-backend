# Tender Portal Backend

Backend API for a tender-management portal. The service provides authentication, role-based access control, tender CRUD operations, vertical-based tender visibility, MongoDB persistence, email notifications, and scheduled deadline reminders.

## Features

- User registration and login with JWT authentication.
- Password hashing with `bcryptjs`.
- Automatic first-user administrator setup.
- Admin approval workflow for new users.
- Admin-managed user approval and vertical permissions.
- Tender creation, retrieval, update, and deletion.
- Access control for tender data based on user role and allowed verticals.
- Duplicate `TenderNumber` protection through a unique MongoDB field.
- Email reminders when an active tender deadline is within 48 hours.
- Hourly background job for checking upcoming tender deadlines.
- Docker and Docker Compose support for the Node.js API and MongoDB.

## Technology Stack

- **Runtime:** Node.js 18 Alpine in the provided Docker image
- **Language:** JavaScript using CommonJS modules
- **Web framework:** Express 5
- **Database:** MongoDB with Mongoose 9
- **Authentication:** JSON Web Tokens (`jsonwebtoken`)
- **Password security:** `bcryptjs`
- **Email:** Nodemailer with SMTP support
- **Scheduled jobs:** `node-cron`
- **Other notable libraries:** CORS, dotenv, Axios, Google APIs, Multer, and `xlsx`

## Project Structure

```text
.
├── config/
│   └── db.js                         MongoDB connection helper
├── controllers/
│   ├── authController.js             Registration, login, approval, and password reset logic
│   └── tenderController.js           Tender CRUD and authorization-aware filtering
├── middleware/
│   └── authMiddleware.js             JWT validation and admin-only authorization
├── models/
│   ├── User.js                       User schema and role/approval fields
│   └── Tender.js                      Tender schema and tender metadata
├── routes/
│   ├── authRoutes.js                 Authentication and user-management routes
│   └── tenderRoutes.js               Tender CRUD routes
├── utils/
│   ├── mailer.js                     SMTP email transporter and send helper
│   ├── reminderJob.js                 Hourly tender deadline cron job
│   └── checkAndSendDeadlineReminder.js Immediate deadline reminder logic
├── checkDuplicates.js                Utility script for finding duplicate tender numbers
├── server.js                         Express application entry point
├── Dockerfile                        Production-oriented Node.js container definition
├── docker-compose.yml                Backend and MongoDB development stack
├── package.json                       Dependencies and npm scripts
└── package-lock.json                  Locked dependency versions
```

> `node_modules/` is present in the repository tree but is generated dependency content and should not be edited or committed. Dependencies should be installed from `package.json` and `package-lock.json`.

## How the Application Works

`server.js` loads environment variables, connects to MongoDB through `config/db.js`, enables CORS and JSON parsing, and mounts the API routers under `/api/auth` and `/api/tenders`.

Incoming protected requests pass through `middleware/authMiddleware.js`. The middleware verifies the JWT using `JWT_SECRET` and places the decoded user information on `req.user`. Admin-only routes additionally use `adminOnly` to restrict access to users with the `admin` role.

Tender operations are implemented in `controllers/tenderController.js` and persisted using the `Tender` Mongoose model. Regular users only see tenders belonging to their permitted verticals and can update or delete tenders they created. Administrators can manage all tenders.

Deadline notifications are checked immediately after tender creation or update. The scheduled job in `utils/reminderJob.js` runs every hour and sends an email to the administrator for active tenders closing within the next 48 hours.

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB, or Docker Desktop with Docker Compose
- An SMTP account if email reminders are required

## Configuration

Create a `.env` file in the project root. The following variables are used by the application:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/tenderdb
JWT_SECRET=replace-with-a-long-random-secret

# SMTP configuration used by utils/mailer.js
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password-or-app-password
```

`MONGO_URI` is required by the main server. `JWT_SECRET` is required for issuing and verifying tokens. Email variables are required for successful deadline notifications. The `.env` file is ignored by Git; do not commit credentials or secrets.

## Running Locally

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/krishnalasya0425/Tender-portal-backend.git
   cd Tender-portal-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create and populate `.env` using the configuration above.

4. Start MongoDB locally, then start the API:

   ```bash
   npm start
   ```

The server listens on the port defined by `PORT`. With `PORT=5001`, the health endpoint is available at:

```text
GET http://localhost:5001/test
```

There is currently no test script defined in `package.json`. The only npm script is `start`, which runs `node server.js`.

## Running with Docker Compose

Docker Compose starts the backend and MongoDB together. The backend container is exposed on port `5001`, MongoDB on port `27017`, and MongoDB data is persisted in the `mongo_data` volume.

```bash
docker compose up --build
```

The Compose configuration supplies the backend with:

```text
MONGO_URI=mongodb://mongodb:27017/tenderdb
```

Stop the stack with:

```bash
docker compose down
```

## API Reference

All routes below are relative to the server base URL, for example `http://localhost:5001`.

### Health check

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| GET | `/test` | None | Returns a basic server status response. |

### Authentication and users

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register a user. The first registered user becomes an approved admin; later users require approval. |
| POST | `/api/auth/login` | None | Authenticate an approved user and return a JWT. |
| POST | `/api/auth/reset-password` | None | Change a user's password using the supplied email and matching new passwords. |
| GET | `/api/auth/pending-users` | Admin JWT | List users waiting for approval. |
| GET | `/api/auth/users` | Admin JWT | List all users without password fields. |
| PUT | `/api/auth/approve-user/:id` | Admin JWT | Approve a user and assign `allowedVerticals`. |

### Tenders

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| POST | `/api/tenders` | JWT | Create a tender. The authenticated user is saved as `createdBy`. |
| GET | `/api/tenders` | JWT | List tenders. Regular users are filtered by their allowed verticals. |
| GET | `/api/tenders/:id` | JWT | Retrieve one tender if the user is authorized to view it. |
| PUT | `/api/tenders/:id` | JWT | Update a tender. Admins can update any tender; regular users can update their own. |
| DELETE | `/api/tenders/:id` | JWT | Delete a tender. Admins can delete any tender; regular users can delete their own. |

For protected endpoints, send the token in the request header:

```http
Authorization: Bearer <jwt-token>
```

## Data Models

### User

The `User` model stores:

- `email` — unique user email address
- `password` — bcrypt-hashed password
- `role` — either `user` or `admin`
- `isApproved` — whether the user may log in
- `allowedVerticals` — tender verticals visible to the user; `ALL` grants unrestricted vertical access
- `createdAt` and `updatedAt` — Mongoose timestamps

### Tender

The `Tender` model stores tender identification, description, category, deadline, bid information, organization details, links, remarks, and status information. `TenderNumber` is unique. Supported `Vertical` values are:

- `AR/VR`
- `AI`
- `AI/UGV`
- `UGV`
- `OTHERS`
- `DRONE/AI`
- `UAV`
- `RCWS/AWS`

The `DeadlineReminderSent` flag prevents repeated reminder emails. Updating a tender resets this flag so a changed deadline can be evaluated again.

## Deadline Reminder Workflow

1. A tender must have a deadline and `Status` set to `Active`.
2. The deadline must be more than the current time and no more than 48 hours away.
3. The service finds the administrator's email address.
4. `utils/mailer.js` sends an HTML email through the configured SMTP server.
5. The tender is saved with `DeadlineReminderSent: true`.
6. `utils/reminderJob.js` repeats this check every hour for active tenders that have not yet been notified.

## Duplicate Tender Check

To inspect the database for duplicate tender numbers, make sure MongoDB is available and run:

```bash
node checkDuplicates.js
```

The utility connects using `MONGODB_URI` when present, otherwise it falls back to `mongodb://localhost:27017/tender-portal`. For consistency with the main server, use the same database configuration when running this script.

## Security and Deployment Notes

- Use a strong, unique `JWT_SECRET` in every environment.
- Never commit `.env`, SMTP passwords, or other credentials.
- Restrict CORS to trusted frontend origins before production deployment; the current server configuration allows all origins.
- Use an SMTP app password or provider-specific credential rather than a personal mailbox password where possible.
- Add automated tests and request validation before exposing the API to untrusted clients.

## License

No license is currently specified in the repository.
