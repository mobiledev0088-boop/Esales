import { FormField } from './FormSection';

// Validation error type
export interface ValidationErrors {
  [key: string]: string;
}

// Validation rules
export const validationRules = {
  required: (value: string) => {
    return !value || value.trim() === '' ? 'This field is required' : '';
  },
  email: (value: string) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
  },
  phone: (value: string) => {
    if (!value) return '';
    const phoneRegex = /^[0-9]{10,15}$/;
    return !phoneRegex.test(value.replace(/[\s-]/g, ''))
      ? 'Please enter a valid phone number'
      : '';
  },
  gst: (value: string) => {
    if (!value) return '';
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return !gstRegex.test(value) ? 'Please enter a valid GST number' : '';
  },
  numeric: (value: string) => {
    if (!value) return '';
    return isNaN(Number(value)) ? 'Please enter a valid number' : '';
  },
};

// Validate a single field based on its configuration
export const validateField = (
  field: FormField,
  value: string
): string => {
  // Check required validation
  if (field.required) {
    const requiredError = validationRules.required(value);
    if (requiredError) return requiredError;
  }

  // If field is empty and not required, skip other validations
  if (!value || value.trim() === '') return '';

  // Check field-specific validations based on keyboardType or field key
  if (field.keyboardType === 'email-address' || field.key.toLowerCase().includes('mail')) {
    const emailError = validationRules.email(value);
    if (emailError) return emailError;
  }

  if (field.keyboardType === 'phone-pad' || field.key.toLowerCase().includes('number') || field.key.toLowerCase().includes('no')) {
    if (field.key.toLowerCase().includes('gst')) {
    //   const gstError = validationRules.gst(value);
      const gstError = false; // Temporary bypass for GST validation
      if (gstError) return gstError;
    } else if (field.keyboardType === 'phone-pad') {
      if(field.required == true){
        const phoneError = validationRules.phone(value);
        if (phoneError) return phoneError;
      }
    }
  }

  if (field.keyboardType === 'numeric') {
    const numericError = validationRules.numeric(value);
    if (numericError) return numericError;
  }

  return '';
};

// Validate all fields in a section
export const validateSection = (
  fields: FormField[],
  values: Record<string, string>
): { isValid: boolean; errors: ValidationErrors } => {
  const errors: ValidationErrors = {};
  let isValid = true;

  fields.forEach((field) => {
    const error = validateField(field, values[field.key] || '');
    if (error) {
      errors[field.key] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Check if a section has any required fields filled
export const hasAnyRequiredFieldsFilled = (
  fields: FormField[],
  values: Record<string, string>
): boolean => {
  return fields.some(
    (field) => field.required && values[field.key] && values[field.key].trim() !== ''
  );
};

// Get list of required fields for a section
export const getRequiredFields = (fields: FormField[]): FormField[] => {
  return fields.filter((field) => field.required);
};
