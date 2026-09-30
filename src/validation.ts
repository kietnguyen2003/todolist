export type LoginErrors = { email?: string; password?: string };

export function validateLogin(email: string, password: string): LoginErrors {
  const trimmedEmail = email.trim();
  const emailError = !trimmedEmail
    ? 'Bạn chưa nhập email.'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
      ? 'Email chưa đúng định dạng. Ví dụ: ban@email.com'
      : undefined;

  return {
    ...(emailError ? { email: emailError } : {}),
    ...(!password.trim() ? { password: 'Bạn chưa nhập mật khẩu.' } : {}),
  };
}
