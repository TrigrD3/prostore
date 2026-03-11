import { Resend } from 'resend';
import { SENDER_EMAIL, APP_NAME } from '@/lib/constants';
import { Order } from '@/types';
import dotenv from 'dotenv';
import { logger } from '@/lib/logger';
dotenv.config();

import PurchaseReceiptEmail from './purchase-receipt';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
  if (!resend) {
    logger.warn(
      { event: 'email.purchase_receipt.skipped', orderId: order.id },
      'Skipping purchase receipt email: RESEND_API_KEY is not configured'
    );
    return;
  }

  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: order.user.email,
    subject: `Order Confirmation ${order.id}`,
    react: <PurchaseReceiptEmail order={order} />,
  });
};
