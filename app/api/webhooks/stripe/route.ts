import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import { createRequestLogger } from '@/lib/request-logger';

export async function POST(req: NextRequest) {
  const { logger: requestLogger, logCompletion } = createRequestLogger(req, {
    extra: { route: 'stripe.webhook' },
  });

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = await Stripe.webhooks.constructEvent(
      rawBody,
      req.headers.get('stripe-signature') as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error) {
    requestLogger.error(
      { err: error, event: 'stripe.webhook.invalid_signature' },
      'Failed to validate Stripe webhook signature'
    );
    logCompletion(400, { reason: 'invalid_signature' }, 'Stripe webhook rejected');
    return NextResponse.json(
      { message: 'Invalid Stripe signature' },
      { status: 400 }
    );
  }

  if (event.type !== 'charge.succeeded') {
    requestLogger.info(
      { eventType: event.type },
      'Stripe webhook ignored non charge.succeeded event'
    );
    logCompletion(200, { eventType: event.type }, 'Stripe event ignored');
    return NextResponse.json({
      message: 'event is not charge.succeeded',
    });
  }

  const charge = event.data.object as Stripe.Charge;
  const orderId = charge.metadata?.orderId;

  if (!orderId) {
    requestLogger.error(
      { event: 'stripe.webhook.missing_order_id', chargeId: charge.id },
      'Charge succeeded event missing orderId metadata'
    );
    logCompletion(
      400,
      { reason: 'missing_order_id', chargeId: charge.id },
      'Stripe webhook missing order metadata'
    );
    return NextResponse.json(
      { message: 'Missing order metadata' },
      { status: 400 }
    );
  }

  try {
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: charge.id,
        status: 'COMPLETED',
        email_address: charge.billing_details.email ?? '',
        pricePaid: (charge.amount / 100).toFixed(),
      },
    });
    requestLogger.info(
      { event: 'stripe.webhook.order_paid', orderId, chargeId: charge.id },
      'Order marked as paid from Stripe webhook'
    );
    logCompletion(200, { event: 'order_paid', orderId }, 'Stripe webhook processed');
    return NextResponse.json({
      message: 'updateOrderToPaid was successful',
    });
  } catch (error) {
    requestLogger.error(
      { err: error, event: 'stripe.webhook.order_update_failed', orderId },
      'Failed to update order from Stripe webhook'
    );
    logCompletion(
      500,
      { reason: 'order_update_failed', orderId },
      'Stripe webhook failed'
    );
    return NextResponse.json(
      { message: 'Failed to update order' },
      { status: 500 }
    );
  }
}
