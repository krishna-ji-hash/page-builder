import { getDbPool } from '@/lib/db.js';

export async function getSystemOverview() {
  const pool = getDbPool();

  const [[eventRows], [todayRows], [weekRows], [actorRows], [userRows], [projectRows], [actionRows]] =
    await Promise.all([
      pool.query(`SELECT COUNT(*) AS c FROM admin_activity_logs`),
      pool.query(
        `SELECT COUNT(*) AS c FROM admin_activity_logs WHERE created_at >= CURDATE()`
      ),
      pool.query(
        `SELECT COUNT(*) AS c FROM admin_activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      ),
      pool.query(
        `SELECT COUNT(DISTINCT user_id) AS c FROM admin_activity_logs WHERE user_id IS NOT NULL`
      ),
      pool.query(`SELECT COUNT(*) AS c FROM admin_users WHERE is_active = 1`),
      pool.query(`SELECT COUNT(*) AS c FROM projects`),
      pool.query(
        `SELECT action, COUNT(*) AS c
         FROM admin_activity_logs
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY action
         ORDER BY c DESC
         LIMIT 5`
      ),
    ]);

  return {
    stats: {
      totalEvents: Number(eventRows[0]?.c || 0),
      todayEvents: Number(todayRows[0]?.c || 0),
      weekEvents: Number(weekRows[0]?.c || 0),
      uniqueActors: Number(actorRows[0]?.c || 0),
      activeUsers: Number(userRows[0]?.c || 0),
      projects: Number(projectRows[0]?.c || 0),
    },
    topActions: actionRows.map((row) => ({
      action: row.action,
      count: Number(row.c || 0),
    })),
    retention: 'database',
    auditStatus: 'live',
  };
}
