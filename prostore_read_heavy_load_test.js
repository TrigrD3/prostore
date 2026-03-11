import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';


const BASE_URL = __ENV.BASE_URL || 'https://prostore.katalink.id';
// const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const API_BASE_URL = `${BASE_URL}/api/products`;
const JSON_HEADERS = {
  headers: {
    Accept: 'application/json',
  },
};


const productSlugs = new SharedArray('productSlugs', () => [
  'polo-sporting-stretch-shirt',
  'brooks-brothers-long-sleeved-shirt',
  'tommy-hilfiger-classic-fit-dress-shirt',
  'calvin-klein-slim-fit-stretch-shirt',
  'polo-ralph-lauren-oxford-shirt',
  'polo-classic-pink-hoodie',
]);

const searchCombos = new SharedArray('searchCombos', () => [
  { q: 'polo', category: "Men's Dress Shirts" },
  { q: 'shirt', category: 'all' },
  { q: 'hoodie', category: "Men's Sweatshirts" },
  { q: 'all', category: 'all' },
]);

const randomItem = (items) =>
  items[Math.floor(Math.random() * items.length)];

const safeJson = (response) => {
  try {
    return response.json();
  } catch (error) {
    return null;
  }
};

const thinkTime = () => sleep(1 + Math.random() * 2);

export const options = {
  stages: [
    { duration: '60s', target: 270 },
    { duration: '5m', target: 270 },
    { duration: '60s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  noConnectionReuse: false,
  userAgent: 'k6-Prostore-ReadHeavy-Test/1.0',
};

export default function () {
  // 1. Mengambil daftar produk terbaru
  const latestRes = http.get(`${API_BASE_URL}/latest`, JSON_HEADERS);
  const latestPayload = safeJson(latestRes);
  check(latestRes, {
    'latest status 200': (r) => r.status === 200,
    'latest returns array': () =>
      latestPayload &&
      Array.isArray(latestPayload.data) &&
      latestPayload.data.length >= 0,
  });
  thinkTime();

  // 2. Mensimulasikan penelusuran katalog melalui API pencarian
  if (searchCombos.length) {
    const combo = randomItem(searchCombos);
    const searchUrl = `${API_BASE_URL}/search?category=${encodeURIComponent(
      combo.category
    )}&q=${encodeURIComponent(combo.q)}`;
    const searchRes = http.get(searchUrl, JSON_HEADERS);
    const searchPayload = safeJson(searchRes);
    check(searchRes, {
      'search status 200': (r) => r.status === 200,
      'search returns products array': () =>
        searchPayload &&
        Array.isArray(searchPayload.data) &&
        searchPayload.pagination?.page >= 1,
    });
  }
  thinkTime();

  // 3. Mensimulasikan penelusuran katalog melalui API pencarian
  if (productSlugs.length) {
    const slug = randomItem(productSlugs);
    const productRes = http.get(`${API_BASE_URL}/${slug}`, JSON_HEADERS);
    const productPayload = safeJson(productRes);
    check(productRes, {
      'product status 200': (r) => r.status === 200,
      'product payload matches slug': () =>
        productPayload?.data?.slug === slug,
    });
  }

  thinkTime();
}
