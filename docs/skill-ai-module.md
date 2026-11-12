# Person 2: Skills and AI module

## Setup

The module extends the existing backend and shared Prisma client. It uses the same cookie/JWT authentication and response shape as the rest of the API.

```sh
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

For a local development migration, use `npx prisma migrate dev --name skill_ai_module` instead of `migrate deploy`. The checked-in migration is `backend/prisma/migrations/20261112090000_skill_ai_module/migration.sql`. Existing databases should apply it after the existing auth and opportunity migrations.

Frontend: from the project root run `npm install` and `npm run dev`. Configure `VITE_API_URL` only if the API is not at `http://localhost:5050/api`.

Seed is safe to rerun: it upserts the skill catalog and only creates each predefined assessment once.

## Student APIs

All routes are under `http://localhost:5050/api` and require authentication unless noted. Student routes require role `STUDENT`. Send the session cookie automatically from the browser or use `Authorization: Bearer <JWT>`.

| Method and path | Purpose |
| --- | --- |
| `GET /skills?search=react&category=TECHNICAL` | Search/filter catalog |
| `GET /skills/:id` | Read catalog skill |
| `GET /skills/me` | Current student's skill portfolio |
| `POST /skills/me` | Add/upsert `{ "skillId": "...", "proficiencyLevel": "BEGINNER" }` |
| `PATCH /skills/me/:skillId` | Change `{ "proficiencyLevel": "ADVANCED" }` |
| `DELETE /skills/me/:skillId` | Remove own skill |
| `GET /assessments` | List assessment catalog |
| `GET /assessments/:id` | Read assessment questions (answer key is not returned) |
| `POST /assessments/:id/submit` | Submit `{ "answers": [0, 1] }` option indexes in displayed order |
| `GET /assessments/results/me` | Own assessment history |
| `GET /assessments/results/:id` | Read own result only |
| `GET /skill-gap/me` | Compare portfolio to an intermediate catalog baseline |
| `GET /skill-gap/opportunity/:opportunityId` | Compare against catalog skills detected in an open opportunity's text |
| `GET /matching/opportunities` | Open opportunities sorted by deterministic match percentage |
| `GET /matching/opportunities/:id` | One opportunity's detailed gap analysis |
| `POST /resume/extract-skills` | Extract catalog terms from uploaded own PDF; no writes |
| `POST /resume/approve-skills` | Approve `{ "skills": [{ "skillId": "...", "proficiencyLevel": "BEGINNER" }] }` |
| `GET /recommendations/me` | Read own learning recommendations |
| `POST /recommendations/refresh` | Generate recommendations for missing catalog skills |
| `PATCH /recommendations/:id/complete` | Complete/reopen own item with `{ "isCompleted": true }` |

`POST /skills` is ADMIN-only for catalog administration. Successful JSON uses `{ "success": true, "data": ... }`; failures use `{ "success": false, "message": ... }`.

### Postman examples

Login once with `POST /auth/login` and retain the `token` cookie, or set a bearer token. Then:

```http
GET http://localhost:5050/api/skills?search=react
```

```http
POST http://localhost:5050/api/skills/me
Content-Type: application/json

{"skillId":"<skill id from GET /skills>","proficiencyLevel":"INTERMEDIATE"}
```

```http
POST http://localhost:5050/api/assessments/<assessment id>/submit
Content-Type: application/json

{"answers":[0,1]}
```

```http
GET http://localhost:5050/api/matching/opportunities
```

## Matching contract for Person 3

The existing shared schema has `Opportunity` but no `RequiredSkill` relation yet. To keep Person 3's ownership intact, this module does not create a competing model. Until Person 3 supplies the structured relation, match/gap APIs identify skills by searching the published opportunity title, description, responsibilities and qualifications against catalog names. This interim mode assigns a uniform `INTERMEDIATE` requirement level and equal weights. Responses state the basis and each score calculation. For full required proficiency and configurable weights, integrate Person 3's `RequiredSkill` relation into `scoreSkills(studentSkills, requiredSkills)` in `backend/src/utils/matchingAlgorithm.js`; expected requirement objects have `{ skill: { name }, proficiencyLevel, weight }`.

The score gives full weight to meeting/exceeding a required level, half weight for one level below, and zero for missing/two-or-more levels below. No random scores are used. The general gap endpoint uses `INTERMEDIATE` as its explicit catalog baseline.

## Integration notes

- Person 1: the module uses `requireAuth`, `allowRoles`, `StudentProfile.userId`, the existing resume upload endpoint, and shared Prisma client. It never creates/replaces identity or auth records.
- Person 3: coordinate and integrate structured `RequiredSkill` fields before claiming exact opportunity matching. Preserve Person 3's ownership and create a new shared migration when adding the relation.
- Person 4: the student's skills are attached to `StudentProfile.id`; assessment history and recommendations are available from the APIs above for dashboard aggregation.

Resume extraction reads selectable PDF text and matches the seeded catalog. Scanned-image PDFs require OCR, which is not part of this offline implementation. External learning resource URLs are left empty unless verified; recommendation titles/descriptions remain locally generated from the missing skill catalog.
