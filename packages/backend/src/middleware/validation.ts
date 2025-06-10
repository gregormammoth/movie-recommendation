import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null; // Returns error message or null if valid
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates request body against provided rules
 */
export const validateBody = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];
    
    for (const rule of rules) {
      const value = req.body[rule.field];
      
      // Check if required field is missing
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field: rule.field, message: `${rule.field} is required` });
        continue;
      }
      
      // Skip validation if field is not provided and not required
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push({ field: rule.field, message: `${rule.field} must be a string` });
              continue;
            }
            break;
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push({ field: rule.field, message: `${rule.field} must be a number` });
              continue;
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push({ field: rule.field, message: `${rule.field} must be a boolean` });
              continue;
            }
            break;
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value !== 'string' || !emailRegex.test(value)) {
              errors.push({ field: rule.field, message: `${rule.field} must be a valid email` });
              continue;
            }
            break;
          case 'uuid':
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (typeof value !== 'string' || !uuidRegex.test(value)) {
              errors.push({ field: rule.field, message: `${rule.field} must be a valid UUID` });
              continue;
            }
            break;
        }
      }
      
      // Length validation for strings
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.minLength} characters long` });
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({ field: rule.field, message: `${rule.field} must be less than ${rule.maxLength} characters long` });
        }
      }
      
      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push({ field: rule.field, message: `${rule.field} format is invalid` });
        }
      }
      
      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors.push({ field: rule.field, message: customError });
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

/**
 * Validates request parameters against provided rules
 */
export const validateParams = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];
    
    for (const rule of rules) {
      const value = req.params[rule.field];
      
      // Check if required parameter is missing
      if (rule.required && !value) {
        errors.push({ field: rule.field, message: `${rule.field} parameter is required` });
        continue;
      }
      
      // Skip validation if parameter is not provided and not required
      if (!rule.required && !value) {
        continue;
      }
      
      // Type validation (params are always strings, so we mainly check patterns)
      if (rule.type === 'uuid') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          errors.push({ field: rule.field, message: `${rule.field} must be a valid UUID` });
        }
      }
      
      if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({ field: rule.field, message: `${rule.field} must be a valid email` });
        }
      }
      
      // Pattern validation
      if (rule.pattern) {
        if (!rule.pattern.test(value)) {
          errors.push({ field: rule.field, message: `${rule.field} format is invalid` });
        }
      }
      
      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors.push({ field: rule.field, message: customError });
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors
      });
    }
    
    next();
  };
};

/**
 * Validates query parameters against provided rules
 */
export const validateQuery = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];
    
    for (const rule of rules) {
      const value = req.query[rule.field];
      
      // Check if required query parameter is missing
      if (rule.required && !value) {
        errors.push({ field: rule.field, message: `${rule.field} query parameter is required` });
        continue;
      }
      
      // Skip validation if query parameter is not provided and not required
      if (!rule.required && !value) {
        continue;
      }
      
      // Type-specific validation for query parameters
      if (rule.type === 'number' && typeof value === 'string') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push({ field: rule.field, message: `${rule.field} must be a valid number` });
          continue;
        }
      }
      
      if (rule.type === 'boolean' && typeof value === 'string') {
        if (value !== 'true' && value !== 'false') {
          errors.push({ field: rule.field, message: `${rule.field} must be 'true' or 'false'` });
          continue;
        }
      }
      
      // Custom validation (pass the original value)
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors.push({ field: rule.field, message: customError });
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter validation failed',
        errors
      });
    }
    
    next();
  };
}; 