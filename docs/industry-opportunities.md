# Industry & Opportunities backend rules

## Opportunity dates and field limits

Date inputs use the canonical ISO 8601/RFC 3339 timestamp form with an explicit timezone, for example `2026-12-15T18:30:00Z` or `2026-12-15T18:30:00+05:30`. Calendar dates must exist. Application deadlines must be in the future when supplied and must still be in the future when publishing.

Text limits are enforced by the API: title 200 characters, description 10,000, responsibilities and qualifications 5,000 each, location 200, compensation 200, and URLs 2,048. Company fields are limited to 200 for name, 254 for official email, 2,048 for website, 500 for address, 5,000 for description, and 1,000 for contact information. Website and application URLs must be absolute HTTP or HTTPS URLs without embedded credentials.

Pagination accepts `page` from 1 through 10,000 and `pageSize` from 1 through 100. Both values must be positive decimal integers.

## Status meaning and transitions

`publishedAt` is the timestamp of the **first successful publication**. Closing and reopening an opportunity preserves this timestamp.

Allowed status transitions:

| Current status | Allowed next status | Notes |
|---|---|---|
| `DRAFT` | `OPEN`, `ARCHIVED` | Opening requires a verified company and a non-expired deadline. |
| `OPEN` | `CLOSED`, `ARCHIVED` | Closing hides the opportunity from public browse results. |
| `CLOSED` | `OPEN`, `ARCHIVED` | Reopening requires a verified company and a non-expired deadline. |
| `ARCHIVED` | None | Archived opportunities are terminal and retained for history. |

Repeating the current status is idempotent. Public browse only returns `OPEN` opportunities; requesting any other status returns `400` rather than exposing private records.

## Deletion and future applications

Deleting a draft opportunity is currently allowed. The Company-to-Opportunity foreign key uses `ON DELETE RESTRICT`, so a Company cannot be deleted while any opportunity exists. Because the existing User-to-Company foreign key cascades, deleting the owner User also fails while that Company has opportunities; PostgreSQL rejects the whole operation rather than removing opportunities.

When Person 4 adds applications, keep historical opportunities and applications by closing or archiving them. The application foreign key should also restrict opportunity deletion, or the API should move to soft deletion. Do not add cascading deletion from opportunities to applications.

## Migration sequence

The first opportunity migration creates the table with cascade deletion. The follow-up migration changes that foreign key to restrict deletion. On a fresh database, both migrations run in order. On a database where the first migration has already been applied, only the follow-up migration changes the foreign key. Do not edit an already-applied migration; future policy changes should use additional migrations.
