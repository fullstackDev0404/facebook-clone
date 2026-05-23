// ─── Validation utilities for auth forms ─────────────────────────────────────

export const isValidUsername = (v: string): boolean =>
  /^[a-zA-Z0-9_]{3,20}$/.test(v)

export const isValidEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export const isValidPhone = (v: string): boolean =>
  /^\+?\d{7,15}$/.test(v)

export const isValidEmailOrPhone = (v: string): boolean =>
  isValidEmail(v) || isValidPhone(v)

export const validateLogin = (
  email: string,
  password: string
): Record<string, string> => {
  const errors: Record<string, string> = {}
  if (!email.trim())                  errors.email = 'Email or phone number is required'
  else if (!isValidEmailOrPhone(email)) errors.email = 'Enter a valid email or phone number'
  if (!password)                      errors.password = 'Password is required'
  else if (password.length < 6)       errors.password = 'Password must be at least 6 characters'
  return errors
}

interface SignupFields {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  dob: string
  gender: string
}

export const validateSignup = (fields: SignupFields): Record<string, string> => {
  const errors: Record<string, string> = {}
  if (!fields.firstName.trim())           errors.firstName = 'First name is required'
  if (!fields.lastName.trim())            errors.lastName  = 'Last name is required'
  if (!fields.username.trim())            errors.username  = 'Username is required'
  else if (!isValidUsername(fields.username)) errors.username = 'Username must be 3-20 characters, letters, numbers, and underscores only'
  if (!fields.email.trim())               errors.email     = 'Email or phone is required'
  else if (!isValidEmailOrPhone(fields.email)) errors.email = 'Enter a valid email or phone number'
  if (!fields.password)                   errors.password  = 'Password is required'
  else if (fields.password.length < 6)    errors.password  = 'Password must be at least 6 characters'
  if (!fields.dob)                        errors.dob       = 'Date of birth is required'
  if (!fields.gender)                     errors.gender    = 'Please select a gender'
  return errors
}

/** Tailwind classes for an input based on error state. */
export const inputCls = (hasError: boolean): string =>
  `w-full border rounded-lg px-4 py-3 text-sm outline-none transition ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : 'border-gray-300 focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/30'
  }`
