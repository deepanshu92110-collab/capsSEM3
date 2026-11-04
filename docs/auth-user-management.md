# Authentication and User Management

## Setup

Requirements: Node.js 20.19+ (Vite 7), PostgreSQL, and npm. The API defaults to port `5050` because macOS may reserve port `5000` for AirTunes.

```sh
# Create backend/.env locally with DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN,
# PORT, FRONTEND_URL, and NODE_ENV. Do not commit this file.
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name auth_user_management
npm run dev
```

In another terminal:

```sh
cd <repository>/capsSEM3
npm install
npm run dev
```

For production, set `NODE_ENV=production`, use HTTPS, configure `FRONTEND_URL` to the exact frontend origin, and set `JWT_SECRET` securely. Cookies are HTTP-only and secure in production. Use `SameSite=None` in production to support separate frontend/backend origins. Uploads are stored under `backend/uploads`; use durable object storage before running multiple backend instances.

## Environment

Backend required variables are `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `FRONTEND_URL`, and `NODE_ENV`. Configure them in a local `backend/.env`; environment files are intentionally excluded from version control. Frontend may set `VITE_API_URL` (defaults to `http://localhost:5000/api`).

## API conventions

JSON success responses use `{ "success": true, "data": { ... } }`; errors use `{ "success": false, "message": "..." }`. Authentication sets an HTTP-only `token` cookie. For non-browser clients, an `Authorization: Bearer <JWT>` header is also accepted. Registration never accepts ADMIN. Passwords require at least 8 characters and are stored using bcrypt cost 12. `GET /api/auth/me` restores the current account after a refresh.

### Auth

| Method and path | Access | Request | Response |
|---|---|---|---|
| `POST /api/auth/register` | Public | `{ "fullName":"A Student", "email":"a@example.edu", "password":"long-password", "role":"STUDENT", "phone":"+1..." }` | `201 { success:true, data:{ user:{ id,fullName,email,phone,role,isActive,createdAt,updatedAt } } }` |
| `POST /api/auth/register` | Public institution | Above with `role:"INSTITUTION", "institutionName":"North College", "officialEmail":"office@example.edu"` | Same safe user response; institution profile created pending verification |
| `POST /api/auth/register` | Public industry | Above with `role:"INDUSTRY", "companyName":"Example Co"` | Same safe user response; Company profile created pending verification |
| `POST /api/auth/login` | Public | `{ "email":"a@example.edu", "password":"long-password" }` | Sets cookie; `200 { success:true, data:{ user } }` |
| `POST /api/auth/logout` | Public | Empty | Clears cookie; `{ success:true, message:"Logged out" }` |
| `GET /api/auth/me` | Authenticated | Empty | `{ success:true, data:{ user } }` |

### Users

`GET /api/users`, `GET /api/users/:id`, and `PATCH /api/users/:id/status` require ADMIN. `PATCH /api/users/:id` allows ADMIN or the matching account owner. Example update: `{ "fullName":"Updated Name", "phone":"+1..." }`; status update: `{ "isActive":false }`. Responses return safe `user` objects without password hashes.

### Students

All routes require a STUDENT account except profile reads, which allow authenticated platform roles. `GET /api/students/me` returns `{ success:true, data:{ profile } }`. `POST /api/students/profile` creates (or initializes) the caller's profile; `PATCH /api/students/profile` updates it. Both accept optional fields `institutionId`, `degree`, `department`, `graduationYear`, `semester`, `bio`, `profileImage`, `resumeUrl`, `linkedIn`, `github`, `portfolio`. The account's user id is always used; clients cannot specify another owner. `GET /api/students/:id` resolves a profile id or user id. Uploads use multipart field `file`: `POST /api/students/profile/resume` accepts PDF; `PATCH /api/students/profile/image` accepts PNG/JPG/WebP. Maximum upload size is 5 MiB. `POST /api/students/profile` returns `201 { success:true, data:{ profile } }`.

### Institutions

`POST /api/institutions/profile`, `GET /api/institutions/me`, and `PATCH /api/institutions/profile` require the matching INSTITUTION account; profile updates always target the current user. Fields: `name`, `officialEmail`, `website`, `address`, `description`, `contactInfo`. `GET /api/institutions/:id` is available to authenticated roles. `PATCH /api/institutions/:id/verify` is ADMIN-only and accepts `{ "isVerified":true }`. `PATCH /api/institutions/companies/:id/verify` is ADMIN-only and verifies a Company (industry) record using the same body. Institution and company profiles begin unverified.

Health check: `GET /api/health`.

## Database and integration contract

The initial shared schema defines `User` (primary identity and role), `StudentProfile` (one-to-one with User, optional relation to Institution), `Institution` (one-to-one with User), and `Company` (one-to-one with an INDUSTRY User). IDs are Prisma `cuid()` strings. Extend this schema in coordination before migration; do not introduce another User model.

- **Person 2:** use `User.id` for student ownership and `StudentProfile.id` for profile association. `StudentProfile.institutionId` references `Institution.id`. Add `Skill`, `StudentSkill`, `Assessment`, and `AssessmentResult` with foreign keys to those stable IDs.
- **Person 3:** use the `Company` model as the industry/company profile relation; reference `Company.id` for opportunities. Extend Company fields as needed and add `Opportunity` and `RequiredSkill`. Company is created with industry registration; verification is admin controlled.
- **Person 4:** reference `User.id` for applicants and recipients, `StudentProfile.id` for student profile associations, `Institution.id` for institutions, and `Company.id` for employer associations. The current API returns these IDs in the `data` payload.

There were no existing shared models in the repository when this schema was added. Coordinate schema changes and apply one shared migration history against the team's PostgreSQL database.

## Tests and commands

```sh
cd backend
npm test
npm run dev
```

Frontend production build:

```sh
cd <repository>/capsSEM3
npm run build
```

Integration flows involving registration/login, protected API access, and admin verification require a running PostgreSQL database, a migrated schema, and seeded ADMIN credentials. No email recovery service is configured, so the UI explains that password reset is unavailable rather than collecting credentials without a delivery path.
