import crypto from 'crypto';

export function hashSessionToken(sessionToken: string) {
  return crypto.createHash('sha256').update(sessionToken).digest('hex');
}
