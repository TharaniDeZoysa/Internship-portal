# API testing checklist

Use Postman or the Thunder Client VS Code extension. Base URL: `http://localhost:5000`.

- [ ] GET `/` returns the health message.
- [ ] POST `/api/internships` with the README sample JSON returns HTTP 201.
- [ ] GET `/api/internships` includes the new record.
- [ ] GET `/api/internships/:id` returns one record.
- [ ] GET `/api/internships?search=software` filters results.
- [ ] PUT `/api/internships/:id` updates a field.
- [ ] POST with a missing required field returns HTTP 400.
- [ ] DELETE `/api/internships/:id` removes the record.
- [ ] GET the deleted ID returns HTTP 404.

Remember to replace `:id` with the actual MongoDB `_id` returned from POST.
