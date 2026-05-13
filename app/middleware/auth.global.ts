export default defineNuxtRouteMiddleware(function authMiddleware(to) {
  const { loggedIn } = useUserSession();

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
});
