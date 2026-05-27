'use client';

import CmsBindingsPanel from './CmsBindingsPanel';
import { InspectorPanel, InspectorSection } from './InspectorUi';

function formatPageIdLabel(pageId) {
  if (pageId == null || pageId === '') return '';
  const id = String(pageId).trim();
  if (!id) return '';
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export default function SeoCmsPanel({ selectedNode, projectId, pageId, onChange }) {
  const pageIdLabel = formatPageIdLabel(pageId);

  if (!selectedNode) {
    return (
      <div className="bld-panel">
        <div className="bld-empty-state">Select a widget on canvas.</div>
      </div>
    );
  }

  return (
    <InspectorPanel title="SEO & CMS">
      <InspectorSection title="CMS bindings" defaultOpen keywords="cms collection binding dynamic">
        <CmsBindingsPanel selectedNode={selectedNode} projectId={projectId} onChange={onChange} />
      </InspectorSection>
      <InspectorSection title="Page SEO" defaultOpen={false} keywords="seo meta title description">
        <p className="bld-field-note" style={{ margin: 0 }}>
          Page-level title, description, Open Graph, and schema are edited from the builder top bar{' '}
          <strong>SEO</strong> button{pageIdLabel ? ` (page ${pageIdLabel})` : ''}. Node styles stay in the Style tab.
        </p>
      </InspectorSection>
    </InspectorPanel>
  );
}
