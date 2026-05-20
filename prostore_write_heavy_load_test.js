import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL = __ENV.BASE_URL || 'https://prostore.katalink.id';
const SESSION_COOKIE = __ENV.SESSION_COOKIE || 'SESSION_COOKIE_HERE';

const API_ADMIN_URL = `${BASE_URL}/api/products/admin`;

export const options = {
  stages: [
    { duration: '60s', target: 90 },
    { duration: '5m', target: 90 },
    { duration: '60s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
  userAgent: 'k6-Prostore-WriteHeavy-Test/1.0',
};

export default function () {
  if (SESSION_COOKIE === 'YOUR_SESSION_TOKEN_HERE') {
    if (__ITER === 0) console.error('ERROR: Please provide a valid SESSION_COOKIE.');
    sleep(1);
    return;
  }

  const cookieName = BASE_URL.startsWith('https') ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const headers = {
    'Cookie': `${cookieName}=${SESSION_COOKIE}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const uniqueId = uuidv4().substring(0, 8);
  const payload = JSON.stringify({
    name: `Load Test ${uniqueId}`,
    slug: `load-test-${uniqueId}`,
    category: "Men's Dress Shirts",
    brand: 'k6-test',
    description: 'Automated load test product',
    stock: 50,
    images: ['/images/sample-products/p1-1.jpg'],
    isFeatured: false,
    banner: null,
    price: '99.99',
  });

  // 1. Create Product
  const createRes = http.post(API_ADMIN_URL, payload, { headers });
  
  // Safe check logic
  let createJson = null;
  if (createRes.status === 200) {
    try {
      createJson = createRes.json();
    } catch (e) {
      console.error(`Status was 200 but JSON parse failed. Body: ${createRes.body.substring(0, 50)}`);
    }
  } else {
    // Log the error body so you know why it's failing
    if (__ITER < 5) {
      console.warn(`Create failed with status ${createRes.status}. Body: ${createRes.body.substring(0, 100)}`);
    }
  }

  const createSuccess = check(createRes, {
    'Create: status 200': (r) => r.status === 200,
    'Create: success true': () => createJson !== null && createJson.success === true,
  });

  if (createSuccess && createJson.data && createJson.data.id) {
    const productId = createJson.data.id;
    sleep(1 + Math.random() * 2);


    // 2. Delete Product
    const deleteRes = http.del(`${API_ADMIN_URL}?id=${productId}`, null, { headers });
    
    let deleteJson = null;
    if (deleteRes.status === 200) {
      try { deleteJson = deleteRes.json(); } catch (e) {}
    }

    check(deleteRes, {
      'Delete: status 200': (r) => r.status === 200,
      'Delete: success true': () => deleteJson !== null && deleteJson.success === true,
    });
  }

  sleep(1 + Math.random() * 2);
}
