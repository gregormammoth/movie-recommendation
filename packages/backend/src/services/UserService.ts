import { Repository } from 'typeorm';
import { AppDataSource } from '../index';
import { User } from '../entities/User';

export interface CreateUserRequest {
  username: string;
  email?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserValidationError {
  field: string;
  message: string;
}

export class UserService {
  private userRepository?: Repository<User>;

  private getUserRepository(): Repository<User> {
    if (!this.userRepository) {
      this.userRepository = AppDataSource.getRepository(User);
    }
    return this.userRepository;
  }

  /**
   * Validates user input data
   */
  private validateUserData(data: CreateUserRequest): UserValidationError[] {
    const errors: UserValidationError[] = [];

    // Username validation
    if (!data.username) {
      errors.push({ field: 'username', message: 'Username is required' });
    } else {
      if (data.username.length < 2) {
        errors.push({ field: 'username', message: 'Username must be at least 2 characters long' });
      }
      if (data.username.length > 50) {
        errors.push({ field: 'username', message: 'Username must be less than 50 characters long' });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
        errors.push({ field: 'username', message: 'Username can only contain letters, numbers, underscores, and dashes' });
      }
    }

    // Email validation (optional)
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
      if (data.email.length > 255) {
        errors.push({ field: 'email', message: 'Email must be less than 255 characters long' });
      }
    }

    return errors;
  }

  /**
   * Sanitizes user input data
   */
  private sanitizeUserData(data: CreateUserRequest): CreateUserRequest {
    return {
      username: data.username?.trim().toLowerCase(),
      email: data.email?.trim().toLowerCase(),
    };
  }

  /**
   * Converts User entity to UserResponse
   */
  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Creates a new user with validation and error handling
   */
  async createUser(userData: CreateUserRequest): Promise<{ success: boolean; user?: UserResponse; errors?: UserValidationError[] }> {
    try {
      // Sanitize input data
      const sanitizedData = this.sanitizeUserData(userData);

      // Validate input data
      const validationErrors = this.validateUserData(sanitizedData);
      if (validationErrors.length > 0) {
        return { success: false, errors: validationErrors };
      }

      const userRepo = this.getUserRepository();

      // Check if username already exists
      const existingUserByUsername = await userRepo.findOne({ 
        where: { username: sanitizedData.username } 
      });
      if (existingUserByUsername) {
        return { 
          success: false, 
          errors: [{ field: 'username', message: 'Username already exists' }] 
        };
      }

      // Check if email already exists (if provided)
      if (sanitizedData.email) {
        const existingUserByEmail = await userRepo.findOne({ 
          where: { email: sanitizedData.email } 
        });
        if (existingUserByEmail) {
          return { 
            success: false, 
            errors: [{ field: 'email', message: 'Email already exists' }] 
          };
        }
      }

      // Create new user
      const user = userRepo.create({
        username: sanitizedData.username,
        email: sanitizedData.email,
      });

      const savedUser = await userRepo.save(user);
      console.log(`User created successfully: ${savedUser.username} (${savedUser.id})`);

      return { 
        success: true, 
        user: this.toUserResponse(savedUser) 
      };

    } catch (error) {
      console.error('Error creating user:', error);
      return { 
        success: false, 
        errors: [{ field: 'general', message: 'Internal server error occurred while creating user' }] 
      };
    }
  }

