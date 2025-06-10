import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  CircularProgress,
  Alert,
  Chip 
} from '@mui/material';
import { SmartToy, Wifi, WifiOff } from '@mui/icons-material';
import { socketService } from '../services/socketService';
import type { Message, ChatRoom as ChatRoomType } from '../services/socketService';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatRoomProps {
  room: ChatRoomType;
  currentUserId: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAITyping, setIsAITyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Connect to socket
    const socket = socketService.connect(currentUserId);
    
    // Set up event listeners
    socketService.onRoomJoined(() => {
      setIsConnected(true);
      setIsLoading(false);
      socketService.getMessages(room.id);
    });

    socketService.onMessagesList((messagesList) => {
      setMessages(messagesList);
      setIsLoading(false);
    });

    socketService.onNewMessage((message) => {
      setMessages(prev => [...prev, message]);
      if (message.type === 'user' && message.userId !== currentUserId) {
        // Show AI typing indicator when receiving a user message from others
        setIsAITyping(true);
      }
    });

    socketService.onAIMessage((message) => {
      setIsAITyping(false);
      setMessages(prev => [...prev, message]);
    });

    socket.on('error', (data) => {
      setError(data.message);
      setIsLoading(false);
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socketService.joinRoom(room.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Join the room
    if (socket.connected) {
      socketService.joinRoom(room.id);
    }

    return () => {
      socketService.leaveRoom(room.id);
      socketService.removeAllListeners();
    };
  }, [room.id, currentUserId]);

  const handleSendMessage = (content: string) => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    socketService.sendMessage(room.id, content);
    setIsAITyping(true); // Show AI typing indicator
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="h2">
              {room.name}
            </Typography>
            {room.description && (
              <Typography variant="body2" color="text.secondary">
                {room.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={isConnected ? <Wifi /> : <WifiOff />}
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Box>
      </Paper>
      
      <Divider />

      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      {/* Messages Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          backgroundColor: '#fafafa',
        }}
      >
        {messages.length === 0 ? (
          <Box 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <SmartToy sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary" textAlign="center">
              Welcome to {room.name}!
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Start a conversation and get AI-powered movie recommendations.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
              />
            ))}
            
            {/* AI Typing Indicator */}
            {isAITyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToy sx={{ color: '#2196f3' }} />
                  <Typography variant="body2" color="text.secondary">
                    AI is typing...
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#2196f3',
                        animation: 'bounce 1.4s infinite both',
                        '@keyframes bounce': {
                          '0%, 80%, 100%': { transform: 'scale(0)' },
                          '40%': { transform: 'scale(1)' },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#2196f3',
                        animation: 'bounce 1.4s infinite both 0.2s',
                        '@keyframes bounce': {
                          '0%, 80%, 100%': { transform: 'scale(0)' },
                          '40%': { transform: 'scale(1)' },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#2196f3',
                        animation: 'bounce 1.4s infinite both 0.4s',
                        '@keyframes bounce': {
                          '0%, 80%, 100%': { transform: 'scale(0)' },
                          '40%': { transform: 'scale(1)' },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!isConnected}
        placeholder={isConnected ? "Ask for movie recommendations..." : "Connecting..."}
      />
    </Box>
  );
};

export default ChatRoom; 