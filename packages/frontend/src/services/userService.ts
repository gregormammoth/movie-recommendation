interface CreateUserRequest {
  id?: string; // Optional custom ID - if not provided, will be auto-generated
  username: string;
  email?: string;
}

interface UserResponse {
  id: string;
  username: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserValidationError {
  field: string;
  message: string;
}

interface CreateUserResponse {
  success: boolean;
  message?: string;
  data?: UserResponse;
  errors?: UserValidationError[];
}

interface CheckAvailabilityResponse {
  success: boolean;
  data?: {
    username?: string;
    email?: string;
    available: boolean;
  };
}

class UserService {
  private baseUrl: string;

  constructor() {
    // In Docker, nginx proxies API requests, so we use the same origin
    // In development, we connect directly to the backend
    const isProduction = window.location.hostname !== 'localhost' || window.location.port === '3000';
    this.baseUrl = isProduction 
      ? window.location.origin  // Use same origin when running through nginx proxy
      : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');
  }

  /**
   * Creates a new user
   */
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: 'Network error occurred while creating user',
        errors: [{ field: 'general', message: 'Failed to connect to server' }]
      };
    }
  }

  /**
   * Gets a user by ID
   */
  async getUserById(userId: string): Promise<{ success: boolean; data?: UserResponse; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        message: 'Network error occurred while fetching user'
      };
    }
  }

  /**
   * Updates user information
   */
  async updateUser(userId: string, updateData: Partial<CreateUserRequest>): Promise<CreateUserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        message: 'Network error occurred while updating user',
        errors: [{ field: 'general', message: 'Failed to connect to server' }]
      };
    }
  }

  /**
   * Checks if a username is available
   */
  async checkUsernameAvailability(username: string): Promise<CheckAvailabilityResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/check/username/${encodeURIComponent(username)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Checks if an email is available
   */
  async checkEmailAvailability(email: string): Promise<CheckAvailabilityResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/check/email/${encodeURIComponent(email)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Gets a user by username
   */
  async getUserByUsername(username: string): Promise<{ success: boolean; data?: UserResponse; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/username/${encodeURIComponent(username)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return {
        success: false,
        message: 'Network error occurred while fetching user'
      };
    }
  }

  /**
   * Validates username format on the client side
   */
  validateUsername(username: string): UserValidationError[] {
    const errors: UserValidationError[] = [];

    if (!username) {
      errors.push({ field: 'username', message: 'Username is required' });
      return errors;
    }

    if (username.length < 2) {
      errors.push({ field: 'username', message: 'Username must be at least 2 characters long' });
    }

    if (username.length > 50) {
      errors.push({ field: 'username', message: 'Username must be less than 50 characters long' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers, underscores, and dashes' });
    }

    return errors;
  }

  /**
   * Validates email format on the client side
   */
  validateEmail(email: string): UserValidationError[] {
    const errors: UserValidationError[] = [];

    if (!email) {
      return errors; // Email is optional
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (email.length > 255) {
      errors.push({ field: 'email', message: 'Email must be less than 255 characters long' });
    }

    return errors;
  }
}

export const userService = new UserService();
export type { 
  CreateUserRequest, 
  UserResponse, 
  UserValidationError, 
  CreateUserResponse,
  CheckAvailabilityResponse 
}; 