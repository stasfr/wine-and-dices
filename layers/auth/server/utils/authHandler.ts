import type { H3Event } from 'h3';
import type { UserSessionRequired } from '#auth-utils';

export interface AuthUser {
  id: string;
  email: string;
  isActive: boolean;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  middleName: string | null | undefined;
  avatar: string | null | undefined;
}

declare module 'h3' {
  interface H3EventContext {
    authUser?: AuthUser;
  }
}

/**
 * An authenticated wrapper of Nitro defineEventHandler
 *
 * @example ```ts
 * import { defineAuthenticatedHandler } from '~~/server/utils/authHandler'
 *
 * export default defineAuthenticatedHandler(async (event, session) => {
 *   // Your authenticated logic here
 * })
 * ```
 */
export function defineAuthenticatedHandler<T>(
  handler: (event: H3Event, session: UserSessionRequired) => Promise<T> | T,
) {
  return defineEventHandler(async (event) => {
    const session = await requireUserSession(event);

    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    if (session.user.isActive !== true) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    event.context.authUser = session.user;

    return handler(event, session);
  });
}
