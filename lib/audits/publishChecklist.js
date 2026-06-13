import { normalizePageSeo } from '../seo/seoEngine.js';
import { runTreeAudits, scoreFromWarnings } from './auditEngine.js';
import { computeAuditScores } from './auditReport.js';

function walkNodes(nodes, visit) {
  for (const n of nodes || []) {
    if (!n) continue;
    visit(n);
    if (Array.isArray(n.children) && n.children.length) walkNodes(n.children, visit);
  }
}

function auditFormWorkflow(tree) {
  const problems = [];
  walkNodes(tree, (node) => {
    if (node?.nodeType !== 'form') return;
    const fields = Array.isArray(node?.props?.fields) ? node.props.fields : [];
    const label = node.displayName || 'Form';
    if (!fields.length) {
      problems.push({
        nodeId: node.id,
        severity: 'critical',
        label: `${label} has no fields configured`,
      });
      return;
    }
    const names = new Set();
    for (const field of fields) {
      const name = String(field?.name || '').trim();
      if (!name) {
        problems.push({
          nodeId: node.id,
          severity: 'warning',
          label: `${label} has a field without a name`,
        });
        continue;
      }
      if (names.has(name)) {
        problems.push({
          nodeId: node.id,
          severity: 'warning',
          label: `${label} has duplicate field name "${name}"`,
        });
      }
      names.add(name);
    }
  });
  return problems;
}

function item(id, label, status, message, blocking = false) {
  return { id, label, status, message, blocking };
}

/**
 * @param {object} params
 * @param {object[]} params.tree
 * @param {object} [params.pageSeo]
 * @param {object} [params.projectConfig]
 * @param {object[]} [params.domains]
 * @param {object[]} [params.auditWarnings]
 */
export function buildPublishChecklist({
  tree,
  pageSeo,
  projectConfig,
  domains = [],
  auditWarnings,
}) {
  const warnings =
    auditWarnings ||
    runTreeAudits({ tree, pageSeo, projectConfig }).warnings ||
    [];
  const seo = normalizePageSeo(pageSeo || {});
  const title = String(seo.title || '').trim();
  const description = String(seo.description || '').trim();
  const scores = computeAuditScores(warnings);
  const criticalAudits = warnings.filter((w) => w.severity === 'critical');
  const responsiveWarnings = warnings.filter((w) => w.kind === 'responsive');
  const responsiveCritical = responsiveWarnings.filter((w) => w.severity === 'critical');
  const altWarning = warnings.find((w) => w.id === 'a11y-img-alt-missing');
  const formProblems = auditFormWorkflow(tree);
  const formCritical = formProblems.filter((p) => p.severity === 'critical');

  const items = [];
  const nodeCount = Array.isArray(tree) ? tree.length : 0;

  if (!nodeCount) {
    items.push(item('page-content', 'Page has content', 'fail', 'Draft is empty — add sections before publishing.', true));
  } else {
    items.push(item('page-content', 'Page has content', 'pass', `${nodeCount} top-level section(s).`));
  }

  if (title) {
    items.push(item('seo-title', 'SEO title present', 'pass', title.slice(0, 80)));
  } else {
    items.push(item('seo-title', 'SEO title present', 'warn', 'Missing SEO title — add one in SEO settings.', false));
  }

  if (description) {
    items.push(item('seo-description', 'Meta description present', 'pass', description.slice(0, 100)));
  } else {
    items.push(
      item('seo-description', 'Meta description present', 'warn', 'Missing meta description.', false)
    );
  }

  if (criticalAudits.length) {
    items.push(
      item(
        'audit-critical',
        'No critical audit issues',
        'fail',
        `${criticalAudits.length} critical issue(s): ${criticalAudits
          .slice(0, 3)
          .map((w) => w.label)
          .join('; ')}`,
        true
      )
    );
  } else {
    const warnCount = warnings.filter((w) => w.severity === 'warning').length;
    items.push(
      item(
        'audit-critical',
        'No critical audit issues',
        'pass',
        warnCount ? `No critical issues (${warnCount} warning(s) remain).` : 'No critical issues.'
      )
    );
  }

  if (responsiveCritical.length) {
    items.push(
      item(
        'mobile-responsive',
        'Mobile responsive check',
        'fail',
        responsiveCritical.map((w) => w.label).join('; '),
        true
      )
    );
  } else if (scores.responsive >= 70) {
    items.push(
      item('mobile-responsive', 'Mobile responsive check', 'pass', `Responsive score ${scores.responsive}/100.`)
    );
  } else {
    items.push(
      item(
        'mobile-responsive',
        'Mobile responsive check',
        'warn',
        `Responsive score ${scores.responsive}/100 — review carousel/mobile layout warnings.`,
        false
      )
    );
  }

  if (altWarning) {
    items.push(
      item(
        'image-alt',
        'Image alt text',
        'warn',
        altWarning.label || 'Some images are missing alt text.',
        false
      )
    );
  } else {
    items.push(item('image-alt', 'Image alt text', 'pass', 'All checked images have alt text.'));
  }

  const domainList = Array.isArray(domains) ? domains : [];
  if (domainList.length) {
    const verified = domainList.some((d) => d.verified);
    const primary = domainList.find((d) => d.isPrimary);
    if (verified) {
      items.push(
        item(
          'domain-status',
          'Domain status',
          'pass',
          primary?.domain
            ? `Primary domain ${primary.domain} is verified.`
            : 'At least one domain is verified.'
        )
      );
    } else {
      items.push(
        item(
          'domain-status',
          'Domain status',
          'warn',
          'Project has custom domains but none are verified yet.',
          false
        )
      );
    }
  } else {
    items.push(item('domain-status', 'Domain status', 'pass', 'No custom domains configured (optional).'));
  }

  if (formCritical.length) {
    items.push(
      item(
        'form-workflow',
        'Form workflow valid',
        'fail',
        formCritical.map((p) => p.label).join('; '),
        true
      )
    );
  } else if (formProblems.length) {
    items.push(
      item(
        'form-workflow',
        'Form workflow valid',
        'warn',
        formProblems.map((p) => p.label).join('; '),
        false
      )
    );
  } else {
    const formCount = [];
    walkNodes(tree, (n) => {
      if (n?.nodeType === 'form') formCount.push(n.id);
    });
    items.push(
      item(
        'form-workflow',
        'Form workflow valid',
        'pass',
        formCount.length ? `${formCount.length} form(s) configured.` : 'No forms on this page.'
      )
    );
  }

  const blocking = items.filter((i) => i.blocking || i.status === 'fail');
  const warningsOnly = items.filter((i) => i.status === 'warn');

  return {
    items,
    canPublish: blocking.length === 0,
    hasWarnings: warningsOnly.length > 0,
    scores,
    auditScore: scoreFromWarnings(warnings),
    summary: {
      pass: items.filter((i) => i.status === 'pass').length,
      warn: warningsOnly.length,
      fail: items.filter((i) => i.status === 'fail').length,
    },
  };
}
