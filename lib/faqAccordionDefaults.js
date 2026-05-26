/** Default FAQ accordion items — Dispatch Solutions-style section template. */

export const DEFAULT_FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'What is Dispatch Solutions and how does it help eCommerce sellers?',
    answer:
      'Dispatch Solutions is a courier aggregator that lets you ship with multiple carriers from one dashboard — compare rates, print labels, track shipments, and manage COD in one place for D2C and marketplace sellers.',
  },
  {
    id: 'faq-2',
    question: 'How is Dispatch Solutions different from other shipping aggregators in India?',
    answer:
      'We focus on delivery success, not just cheap rates: AI courier allocation, structured NDR workflows, transparent billing, free order verification, and a dedicated KAM instead of ticket-only support.',
  },
  {
    id: 'faq-3',
    question: 'Is Dispatch Solutions free to use? Are there any hidden charges?',
    answer:
      'You can get started without a platform subscription fee. You pay for shipping and any optional value-added services — rates and surcharges are shown before you book, with no surprise deductions on payouts.',
  },
  {
    id: 'faq-4',
    question: 'How do I start shipping with Dispatch Solutions? What documents are needed?',
    answer:
      'Sign up, complete KYC (GSTIN or business proof, bank details, and authorized signatory ID), connect your store or upload orders, then book your first shipment. Our onboarding team helps you go live quickly.',
  },
];

/**
 * @param {unknown} item
 * @param {number} index
 */
export function normalizeFaqItem(item, index = 0) {
  const t = item && typeof item === 'object' ? item : {};
  const id = String(t.id || `faq-${index + 1}`).trim() || `faq-${index + 1}`;
  return {
    id,
    question: String(t.question || t.label || `Question ${index + 1}`).trim(),
    answer: String(t.answer || t.body || t.text || '').trim(),
  };
}

/**
 * @param {unknown} items
 */
export function normalizeFaqItems(items) {
  if (!Array.isArray(items)) return DEFAULT_FAQ_ITEMS.map((item, i) => normalizeFaqItem(item, i));
  const out = items.filter((x) => x && typeof x === 'object').map((item, i) => normalizeFaqItem(item, i));
  return out.length ? out : DEFAULT_FAQ_ITEMS.map((item, i) => normalizeFaqItem(item, i));
}

/**
 * @param {Record<string, unknown> | null | undefined} props
 */
export function resolveFaqAccordionProps(props) {
  const p = props && typeof props === 'object' ? props : {};
  const items = normalizeFaqItems(p.items);
  const openIdRaw = String(p.openItemId ?? p.activeItemId ?? '').trim();
  const openItemId = items.some((it) => it.id === openIdRaw) ? openIdRaw : '';
  return { items, openItemId };
}

/**
 * @param {ReturnType<typeof normalizeFaqItem>[]} items
 * @param {number} index
 * @param {Record<string, unknown>} patch
 */
export function patchFaqItems(items, index, patch) {
  const list = Array.isArray(items) ? [...items] : [];
  if (!Number.isInteger(index) || index < 0 || index >= list.length || !patch) return list;
  list[index] = normalizeFaqItem({ ...(list[index] || {}), ...patch }, index);
  return list;
}

/** New blank FAQ row with a unique id. */
export function createEmptyFaqItem(existingItems = []) {
  const list = Array.isArray(existingItems) ? existingItems : [];
  const used = new Set(list.map((it) => String(it?.id || '')));
  let n = list.length + 1;
  let id = `faq-${n}`;
  while (used.has(id)) {
    n += 1;
    id = `faq-${n}`;
  }
  return normalizeFaqItem(
    {
      id,
      question: 'New question',
      answer: 'Type your answer here.',
    },
    n - 1
  );
}

/**
 * @param {ReturnType<typeof normalizeFaqItem>[]} items
 */
export function appendFaqItem(items) {
  const list = Array.isArray(items) ? [...items] : [];
  return [...list, createEmptyFaqItem(list)];
}

/**
 * @param {ReturnType<typeof normalizeFaqItem>[]} items
 * @param {number} index
 */
export function removeFaqItemAt(items, index) {
  const list = Array.isArray(items) ? [...items] : [];
  if (list.length <= 1) return list;
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return list;
  const next = list.filter((_, i) => i !== index);
  return next.map((item, i) => normalizeFaqItem(item, i));
}
