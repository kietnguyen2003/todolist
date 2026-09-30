export type LoginErrors = { email?: string; password?: string };

export function validateLogin(email: string, password: string): LoginErrors {
  const trimmedEmail = email.trim();
  const emailError = !trimmedEmail
    ? 'Enter your email.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
      ? 'Enter a valid email, for example you@email.com.'
      : undefined;

  return {
    ...(emailError ? { email: emailError } : {}),
    ...(!password.trim() ? { password: 'Enter your password.' } : {}),
  };
}
