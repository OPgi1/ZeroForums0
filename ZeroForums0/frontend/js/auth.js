/**
 * ZeroForums0 - Authentication Manager
 * 
 * Production-grade authentication with CAPTCHA and brute force protection
 * Custom Proof-of-Work CAPTCHA system
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

import { CryptoManager } from './crypto.js';
import { Utils } from './utils.js';

export class AuthManager {
  constructor() {
    this.crypto = new CryptoManager();
    this.utils = new Utils();
    this.session = null;
    this.captchaTokens = new Map();
  }

  /**
   * Check for existing session
   */
  async checkSession() {
    try {
      const sessionData = await this.loadSession();
      if (!sessionData) return null;

      // Validate session
      if (Date.now() > sessionData.expiresAt) {
        await this.clearSession();
        return null;
      }

      // Validate session integrity
      if (!await this.validateSessionIntegrity(sessionData)) {
        await this.clearSession();
        return null;
      }

      this.session = sessionData;
      return sessionData.user;
    } catch (error) {
      console.error('Session check failed:', error);
      return null;
    }
  }

  /**
   * Register new user
   */
  async register(username, profileImage, captcha, captchaToken) {
    try {
      // Validate username
      if (!this.validateUsername(username)) {
        throw new Error('Invalid username format');
      }

      // Check username availability
      const isAvailable = await this.checkUsernameAvailability(username);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      // Validate CAPTCHA
      const captchaValid = await this.validateCaptcha(captcha, captchaToken);
      if (!captchaValid) {
        throw new Error('CAPTCHA validation failed');
      }

      // Generate keys
      await this.crypto.initialize();
      const publicKey = this.crypto.getPublicKey();

      // Prepare user data
      const userData = {
        username,
        publicKey,
        profileImage: profileImage ? await this.encryptProfileImage(profileImage) : null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Register with server
      const response = await this.makeSecureRequest('/api/auth/register', 'POST', userData);

      if (response.success) {
        // Create session
        const session = await this.createSession(response.user);
        this.session = session;
        
        // Save session
        await this.saveSession(session);
        
        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(username, captcha, captchaToken) {
    try {
      // Validate CAPTCHA
      const captchaValid = await this.validateCaptcha(captcha, captchaToken);
      if (!captchaValid) {
        throw new Error('CAPTCHA validation failed');
      }

      // Login with server
      const response = await this.makeSecureRequest('/api/auth/login', 'POST', {
        username,
        captcha,
        captchaToken
      });

      if (response.success) {
        // Create session
        const session = await this.createSession(response.user);
        this.session = session;
        
        // Save session
        await this.saveSession(session);
        
        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      if (this.session) {
        // Notify server
        await this.makeSecureRequest('/api/auth/logout', 'POST', {
          sessionId: this.session.sessionId
        });
      }
      
      await this.clearSession();
      this.session = null;
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local session even if server request fails
      await this.clearSession();
      this.session = null;
    }
  }

  /**
   * Wipe user account and all data
   */
  async wipeAccount() {
    try {
      if (!this.session) {
        throw new Error('No active session');
      }

      // Confirm wipe
      const confirmation = prompt('Type "WIPE_EVERYTHING" to confirm:');
      if (confirmation !== 'WIPE_EVERYTHING') {
        throw new Error('Wipe cancelled');
      }

      // Wipe server data
      const response = await this.makeSecureRequest('/api/wipe', 'POST', {
        confirmation: 'WIPE_EVERYTHING',
        sessionId: this.session.sessionId
      });

      if (response.success) {
        // Clear local data
        await this.crypto.clearAll();
        await this.clearSession();
        await this.clearAllLocalStorage();
        
        this.session = null;
        return { success: true };
      } else {
        throw new Error(response.error || 'Wipe failed');
      }
    } catch (error) {
      console.error('Account wipe failed:', error);
      throw error;
    }
  }

  /**
   * Update user avatar
   */
  async updateAvatar(file) {
    try {
      if (!this.session) {
        throw new Error('No active session');
      }

      // Encrypt avatar
      const encryptedAvatar = await this.encryptProfileImage(file);

      // Update server
      const response = await this.makeSecureRequest('/api/auth/avatar', 'POST', {
        avatar: encryptedAvatar,
        sessionId: this.session.sessionId
      });

      if (response.success) {
        // Update local session
        this.session.user.profileImage = response.avatarUrl;
        await this.saveSession(this.session);
        return { success: true };
      } else {
        throw new Error(response.error || 'Avatar update failed');
      }
    } catch (error) {
      console.error('Avatar update failed:', error);
      throw error;
    }
  }

  /**
   * Get CAPTCHA challenge
   */
  async getCaptcha() {
    try {
      const response = await this.makeSecureRequest('/api/auth/captcha', 'GET');
      
      if (response.success) {
        // Store token for validation
        this.captchaTokens.set(response.token, {
          challenge: response.challenge,
          solution: response.solution,
          createdAt: Date.now(),
          used: false
        });
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to get CAPTCHA');
      }
    } catch (error) {
      console.error('CAPTCHA request failed:', error);
      throw error;
    }
  }

  /**
   * Validate CAPTCHA
   */
  async validateCaptcha(userInput, token) {
    try {
      const captchaData = this.captchaTokens.get(token);
      
      if (!captchaData || captchaData.used || Date.now() - captchaData.createdAt > 5 * 60 * 1000) {
        return false;
      }

      // Check if solution matches
      const isValid = this.utils.constantTimeEquals(userInput.toLowerCase(), captchaData.solution.toLowerCase());
      
      if (isValid) {
        captchaData.used = true;
      }
      
      return isValid;
    } catch (error) {
      console.error('CAPTCHA validation failed:', error);
      return false;
    }
  }

  /**
   * Create session
   */
  async createSession(user) {
    const sessionId = this.utils.generateUUID();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    const session = {
      sessionId,
      userId: user.id,
      username: user.username,
      createdAt: Date.now(),
      expiresAt,
      fingerprint: this.generateFingerprint(),
      ip: await this.getClientIP(),
      user
    };

    // Sign session
    session.signature = await this.crypto.signData(JSON.stringify({
      sessionId,
      userId: user.id,
      expiresAt
    }));

    return session;
  }

  /**
   * Validate session integrity
   */
  async validateSessionIntegrity(session) {
    try {
      const dataToVerify = JSON.stringify({
        sessionId: session.sessionId,
        userId: session.userId,
        expiresAt: session.expiresAt
      });

      return await this.crypto.verifySignature(
        dataToVerify,
        session.signature,
        this.crypto.getPublicKey()
      );
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Save session to IndexedDB
   */
  async saveSession(session) {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      
      await store.put({
        id: 'current_session',
        session: session,
        createdAt: new Date().toISOString()
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session');
    }
  }

  /**
   * Load session from IndexedDB
   */
  async loadSession() {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get('current_session');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.session : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Clear session
   */
  async clearSession() {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      
      await store.delete('current_session');

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Clear all local storage
   */
  async clearAllLocalStorage() {
    try {
      // Clear IndexedDB
      const db = await this.openDatabase();
      const stores = ['sessions', 'keys', 'messages', 'files'];
      
      for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
      }

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  }

  /**
   * Generate device fingerprint
   */
  generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('ZeroForums0', 2, 2);
    
    const fingerprintData = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      colorDepth: window.screen.colorDepth,
      resolution: [window.screen.width, window.screen.height],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionStorage: !!window.sessionStorage,
      localStorage: !!window.localStorage,
      canvas: canvas.toDataURL(),
      cpuCores: navigator.hardwareConcurrency || 'unknown',
      platform: navigator.platform,
      touchSupport: 'ontouchstart' in window
    };

    return this.utils.sha256(JSON.stringify(fingerprintData));
  }

  /**
   * Get client IP (approximate)
   */
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      // Fallback to WebRTC or other methods
      return 'unknown';
    }
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username) {
    try {
      const response = await this.makeSecureRequest('/api/auth/check-username', 'POST', { username });
      return response.available;
    } catch (error) {
      console.error('Username check failed:', error);
      return false;
    }
  }

  /**
   * Validate username format
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return false;
    }
    
    // Check length
    if (username.length < 3 || username.length > 50) {
      return false;
    }
    
    // Check allowed characters (alphanumeric and underscores)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
  }

  /**
   * Encrypt profile image
   */
  async encryptProfileImage(file) {
    try {
      // Read file as data URL
      const dataUrl = await this.readFileAsDataURL(file);
      
      // Encrypt the data URL
      const encrypted = await this.crypto.encryptMessage(
        dataUrl,
        await this.crypto.generateSharedSecret(),
        'profile_image'
      );
      
      return {
        encryptedData: encrypted.ciphertext,
        iv: encrypted.iv,
        filename: file.name,
        contentType: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Profile image encryption failed:', error);
      throw new Error('Failed to encrypt profile image');
    }
  }

  /**
   * Read file as data URL
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Make secure request with HMAC signing
   */
  async makeSecureRequest(path, method, body = null) {
    try {
      const timestamp = Date.now();
      const nonce = this.crypto.generateNonce();
      const requestId = this.crypto.generateRequestToken();

      // Prepare request data
      const requestData = {
        method,
        path,
        body,
        timestamp,
        nonce,
        requestId
      };

      // Generate HMAC signature
      const secret = this.session ? this.session.sessionId : 'public';
      const signature = await this.crypto.generateHMAC(
        JSON.stringify(requestData),
        secret
      );

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp.toString(),
        'X-Nonce': nonce,
        'X-Signature': signature,
        'X-Request-ID': requestId
      };

      if (this.session) {
        headers['X-Session-Token'] = this.session.sessionId;
        headers['X-Fingerprint'] = this.session.fingerprint;
      }

      // Make request
      const response = await fetch(path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Secure request failed:', error);
      throw error;
    }
  }

  /**
   * Open IndexedDB database
   */
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ZeroForums0_Auth', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const stores = ['sessions', 'keys', 'messages', 'files'];
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get current session
   */
  getCurrentSession() {
    return this.session;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.session && Date.now() < this.session.expiresAt;
  }
}