export function isMissingAuthSessionError(message: string | null | undefined): boolean {
  if (!message) {
    return false;
  }

  return message.toLowerCase().includes("auth session missing");
}
