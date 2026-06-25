# Production database checklist

Use before and after every production deploy that touches the database.

---

## Required environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MYSQL_HOST` | Yes | Database host |
| `MYSQL_PORT` | Yes (default 3306) | Database port |
| `MYSQL_USER` | Yes | Database user |
| `MYSQL_PASSWORD` | Yes (production) | Database password |
| `MYSQL_DATABASE` | Yes | Database name |
| `MYSQL_SSL` | Recommended (`auto`) | TLS for managed MySQL |
| `MYSQL_POOL_LIMIT` | Recommended (10–20) | Connection pool size |
| `DATABASE_URL` | Optional | Auto-built from `MYSQL_*` for Prisma |
| `AUTH_SECRET` | Yes (32+ chars) | Session signing |
| `SITE_URL` | Yes | Admin CSRF origin |
| `BUILDER_APP_HOST` | Yes | Admin/builder host |

Optional but recommended:

- `MYSQL_SSL_CA` — CA bundle for strict SSL
- `APP_VERSION` — shown in `/api/health`
- `HEALTH_CHECK_URL` — for `npm run health:check` in CI

---

## Deploy steps

1. **Backup DB** — `npm run db:backup`
2. **Pull latest code**
3. **Install** — `npm install`
4. **Status** — `npm run db:status`
5. **Migrate** — `npm run db:migrate`
6. **Test** — `npm test`
7. **Build** — `npm run build`
8. **Restart app** — `npm start` or process manager
9. **Health** — `curl /api/health` or `npm run health:check`
10. **Public live route** — open site home page (e.g. `/` or `/home`) and confirm published content loads

Expected health response:

```json
{
  "status": "ok",
  "mysql": "ok",
  "prisma": "ok",
  "migrations": "ok"
}
```

`status: "degraded"` with `migrations: "pending"` means migrations were not applied — run `db:migrate` before serving traffic.

---

## Rollback

1. **Stop app**
2. **Restore backup** — `RESTORE_CONFIRM=YES npm run db:restore -- backups/YYYY-MM-DD-HH-mm-database.sql`
3. **Rollback code** — deploy previous release tag/commit
4. **Restart app**
5. **Health** — `npm run health:check`

> Production restore requires `RESTORE_CONFIRM=YES` and interactive confirmation (or `RESTORE_NON_INTERACTIVE=1` only in controlled automation).

---

## Pre-flight warnings

| Symptom | Action |
|---------|--------|
| `db:status` shows pending migrations | Run `db:migrate` before deploy |
| `/api/health` migrations `pending` | Do not go live |
| Prisma tables missing in DB | Run migrations; check `missingPrismaTables` in health details |
| `ER_CON_COUNT_ERROR` | Restart app; review `MYSQL_POOL_LIMIT` |

---

## Backup retention

- Backups saved to `backups/` (gitignored)
- `backups/latest.sql` — most recent dump
- Enable gzip: `BACKUP_GZIP=1 npm run db:backup`
- Store production backups off-server (S3, etc.) — not committed to git
