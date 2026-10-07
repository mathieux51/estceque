export class GetUserMediaError extends Error {}
export class EnvError extends Error {}
export class UnsupportedMimeTypeError extends Error {}

export const isErrorWithMessage = (error: unknown): error is Error =>
  typeof error === 'object' &&
  error !== null &&
  'message' in error &&
  typeof (error as Record<string, unknown>).message === 'string'

export const toError = (maybeError: unknown): Error => {
  if (isErrorWithMessage(maybeError)) {
    return maybeError
  }

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError))
  }
}

export const getErrorMessage = (error: unknown) => toError(error).message
