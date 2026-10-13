/**
 * Keeps enough of an email to tell accounts apart in logs without writing the address itself:
 * `john.doe@example.com` becomes `j***@example.com`.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");

  if (at < 1) {
    return "***";
  }

  return `${email[0]}***${email.slice(at)}`;
}
