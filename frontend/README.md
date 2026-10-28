# InternConnect — Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```
Start the backend first (`npm run dev` in the project root; `npm run seed` for demo data).

## Pages
| Route | Who | What |
|---|---|---|
| `/` | everyone | Landing page + newest internships |
| `/internships` | everyone | Search, filter, sort, paginate, save |
| `/internships/:id` | everyone | Details; students apply with cover letter + resume |
| `/login`, `/register` | guests | Register as student or company |
| `/dashboard` | student | Application tracker (progress bar, history, withdraw) + saved list |
| `/profile` | all | Student profile & resume upload, or company profile; change password |
| `/company` | company/admin | Postings, applicant counts, edit / close / delete |
| `/company/internships/new`, `/:id/edit` | company/admin | Post / edit an internship |
| `/company/applicants` | company/admin | Review applicants, set status, feedback, interview date, download resume |
| `/admin` | admin | Stats and user management |
