/**
 * ZeroForums0 - WebCrypto Manager
 * 
 * Production-grade cryptographic operations using WebCrypto API
 * RSA-4096 for key exchange, AES-256-GCM for encryption
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

export class CryptoManager {
  constructor() {
    this.keys = null;
    this.sharedSecrets = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Check WebCrypto support
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('WebCrypto API not supported');
      }

      // Load existing keys or generate new ones
      this.keys = await this.loadKeys();
      if (!this.keys) {
        this.keys = await this.generateKeyPair();
        await this.saveKeys(this.keys);
      }

      this.isInitialized = true;
      console.log('CryptoManager initialized successfully');
    } catch (error) {
      console.error('CryptoManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate RSA-4096 key pair
   */
  async generateKeyPair() {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 4096,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: 'SHA-256' }
        },
        true,
        ['encrypt', 'decrypt', 'sign', 'verify']
      );

      // Export public key
      const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyBase64 = this.arrayBufferToBase64(publicKey);

      // Export private key
      const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyBase64 = this.arrayBufferToBase64(privateKey);

      return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
        publicKeyObj: keyPair.publicKey,
        privateKeyObj: keyPair.privateKey
      };
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error('Failed to generate cryptographic keys');
    }
  }

  /**
   * Generate AES-256-GCM shared secret for conversations
   */
  async generateSharedSecret() {
    try {
      const secret = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      return secret;
    } catch (error) {
      console.error('Shared secret generation failed:', error);
      throw new Error('Failed to generate shared secret');
    }
  }

  /**
   * Encrypt message with AES-256-GCM
   */
  async encryptMessage(message, sharedSecret, conversationId) {
    try {
      if (!this.isInitialized) {
        throw new Error('CryptoManager not initialized');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      // Generate unique IV for this message
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Generate unique salt
      const salt = crypto.getRandomValues(new Uint8Array(16));

      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          additionalData: encoder.encode(conversationId),
          tagLength: 128
        },
        sharedSecret,
        data
      );

      return {
        ciphertext: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
        algorithm: 'AES-GCM'
      };
    } catch (error) {
      console.error('Message encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message with AES-256-GCM
   */
  async decryptMessage(encryptedData, sharedSecret, conversationId) {
    try {
      if (!this.isInitialized) {
        throw new Error('CryptoManager not initialized');
      }

      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          additionalData: encoder.encode(conversationId),
          tagLength: 128
        },
        sharedSecret,
        ciphertext
      );

      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Message decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt file with AES-256-GCM
   */
  async encryptFile(file, sharedSecret, conversationId) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          additionalData: new TextEncoder().encode(conversationId),
          tagLength: 128
        },
        sharedSecret,
        arrayBuffer
      );

      return {
        filename: file.name,
        contentType: file.type,
        size: file.size,
        encryptedData: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
        algorithm: 'AES-GCM'
      };
    } catch (error) {
      console.error('File encryption failed:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Decrypt file with AES-256-GCM
   */
  async decryptFile(encryptedFile, sharedSecret, conversationId) {
    try {
      const encryptedData = this.base64ToArrayBuffer(encryptedFile.encryptedData);
      const iv = this.base64ToArrayBuffer(encryptedFile.iv);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          additionalData: new TextEncoder().encode(conversationId),
          tagLength: 128
        },
        sharedSecret,
        encryptedData
      );

      return new Blob([decrypted], { type: encryptedFile.contentType });
    } catch (error) {
      console.error('File decryption failed:', error);
      throw new Error('Failed to decrypt file');
    }
  }

  /**
   * Sign data with private key
   */
  async signData(data) {
    try {
      if (!this.keys || !this.keys.privateKeyObj) {
        throw new Error('Private key not available');
      }

      const encoder = new TextEncoder();
      const dataArray = typeof data === 'string' ? encoder.encode(data) : data;

      const signature = await crypto.subtle.sign(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        this.keys.privateKeyObj,
        dataArray
      );

      return this.arrayBufferToBase64(signature);
    } catch (error) {
      console.error('Data signing failed:', error);
      throw new Error('Failed to sign data');
    }
  }

  /**
   * Verify signature with public key
   */
  async verifySignature(data, signature, publicKey) {
    try {
      const encoder = new TextEncoder();
      const dataArray = typeof data === 'string' ? encoder.encode(data) : data;
      const signatureArray = this.base64ToArrayBuffer(signature);

      // Import public key if needed
      let publicKeyObj;
      if (publicKey instanceof CryptoKey) {
        publicKeyObj = publicKey;
      } else {
        publicKeyObj = await crypto.subtle.importKey(
          'spki',
          this.base64ToArrayBuffer(publicKey),
          {
            name: 'RSA-OAEP',
            hash: { name: 'SHA-256' }
          },
          false,
          ['verify']
        );
      }

      const isValid = await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        publicKeyObj,
        signatureArray,
        dataArray
      );

      return isValid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate HMAC for request signing
   */
  async generateHMAC(data, secret) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const hmacKey = await crypto.subtle.importKey(
        'raw',
        this.base64ToArrayBuffer(secret),
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', hmacKey, dataBuffer);
      return this.arrayBufferToBase64(signature);
    } catch (error) {
      console.error('HMAC generation failed:', error);
      throw new Error('Failed to generate HMAC');
    }
  }

  /**
   * Generate unique nonce for requests
   */
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array);
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate unique conversation ID
   */
  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate unique request token
   */
  generateRequestToken() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Utility: Convert string to ArrayBuffer
   */
  stringToArrayBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }

  /**
   * Utility: Convert ArrayBuffer to string
   */
  arrayBufferToString(buffer) {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
  }

  /**
   * Save keys to IndexedDB
   */
  async saveKeys(keys) {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');
      
      await store.put({
        id: 'user_keys',
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        createdAt: new Date().toISOString()
      });

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to save keys:', error);
      throw new Error('Failed to save cryptographic keys');
    }
  }

  /**
   * Load keys from IndexedDB
   */
  async loadKeys() {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(['keys'], 'readonly');
      const store = transaction.objectStore('keys');
      const request = store.get('user_keys');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve({
              publicKey: result.publicKey,
              privateKey: result.privateKey,
              publicKeyObj: null, // Will be imported when needed
              privateKeyObj: null
            });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load keys:', error);
      return null;
    }
  }

  /**
   * Open IndexedDB database
   */
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ZeroForums0_Crypto', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cryptographic data
   */
  async clearAll() {
    try {
      // Clear keys from memory
      this.keys = null;
      this.sharedSecrets.clear();

      // Clear keys from IndexedDB
      const db = await this.openDatabase();
      const transaction = db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');
      
      await store.clear();

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to clear cryptographic data:', error);
      throw new Error('Failed to clear cryptographic data');
    }
  }

  /**
   * Get public key for sharing
   */
  getPublicKey() {
    if (!this.keys) {
      throw new Error('Keys not initialized');
    }
    return this.keys.publicKey;
  }

  /**
   * Import public key from base64
   */
  async importPublicKey(publicKeyBase64) {
    try {
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64);
      
      return await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: { name: 'SHA-256' }
        },
        false,
        ['encrypt', 'verify']
      );
    } catch (error) {
      console.error('Public key import failed:', error);
      throw new Error('Failed to import public key');
    }
  }

  /**
   * Export public key as base64
   */
  async exportPublicKey(publicKeyObj) {
    try {
      const exported = await crypto.subtle.exportKey('spki', publicKeyObj);
      return this.arrayBufferToBase64(exported);
    } catch (error) {
      console.error('Public key export failed:', error);
      throw new Error('Failed to export public key');
    }
  }

  /**
   * Performance monitoring for cryptographic operations
   */
  async measureCryptoOperation(operation, ...args) {
    const startTime = performance.now();
    try {
      const result = await operation.apply(this, args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Crypto operation took ${duration.toFixed(2)}ms`);
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow crypto operation: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`Crypto operation failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}