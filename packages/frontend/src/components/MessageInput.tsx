import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Box, TextField, IconButton, Paper } from '@mui/material';
import { Send } from '@mui/icons-material';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message..." 
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              backgroundColor: 'white',
            },
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          color="primary"
          sx={{
            backgroundColor: message.trim() ? '#1976d2' : 'transparent',
            color: message.trim() ? 'white' : 'inherit',
            '&:hover': {
              backgroundColor: message.trim() ? '#1565c0' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default MessageInput; 