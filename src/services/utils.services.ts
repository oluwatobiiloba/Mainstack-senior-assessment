const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

/**
 * Wraps an async operation with retry logic for mongo transient errors.
 *
 * @param operation - An async function representing the operation to perform.
 * @param maxRetries - Maximum number of retry attempts.
 * @param delay - Delay in milliseconds between retries.
 * @returns A promise resolving to the operation's result.
 * @throws An error if the operation fails after the maximum number of retries.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      const isTransient =
        (error.errorLabel && typeof error.errorLabel.has === "function" && error.errorLabel.has("TransientTransactionError")) ||
        (error.errorLabelSet && typeof error.errorLabelSet.has === "function" && error.errorLabelSet.has("TransientTransactionError"));

      if (!isTransient) {
        throw error;
      }

      attempt++;
      console.warn(
        `Transient error occurred. Attempt ${attempt} of ${maxRetries}. Retrying in ${delay}ms...`
      );
      // Wait for the specified delay before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Operation failed after ${maxRetries} attempts.`);
}