import React, { useState, useEffect } from 'react';
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Drawer,
  IconButton,
  Chip,
  Fab,
  CircularProgress,
  Alert,
  AlertTitle,
  InputAdornment
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Add as AddIcon, 
  SmartToy,
  Movie 
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { socketService } from './services/socketService';
import type { ChatRoom as ChatRoomType } from './services/socketService';
import { userService, type UserValidationError } from './services/userService';
import { useUserValidation } from './hooks/useUserValidation';
import ChatRoom from './components/ChatRoom';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#2196f3',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

const DRAWER_WIDTH = 300;

function App() {
  const [currentUserId] = useState(() => localStorage.getItem('userId') || uuidv4());
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [rooms, setRooms] = useState<ChatRoomType[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(!username);
  
  // User creation states
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userCreationErrors, setUserCreationErrors] = useState<UserValidationError[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Use the validation hook for real-time username checking
  const { 
    errors: validationErrors, 
    isChecking: isCheckingUsername, 
    isAvailable, 
    validateUsername, 
    clearErrors: clearValidationErrors 
  } = useUserValidation();

  // Save user data to localStorage
  useEffect(() => {
    localStorage.setItem('userId', currentUserId);
    if (username) {
      localStorage.setItem('username', username);
    }
  }, [currentUserId, username]);

  // Initialize socket connection and load rooms
  useEffect(() => {
    if (!username) return;

    const socket = socketService.connect(currentUserId);

    socketService.onRoomsList((roomsList) => {
      setRooms(roomsList);
      // Select first room if none selected
      if (roomsList.length > 0 && !selectedRoom) {
        setSelectedRoom(roomsList[0]);
      }
    });

    socketService.onRoomCreated((roomData) => {
      const newRoom: ChatRoomType = {
        id: roomData.id,
        name: roomData.name,
        description: roomData.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
      };
      setRooms(prev => [newRoom, ...prev]);
      setSelectedRoom(newRoom);
      setIsCreateRoomOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
    });

    // Load existing rooms
    socketService.getRooms();

    return () => {
      socketService.disconnect();
    };
  }, [username, currentUserId, selectedRoom]);

  const handleSetUsername = async () => {
    if (!username.trim()) return;

    // Check if there are validation errors or username is not available
    if (validationErrors.length > 0 || isAvailable === false) {
      setUserCreationErrors(validationErrors);
      return;
    }

    // Clear previous errors
    setUserCreationErrors([]);
    setIsCreatingUser(true);

    try {
      // Try to create the user
      const result = await userService.createUser({
        username: username.trim(),
      });

      if (result.success && result.data) {
        // User created successfully
        console.log('User created successfully:', result.data);
        setShowSuccessMessage(true);
        
        // Store the backend user ID (keeping the existing currentUserId for socket compatibility)
        localStorage.setItem('userId', result.data.id);
        localStorage.setItem('username', result.data.username);
        
        // Close dialog after a brief success message
        setTimeout(() => {
          setIsUsernameDialogOpen(false);
          setShowSuccessMessage(false);
        }, 1500);
        
      } else {
        // Handle validation errors from the backend
        if (result.errors) {
          setUserCreationErrors(result.errors);
        } else {
          setUserCreationErrors([{
            field: 'general',
            message: result.message || 'Failed to create user'
          }]);
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setUserCreationErrors([{
        field: 'general',
        message: 'Network error. Please check your connection and try again.'
      }]);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      socketService.createRoom(newRoomName.trim(), newRoomDescription.trim() || undefined);
    }
  };

  const handleRoomSelect = (room: ChatRoomType) => {
    setSelectedRoom(room);
    setIsDrawerOpen(false);
  };

  if (isUsernameDialogOpen) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Dialog open={true} maxWidth="sm" fullWidth>
          <DialogTitle>Welcome to Vibe Coding Chat</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enter your username to start chatting with our AI movie recommendation assistant.
            </Typography>
            
            {/* Success Message */}
            {showSuccessMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <AlertTitle>Success!</AlertTitle>
                User created successfully. Starting your chat experience...
              </Alert>
            )}
            
            {/* Error Messages */}
            {(userCreationErrors.length > 0 || validationErrors.length > 0) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Please fix the following errors:</AlertTitle>
                {[...userCreationErrors, ...validationErrors].map((error, index) => (
                  <Typography key={index} variant="body2">
                    • {error.message}
                  </Typography>
                ))}
              </Alert>
            )}
            
            {/* Username Available Message */}
            {isAvailable === true && username.trim() && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Username "{username.trim()}" is available!
              </Alert>
            )}
            
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              variant="outlined"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                // Clear previous errors and validate in real-time
                setUserCreationErrors([]);
                clearValidationErrors();
                if (e.target.value.trim()) {
                  validateUsername(e.target.value.trim());
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && !isCreatingUser && !isCheckingUsername && handleSetUsername()}
              disabled={isCreatingUser || showSuccessMessage}
              error={
                userCreationErrors.some(err => err.field === 'username') ||
                validationErrors.some(err => err.field === 'username') ||
                isAvailable === false
              }
              helperText={
                userCreationErrors.find(err => err.field === 'username')?.message ||
                validationErrors.find(err => err.field === 'username')?.message ||
                (isCheckingUsername ? "Checking availability..." : 
                 isAvailable === true ? "✓ Username is available" :
                 isAvailable === false ? "Username is already taken" :
                 "2-50 characters, letters, numbers, underscores, and dashes only")
              }
              InputProps={{
                endAdornment: isCheckingUsername ? <CircularProgress size={20} /> : null
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleSetUsername} 
              variant="contained"
              disabled={
                !username.trim() || 
                isCreatingUser || 
                showSuccessMessage || 
                isCheckingUsername ||
                validationErrors.length > 0 ||
                isAvailable === false
              }
              startIcon={isCreatingUser ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isCreatingUser ? 'Creating User...' : 
               showSuccessMessage ? 'Success!' : 
               isCheckingUsername ? 'Checking...' :
               'Start Chatting'}
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* App Bar */}
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <SmartToy sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Vibe Coding - AI Movie Chat
            </Typography>
            <Chip 
              label={`Hi, ${username}!`} 
              color="secondary" 
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
          </Toolbar>
        </AppBar>

        {/* Sidebar Drawer */}
        <Drawer
          variant="temporary"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        />
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: DRAWER_WIDTH,
            '& .MuiDrawer-paper': { 
              width: DRAWER_WIDTH, 
              position: 'relative',
              height: '100vh',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Chat Rooms
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateRoomOpen(true)}
              sx={{ mb: 2 }}
            >
              New Room
            </Button>
          </Box>
          <List>
            {rooms.map((room) => (
              <ListItem key={room.id} disablePadding>
                <ListItemButton
                  selected={selectedRoom?.id === room.id}
                  onClick={() => handleRoomSelect(room)}
                >
                  <ListItemText
                    primary={room.name}
                    secondary={room.description}
                  />
                  {room.messageCount > 0 && (
                    <Chip 
                      label={room.messageCount} 
                      size="small" 
                      color="primary"
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
            {rooms.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No rooms yet"
                  secondary="Create your first chat room!"
                />
              </ListItem>
            )}
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Toolbar />
          {selectedRoom ? (
            <ChatRoom room={selectedRoom} currentUserId={currentUserId} />
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                p: 3,
              }}
            >
              <Movie sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h4" color="text.secondary" textAlign="center">
                Welcome to AI Movie Chat!
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Create a chat room or select an existing one to start getting AI-powered movie recommendations.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setIsCreateRoomOpen(true)}
              >
                Create Your First Room
              </Button>
            </Box>
          )}
        </Box>

        {/* Floating Action Button for mobile */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', sm: 'none' },
          }}
          onClick={() => setIsCreateRoomOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Create Room Dialog */}
      <Dialog 
        open={isCreateRoomOpen} 
        onClose={() => setIsCreateRoomOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Chat Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Room Name"
            fullWidth
            variant="outlined"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newRoomDescription}
            onChange={(e) => setNewRoomDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateRoomOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRoom}
            variant="contained"
            disabled={!newRoomName.trim()}
          >
            Create Room
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
