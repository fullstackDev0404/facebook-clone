// Shared validation utilities for auth forms

export const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const isValidPhone = (value) =>
    /^\+?\d{7,15}$/.test(value)

export const isValidEmailOrPhone = (value) =>
    isValidEmail(value) || isValidPhone(value)

export const validateLogin = (email, password) => {
    const errors = {}
    if (!email.trim()) {
        errors.email = 'Email or phone number is required'
    } else if (!isValidEmailOrPhone(email)) {
        errors.email = 'Enter a valid email or phone number'
    }
    if (!password) {
        errors.password = 'Password is required'
    } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
    }
    return errors
}

export const validateSignup = (fields) => {
    const errors = {}
    if (!fields.firstName.trim()) errors.firstName = 'First name is required'
    if (!fields.lastName.trim()) errors.lastName = 'Last name is required'
    if (!fields.email.trim()) {
        errors.email = 'Email or phone is required'
    } else if (!isValidEmailOrPhone(fields.email)) {
        errors.email = 'Enter a valid email or phone number'
    }
    if (!fields.password) {
        errors.password = 'Password is required'
    } else if (fields.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
    }
    if (!fields.dob) errors.dob = 'Date of birth is required'
    if (!fields.gender) errors.gender = 'Please select a gender'
    return errors
}

// Returns Tailwind classes for an input based on error state
export const inputCls = (hasError) =>
    `w-full border rounded-lg px-4 py-3 text-sm outline-none transition ${
        hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/30'
    }`
