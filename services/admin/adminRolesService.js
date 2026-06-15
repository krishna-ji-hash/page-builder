import { ROLE_DEFINITIONS } from '@/lib/admin/roleDefinitions.js';
import { getDbPool } from '@/lib/db.js';

export async function getRolesOverview() {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT role,
            COUNT(*) AS total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active
     FROM admin_users
     GROUP BY role`
  );
  const counts = new Map(
    rows.map((row) => [
      row.role,
      { total: Number(row.total || 0), active: Number(row.active || 0) },
    ])
  );

  const roles = ROLE_DEFINITIONS.map((def) => {
    const stat = counts.get(def.id) || { total: 0, active: 0 };
    return {
      ...def,
      memberCount: stat.total,
      activeCount: stat.active,
    };
  });

  const totals = roles.reduce(
    (acc, role) => ({
      roles: roles.length,
      members: acc.members + role.memberCount,
      active: acc.active + role.activeCount,
    }),
    { roles: 0, members: 0, active: 0 }
  );

  return { roles, totals };
}
