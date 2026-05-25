/**
 * Removes every divider node and "Line section" scaffold rows, then refreshes snapshots.
 * Usage: node --env-file=.env scripts/remove-all-divider-nodes.mjs [--page-id=12]
 */
import mysql from 'mysql2/promise';

function buildTree(flat) {
  const byId = new Map();
  const roots = [];
  for (const row of flat) {
    byId.set(row.id, {
      id: row.id,
      pageId: row.page_id,
      versionId: row.version_id,
      parentNodeId: row.parent_node_id,
      nodeType: row.node_type,
      displayName: row.display_name,
      positionIndex: row.position_index,
      props: row.props_json ? JSON.parse(row.props_json) : {},
      children: [],
    });
  }
  for (const node of byId.values()) {
    if (node.parentNodeId && byId.has(node.parentNodeId)) {
      byId.get(node.parentNodeId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (nodes) => {
    nodes.sort((a, b) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

async function refreshSnapshot(connection, versionId) {
  const [nodes] = await connection.query(
    `SELECT id, page_id, version_id, parent_node_id, node_type, display_name, props_json, position_index
     FROM builder_nodes WHERE version_id = ? ORDER BY position_index ASC, id ASC`,
    [versionId]
  );
  const tree = buildTree(nodes);
  await connection.query(`UPDATE page_versions SET snapshot_json = ? WHERE id = ?`, [
    JSON.stringify({ nodes: tree }),
    versionId,
  ]);
}

function collectSubtreeIds(flat, rootId) {
  const byParent = new Map();
  for (const row of flat) {
    const key = row.parent_node_id || 0;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(row.id);
  }
  const out = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop();
    out.push(id);
    for (const child of byParent.get(id) || []) stack.push(child);
  }
  return out;
}

async function purgeDividersInVersion(connection, versionId) {
  const [dividers] = await connection.query(
    `SELECT id FROM builder_nodes WHERE version_id = ? AND node_type = 'divider'`,
    [versionId]
  );
  const [lineRows] = await connection.query(
    `SELECT id FROM builder_nodes WHERE version_id = ? AND node_type = 'row' AND display_name = 'Line section'`,
    [versionId]
  );
  const ids = new Set(dividers.map((r) => r.id));
  if (lineRows.length) {
    const [flat] = await connection.query(
      `SELECT id, parent_node_id FROM builder_nodes WHERE version_id = ?`,
      [versionId]
    );
    for (const row of lineRows) {
      collectSubtreeIds(flat, row.id).forEach((id) => ids.add(id));
    }
  }
  const deleteIds = [...ids];
  if (!deleteIds.length) return 0;
  await connection.query(`DELETE FROM builder_nodes WHERE id IN (?)`, [deleteIds]);
  await refreshSnapshot(connection, versionId);
  return deleteIds.length;
}

async function run() {
  const pageIdArg = process.argv.find((a) => a.startsWith('--page-id='));
  const pageIdFilter = pageIdArg ? Number(pageIdArg.split('=')[1]) : null;

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'documents',
  });

  try {
    let versionQuery = `SELECT DISTINCT pv.id AS version_id, pv.page_id, p.published_version_id
      FROM page_versions pv
      JOIN pages p ON p.id = pv.page_id
      WHERE pv.status = 'draft'`;
    const versionParams = [];
    if (pageIdFilter) {
      versionQuery += ' AND pv.page_id = ?';
      versionParams.push(pageIdFilter);
    }
    const [draftVersions] = await connection.query(versionQuery, versionParams);

    let total = 0;
    for (const row of draftVersions) {
      const n = await purgeDividersInVersion(connection, row.version_id);
      if (n) {
        process.stdout.write(`Page ${row.page_id} draft: removed ${n} node(s)\n`);
        total += n;
      }
      if (row.published_version_id) {
        const pn = await purgeDividersInVersion(connection, row.published_version_id);
        if (pn) {
          process.stdout.write(`Page ${row.page_id} published: removed ${pn} node(s)\n`);
          total += pn;
        }
      }
    }

    if (!total) {
      process.stdout.write('No divider / line-section nodes found.\n');
    } else {
      process.stdout.write(`Done. Removed ${total} node(s) total. Reload builder + hard-refresh live.\n`);
    }
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});
