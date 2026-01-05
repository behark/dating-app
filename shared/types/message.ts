/**
 * Shared type definitions for Message and Chat
 * These types match the backend Message model and should be kept in sync
 */

/**
 * Voice message metadata
 */
export interface VoiceMessage {
  url: string;
  duration?: number;
  waveform?: number[];
  transcript?: string;
  isTranscribed?: boolean;
  language?: string;
}

/**
 * Video call metadata
 */
export interface VideoCall {
  callId?: string;
  status?: 'initiated' | 'accepted' | 'rejected' | 'ended' | 'missed';
  startedAt?: Date | string;
  endedAt?: Date | string;
  duration?: number;
}

/**
 * Message type
 */
export type MessageType = 'text' | 'image' | 'gif' | 'sticker' | 'voice' | 'video_call' | 'system';

/**
 * Message status
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Main Message interface
 */
export interface IMessage {
  _id?: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isEncrypted?: boolean;
  read?: boolean;
  readAt?: Date | string;
  type?: MessageType;
  mediaUrl?: string;
  createdAt?: Date | string;
  metadata?: Record<string, unknown>;

  // Media message fields
  voiceMessage?: VoiceMessage;
  videoCall?: VideoCall;

  // Frontend-only fields
  status?: MessageStatus;
  deliveredAt?: Date | string;
  readBy?: string[];
  tempId?: string; // Temporary ID for optimistic updates
}

/**
 * Conversation interface
 * Represents a chat conversation with another user
 */
export interface IConversation {
  _id?: string;
  matchId: string;
  otherUser: {
    _id: string;
    name: string;
    photos: Array<{
      url: string;
      isMain?: boolean;
    }>;
    lastActive?: Date | string;
    isOnline?: boolean;
  };
  lastMessage?: IMessage;
  unreadCount: number;
  conversationStarted?: boolean;
  lastActivity?: Date | string;
}

/**
 * Typing indicator data
 */
export interface TypingIndicator {
  userId: string;
  matchId: string;
  isTyping: boolean;
  timestamp: Date | string;
}

/**
 * Read receipt data
 */
export interface ReadReceipt {
  messageId: string;
  matchId: string;
  readBy: string;
  readAt: Date | string;
}

/**
 * Chat room data for Socket.io
 */
export interface ChatRoom {
  matchId: string;
  participants: string[];
  createdAt?: Date | string;
}

/**
 * Message send payload
 */
export interface SendMessagePayload {
  matchId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  type?: MessageType;
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
  voiceMessage?: VoiceMessage;
  videoCall?: VideoCall;
  tempId?: string;
}

/**
 * Message update payload
 */
export interface MessageUpdatePayload {
  messageId: string;
  matchId: string;
  updates: Partial<IMessage>;
}

export type Message = IMessage;
export type Conversation = IConversation;
