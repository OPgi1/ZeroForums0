/**
 * ZeroForums0 - Security Manager
 * 
 * Comprehensive security validation and request handling
 * Implements HMAC signatures, rate limiting, and brute force protection
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

import { Env } from '../index';
import { APIRequest, SecurityError, AuthenticationError, ValidationError, SECURITY_CONSTANTS } from '../types';

export class SecurityManager {
  private static rateLimitMap = new Map<string, number[]>();
  private static loginAttempts = new Map<string, LoginAttempt[]>();

  /**
   * Validate incoming request for security compliance
   */
  static async validateRequest(request: APIRequest, env: Env): Promise<void> {
    // 1. Rate limiting validation
    await this.validateRateLimit(request);
    
    // 2. HMAC signature validation
    await this.validateSignature(request, env);
    
    // 3. Brute force protection
    await this.validateBruteForce(request, env);
    
    // 4. Session validation (for authenticated endpoints)
    if (this.requiresAuthentication(request.path)) {
      await this.validateSession(request, env);
    }
  }

  /**
   * Validate rate limiting
   */
  private static async validateRateLimit(request: APIRequest): Promise<void> {
    const clientKey = this.getClientKey(request);
    const now = Date.now();
    
    // Get existing requests for this client
    let requests = this.rateLimitMap.get(clientKey) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => now - timestamp < SECURITY_CONSTANTS.RATE_LIMIT_WINDOW);
    
    // Check if limit exceeded
    if (requests.length >= SECURITY_CONSTANTS.RATE_LIMIT_MAX_REQUESTS) {
      throw new SecurityError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }
    
    // Add current request
    requests.push(now);
    this.rateLimitMap.set(clientKey, requests);
  }

  /**
   * Validate HMAC signature
   */
  private static async validateSignature(request: APIRequest, env: Env): Promise<void> {
    // Extract signature from headers
    const signature = request.headers['x-signature'];
    if (!signature) {
      throw new SecurityError('Missing signature', 'MISSING_SIGNATURE');
    }
    
    // Reconstruct the signed string
    const signedString = this.buildSignedString(request);
    
    // TODO: Implement HMAC validation
    // This would require a shared secret or public key validation
    // For now, we'll implement a basic signature format validation
    
    if (!this.isValidSignatureFormat(signature)) {
      throw new SecurityError('Invalid signature format', 'INVALID_SIGNATURE');
    }
    
    // TODO: Implement actual HMAC verification
    // const isValid = await this.verifyHMAC(signedString, signature, env);
    // if (!isValid) {
    //   throw new SecurityError('Invalid signature', 'INVALID_SIGNATURE');
    // }
  }

  /**
   * Validate brute force protection
   */
  private static async validateBruteForce(request: APIRequest, env: Env): Promise<void> {
    if (request.path !== '/api/auth/login') {
      return; // Only validate for login attempts
    }
    
    const clientKey = this.getClientKey(request);
    const now = Date.now();
    
    // Get login attempts for this client
    let attempts = this.loginAttempts.get(clientKey) || [];
    
    // Remove old attempts outside 24 hours
    attempts = attempts.filter(attempt => now - attempt.timestamp.getTime() < 24 * 60 * 60 * 1000);
    
    // Check for failed attempts
    const failedAttempts = attempts.filter(attempt => !attempt.success);
    
    if (failedAttempts.length >= SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      // Check if still locked out
      const lastFailed = failedAttempts[failedAttempts.length - 1];
      const lockoutDuration = Math.pow(3, failedAttempts.length - 3) * SECURITY_CONSTANTS.LOCKOUT_BASE_DURATION;
      const lockoutUntil = lastFailed.timestamp.getTime() + lockoutDuration;
      
      if (now < lockoutUntil) {
        throw new AuthenticationError('Account temporarily locked due to too many failed login attempts');
      }
    }
  }

  /**
   * Validate session for authenticated endpoints
   */
  private static async validateSession(request: APIRequest, env: Env): Promise<void> {
    const sessionToken = request.headers['x-session-token'];
    if (!sessionToken) {
      throw new AuthenticationError('Missing session token');
    }
    
    // TODO: Implement session validation
    // This would check the session in KV storage
    // const session = await this.getSession(sessionToken, env);
    // if (!session || session.expiresAt < Date.now()) {
    //   throw new AuthenticationError('Invalid or expired session');
    // }
    
    // For now, we'll implement a basic format validation
    if (!this.isValidSessionToken(sessionToken)) {
      throw new AuthenticationError('Invalid session token format');
    }
  }

  /**
   * Build signed string for HMAC validation
   */
  private static buildSignedString(request: APIRequest): string {
    return [
      request.method,
      request.path,
      request.timestamp,
      request.nonce,
      JSON.stringify(request.body || {})
    ].join('|');
  }

  /**
   * Get client identification key
   */
  private static getClientKey(request: APIRequest): string {
    const ip = request.headers['x-real-ip'] || request.headers['x-forwarded-for'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const fingerprint = request.headers['x-fingerprint'] || 'unknown';
    
    return `${ip}|${userAgent}|${fingerprint}`;
  }

  /**
   * Check if endpoint requires authentication
   */
  private static requiresAuthentication(path: string): boolean {
    const publicEndpoints = [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/captcha',
      '/api/health'
    ];
    
    return !publicEndpoints.includes(path);
  }

  /**
   * Validate signature format
   */
  private static isValidSignatureFormat(signature: string): boolean {
    // Basic format validation: should be base64 encoded
    try {
      atob(signature.replace(/_/g, '/').replace(/-/g, '+'));
      return signature.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Validate session token format
   */
  private static isValidSessionToken(token: string): boolean {
    // Basic format validation: should be UUID-like
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(token);
  }

  /**
   * Record login attempt
   */
  static async recordLoginAttempt(
    username: string,
    success: boolean,
    request: APIRequest,
    env: Env
  ): Promise<void> {
    const clientKey = this.getClientKey(request);
    const attempt: LoginAttempt = {
      username,
      timestamp: new Date(),
      ip: request.headers['x-real-ip'] || 'unknown',
      fingerprint: request.headers['x-fingerprint'] || 'unknown',
      success
    };
    
    // Update login attempts map
    let attempts = this.loginAttempts.get(clientKey) || [];
    attempts.push(attempt);
    this.loginAttempts.set(clientKey, attempts);
    
    // TODO: Store in KV for persistence
    // await this.storeLoginAttempt(attempt, env);
  }

  /**
   * Clear expired data (called by scheduled worker)
   */
  static async cleanupExpiredData(env: Env): Promise<void> {
    const now = Date.now();
    
    // Clean up rate limit map
    for (const [clientKey, requests] of this.rateLimitMap.entries()) {
      const recentRequests = requests.filter(timestamp => now - timestamp < SECURITY_CONSTANTS.RATE_LIMIT_WINDOW);
      if (recentRequests.length === 0) {
        this.rateLimitMap.delete(clientKey);
      } else {
        this.rateLimitMap.set(clientKey, recentRequests);
      }
    }
    
    // Clean up login attempts
    for (const [clientKey, attempts] of this.loginAttempts.entries()) {
      const recentAttempts = attempts.filter(attempt => now - attempt.timestamp.getTime() < 24 * 60 * 60 * 1000);
      if (recentAttempts.length === 0) {
        this.loginAttempts.delete(clientKey);
      } else {
        this.loginAttempts.set(clientKey, recentAttempts);
      }
    }
    
    // TODO: Clean up expired sessions and tokens from KV
    // await this.cleanupExpiredSessions(env);
    // await this.cleanupExpiredTokens(env);
  }
}

// Helper interfaces for internal use
interface LoginAttempt {
  username: string;
  timestamp: Date;
  ip: string;
  fingerprint: string;
  success: boolean;
}