import assert from 'node:assert/strict';
import test from 'node:test';
import { freezeGlobalSectionsForPublish } from '../lib/globalSectionSnapshot.js';

test('freezeGlobalSectionsForPublish deep-clones header and footer rows', () => {
  const header = { nodeType: 'row', id: 1, props: { meta: { isHeader: true }, text: 'H' }, children: [] };
  const footer = { nodeType: 'row', id: 2, props: { meta: { isFooter: true } }, children: [] };
  const frozen = freezeGlobalSectionsForPublish({ globalSections: { header, footer } });
  assert.notEqual(frozen.header, header);
  assert.equal(frozen.header.props.text, 'H');
  header.props.text = 'CHANGED';
  assert.equal(frozen.header.props.text, 'H');
  assert.equal(frozen.footer.nodeType, 'row');
});

test('freezeGlobalSectionsForPublish ignores invalid entries', () => {
  const frozen = freezeGlobalSectionsForPublish({
    globalSections: { header: { nodeType: 'heading' }, footer: null },
  });
  assert.equal(frozen.header, null);
  assert.equal(frozen.footer, null);
});
