import { sectionHeadingToStyleVars, columnHeadingToStyleVars } from '@/lib/contentComposer';

/**
 * Optional title block above section row children (builder + live).
 */
export function SectionHeadingBlock({ sectionHeading, className = '' }) {
  const s = sectionHeading;
  if (!s?.enabled) return null;
  const hasContent = Boolean(s.eyebrow || s.heading || s.description);
  if (!hasContent) return null;
  const Tag = s.tag === 'h1' || s.tag === 'h3' ? s.tag : 'h2';
  const style = { ...sectionHeadingToStyleVars(s), textAlign: s.align };
  return (
    <div
      className={`bld-section-heading${className ? ` ${className}` : ''}`}
      style={style}
      data-bld-section-heading="true"
    >
      {s.eyebrow ? <p className="bld-section-eyebrow">{s.eyebrow}</p> : null}
      {s.heading ? <Tag className="bld-section-title">{s.heading}</Tag> : null}
      {s.description ? <p className="bld-section-description">{s.description}</p> : null}
    </div>
  );
}

/**
 * Optional title block above column/stack children.
 */
export function ColumnHeadingBlock({ columnHeading, className = '' }) {
  const c = columnHeading;
  if (!c?.enabled) return null;
  const hasContent = Boolean(c.heading || c.description);
  if (!hasContent) return null;
  const style = { ...columnHeadingToStyleVars(c), textAlign: c.align };
  return (
    <div
      className={`bld-column-heading${className ? ` ${className}` : ''}`}
      style={style}
      data-bld-column-heading="true"
    >
      {c.heading ? <h3 className="bld-column-title">{c.heading}</h3> : null}
      {c.description ? <p className="bld-column-description">{c.description}</p> : null}
    </div>
  );
}
