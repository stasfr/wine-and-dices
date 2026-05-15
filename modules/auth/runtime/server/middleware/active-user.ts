export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  if (
    path === '/api/auth/login' ||
    path === '/api/auth/register' ||
    path.startsWith('/api/auth/activate/')
  ) {
    return;
  }

  if (path === '/api/users/profile' || path === '/api/users/avatar') {
    return;
  }

  if (path.startsWith('/api/_auth/')) {
    return;
  }

  if (!path.startsWith('/api/')) {
    return;
  }

  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({ status: 401, statusMessage: 'Unauthorized' });
  }

  if (session.user.isActive !== true) {
    throw createError({ status: 401, statusMessage: 'Unauthorized' });
  }
});
