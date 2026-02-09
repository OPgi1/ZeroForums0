/**
 * ZeroForums0 - Utility Functions
 * 
 * Production-grade utility functions for security, formatting, and validation
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

export class Utils {
  constructor() {
    this.performanceMetrics = new Map();
    this.analyticsQueue = [];
  }

  /**
   * Generate UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Format date with locale support
   */
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      return new Date(date).toLocaleDateString(undefined, mergedOptions);
    } catch (error) {
      console.error('Date formatting failed:', error);
      return date.toString();
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format message timestamp
   */
  formatMessageTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    
    if (diff < minute) {
      return 'Just now';
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return this.formatDate(timestamp, { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    
    return str
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#39;');
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Debounce function
   */
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  }

  /**
   * Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Deep clone object
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  constantTimeEquals(a, b) {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Generate SHA-256 hash
   */
  async sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if running in secure context (HTTPS)
   */
  isSecureContext() {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }

  /**
   * Get browser information
   */
  getBrowserInfo() {
    const ua = navigator.userAgent;
    const browser = {
      name: 'Unknown',
      version: 'Unknown',
      platform: navigator.platform
    };

    if (ua.includes('Chrome')) {
      browser.name = 'Chrome';
      browser.version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Firefox')) {
      browser.name = 'Firefox';
      browser.version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Safari')) {
      browser.name = 'Safari';
      browser.version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Edge')) {
      browser.name = 'Edge';
      browser.version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }

    return browser;
  }

  /**
   * Check if device is mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if device supports touch
   */
  supportsTouch() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get screen dimensions
   */
  getScreenInfo() {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth
    };
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        return success;
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  }

  /**
   * Download file
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Read file as text
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Read file as ArrayBuffer
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Validate file type
   */
  isValidFileType(file, allowedTypes) {
    return allowedTypes.includes(file.type) || allowedTypes.includes(file.name.split('.').pop());
  }

  /**
   * Validate file size
   */
  isValidFileSize(file, maxSize) {
    return file.size <= maxSize;
  }

  /**
   * Generate random string
   */
  generateRandomString(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    
    return result;
  }

  /**
   * Performance monitoring
   */
  startPerformanceTimer(name) {
    this.performanceMetrics.set(name, performance.now());
  }

  endPerformanceTimer(name) {
    const startTime = this.performanceMetrics.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.performanceMetrics.delete(name);
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return null;
  }

  /**
   * Analytics tracking (privacy-focused)
   */
  trackEvent(eventName, data = {}) {
    if (!this.isSecureContext()) return;

    const eventData = {
      event: eventName,
      timestamp: Date.now(),
      url: location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      ...data
    };

    this.analyticsQueue.push(eventData);

    // Send analytics in batches
    if (this.analyticsQueue.length >= 10) {
      this.sendAnalyticsBatch();
    }
  }

  async sendAnalyticsBatch() {
    if (this.analyticsQueue.length === 0) return;

    const batch = this.analyticsQueue.splice(0, this.analyticsQueue.length);
    
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: batch })
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
      // Re-queue events for retry
      this.analyticsQueue.unshift(...batch);
    }
  }

  /**
   * Error reporting
   */
  reportError(error, context = {}) {
    const errorReport = {
      message: error.message || error.toString(),
      stack: error.stack,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent,
      context
    };

    console.error('Error reported:', errorReport);

    // Send error report to server
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorReport)
    }).catch(() => {
      // Ignore errors when reporting errors
    });
  }

  /**
   * Memory usage monitoring
   */
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Network status monitoring
   */
  getNetworkStatus() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  /**
   * Accessibility utilities
   */
  announceToScreenReader(message) {
    const announcer = document.getElementById('screen-reader-announcer');
    if (!announcer) {
      const element = document.createElement('div');
      element.id = 'screen-reader-announcer';
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.style.position = 'absolute';
      element.style.left = '-10000px';
      element.style.width = '1px';
      element.style.height = '1px';
      element.style.overflow = 'hidden';
      document.body.appendChild(element);
    }

    const announcerElement = document.getElementById('screen-reader-announcer');
    announcerElement.textContent = message;
  }

  /**
   * Keyboard navigation utilities
   */
  handleKeyboardNavigation(event, handlers) {
    const { key, ctrlKey, shiftKey, altKey } = event;

    // Common shortcuts
    if (ctrlKey && key === 'k') {
      event.preventDefault();
      handlers.search && handlers.search();
    } else if (ctrlKey && key === 'n') {
      event.preventDefault();
      handlers.newItem && handlers.newItem();
    } else if (key === 'Escape') {
      handlers.escape && handlers.escape();
    } else if (key === 'Enter' && !ctrlKey) {
      handlers.enter && handlers.enter();
    }
  }

  /**
   * Responsive utilities
   */
  getBreakpoint() {
    const width = window.innerWidth;
    
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    return 'xl';
  }

  /**
   * Color utilities
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * Animation utilities
   */
  animate(element, properties, duration = 300, easing = 'ease') {
    return new Promise((resolve) => {
      const start = performance.now();
      const initial = {};
      
      // Get initial values
      Object.keys(properties).forEach(prop => {
        initial[prop] = parseFloat(getComputedStyle(element)[prop]);
      });

      function step(timestamp) {
        const progress = Math.min((timestamp - start) / duration, 1);
        const ease = easeFunctions[easing](progress);

        Object.keys(properties).forEach(prop => {
          const value = initial[prop] + (properties[prop] - initial[prop]) * ease;
          element.style[prop] = value + (prop === 'opacity' ? '' : 'px');
        });

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(step);
    });
  }
}

// Easing functions for animations
const easeFunctions = {
  linear: t => t,
  ease: t => t * (2 - t),
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

// Export singleton instance
export const utils = new Utils();