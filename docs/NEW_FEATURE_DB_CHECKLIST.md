# New feature — database checklist

Use this before, during, and after any feature that touches data.

---

## Before coding

- [ ] **DB owner declared** — mysql2 or Prisma? (see `docs/DB_OWNERSHIP.md`)
- [ ] Does this feature need a **new table**?
- [ ] Does it need a **Prisma model**? (only if admin Prisma CRUD is required)
- [ ] Does it touch **`builder_nodes`**?
- [ ] Does it affect **publish snapshot** (`published_json`, `page_versions`)?
- [ ] Does it need a **SQL migration**? (`database/migrations/NNN_name.sql`)
- [ ] Does it need **backup/export** support?
- [ ] Does it need **seed data**?
- [ ] Does it need **indexes**? (query patterns, foreign keys)

---

## During coding

- [ ] Add SQL migration (additive, non-breaking)
- [ ] Add service function in `services/` (not raw SQL in route handlers)
- [ ] Use **`withTransaction()`** (`lib/db.js`) for multi-step writes
- [ ] Preserve builder/publish architecture if touching pages
- [ ] Add tests in `tests/`
- [ ] Run `npm run db:migrate`
- [ ] Run `npm test`
- [ ] Run `npm run build`

---

## After coding

- [ ] `npm run db:status` — no pending migrations
- [ ] `GET /api/health` or `npm run health:check` — status `ok`
- [ ] `npm run db:backup` — backup succeeds (staging/production)
- [ ] Document new tables in `docs/DB_OWNERSHIP.md` if ownership is new

---

## Quick decision tree

```
New feature needs data?
  ├─ Builder tree / publish / bulk nodes → mysql2 + builderService pattern
  ├─ Admin list/CRUD (existing Prisma area) → Prisma + migration if new columns
  ├─ Public high-write (forms, analytics) → mysql2
  └─ New table only used by one API → pick one layer; don't split without reason
```

---

## Migration naming

```
database/migrations/024_short_description.sql
```

- Use next sequential number
- Idempotent where possible (`IF NOT EXISTS`)
- Never edit applied migrations — add a new one
