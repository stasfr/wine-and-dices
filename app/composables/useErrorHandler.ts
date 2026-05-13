export function useErrorHandler() {
  const toast = useToast();

  function handleError(
    err: unknown,
    options: { title: string; fallback?: string },
  ) {
    toast.add({
      title: options.title,
      description: getErrorMessage(err, options.fallback),
      color: 'error',
    });
  }

  return { handleError, getErrorMessage, getErrorStatusCode };
}
