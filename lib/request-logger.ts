import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import UAParser from 'ua-parser-js';
import type { Logger } from 'pino';

import { logger } from './logger';

type RequestLike = NextRequest | Request;

export interface RequestLoggerUser {
  id?: string;
  email?: string;
  role?: string;
}

export interface RequestLoggerOptions {
  requestId?: string;
  user?: RequestLoggerUser;
  extra?: Record<string, unknown>;
}

export interface RequestLoggerResult {
  logger: Logger;
  requestId: string;
  logCompletion: (
    status: number,
    extra?: Record<string, unknown>,
    message?: string
  ) => void;
}

const buildDeviceProfile = (userAgent: string | null) => {
  if (!userAgent) return undefined;

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  return {
    browser: browser.name || undefined,
    browserVersion: browser.version || undefined,
    os: os.name || undefined,
    osVersion: os.version || undefined,
    deviceType: device.type || 'desktop',
    deviceVendor: device.vendor || undefined,
    deviceModel: device.model || undefined,
  };
};

const resolveClientIp = (request: RequestLike) => {
  const singleValuedHeaders = [
    'cf-connecting-ip',
    'true-client-ip',
    'x-real-ip',
  ];

  for (const header of singleValuedHeaders) {
    const value = request.headers.get(header);
    if (value) return value.split(',')[0]?.trim() || value;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',').map((segment) => segment.trim());
    if (firstIp) return firstIp;
  }

  const forwarded = request.headers.get('forwarded');
  if (forwarded) {
    const match = forwarded.match(/for="?([^;,"]+)/i);
    if (match?.[1]) return match[1];
  }

  const requestWithIp = request as Request & { ip?: string };
  if (requestWithIp.ip) return requestWithIp.ip;

  return undefined;
};

export const createRequestLogger = (
  request: RequestLike,
  options?: RequestLoggerOptions
): RequestLoggerResult => {
  const requestId = options?.requestId ?? randomUUID();
  const url = 'nextUrl' in request ? request.nextUrl : new URL(request.url);
  const device = buildDeviceProfile(request.headers.get('user-agent'));
  const ip = resolveClientIp(request);

  const baseContext: Record<string, unknown> = {
    requestId,
    method: request.method,
    path: url.pathname,
    ...(device ? { device } : {}),
    ...(ip ? { ip } : {}),
  };

  if (options?.user) {
    baseContext.user = options.user;
  }

  if (options?.extra) {
    baseContext.context = options.extra;
  }

  const startedAt = Date.now();
  const childLogger = logger.child(baseContext);

  const logCompletion = (
    status: number,
    extra?: Record<string, unknown>,
    message = 'Request completed'
  ) => {
    childLogger.info(
      { status, durationMs: Date.now() - startedAt, ...extra },
      message
    );
  };

  return {
    logger: childLogger,
    requestId,
    logCompletion,
  };
};
