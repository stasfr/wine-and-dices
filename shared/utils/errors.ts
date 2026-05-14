export function getErrorMessage(
  err: unknown,
  fallback = 'An unexpected error occurred',
) {
  if (typeof err !== 'object' || err === null) {
    return fallback;
  }

  if (
    'statusMessage' in err &&
    typeof err.statusMessage === 'string' &&
    err.statusMessage.length > 0
  ) {
    return err.statusMessage;
  }

  if (
    'message' in err &&
    typeof err.message === 'string' &&
    err.message.length > 0
  ) {
    return err.message;
  }

  if (
    'statusText' in err &&
    typeof err.statusText === 'string' &&
    err.statusText.length > 0
  ) {
    return err.statusText;
  }

  return fallback;
}

export function getErrorStatusCode(err: unknown) {
  if (typeof err !== 'object' || err === null) {
    return undefined;
  }

  if ('statusCode' in err && typeof err.statusCode === 'number') {
    return err.statusCode;
  }

  if ('status' in err && typeof err.status === 'number') {
    return err.status;
  }

  return undefined;
}
