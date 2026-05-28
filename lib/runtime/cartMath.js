function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function computeCartTotals(items = [], pricing = {}) {
  const taxRate = Number(pricing.taxRate || 0);
  const shipping = Number(pricing.shipping || 0);
  const discount = Number(pricing.discount || 0);
  const subtotal = round2(
    (Array.isArray(items) ? items : []).reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 0), 0)
  );
  const tax = round2(subtotal * (Number.isFinite(taxRate) ? taxRate : 0));
  const total = round2(Math.max(0, subtotal + tax + shipping - discount));
  return { subtotal, tax, shipping, discount, total };
}

