import { generateAccessToken, paypal } from '../lib/paypal';
import { logger } from '../lib/logger';

// Test to generate access token from paypal
test('generates token from paypal', async () => {
  const tokenResponse = await generateAccessToken();
  logger.debug(
    { event: 'tests.paypal.token', tokenLength: tokenResponse.length },
    'Generated PayPal token'
  );
  expect(typeof tokenResponse).toBe('string');
  expect(tokenResponse.length).toBeGreaterThan(0);
});

// Test to create a paypal order
test('creates a paypal order', async () => {
  const token = await generateAccessToken();
  const price = 10.0;

  const orderResponse = await paypal.createOrder(price);
  logger.debug(
    { event: 'tests.paypal.order', status: orderResponse.status },
    'Created PayPal order'
  );

  expect(orderResponse).toHaveProperty('id');
  expect(orderResponse).toHaveProperty('status');
  expect(orderResponse.status).toBe('CREATED');
});

// Test to capture payment with mock order
test('simulate capturing a payment from an order', async () => {
  const orderId = '100';

  const mockCapturePayment = jest
    .spyOn(paypal, 'capturePayment')
    .mockResolvedValue({
      status: 'COMPLETED',
    });

  const captureResponse = await paypal.capturePayment(orderId);
  expect(captureResponse).toHaveProperty('status', 'COMPLETED');

  mockCapturePayment.mockRestore();
});
