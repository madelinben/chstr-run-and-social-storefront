// Local stand-in for the Shopify Storefront API, for dev and e2e without a store.
// Run: node scripts/mock-storefront.mjs   then set PUBLIC_SHOPIFY_STOREFRONT_URL=http://localhost:4400
import { createServer } from 'node:http';

const money = (amount) => ({ amount, currencyCode: 'GBP' });
const image = (name) => ({ url: `/images/products/${name}.webp`, altText: name });
const variant = (id, title, amount, availableForSale = true) => ({ id: `gid://shopify/ProductVariant/${id}`, title, availableForSale, price: money(amount) });
const products = [
  {
    id: 'gid://shopify/Product/1', handle: 'club-tee', title: 'Club Tee', description: 'Soft cotton club tee with the bubble logo.',
    featuredImage: image('club-tee'), images: { nodes: [image('club-tee'), image('club-tee')] },
    variants: { nodes: [variant(11, 'S', '20.0'), variant(12, 'M', '20.0'), variant(13, 'L', '20.0', false)] },
  },
  {
    id: 'gid://shopify/Product/2', handle: 'run-cap', title: 'Run Cap', description: 'Lightweight running cap.',
    featuredImage: image('run-cap'), images: { nodes: [image('run-cap')] },
    variants: { nodes: [variant(21, 'Default Title', '15.0')] },
  },
];
const variants = new Map(products.flatMap((p) => p.variants.nodes.map((v) => [v.id, { variant: v, product: p }])));
const carts = new Map();

function view(cart) {
  const lines = [...cart.lines.entries()].map(([merchandiseId, quantity]) => {
    const { variant: v, product } = variants.get(merchandiseId);
    return { id: `line:${merchandiseId}`, quantity, merchandise: { id: v.id, title: v.title, product: { title: product.title, handle: product.handle } } };
  });
  const total = [...cart.lines.entries()].reduce((sum, [id, q]) => sum + Number(variants.get(id).variant.price.amount) * q, 0);
  return {
    id: cart.id, checkoutUrl: 'https://example.myshopify.com/checkout/mock', totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
    cost: { totalAmount: money(total.toFixed(1)) }, lines: { nodes: lines },
  };
}

function handle({ query, variables }) {
  if (query.includes('query Products')) return { products: { nodes: products } };
  if (query.includes('query Cart')) return { cart: carts.has(variables.id) ? view(carts.get(variables.id)) : null };
  if (query.includes('cartCreate')) {
    const cart = { id: `gid://shopify/Cart/${carts.size + 1}`, lines: new Map() };
    carts.set(cart.id, cart);
    for (const l of variables.lines) cart.lines.set(l.merchandiseId, l.quantity);
    return { cartCreate: { cart: view(cart) } };
  }
  const cart = carts.get(variables.cartId);
  if (!cart) return { cart: null };
  if (query.includes('cartLinesAdd')) {
    for (const l of variables.lines) cart.lines.set(l.merchandiseId, (cart.lines.get(l.merchandiseId) ?? 0) + l.quantity);
    return { cartLinesAdd: { cart: view(cart) } };
  }
  if (query.includes('cartLinesUpdate')) {
    for (const l of variables.lines) cart.lines.set(l.id.replace('line:', ''), l.quantity);
    return { cartLinesUpdate: { cart: view(cart) } };
  }
  if (query.includes('cartLinesRemove')) {
    for (const id of variables.lineIds) cart.lines.delete(id.replace('line:', ''));
    return { cartLinesRemove: { cart: view(cart) } };
  }
  throw new Error('Unhandled operation');
}

createServer((request, response) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
  if (request.method === 'OPTIONS') return response.writeHead(204, headers).end();
  let body = '';
  request.on('data', (chunk) => (body += chunk));
  request.on('end', () => {
    let payload;
    try {
      payload = { data: handle(JSON.parse(body)) };
    } catch (error) {
      payload = { errors: [{ message: String(error) }] };
    }
    response.writeHead(200, headers).end(JSON.stringify(payload));
  });
}).listen(4400, () => console.log('Mock Storefront API on http://localhost:4400'));
