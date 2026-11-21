const test = require('node:test');
const assert = require('node:assert/strict');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');
const tax = require('../lib/tax');

// These tests use only in-memory order lines and never read or write data/db.json.

test('invoice figures match the totals billed by POS pricing', () => {
  const items = [
    { id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 600, qty: 1 },
    { id: 2, name: 'Tea', sku: 'TEA-1', hsn: '0902', price: 400, qty: 1 }
  ];
  const billed = pricing.computeTotals(items, 'SAVE10');
  const printed = invoice.computeInvoiceFigures({ items, coupon: 'SAVE10' });

  assert.equal(printed.subtotal, billed.subtotal);
  assert.equal(printed.discount, billed.discount);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.cgst, billed.cgst);
  assert.equal(printed.sgst, billed.sgst);
  assert.equal(printed.total, billed.total);
  assert.deepEqual(
    printed.rows.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.lineTax })),
    billed.lines.map((line) => ({ gstPercent: line.gstPercent, lineTax: line.tax }))
  );
});

test('invoice uses the HSN slab and matches POS pricing', () => {
  const items = [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const printed = invoice.computeInvoiceFigures({ items, coupon: '' });

  assert.equal(tax.getRateForItem(items[0]), 0.05);
  assert.equal(billed.tax, 5);
  assert.equal(billed.total, 105);
  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.tax, 5);
  assert.equal(printed.total, 105);
});

test('invoice applies the configured coupon cap and taxes the post-discount amount', () => {
  const items = [{ id: 2, name: 'Tea', sku: 'TEA-1', hsn: '0902', price: 4000, qty: 1 }];
  const billed = pricing.computeTotals(items, 'WELCOME');
  const printed = invoice.computeInvoiceFigures({ items, coupon: 'WELCOME' });

  assert.equal(billed.discount, 100); // Pricing applies the configured maximum discount.
  assert.equal(billed.tax, 702); // Pricing taxes the post-discount taxable amount.
  assert.equal(billed.total, 4602);
  assert.equal(printed.discount, 100);
  assert.equal(printed.tax, 702);
  assert.equal(printed.total, 4602);
  assert.equal(printed.total, billed.total);
});

test('invoice interprets decimal gstRate values the same way as POS pricing', () => {
  const items = [{ id: 3, name: 'Item', sku: 'ITEM-1', gstRate: 0.05, price: 100, qty: 1 }];
  const billed = pricing.computeTotals(items, '');
  const printed = invoice.computeInvoiceFigures({ items, coupon: '' });

  assert.equal(tax.getRateForItem(items[0]), 0.05);
  assert.equal(billed.tax, 5);
  assert.equal(printed.rows[0].gstPercent, 5);
  assert.equal(printed.tax, 5);
  assert.equal(printed.tax, billed.tax);
});

test('invoice tax total matches the sum of POS-rounded line tax amounts', () => {
  const items = [1, 2, 3].map((id) => ({
    id,
    name: 'Small item',
    sku: `SMALL-${id}`,
    hsn: 'UNKNOWN',
    price: 0.03,
    qty: 1
  }));
  const billed = pricing.computeTotals(items, '');
  const printed = invoice.computeInvoiceFigures({ items, coupon: '' });

  assert.deepEqual(billed.lines.map((line) => line.tax), [0.01, 0.01, 0.01]);
  assert.equal(billed.tax, 0.03);
  assert.deepEqual(printed.rows.map((row) => row.lineTax), [0.01, 0.01, 0.01]);
  assert.equal(printed.tax, 0.03);
  assert.equal(billed.total, 0.12);
  assert.equal(printed.total, 0.12);
  assert.equal(printed.tax, billed.tax);
});

test('invoice render does not warn when totals match POS pricing', () => {
  const order = {
    id: 1001,
    date: '21/11/2026',
    customer: 'Walk-in',
    paymentMode: 'cash',
    status: 'completed',
    coupon: '',
    total: 105,
    items: [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 100, qty: 1 }]
  };

  const html = invoice.render(order);

  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹105\.00/);
});
