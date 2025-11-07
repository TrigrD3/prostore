import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

/**
 * Prostore read-heavy scenario inspired by the Katalink test.
 * Customize BASE_URL via `k6 run --env BASE_URL=http://localhost:3000 prostore_read_heavy_load_test.js`
 * when running against Docker Compose or any deployed environment.
 */
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Sample slugs generated from the default seed data. Update as you add new fixtures.
const productSlugs = new SharedArray('productSlugs', () => [
  'polo-sporting-stretch-shirt',
  'brooks-brothers-long-sleeved-shirt',
  'tommy-hilfiger-classic-fit-dress-shirt',
  'calvin-klein-slim-fit-stretch-shirt',
  'polo-ralph-lauren-oxford-shirt',
  'polo-classic-pink-hoodie',
]);

const randomItem = (items) =>
  items[Math.floor(Math.random() * items.length)];

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  noConnectionReuse: false,
  userAgent: 'k6-Prostore-ReadHeavy-Test/1.0',
};

export default function () {
  if (!productSlugs.length) {
    console.warn('No product slugs provided for the k6 test run.');
    sleep(1);
    return;
  }

  const slug = randomItem(productSlugs);
  const requestUrl = `${BASE_URL}/product/${slug}`;
  const res = http.get(requestUrl);
  check(res, {
    'product status 200': (r) => r.status === 200,
    'product page has title text': (r) =>
      r.body && r.body.toLowerCase().includes('add to cart'),
  });
  sleep(0.5 + Math.random());
}
