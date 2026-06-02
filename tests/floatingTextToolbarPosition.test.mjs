import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFloatingToolbarBesidePosition,
  computeFloatingToolbarPosition,
  isPlausibleToolbarAnchor,
} from '../lib/floatingTextToolbarPosition.js';

test('computeFloatingToolbarPosition prefers above caret', () => {
  const pos = computeFloatingToolbarPosition(
    { left: 100, top: 200, bottom: 218, width: 40, height: 18 },
    { width: 260, height: 56 },
    { vw: 800, vh: 600, margin: 8, gap: 6 },
  );
  assert.equal(pos.placement, 'above');
  assert.equal(pos.transform, 'translate(-50%, -100%)');
  assert.equal(pos.top, 194);
  assert.equal(pos.left, 138);
});

test('isPlausibleToolbarAnchor rejects origin caret and uses wrap fallback', () => {
  const wrapRect = { left: 400, top: 300, bottom: 340, width: 600, height: 40 };
  assert.equal(isPlausibleToolbarAnchor({ left: 0, top: 0, bottom: 0, width: 0, height: 0 }, wrapRect), false);
  assert.equal(
    isPlausibleToolbarAnchor({ left: 420, top: 310, bottom: 328, width: 2, height: 18 }, wrapRect),
    true,
  );
});

test('computeFloatingToolbarPosition flips below when no room above', () => {
  const pos = computeFloatingToolbarPosition(
    { left: 50, top: 20, bottom: 36, width: 10, height: 16 },
    { width: 260, height: 56 },
    { vw: 400, vh: 300, margin: 8, gap: 6 },
  );
  assert.equal(pos.placement, 'below');
  assert.equal(pos.transform, 'translate(-50%, 0)');
});

test('computeFloatingToolbarBesidePosition docks right of asset by default', () => {
  const pos = computeFloatingToolbarBesidePosition(
    { left: 40, top: 80, right: 140, bottom: 120, width: 100, height: 40 },
    { width: 180, height: 90 },
    { vw: 1200, vh: 800 },
  );
  assert.equal(pos.placement, 'right');
  assert.equal(pos.left, 150);
  assert.equal(pos.top, 80);
});

test('computeFloatingToolbarBesidePosition prefers below for brand logos', () => {
  const pos = computeFloatingToolbarBesidePosition(
    { left: 40, top: 80, right: 140, bottom: 120, width: 100, height: 40 },
    { width: 180, height: 90 },
    { vw: 1200, vh: 800, preferBelow: true },
  );
  assert.equal(pos.placement, 'below');
  assert.equal(pos.top, 130);
});
