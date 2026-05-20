import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// 1. --- CONFIGURATION ---
const BASE_URL = __ENV.BASE_URL || 'https://prostore.katalink.id';

// Paste your cookie value here (from browser DevTools)
const SESSION_COOKIE = __ENV.SESSION_COOKIE || 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiTFBDUUp4N25OeWJvcV9XaEtfTTZQTzE5QWY5aU1IeFJ2Wm0zcWpuV0lBNUhfWUlBYnNSRDlFM0Z0aVlWWC13VktoTl9TMmxkZGhHNTY3cDNmUXdzSWcifQ..NSJhz7-f8jgksPPfQQ-KZg.RruB02Wpz08LhCEHz17AqMxCSbYx7ejGkHrVhXp5UKf7_cscWJHMslO3e5bqy_4GbCuzHCvSCDHrg52IWhJ9pagPHWxor3X98kmRwjFck_8fHXd92a1ehDxmMId9xmyvx8dXsYbALMd0dHui3CJ_kx-tChK_v5m_U5E-xh3E2wTxojr9TqFAxUMezFW_jnauabhpdalQ75D8V2GH8vtVDZMZFxdXX2SPF1qBPwW6WAziMnblgpC7zqPH-8U0hu18GZaPRalQ4l1X5-4XRyIBS-aOGdjWAPbWgiN6iyDft1Fp0BzkWlKkddpD45IgFTns.xBpZkqHZZ1ATGAEnZZMuzXJnLguiOX43-YIW0q0lWrc';

const API_ADMIN_URL = `${BASE_URL}/api/products/admin`;

export const options = {
  stages: [
    { duration: '1m', target: 270 },
    { duration: '5m', target: 270 },
    { duration: '1m', target: 0 },
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

  // Detect correct cookie name (production uses __Secure prefix)
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
  
  const createSuccess = check(createRes, {
    'Create: status 200': (r) => r.status === 200,
    'Create: success true': (r) => r.json() && r.json().success === true,
  });

  if (!createSuccess) {
    if (__ITER < 5) console.error(`Create failed: ${createRes.status} ${createRes.body}`);
    sleep(1);
    return;
  }

  const productId = createRes.json().data.id;
  sleep(1 + Math.random() * 2); // Think time

  // 2. Delete Product
  const deleteRes = http.del(`${API_ADMIN_URL}?id=${productId}`, null, { headers });

  check(deleteRes, {
    'Delete: status 200': (r) => r.status === 200,
    'Delete: success true': (r) => r.json() && r.json().success === true,
  });

  sleep(1 + Math.random() * 2);
}
