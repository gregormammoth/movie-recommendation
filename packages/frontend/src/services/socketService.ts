import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai' | 'system';
  userId: string;
  username: string;
  createdAt: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ServerToClientEvents {
  room_joined: (data: { roomId: string }) => void;
  room_left: (data: { roomId: string }) => void;
  new_message: (data: Message) => void;
  ai_message: (data: Message) => void;
  room_created: (data: { id: string; name: string; description?: string }) => void;
  rooms_list: (data: ChatRoom[]) => void;
  messages_list: (data: Message[]) => void;
  error: (data: { message: string }) => void;
}

interface ClientToServerEvents {
  join_room: (data: { roomId: string; userId: string }) => void;
  leave_room: (data: { roomId: string }) => void;
  send_message: (data: { roomId: string; userId: string; content: string }) => void;
  create_room: (data: { userId: string; name: string; description?: string }) => void;
  get_rooms: (data: { userId: string }) => void;
  get_messages: (data: { roomId: string }) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private currentUserId: string | null = null;

  connect(userId: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    // In Docker, nginx proxies Socket.IO requests, so we connect to the same origin
    // In development, we connect directly to the backend
    const isProduction = window.location.hostname !== 'localhost' || window.location.port === '3000';
    const backendUrl = isProduction 
      ? window.location.origin  // Use same origin when running through nginx proxy
      : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');
    
    console.log('Connecting to Socket.IO at:', backendUrl, 'isProduction:', isProduction);
    
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
    });

    this.currentUserId = userId;

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (data) => {
      console.error('Socket error:', data.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
    }
  }

  joinRoom(roomId: string): void {
    console.log('Frontend joinRoom', this.socket);
    if (this.socket && this.currentUserId) {
      this.socket.emit('join_room', { roomId, userId: this.currentUserId });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('leave_room', { roomId });
    }
  }

  sendMessage(roomId: string, content: string): void {
    if (this.socket && this.currentUserId) {
      this.socket.emit('send_message', { roomId, userId: this.currentUserId, content });
    }
  }

  createRoom(name: string, description?: string): void {
    if (this.socket && this.currentUserId) {
      this.socket.emit('create_room', { userId: this.currentUserId, name, description });
    }
  }

  getRooms(): void {
    if (this.socket && this.currentUserId) {
      this.socket.emit('get_rooms', { userId: this.currentUserId });
    }
  }

  getMessages(roomId: string): void {
    if (this.socket) {
      console.log('Frontend emitting get_messages event for room:', roomId);
      this.socket.emit('get_messages', { roomId });
    }
  }

  onNewMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onAIMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('ai_message', callback);
    }
  }

  onRoomJoined(callback: (data: { roomId: string }) => void): void {
    console.log('Frontend onRoomJoined', !!this.socket);
    if (this.socket) {
      this.socket.on('room_joined', (data) => {
        console.log('Frontend received room_joined event:', data);
        callback(data);
      });
    }
  }

  onRoomCreated(callback: (data: { id: string; name: string; description?: string }) => void): void {
    if (this.socket) {
      this.socket.on('room_created', callback);
    }
  }

  onRoomsList(callback: (rooms: ChatRoom[]) => void): void {
    if (this.socket) {
      this.socket.on('rooms_list', callback);
    }
  }

  onMessagesList(callback: (messages: Message[]) => void): void {
    if (this.socket) {
      this.socket.on('messages_list', (messages) => {
        console.log('Frontend received messages_list event:', messages.length, 'messages');
        callback(messages);
      });
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export type { Message, ChatRoom }; 