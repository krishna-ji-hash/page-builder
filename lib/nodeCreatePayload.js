import { buildDividerCreatePayload } from '@/lib/dividerDefaults';
import { getWidgetDefinition } from '@/lib/builder/widgetRegistry';

/**
 * Default props/style for widget create & quick-add (when defined in registry).
 */
export function payloadForWidgetCreate(nodeType, projectType = 'website', { dividerOrientation } = {}) {
  if (nodeType === 'divider') {
    return buildDividerCreatePayload(dividerOrientation === 'vertical' ? 'vertical' : 'horizontal');
  }
  const def = getWidgetDefinition(projectType, nodeType);
  if (!def) return {};
  const out = {};
  if (def.defaultProps && typeof def.defaultProps === 'object') {
    out.props = JSON.parse(JSON.stringify(def.defaultProps));
  }
  if (def.defaultStyle_json && typeof def.defaultStyle_json === 'object') {
    out.style_json = JSON.parse(JSON.stringify(def.defaultStyle_json));
  }
  return out;
}
