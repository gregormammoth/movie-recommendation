import { useState, useEffect, useCallback } from 'react';
import { userService, type UserValidationError } from '../services/userService';

interface UseUserValidationOptions {
  checkAvailability?: boolean;
  debounceMs?: number;
}

interface UseUserValidationReturn {
  errors: UserValidationError[];
  isChecking: boolean;
  isAvailable: boolean | null;
  validateUsername: (username: string) => void;
  clearErrors: () => void;
}

export const useUserValidation = (options: UseUserValidationOptions = {}): UseUserValidationReturn => {
  const { checkAvailability = true, debounceMs = 500 } = options;
  
  const [errors, setErrors] = useState<UserValidationError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const validateUsername = useCallback(async (username: string) => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Clear previous state
    setErrors([]);
    setIsAvailable(null);

    // Client-side validation first
    const clientErrors = userService.validateUsername(username);
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      setIsChecking(false);
      return;
    }

    // If we should check availability and username passes client validation
    if (checkAvailability && username.trim()) {
      setIsChecking(true);
      
      // Set up debounced availability check
      const timer = setTimeout(async () => {
        try {
          const result = await userService.checkUsernameAvailability(username.trim());
          if (result.success && result.data) {
            setIsAvailable(result.data.available);
            if (!result.data.available) {
              setErrors([{
                field: 'username',
                message: 'Username is already taken'
              }]);
            }
          }
        } catch (error) {
          console.error('Error checking username availability:', error);
          // Don't show error for availability check failure - just disable the check
        } finally {
          setIsChecking(false);
        }
      }, debounceMs);

      setDebounceTimer(timer);
    }
  }, [checkAvailability, debounceMs, debounceTimer]);

  const clearErrors = useCallback(() => {
    setErrors([]);
    setIsAvailable(null);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    errors,
    isChecking,
    isAvailable,
    validateUsername,
    clearErrors
  };
}; 