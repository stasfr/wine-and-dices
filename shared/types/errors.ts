export interface FetchError {
  statusCode: number | undefined;
  statusMessage: string | undefined;
  message: string | undefined;
  status: number | undefined;
  statusText: string | undefined;
  data: unknown | undefined;
}
