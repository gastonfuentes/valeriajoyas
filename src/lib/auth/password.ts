// Pure validation for setting a new password (the reset-password form).

export const MIN_PASSWORD_LENGTH = 8
// Supabase/bcrypt only consider the first 72 bytes; reject longer so what the
// user typed is what actually protects the account.
export const MAX_PASSWORD_LENGTH = 72

export type NewPasswordErrors = Partial<Record<'password' | 'confirm', string>>

export type ValidateNewPasswordResult =
  | { ok: true }
  | { ok: false; errors: NewPasswordErrors }

export function validateNewPassword(password: string, confirm: string): ValidateNewPasswordResult {
  const errors: NewPasswordErrors = {}

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    errors.password = `La contraseña no puede superar ${MAX_PASSWORD_LENGTH} caracteres.`
  } else if (password !== confirm) {
    // Only check the match once the password itself is valid, so the actionable
    // error (length) isn't masked by a mismatch message.
    errors.confirm = 'Las contraseñas no coinciden.'
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }
  return { ok: true }
}
