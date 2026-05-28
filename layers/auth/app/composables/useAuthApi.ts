export default function useAuthApi() {
  const requestFetch = useRequestFetch();

  async function activateUser(activationId: string) {
    return await requestFetch(`/api/auth/activate/${activationId}`, {
      method: 'POST',
    });
  }

  async function login(body: { email: string; password: string }) {
    return await requestFetch('/api/auth/login', {
      method: 'POST',
      body,
    });
  }

  async function register(body: { email: string; password: string }) {
    return await requestFetch('/api/auth/register', {
      method: 'POST',
      body,
    });
  }

  async function resendActivation() {
    return await requestFetch('/api/auth/resend-activation', {
      method: 'POST',
    });
  }

  async function updateProfile(body: {
    firstName: string;
    lastName: string;
    middleName: string;
  }) {
    return await requestFetch('/api/users/profile', {
      method: 'PATCH',
      body,
    });
  }

  async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return await requestFetch('/api/users/avatar', {
      method: 'POST',
      body: formData,
    });
  }

  async function deleteAvatar() {
    return await requestFetch('/api/users/avatar', {
      method: 'DELETE',
    });
  }

  async function searchUsers(search: string) {
    return await requestFetch('/api/users/list', {
      query: { search },
    });
  }

  return {
    activateUser,
    login,
    register,
    resendActivation,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    searchUsers,
  };
}
