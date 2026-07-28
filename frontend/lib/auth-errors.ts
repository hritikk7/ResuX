// Maps raw Supabase Auth error strings to copy a user can act on. Supabase
// intentionally doesn't tell us *which* sign-in method an email is
// registered with (avoids leaking account existence), so the "signed up
// with Google" hint below is an inference, not a fact from the API.
export function authErrorMessage(error: { message: string } | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";

  const message = error.message;

  if (message === "Invalid login credentials") {
    return "Incorrect email or password. If you signed up with Google, use the Google button above.";
  }
  if (message === "User already registered") {
    return "That email already has an account. Try signing in instead.";
  }
  if (message.includes("Token has expired or is invalid")) {
    return "That code has expired or is incorrect. Request a new one.";
  }

  // "For security purposes, you can only request this after N seconds" and
  // any other Supabase message are already clear enough to show as-is.
  return message;
}