  /**
   * Gets a user by ID
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    try {
      const userRepo = this.getUserRepository();
      const user = await userRepo.findOne({ where: { id: userId } });
      return user ? this.toUserResponse(user) : null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Gets a user by username
   */
  async getUserByUsername(username: string): Promise<UserResponse | null> {
    try {
      const userRepo = this.getUserRepository();
      const user = await userRepo.findOne({ where: { username: username.toLowerCase() } });
      return user ? this.toUserResponse(user) : null;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  /**
   * Gets a user by email
   */
  async getUserByEmail(email: string): Promise<UserResponse | null> {
    try {
      const userRepo = this.getUserRepository();
      const user = await userRepo.findOne({ where: { email: email.toLowerCase() } });
      return user ? this.toUserResponse(user) : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  /**
   * Updates user information
   */
  async updateUser(userId: string, updateData: Partial<CreateUserRequest>): Promise<{ success: boolean; user?: UserResponse; errors?: UserValidationError[] }> {
    try {
      const userRepo = this.getUserRepository();
      const existingUser = await userRepo.findOne({ where: { id: userId } });
      
      if (!existingUser) {
        return { 
          success: false, 
          errors: [{ field: 'userId', message: 'User not found' }] 
        };
      }

      // Sanitize update data
      const sanitizedData = this.sanitizeUserData(updateData as CreateUserRequest);

      // Validate update data
      const validationErrors = this.validateUserData({
        username: sanitizedData.username || existingUser.username,
        email: sanitizedData.email || existingUser.email,
      });
      if (validationErrors.length > 0) {
        return { success: false, errors: validationErrors };
      }

      // Check for conflicts with other users
      if (sanitizedData.username && sanitizedData.username !== existingUser.username) {
        const conflictUser = await userRepo.findOne({ where: { username: sanitizedData.username } });
        if (conflictUser) {
          return { 
            success: false, 
            errors: [{ field: 'username', message: 'Username already exists' }] 
          };
        }
        existingUser.username = sanitizedData.username;
      }

      if (sanitizedData.email && sanitizedData.email !== existingUser.email) {
        const conflictUser = await userRepo.findOne({ where: { email: sanitizedData.email } });
        if (conflictUser) {
          return { 
            success: false, 
            errors: [{ field: 'email', message: 'Email already exists' }] 
          };
        }
        existingUser.email = sanitizedData.email;
      }

      const updatedUser = await userRepo.save(existingUser);
      console.log(`User updated successfully: ${updatedUser.username} (${updatedUser.id})`);

      return { 
        success: true, 
        user: this.toUserResponse(updatedUser) 
      };

    } catch (error) {
      console.error('Error updating user:', error);
      return { 
        success: false, 
        errors: [{ field: 'general', message: 'Internal server error occurred while updating user' }] 
      };
    }
  }

  /**
   * Deactivates a user (soft delete)
   */
  async deactivateUser(userId: string): Promise<{ success: boolean; errors?: UserValidationError[] }> {
    try {
      const userRepo = this.getUserRepository();
      const user = await userRepo.findOne({ where: { id: userId } });
      
      if (!user) {
        return { 
          success: false, 
          errors: [{ field: 'userId', message: 'User not found' }] 
        };
      }

      user.isActive = false;
      await userRepo.save(user);
      
      console.log(`User deactivated: ${user.username} (${user.id})`);
      return { success: true };

    } catch (error) {
      console.error('Error deactivating user:', error);
      return { 
        success: false, 
        errors: [{ field: 'general', message: 'Internal server error occurred while deactivating user' }] 
      };
    }
  }

  /**
   * Reactivates a user
   */
  async reactivateUser(userId: string): Promise<{ success: boolean; errors?: UserValidationError[] }> {
    try {
      const userRepo = this.getUserRepository();
      const user = await userRepo.findOne({ where: { id: userId } });
      
      if (!user) {
        return { 
          success: false, 
          errors: [{ field: 'userId', message: 'User not found' }] 
        };
      }

      user.isActive = true;
      await userRepo.save(user);
      
      console.log(`User reactivated: ${user.username} (${user.id})`);
      return { success: true };

    } catch (error) {
      console.error('Error reactivating user:', error);
      return { 
        success: false, 
        errors: [{ field: 'general', message: 'Internal server error occurred while reactivating user' }] 
      };
    }
  }

  /**
   * Gets all users with pagination
   */
  async getUsers(page: number = 1, limit: number = 10, includeInactive: boolean = false): Promise<{
    users: UserResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const userRepo = this.getUserRepository();
      const skip = (page - 1) * limit;

      const whereCondition = includeInactive ? {} : { isActive: true };

      const [users, total] = await userRepo.findAndCount({
        where: whereCondition,
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      const totalPages = Math.ceil(total / limit);

      return {
        users: users.map(user => this.toUserResponse(user)),
        total,
        page,
        limit,
        totalPages,
      };

    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        users: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  /**
   * Checks if a username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const userRepo = this.getUserRepository();
      const existingUser = await userRepo.findOne({ 
        where: { username: username.toLowerCase() } 
      });
      return !existingUser;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  /**
   * Checks if an email is available
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const userRepo = this.getUserRepository();
      const existingUser = await userRepo.findOne({ 
        where: { email: email.toLowerCase() } 
      });
      return !existingUser;
    } catch (error) {
      console.error('Error checking email availability:', error);
      return false;
    }
  }
} 