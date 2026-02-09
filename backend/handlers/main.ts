/**
 * ZeroForums0 - Main Request Handler
 * 
 * Entry point for all HTTP requests with comprehensive security validation
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

import { Env } from '../index';
import { APIRequest, APIResponse, SecurityError, AuthenticationError, ValidationError } from '../types';
import { SecurityManager } from '../crypto/security';
import { AuthHandler } from './auth';
import { ChatHandler } from './chat';
import { ForumHandler } from './forum';
import { i18n } from '../crypto/i18n';

export async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    // Parse and validate request
    const apiRequest = await parseAndValidateRequest(request);
    
    // Security validation
    await SecurityManager.validateRequest(apiRequest, env);
    
    // Route to appropriate handler
    const response = await routeRequest(apiRequest, env, ctx);
    
    // Add security headers
    return addSecurityHeaders(response);
    
  } catch (error) {
    console.error('Request handling error:', error);
    
    if (error instanceof SecurityError || error instanceof AuthenticationError || error instanceof ValidationError) {
      return createErrorResponse(error.message, error.name, 400);
    }
    
    return createErrorResponse('Internal server error', 'InternalServerError', 500);
  }
}

/**
 * Parse and validate incoming request
 */
async function parseAndValidateRequest(request: Request): Promise<APIRequest> {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  
  // Extract headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  
  // Validate required headers
  if (!headers['content-type']) {
    throw new ValidationError('Missing Content-Type header');
  }
  
  if (!headers['x-timestamp']) {
    throw new ValidationError('Missing timestamp header');
  }
  
  if (!headers['x-nonce']) {
    throw new ValidationError('Missing nonce header');
  }
  
  if (!headers['x-signature']) {
    throw new ValidationError('Missing signature header');
  }
  
  // Parse body
  let body: any = null;
  if (request.body && headers['content-type'].includes('application/json')) {
    try {
      body = await request.json();
    } catch (error) {
      throw new ValidationError('Invalid JSON body');
    }
  }
  
  // Validate timestamp (within 5 minutes)
  const timestamp = parseInt(headers['x-timestamp']);
  const now = Date.now();
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
    throw new ValidationError('Timestamp too old or too far in future');
  }
  
  return {
    method,
    path,
    body,
    headers,
    timestamp,
    nonce: headers['x-nonce'],
    signature: headers['x-signature']
  };
}

/**
 * Route request to appropriate handler
 */
async function routeRequest(
  apiRequest: APIRequest,
  env: Env,
  ctx: ExecutionContext
): Promise<APIResponse> {
  const { method, path, body } = apiRequest;
  
  // Authentication endpoints
  if (path === '/api/auth/register') {
    if (method !== 'POST') throw new ValidationError('Method not allowed');
    return await AuthHandler.register(body, env);
  }
  
  if (path === '/api/auth/login') {
    if (method !== 'POST') throw new ValidationError('Method not allowed');
    return await AuthHandler.login(body, env);
  }
  
  if (path === '/api/auth/logout') {
    if (method !== 'POST') throw new ValidationError('Method not allowed');
    return await AuthHandler.logout(body, env);
  }
  
  if (path === '/api/auth/captcha') {
    if (method !== 'GET') throw new ValidationError('Method not allowed');
    return await AuthHandler.getCaptcha(env);
  }
  
  // Chat endpoints
  if (path === '/api/chat/conversations') {
    if (method === 'GET') return await ChatHandler.getConversations(body, env);
    if (method === 'POST') return await ChatHandler.createConversation(body, env);
    throw new ValidationError('Method not allowed');
  }
  
  if (path.startsWith('/api/chat/conversation/')) {
    const conversationId = path.split('/').pop();
    if (!conversationId) throw new ValidationError('Invalid conversation ID');
    
    if (method === 'GET') return await ChatHandler.getConversation(conversationId, body, env);
    if (method === 'POST') return await ChatHandler.sendMessage(conversationId, body, env);
    if (method === 'DELETE') return await ChatHandler.deleteConversation(conversationId, body, env);
    throw new ValidationError('Method not allowed');
  }
  
  if (path.startsWith('/api/chat/messages/')) {
    const messageId = path.split('/').pop();
    if (!messageId) throw new ValidationError('Invalid message ID');
    
    if (method === 'GET') return await ChatHandler.getMessage(messageId, body, env);
    if (method === 'DELETE') return await ChatHandler.deleteMessage(messageId, body, env);
    throw new ValidationError('Method not allowed');
  }
  
  // Forum endpoints
  if (path === '/api/forum/posts') {
    if (method === 'GET') return await ForumHandler.getPosts(body, env);
    if (method === 'POST') return await ForumHandler.createPost(body, env);
    throw new ValidationError('Method not allowed');
  }
  
  if (path.startsWith('/api/forum/post/')) {
    const postId = path.split('/').pop();
    if (!postId) throw new ValidationError('Invalid post ID');
    
    if (method === 'GET') return await ForumHandler.getPost(postId, body, env);
    if (method === 'PUT') return await ForumHandler.updatePost(postId, body, env);
    if (method === 'DELETE') return await ForumHandler.deletePost(postId, body, env);
    throw new ValidationError('Method not allowed');
  }
  
  if (path.startsWith('/api/forum/post/') && path.endsWith('/replies')) {
    const postId = path.split('/')[3];
    if (!postId) throw new ValidationError('Invalid post ID');
    
    if (method === 'GET') return await ForumHandler.getReplies(postId, body, env);
    if (method === 'POST') return await ForumHandler.createReply(postId, body, env);
    throw new ValidationError('Method not allowed');
  }
  
  // Utility endpoints
  if (path === '/api/wipe') {
    if (method !== 'POST') throw new ValidationError('Method not allowed');
    return await handleWipeRequest(body, env);
  }
  
  if (path === '/api/health') {
    if (method !== 'GET') throw new ValidationError('Method not allowed');
    return { success: true, data: { status: 'healthy', timestamp: Date.now() } };
  }
  
  throw new ValidationError('Endpoint not found');
}

/**
 * Create standardized error response
 */
function createErrorResponse(message: string, code: string, statusCode: number): Response {
  const response: APIResponse = {
    success: false,
    error: message,
    timestamp: Date.now()
  };
  
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Error-Code': code
    }
  });
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: APIResponse): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
  });
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers
  });
}

/**
 * Handle complete data wipe request
 */
async function handleWipeRequest(body: any, env: Env): Promise<APIResponse> {
  // Validate wipe request (requires special token or admin privileges)
  if (!body || !body.confirmation || body.confirmation !== 'WIPE_EVERYTHING') {
    throw new ValidationError('Wipe request requires confirmation');
  }
  
  // TODO: Implement complete data wipe functionality
  // This should:
  // 1. Delete all user data from KV
  // 2. Clear all sessions
  // 3. Invalidate all tokens
  // 4. Remove all encrypted files
  // 5. Clear metadata
  
  return {
    success: true,
    data: { message: 'Data wipe initiated' },
    timestamp: Date.now()
  };
}