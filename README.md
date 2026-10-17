# University Placement and Internship Portal — Backend

This backend is developed using **Node.js, Express.js, and MongoDB**. It manages internship details and can be connected to a React frontend later.

# Features
- Add, view, update, and delete internships (CRUD).
- Search and filter internships.
- Sort and paginate results.
- Validate data and handle errors.

# 1. Requirements
Install Node.js, MongoDB, VS Code, and Postman.

Check Node.js and npm:

```bash
node -v
npm -v
```

# 2. Install and Configure

Run this command in the backend folder:

```bash
npm install
```

Create a `.env` file by copying `.env.example`:

```powershell
Copy-Item .env.example .env
```

Make sure MongoDB is running and check the database connection URL in `.env`.

# 3. Run the Backend

```bash
npm run dev
```

Open `http://localhost:5000` in browser to check the server.

# 4. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/internships` | Add an internship |
| GET | `/api/internships` | View internships |
| PUT | `/api/internships/:id` | Update an internship |
| DELETE | `/api/internships/:id` | Delete an internship |

Use Postman to test these operations.