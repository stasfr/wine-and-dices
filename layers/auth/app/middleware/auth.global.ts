export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession();

  if (to.meta.public === true) {
    return;
  }

  if (!loggedIn.value || !user.value) {
    if (import.meta.client) {
      const toast = useToast();
      toast.add({
        title: 'Access denied',
        description: 'Please sign in to access this page.',
        icon: 'i-lucide-lock',
        color: 'error',
      });
    }
    return navigateTo('/auth/login');
  }

  if (to.path === '/profile') {
    return;
  }

  if (user.value.isActive !== true) {
    if (import.meta.client) {
      const toast = useToast();
      toast.add({
        title: 'Account inactive',
        description: 'Please activate your profile to continue.',
        icon: 'i-lucide-user-x',
        color: 'error',
      });
    }
    return navigateTo('/profile');
  }
});
