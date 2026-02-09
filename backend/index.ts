/**
 * ZeroForums0 - Cloudflare Workers Backend
 * 
 * Ultra-Secure Encrypted Forum & Chat Platform
 * Production-grade security with WebCrypto API
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

import { handleRequest } from './handlers/main';
import { ChatRoom } from './handlers/chat';
import { ForumRoom } from './handlers/forum';

export interface Env {
  FORUMS_KV: KVNamespace;
  CHAT_ROOMS: DurableObjectNamespace;
  FORUM_ROOMS: DurableObjectNamespace;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return handleRequest(request, env, ctx);
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Daily cleanup task
    await cleanupExpiredData(env);
  }
};

// Durable Objects for real-time features
export { ChatRoom };
export { ForumRoom };

/**
 * Cleanup expired data from KV storage
 */
async function cleanupExpiredData(env: Env): Promise<void> {
  try {
    // Implementation for cleaning up expired sessions, tokens, etc.
    // This runs daily via cron trigger
    console.log('Starting daily cleanup...');
    
    // TODO: Implement cleanup logic for:
    // - Expired CAPTCHA tokens
    // - Old session data
    // - Expired invite codes
    // - Temporary files
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}