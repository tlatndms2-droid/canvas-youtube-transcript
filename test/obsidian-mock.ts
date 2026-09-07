export async function requestUrl(): Promise<never> {
  throw new Error("requestUrl must be injected in tests");
}
