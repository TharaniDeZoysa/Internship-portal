# University Placement and Internship Portal

Node.js + Express + MongoDB (Mongoose) REST API. The React app lives in `frontend/`.

## Features
- **Accounts & roles** – register/login with JWT; roles: `student`, `company`, `admin`.
- **Student profiles** – education, skills, links, bio; **resume upload** (PDF/DOC/DOCX, 5 MB).
- **Company registration & profile** – company details, posts under the company name.
- **Job (internship) posting** – companies create / edit / close / delete their own postings.
- **Application tracking** – students apply (cover letter + resume), withdraw, and follow the
  status: Applied → Under Review → Shortlisted → Interview → Offered / Rejected. Companies review
  applicants, set the status, leave feedback and an interview date.
- **Extras** – search / filter / sort / pagination, saved (bookmarked) internships, change password,
  admin dashboard (stats, activate / deactivate users), rate-limited auth, Helmet headers.

## 1. Requirements
Node.js 18+, MongoDB running locally, (Postman for testing).

## 2. Install and configure
```bash
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```
Set `JWT_SECRET` in `.env` to a long random string (the server refuses to start without it):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Run
```bash
npm run seed   # optional: demo accounts + 5 sample internships
npm run dev    # http://localhost:5000
```
Demo logins created by the seed (password **Demo1234**):
`student@demo.com`, `hr@brightbytetechnologies.com` (company), `admin@demo.com`.

Uploaded resumes are stored in `uploads/resumes/` (git-ignored) and are only downloadable through
the API by the student who owns them, the company that received the application, or an admin.

## 4. API
Send the token as `Authorization: Bearer <token>`.

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create student/company account |
| POST | `/api/auth/login` | public | Log in, returns `token` + `user` |
| GET | `/api/auth/me` | any | Current user |
| PUT | `/api/auth/password` | any | Change password |
| GET / PUT | `/api/profile` | any | View / update own profile |
| POST / GET / DELETE | `/api/profile/resume` | student | Upload (field `resume`) / download / remove CV |
| GET | `/api/profile/saved` | student | Saved internships |
| POST / DELETE | `/api/profile/saved/:id` | student | Save / unsave an internship |
| GET | `/api/internships` | public | List: `search, field, type, sort, page, limit, status` |
| GET | `/api/internships/:id` | public | One internship |
| GET | `/api/internships/mine` | company, admin | Own postings with applicant counts |
| POST | `/api/internships` | company, admin | Create posting |
| PUT / DELETE | `/api/internships/:id` | owner, admin | Edit / delete (delete also removes its applications) |
| POST | `/api/applications/internship/:id` | student | Apply (multipart: `coverLetter`, optional `resume`) |
| GET | `/api/applications/mine` | student | My applications |
| PATCH | `/api/applications/:id/withdraw` | student | Withdraw |
| GET | `/api/applications/received` | company, admin | Applicants (`internship`, `status` filters) |
| PATCH | `/api/applications/:id/status` | company, admin | `{ status, feedback, interviewDate }` |
| GET | `/api/applications/:id/resume` | student/company/admin | Download the CV sent with an application |
| GET | `/api/admin/stats` | admin | Totals by role / status |
| GET | `/api/admin/users` | admin | Users (`role`, `search`) |
| PATCH | `/api/admin/users/:id/status` | admin | `{ isActive: true/false }` |

> **Changed from the first version:** creating, editing and deleting internships now requires a
> company/admin login. Internships saved before accounts existed have no owner; run `npm run seed`
> to link the sample ones to companies, or manage them as an admin.
