import { describe, it, expect } from 'vitest'
import { validateNewPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from './password'

describe('validateNewPassword', () => {
  it('accepts a valid matching password', () => {
    const result = validateNewPassword('superseguro1', 'superseguro1')
    expect(result.ok).toBe(true)
  })

  it('accepts a password exactly at the minimum length', () => {
    const pw = 'a'.repeat(MIN_PASSWORD_LENGTH)
    const result = validateNewPassword(pw, pw)
    expect(result.ok).toBe(true)
  })

  it('rejects a password shorter than the minimum', () => {
    const pw = 'a'.repeat(MIN_PASSWORD_LENGTH - 1)
    const result = validateNewPassword(pw, pw)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.password).toBeTruthy()
  })

  it('rejects an empty password', () => {
    const result = validateNewPassword('', '')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.password).toBeTruthy()
  })

  it('rejects a password longer than the bcrypt limit', () => {
    const pw = 'a'.repeat(MAX_PASSWORD_LENGTH + 1)
    const result = validateNewPassword(pw, pw)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.password).toBeTruthy()
  })

  it('rejects when confirmation does not match', () => {
    const result = validateNewPassword('superseguro1', 'superseguro2')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.confirm).toBeTruthy()
  })

  it('does not flag a mismatch when the password itself is invalid', () => {
    // Too short AND mismatched: report the password problem, the mismatch is moot.
    const result = validateNewPassword('abc', 'xyz')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.password).toBeTruthy()
    expect(result.errors.confirm).toBeFalsy()
  })

  it('does not treat the password as secretly trimmed (spaces count)', () => {
    // A password is used verbatim; only length matters, spaces are real chars.
    const pw = '       8' // 8 chars incl spaces
    const result = validateNewPassword(pw, pw)
    expect(result.ok).toBe(true)
  })
})
