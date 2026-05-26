export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession();

  if (to.meta.public === true) {
    return;
  }

  if (!loggedIn.value || !user.value) {
    return navigateTo('/auth/login');
  }

  if (to.path === '/profile') {
    return;
  }

  if (user.value.isActive !== true) {
    return navigateTo('/profile');
  }
});
