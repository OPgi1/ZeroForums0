/**
 * ZeroForums0 - TypeScript Type Definitions
 * 
 * Security-focused type system for production-grade security
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

// Basic Types
export type Username = string;
export type MessageID = string;
export type ConversationID = string;
export type UserID = string;
export type SessionID = string;
export type Token = string;

// Security Types
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: 'AES-GCM';
}

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface UserKeys {
  rsaKeys: RSAKeyPair;
  sharedSecrets: Map<ConversationID, string>;
}

export interface UserProfile {
  username: Username;
  profileImage?: string;
  publicKey: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Authentication Types
export interface LoginAttempt {
  username: Username;
  timestamp: Date;
  ip: string;
  fingerprint: string;
  success: boolean;
}

export interface Session {
  sessionId: SessionID;
  username: Username;
  createdAt: Date;
  expiresAt: Date;
  fingerprint: string;
  ip: string;
}

export interface CAPTCHA {
  token: string;
  challenge: string;
  solution: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

// Chat Types
export interface Message {
  id: MessageID;
  conversationId: ConversationID;
  senderId: UserID;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'file' | 'voice' | 'gps';
  content: EncryptedData;
  nonce: string;
  salt: string;
}

export interface Conversation {
  id: ConversationID;
  name: string;
  type: 'private' | 'group';
  participants: UserID[];
  createdAt: Date;
  lastMessageAt: Date;
  sharedSecret: string;
  roles: Map<UserID, 'admin' | 'user'>;
}

export interface InviteCode {
  code: string;
  conversationId: ConversationID;
  createdAt: Date;
  expiresAt: Date;
  createdBy: UserID;
  uses: number;
  maxUses: number;
}

// Forum Types
export interface ForumPost {
  id: string;
  title: string;
  content: EncryptedData;
  authorId: UserID;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  attachments: EncryptedData[];
  replies: ForumReply[];
}

export interface ForumReply {
  id: string;
  postId: string;
  content: EncryptedData;
  authorId: UserID;
  createdAt: Date;
  attachments: EncryptedData[];
}

// Request/Response Types
export interface APIRequest {
  method: string;
  path: string;
  body?: any;
  headers: Record<string, string>;
  timestamp: number;
  nonce: string;
  signature: string;
}

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// Security Configuration
export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  captchaComplexity: number;
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
}

// Constants
export const SECURITY_CONSTANTS = {
  MAX_USERNAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  CAPTCHA_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
  MAX_LOGIN_ATTEMPTS: 3,
  LOCKOUT_BASE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Error Types
export class SecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}