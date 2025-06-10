import React from 'react';
import { Box, Paper, Typography, Avatar, Chip } from '@mui/material';
import { SmartToy, Person } from '@mui/icons-material';
import type { Message } from '../services/socketService';

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUserId }) => {
  const isOwnMessage = message.userId === currentUserId;
  const isAI = message.type === 'ai';
  const isSystem = message.type === 'system';

  const getBackgroundColor = () => {
    if (isSystem) return '#f5f5f5';
    if (isAI) return '#e3f2fd';
    if (isOwnMessage) return '#1976d2';
    return '#f5f5f5';
  };

  const getTextColor = () => {
    if (isOwnMessage && !isAI) return 'white';
    return 'black';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
        <Chip 
          label={message.content} 
          size="small" 
          variant="outlined"
          sx={{ backgroundColor: '#f5f5f5' }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage && !isAI ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      {!isOwnMessage && (
        <Avatar
          sx={{
            mr: 1,
            backgroundColor: isAI ? '#2196f3' : '#757575',
            width: 32,
            height: 32,
          }}
        >
          {isAI ? <SmartToy sx={{ fontSize: 18 }} /> : <Person sx={{ fontSize: 18 }} />}
        </Avatar>
      )}
      
      <Box sx={{ maxWidth: '70%' }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: getBackgroundColor(),
            color: getTextColor(),
            borderRadius: isOwnMessage && !isAI ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          }}
        >
          {!isOwnMessage && (
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
              {message.username}
              {isAI && (
                <Chip 
                  label="AI" 
                  size="small" 
                  sx={{ ml: 1, fontSize: '10px', height: '16px' }}
                  color="primary"
                />
              )}
            </Typography>
          )}
          
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 0.5, 
              opacity: 0.7,
              textAlign: isOwnMessage && !isAI ? 'right' : 'left'
            }}
          >
            {formatTime(message.createdAt)}
          </Typography>
        </Paper>
      </Box>
      
      {isOwnMessage && !isAI && (
        <Avatar
          sx={{
            ml: 1,
            backgroundColor: '#1976d2',
            width: 32,
            height: 32,
          }}
        >
          <Person sx={{ fontSize: 18 }} />
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble; 