export default defineNuxtRouteMiddleware(function authMiddleware(to) {
  const { loggedIn, user } = useUserSession();

  const isPublicRoute =
    to.path === '/' ||
    to.path === '/auth/login' ||
    to.path === '/auth/register' ||
    to.path.startsWith('/auth/activate/');

  if (isPublicRoute) {
    return;
  }

  if (!loggedIn.value) {
    return navigateTo('/auth/login');
  }

  if (!user.value) {
    return navigateTo('/auth/login');
  }

  if (user.value.isActive !== true && to.path !== '/profile') {
    return navigateTo('/profile');
  }
});
