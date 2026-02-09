/**
 * ZeroForums0 - Main Application Entry Point
 * 
 * Initializes all components and manages application state
 * Production-grade application architecture
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

import { CryptoManager } from './crypto.js';
import { AuthManager } from './auth.js';
import { ChatManager } from './chat.js';
import { ForumManager } from './forum.js';
import { i18n } from './i18n.js';
import { Utils } from './utils.js';

class ZeroForums0App {
  constructor() {
    this.crypto = new CryptoManager();
    this.auth = new AuthManager();
    this.chat = new ChatManager();
    this.forum = new ForumManager();
    this.utils = new Utils();
    
    this.state = {
      currentUser: null,
      currentSection: 'auth',
      isInitialized: false
    };
    
    this.init();
  }

  async init() {
    try {
      // Initialize i18n system
      await i18n.initialize();
      
      // Initialize WebCrypto
      await this.crypto.initialize();
      
      // Check for existing session
      const session = await this.auth.checkSession();
      if (session) {
        this.state.currentUser = session;
        this.showSection('chat');
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize UI
      this.initializeUI();
      
      this.state.isInitialized = true;
      this.hideLoading();
      
      console.log('ZeroForums0 initialized successfully');
      
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showError('Failed to initialize application');
    }
  }

  setupEventListeners() {
    // Language selection
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lang = e.target.dataset.lang;
        await i18n.switchLanguage(lang);
        this.updateUIForLanguage(lang);
      });
    });

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.target.dataset.section;
        this.showSection(section);
      });
    });

    // Auth forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Auth switches
    document.getElementById('show-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showAuthForm('register');
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showAuthForm('login');
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.handleLogout();
    });

    // Wipe everything
    document.getElementById('wipe-btn')?.addEventListener('click', () => {
      this.handleWipe();
    });

    // Chat events
    document.getElementById('new-conversation-btn')?.addEventListener('click', () => {
      this.showNewConversationModal();
    });

    document.getElementById('send-btn')?.addEventListener('click', () => {
      this.handleSendMessage();
    });

    // Forum events
    document.getElementById('new-post-btn')?.addEventListener('click', () => {
      this.showNewPostModal();
    });

    // Profile events
    document.getElementById('change-avatar-btn')?.addEventListener('click', () => {
      document.getElementById('change-avatar').click();
    });

    document.getElementById('change-avatar')?.addEventListener('change', (e) => {
      this.handleAvatarChange(e);
    });

    // Modal events
    document.getElementById('cancel-conversation')?.addEventListener('click', () => {
      this.hideModal('new-conversation-modal');
    });

    document.getElementById('cancel-post')?.addEventListener('click', () => {
      this.hideModal('new-post-modal');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (this.state.currentSection === 'chat') {
          this.focusMessageInput();
        }
      }
    });

    // Window events
    window.addEventListener('beforeunload', () => {
      this.handleBeforeUnload();
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const captcha = document.getElementById('login-captcha-input').value;
    const captchaToken = document.getElementById('login-captcha-token').value;

    try {
      const result = await this.auth.login(username, captcha, captchaToken);
      
      if (result.success) {
        this.state.currentUser = result.user;
        this.showSection('chat');
        this.showSuccess('Login successful');
      } else {
        this.showError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed: ' + error.message);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const profileImage = document.getElementById('register-profile-image').files[0];
    const captcha = document.getElementById('register-captcha-input').value;
    const captchaToken = document.getElementById('register-captcha-token').value;

    try {
      const result = await this.auth.register(username, profileImage, captcha, captchaToken);
      
      if (result.success) {
        this.state.currentUser = result.user;
        this.showSection('chat');
        this.showSuccess('Registration successful');
      } else {
        this.showError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showError('Registration failed: ' + error.message);
    }
  }

  async handleLogout() {
    try {
      await this.auth.logout();
      this.state.currentUser = null;
      this.showSection('auth');
      this.showSuccess('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      this.showError('Logout failed');
    }
  }

  async handleWipe() {
    const confirmation = prompt('Type "WIPE_EVERYTHING" to confirm:');
    
    if (confirmation === 'WIPE_EVERYTHING') {
      try {
        await this.auth.wipeAccount();
        this.state.currentUser = null;
        this.showSection('auth');
        this.showSuccess('Account wiped successfully');
      } catch (error) {
        console.error('Wipe error:', error);
        this.showError('Wipe failed: ' + error.message);
      }
    } else {
      this.showError('Wipe cancelled');
    }
  }

  showSection(section) {
    this.state.currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(el => {
      el.classList.remove('active');
      el.style.display = 'none';
    });
    
    // Show selected section
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) {
      sectionEl.style.display = 'block';
      sectionEl.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === section);
    });

    // Load section data
    this.loadSectionData(section);
  }

  showAuthForm(formType) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (formType === 'login') {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    }
  }

  showNewConversationModal() {
    const modal = document.getElementById('new-conversation-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  showNewPostModal() {
    const modal = document.getElementById('new-post-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    modal.classList.remove('active');
  }

  async handleSendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
      await this.chat.sendMessage(message);
      input.value = '';
    } catch (error) {
      console.error('Send message error:', error);
      this.showError('Failed to send message');
    }
  }

  async handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      await this.auth.updateAvatar(file);
      this.showSuccess('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar update error:', error);
      this.showError('Failed to update avatar');
    }
  }

  loadSectionData(section) {
    switch (section) {
      case 'chat':
        this.chat.loadConversations();
        break;
      case 'forum':
        this.forum.loadPosts();
        break;
      case 'profile':
        this.loadProfileData();
        break;
    }
  }

  loadProfileData() {
    if (!this.state.currentUser) return;
    
    const usernameEl = document.getElementById('profile-username');
    const joinedEl = document.getElementById('profile-joined-date');
    const lastLoginEl = document.getElementById('profile-last-login-date');
    const avatarEl = document.getElementById('profile-avatar');
    
    if (usernameEl) usernameEl.textContent = this.state.currentUser.username;
    if (joinedEl) joinedEl.textContent = this.utils.formatDate(this.state.currentUser.createdAt);
    if (lastLoginEl) lastLoginEl.textContent = this.utils.formatDate(this.state.currentUser.lastLogin || new Date());
    if (avatarEl && this.state.currentUser.profileImage) {
      avatarEl.src = this.state.currentUser.profileImage;
    }
  }

  focusMessageInput() {
    const input = document.getElementById('message-input');
    if (input) {
      input.focus();
    }
  }

  showSuccess(message) {
    this.showStatusMessage(message, 'success');
  }

  showError(message) {
    this.showStatusMessage(message, 'error');
  }

  showStatusMessage(message, type) {
    const statusEl = document.getElementById('auth-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;
    
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);
  }

  updateUIForLanguage(lang) {
    // Update all text content based on language
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = i18n.t(key, lang);
    });
    
    // Update placeholders
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = i18n.t(key, lang);
    });
    
    // Update button text
    const buttons = document.querySelectorAll('[data-i18n-btn]');
    buttons.forEach(btn => {
      const key = btn.dataset.i18nBtn;
      btn.textContent = i18n.t(key, lang);
    });
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  }

  initializeUI() {
    // Set initial language
    const currentLang = i18n.getCurrentLanguage();
    this.updateUIForLanguage(currentLang);
    
    // Update language selector active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
    
    // Initialize tooltips
    this.initializeTooltips();
    
    // Initialize accessibility features
    this.initializeAccessibility();
    
    // Initialize dark mode toggle
    this.initializeDarkMode();
  }

  initializeTooltips() {
    // Add tooltips to interactive elements
    const tooltips = [
      { selector: '.nav-btn', text: 'Navigation' },
      { selector: '.btn-primary', text: 'Action' },
      { selector: '.btn-secondary', text: 'Secondary Action' },
      { selector: '.conversation-item', text: 'Click to open conversation' },
      { selector: '.post-card', text: 'Click to read post' }
    ];
    
    tooltips.forEach(({ selector, text }) => {
      document.querySelectorAll(selector).forEach(el => {
        el.title = text;
      });
    });
  }

  initializeAccessibility() {
    // Add ARIA labels
    const ariaLabels = [
      { selector: '#login-form', label: 'Login form' },
      { selector: '#register-form', label: 'Registration form' },
      { selector: '#message-input', label: 'Message input' },
      { selector: '#post-content', label: 'Post content' },
      { selector: '.conversation-list', label: 'Conversation list' },
      { selector: '.post-list', label: 'Post list' }
    ];
    
    ariaLabels.forEach(({ selector, label }) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('aria-label', label);
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close modals
        document.querySelectorAll('.modal.active').forEach(modal => {
          modal.style.display = 'none';
          modal.classList.remove('active');
        });
      }
    });
  }

  initializeDarkMode() {
    // Check for user preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!savedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    });
  }

  handleBeforeUnload() {
    // Clean up sensitive data
    if (this.state.currentUser) {
      // Clear session data
      this.auth.clearSession();
    }
  }

  handleResize() {
    // Handle responsive layout changes
    const width = window.innerWidth;
    
    if (width <= 768) {
      // Mobile layout
      document.body.classList.add('mobile-view');
    } else {
      document.body.classList.remove('mobile-view');
    }
  }

  // Error handling
  handleGlobalError(error) {
    console.error('Global error:', error);
    this.showError('An unexpected error occurred');
  }

  // Performance monitoring
  logPerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      console.log(`Page load time: ${loadTime}ms`);
      
      // Log to server if needed
      // this.utils.sendAnalytics('page_load', { loadTime });
    }
  }
}

// Initialize application when DOM is ready
let app;

function initializeApp() {
  try {
    app = new ZeroForums0App();
    
    // Log performance
    window.addEventListener('load', () => {
      app.logPerformance();
    });
    
    // Global error handling
    window.addEventListener('error', (e) => {
      app.handleGlobalError(e.error);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      app.handleGlobalError(e.reason);
    });
    
  } catch (error) {
    console.error('App initialization failed:', error);
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #fff;">
        <h1>ZeroForums0</h1>
        <p>Failed to initialize application</p>
        <p>Please refresh the page or contact support</p>
        <button onclick="location.reload()">Refresh Page</button>
      </div>
    `;
  }
}

// Export for module usage
export { ZeroForums0App, initializeApp };