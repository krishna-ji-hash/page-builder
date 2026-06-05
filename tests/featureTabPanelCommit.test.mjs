import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFeatureTabPanelPatchFromDom } from '../lib/featureTabPanelCommit.js';

test('buildFeatureTabPanelPatchFromDom reads heading and paragraph from active panel', () => {
  const heading = {
    innerHTML: '<strong>Title</strong>',
    getAttribute: () => null,
  };
  const paragraph = {
    innerHTML: 'Body copy',
    getAttribute: () => null,
  };
  const shell = {
    querySelector(sel) {
      if (sel.includes('is-active')) {
        return {
          querySelector(s) {
            if (s.includes('heading')) return heading;
            if (s.includes('paragraph')) return paragraph;
            return null;
          },
          querySelectorAll() {
            return [];
          },
        };
      }
      return null;
    },
  };
  const built = buildFeatureTabPanelPatchFromDom(shell, {
    activeTabId: 'a',
    tabs: [{ id: 'a', heading: '', paragraph: '' }],
  });
  assert.equal(built?.tabId, 'a');
  assert.match(String(built?.patch?.heading || ''), /Title/);
  assert.equal(built?.patch?.paragraph, 'Body copy');
});
