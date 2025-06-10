import { Router } from 'express';
import { UserService, CreateUserRequest } from '../services/UserService';

const router = Router();

// Helper function to get UserService instance
const getUserService = () => new UserService();

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const { id, username, email }: CreateUserRequest = req.body;
    
    const userService = getUserService();
    const result = await userService.createUser({ id, username, email });
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result.user
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'User creation failed',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in POST /users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ field: 'general', message: 'Failed to create user' }]
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const userService = getUserService();
    const user = await userService.getUserById(id);
    
    if (user) {
      res.json({
        success: true,
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error in GET /users/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/users/:id
 * Update user information
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: Partial<CreateUserRequest> = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const userService = getUserService();
    const result = await userService.updateUser(id, updateData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User updated successfully',
        data: result.user
      });
    } else {
      const statusCode = result.errors?.some(e => e.field === 'userId') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'User update failed',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in PUT /users/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ field: 'general', message: 'Failed to update user' }]
    });
  }
});

/**
 * DELETE /api/users/:id
 * Deactivate user (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const userService = getUserService();
    const result = await userService.deactivateUser(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } else {
      const statusCode = result.errors?.some(e => e.field === 'userId') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'User deactivation failed',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in DELETE /users/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ field: 'general', message: 'Failed to deactivate user' }]
    });
  }
});

/**
 * POST /api/users/:id/reactivate
 * Reactivate user
 */
router.post('/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const userService = getUserService();
    const result = await userService.reactivateUser(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User reactivated successfully'
      });
    } else {
      const statusCode = result.errors?.some(e => e.field === 'userId') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: 'User reactivation failed',
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in POST /users/:id/reactivate:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errors: [{ field: 'general', message: 'Failed to reactivate user' }]
    });
  }
});

/**
 * GET /api/users
 * Get all users with pagination
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page
    const includeInactive = req.query.includeInactive === 'true';
    
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and limit must be positive numbers'
      });
    }
    
    const userService = getUserService();
    const result = await userService.getUsers(page, limit, includeInactive);
    
    res.json({
      success: true,
      data: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      }
    });
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/users/username/:username
 * Get user by username
 */
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    const userService = getUserService();
    const user = await userService.getUserByUsername(username);
    
    if (user) {
      res.json({
        success: true,
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error in GET /users/username/:username:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/users/email/:email
 * Get user by email
 */
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const userService = getUserService();
    const user = await userService.getUserByEmail(email);
    
    if (user) {
      res.json({
        success: true,
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error in GET /users/email/:email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/users/check/username/:username
 * Check if username is available
 */
router.get('/check/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    const userService = getUserService();
    const isAvailable = await userService.isUsernameAvailable(username);
    
    res.json({
      success: true,
      data: {
        username,
        available: isAvailable
      }
    });
  } catch (error) {
    console.error('Error in GET /users/check/username/:username:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/users/check/email/:email
 * Check if email is available
 */
router.get('/check/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const userService = getUserService();
    const isAvailable = await userService.isEmailAvailable(email);
    
    res.json({
      success: true,
      data: {
        email,
        available: isAvailable
      }
    });
  } catch (error) {
    console.error('Error in GET /users/check/email/:email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 