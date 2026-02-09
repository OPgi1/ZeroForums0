/**
 * ZeroForums0 - Internationalization Manager
 * 
 * Production-grade i18n system with RTL support and dynamic language switching
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

export class i18n {
  constructor() {
    this.currentLanguage = 'en';
    this.languages = new Map();
    this.fallbackLanguage = 'en';
    this.isInitialized = false;
  }

  /**
   * Initialize i18n system
   */
  async initialize() {
    try {
      // Load language packs
      await this.loadLanguagePack('en', this.getEnglishTranslations());
      await this.loadLanguagePack('ar', this.getArabicTranslations());
      await this.loadLanguagePack('zh', this.getChineseTranslations());
      await this.loadLanguagePack('ru', this.getRussianTranslations());

      // Set initial language
      this.currentLanguage = this.detectLanguage();
      this.isInitialized = true;

      console.log('i18n system initialized with language:', this.currentLanguage);
    } catch (error) {
      console.error('i18n initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load language pack
   */
  async loadLanguagePack(code, translations) {
    this.languages.set(code, {
      code,
      name: translations._meta.name,
      nativeName: translations._meta.nativeName,
      isRTL: translations._meta.isRTL,
      translations: translations._strings
    });
  }

  /**
   * Switch language
   */
  async switchLanguage(code) {
    if (!this.languages.has(code)) {
      throw new Error(`Language ${code} not available`);
    }

    const previousLanguage = this.currentLanguage;
    this.currentLanguage = code;

    // Update HTML attributes
    const html = document.documentElement;
    const langPack = this.languages.get(code);

    html.lang = code;
    html.dir = langPack.isRTL ? 'rtl' : 'ltr';

    // Apply RTL styles
    if (langPack.isRTL) {
      html.classList.add('rtl-mode');
    } else {
      html.classList.remove('rtl-mode');
    }

    // Update all text content
    this.updateAllTextContent();

    // Save preference
    await this.saveLanguagePreference(code);

    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('languagechange', {
      detail: {
        previousLanguage,
        currentLanguage: code
      }
    }));

    console.log(`Language switched to: ${code}`);
  }

  /**
   * Translate text
   */
  t(key, lang = null) {
    const language = lang || this.currentLanguage;
    const pack = this.languages.get(language);

    if (!pack) {
      return this.t(key, this.fallbackLanguage);
    }

    const translation = pack.translations[key];
    if (translation) {
      return translation;
    }

    // Fallback to English
    const fallbackPack = this.languages.get(this.fallbackLanguage);
    if (fallbackPack) {
      return fallbackPack.translations[key] || key;
    }

    return key;
  }

  /**
   * Format date according to language
   */
  formatDate(date, lang = null) {
    const language = lang || this.currentLanguage;
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    try {
      return new Date(date).toLocaleDateString(language, options);
    } catch (error) {
      console.error('Date formatting failed:', error);
      return new Date(date).toString();
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get language pack
   */
  getLanguagePack(code) {
    return this.languages.get(code) || null;
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages() {
    return Array.from(this.languages.values());
  }

  /**
   * Update all text content in the document
   */
  updateAllTextContent() {
    // Update elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.dataset.i18n;
      const translation = this.t(key);
      
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    });

    // Update elements with data-i18n-title attribute
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(el => {
      const key = el.dataset.i18nTitle;
      el.title = this.t(key);
    });

    // Update button text
    const buttons = document.querySelectorAll('[data-i18n-btn]');
    buttons.forEach(btn => {
      const key = btn.dataset.i18nBtn;
      btn.textContent = this.t(key);
    });

    // Update aria-labels
    const ariaElements = document.querySelectorAll('[data-i18n-aria]');
    ariaElements.forEach(el => {
      const key = el.dataset.i18nAria;
      el.setAttribute('aria-label', this.t(key));
    });

    // Update alt text for images
    const imgElements = document.querySelectorAll('[data-i18n-alt]');
    imgElements.forEach(img => {
      const key = img.dataset.i18nAlt;
      img.alt = this.t(key);
    });
  }

  /**
   * Detect user's preferred language
   */
  detectLanguage() {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && this.languages.has(urlLang)) {
      return urlLang;
    }

    // 2. Check localStorage
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang && this.languages.has(savedLang)) {
      return savedLang;
    }

    // 3. Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const primaryLang = browserLang.split('-')[0];
    
    if (this.languages.has(primaryLang)) {
      return primaryLang;
    }

    // 4. Check for regional variants
    for (const [code, pack] of this.languages.entries()) {
      if (browserLang.startsWith(code)) {
        return code;
      }
    }

    // 5. Default to English
    return this.fallbackLanguage;
  }

  /**
   * Save language preference
   */
  async saveLanguagePreference(lang) {
    try {
      localStorage.setItem('preferred_language', lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }

  /**
   * Get direction class for CSS
   */
  getDirectionClass() {
    const pack = this.languages.get(this.currentLanguage);
    return pack && pack.isRTL ? 'rtl-mode' : 'ltr-mode';
  }

  /**
   * Initialize language selector UI
   */
  initializeLanguageSelector(containerId = 'language-selector') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    const languages = this.getAvailableLanguages();

    languages.forEach(lang => {
      const button = document.createElement('button');
      button.className = 'lang-btn';
      button.textContent = lang.nativeName;
      button.dataset.lang = lang.code;
      button.type = 'button';
      
      if (lang.code === this.currentLanguage) {
        button.classList.add('active');
      }

      button.addEventListener('click', async (e) => {
        const selectedLang = e.target.dataset.lang;
        await this.switchLanguage(selectedLang);
        
        // Update active state
        document.querySelectorAll('.lang-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.lang === selectedLang);
        });
      });

      container.appendChild(button);
    });
  }

  /**
   * Get English translations
   */
  getEnglishTranslations() {
    return {
      _meta: {
        name: 'English',
        nativeName: 'English',
        isRTL: false
      },
      _strings: {
        // Platform name (immutable)
        'platform_name': 'ZeroForums0',
        
        // Navigation
        'nav_home': 'Home',
        'nav_chat': 'Chat',
        'nav_forum': 'Forum',
        'nav_profile': 'Profile',
        'nav_settings': 'Settings',
        'nav_logout': 'Logout',
        
        // Authentication
        'auth_register': 'Register',
        'auth_login': 'Login',
        'auth_username': 'Username',
        'auth_profile_image': 'Profile Image',
        'auth_captcha': 'CAPTCHA',
        'auth_register_btn': 'Create Account',
        'auth_login_btn': 'Sign In',
        'auth_already_account': 'Already have an account?',
        'auth_no_account': 'Don\'t have an account?',
        
        // Chat
        'chat_title': 'Encrypted Chat',
        'chat_new_conversation': 'New Conversation',
        'chat_search': 'Search conversations...',
        'chat_message_placeholder': 'Type your encrypted message...',
        'chat_send': 'Send',
        'chat_attach': 'Attach',
        'chat_voice': 'Voice',
        'chat_gps': 'Share Location',
        'chat_delete': 'Delete for Everyone',
        'chat_group': 'Group Chat',
        'chat_invite': 'Invite Code',
        'chat_admin': 'Admin',
        'chat_user': 'User',
        
        // Forum
        'forum_title': 'Encrypted Forum',
        'forum_new_post': 'New Post',
        'forum_search': 'Search posts...',
        'forum_title_placeholder': 'Post title...',
        'forum_content_placeholder': 'Write your encrypted post...',
        'forum_tags': 'Tags',
        'forum_reply': 'Reply',
        'forum_replies': 'Replies',
        'forum_attachments': 'Attachments',
        
        // Security
        'security_wipe': 'Wipe Everything',
        'security_wipe_confirm': 'This will permanently delete all your data. Type "WIPE_EVERYTHING" to confirm.',
        'security_locked': 'Account Locked',
        'security_locked_msg': 'Too many failed attempts. Try again later.',
        'security_captcha': 'Complete the challenge',
        
        // Messages
        'msg_welcome': 'Welcome to ZeroForums0',
        'msg_encrypted': 'All messages are end-to-end encrypted',
        'msg_no_conversations': 'No conversations yet',
        'msg_no_posts': 'No posts yet',
        'msg_loading': 'Loading...',
        'msg_error': 'An error occurred',
        'msg_success': 'Success',
        
        // Errors
        'error_username_taken': 'Username is already taken',
        'error_username_invalid': 'Username must be 3-50 characters',
        'error_captcha_invalid': 'CAPTCHA validation failed',
        'error_login_failed': 'Login failed',
        'error_session_expired': 'Session expired, please login again',
        'error_network': 'Network error, please try again',
        
        // Footer
        'footer_developed_by': 'Developed By Sherlock',
        'footer_telegram': 'Telegram: @tx_5w',
        'footer_instagram': 'Instagram: @j.86vb',
        'footer_tiktok': 'TikTok: @default_room105'
      }
    };
  }

  /**
   * Get Arabic translations
   */
  getArabicTranslations() {
    return {
      _meta: {
        name: 'Arabic',
        nativeName: 'العربية',
        isRTL: true
      },
      _strings: {
        // Platform name (immutable)
        'platform_name': 'ZeroForums0',
        
        // Navigation
        'nav_home': 'الرئيسية',
        'nav_chat': 'الدردشة',
        'nav_forum': 'المنتدى',
        'nav_profile': 'الملف الشخصي',
        'nav_settings': 'الإعدادات',
        'nav_logout': 'تسجيل الخروج',
        
        // Authentication
        'auth_register': 'تسجيل',
        'auth_login': 'تسجيل الدخول',
        'auth_username': 'اسم المستخدم',
        'auth_profile_image': 'صورة الملف الشخصي',
        'auth_captcha': 'التحقق من الإنسان',
        'auth_register_btn': 'إنشاء حساب',
        'auth_login_btn': 'تسجيل الدخول',
        'auth_already_account': 'هل لديك حساب مسبقًا؟',
        'auth_no_account': 'ليس لديك حساب؟',
        
        // Chat
        'chat_title': 'الدردشة المشفرة',
        'chat_new_conversation': 'محادثة جديدة',
        'chat_search': 'البحث في المحادثات...',
        'chat_message_placeholder': 'اكتب رسالتك المشفرة...',
        'chat_send': 'إرسال',
        'chat_attach': 'إرفاق',
        'chat_voice': 'صوت',
        'chat_gps': 'مشاركة الموقع',
        'chat_delete': 'حذف للجميع',
        'chat_group': 'دردشة جماعية',
        'chat_invite': 'رمز الدعوة',
        'chat_admin': 'مسؤول',
        'chat_user': 'مستخدم',
        
        // Forum
        'forum_title': 'المنتدى المشفر',
        'forum_new_post': 'منشور جديد',
        'forum_search': 'البحث في المنشورات...',
        'forum_title_placeholder': 'عنوان المنشور...',
        'forum_content_placeholder': 'اكتب منشورك المشفر...',
        'forum_tags': 'الوسوم',
        'forum_reply': 'رد',
        'forum_replies': 'الردود',
        'forum_attachments': 'المرفقات',
        
        // Security
        'security_wipe': 'مسح كل شيء',
        'security_wipe_confirm': 'هذا سيحذف جميع بياناتك بشكل دائم. اكتب "WIPE_EVERYTHING" للتأكيد.',
        'security_locked': 'الحساب مقفل',
        'security_locked_msg': 'عدد كبير من المحاولات الفاشلة. حاول مرة أخرى لاحقًا.',
        'security_captcha': 'أكمل التحدي',
        
        // Messages
        'msg_welcome': 'مرحبًا بكم في ZeroForums0',
        'msg_encrypted': 'جميع الرسائل مشفرة من طرف إلى طرف',
        'msg_no_conversations': 'لا توجد محادثات بعد',
        'msg_no_posts': 'لا توجد منشورات بعد',
        'msg_loading': 'جارٍ التحميل...',
        'msg_error': 'حدث خطأ ما',
        'msg_success': 'نجاح',
        
        // Errors
        'error_username_taken': 'اسم المستخدم مأخوذ مسبقًا',
        'error_username_invalid': 'يجب أن يكون اسم المستخدم من 3 إلى 50 حرفًا',
        'error_captcha_invalid': 'فشل التحقق من CAPTCHA',
        'error_login_failed': 'فشل تسجيل الدخول',
        'error_session_expired': 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى',
        'error_network': 'خطأ في الشبكة، يرجى المحاولة مرة أخرى',
        
        // Footer
        'footer_developed_by': 'تم التطوير بواسطة Sherlock',
        'footer_telegram': 'تيليجرام: @tx_5w',
        'footer_instagram': 'إنستغرام: @j.86vb',
        'footer_tiktok': 'تيك توك: @default_room105'
      }
    };
  }

  /**
   * Get Chinese translations
   */
  getChineseTranslations() {
    return {
      _meta: {
        name: 'Chinese',
        nativeName: '中文',
        isRTL: false
      },
      _strings: {
        // Platform name (immutable)
        'platform_name': 'ZeroForums0',
        
        // Navigation
        'nav_home': '首页',
        'nav_chat': '聊天',
        'nav_forum': '论坛',
        'nav_profile': '个人资料',
        'nav_settings': '设置',
        'nav_logout': '退出登录',
        
        // Authentication
        'auth_register': '注册',
        'auth_login': '登录',
        'auth_username': '用户名',
        'auth_profile_image': '头像',
        'auth_captcha': '验证码',
        'auth_register_btn': '创建账户',
        'auth_login_btn': '登录',
        'auth_already_account': '已有账户？',
        'auth_no_account': '没有账户？',
        
        // Chat
        'chat_title': '加密聊天',
        'chat_new_conversation': '新对话',
        'chat_search': '搜索对话...',
        'chat_message_placeholder': '输入您的加密消息...',
        'chat_send': '发送',
        'chat_attach': '附件',
        'chat_voice': '语音',
        'chat_gps': '分享位置',
        'chat_delete': '为所有人删除',
        'chat_group': '群聊',
        'chat_invite': '邀请码',
        'chat_admin': '管理员',
        'chat_user': '用户',
        
        // Forum
        'forum_title': '加密论坛',
        'forum_new_post': '新帖子',
        'forum_search': '搜索帖子...',
        'forum_title_placeholder': '帖子标题...',
        'forum_content_placeholder': '编写您的加密帖子...',
        'forum_tags': '标签',
        'forum_reply': '回复',
        'forum_replies': '回复',
        'forum_attachments': '附件',
        
        // Security
        'security_wipe': '清除所有内容',
        'security_wipe_confirm': '这将永久删除您的所有数据。输入"WIPE_EVERYTHING"以确认。',
        'security_locked': '账户已锁定',
        'security_locked_msg': '登录失败次数过多。请稍后再试。',
        'security_captcha': '完成验证',
        
        // Messages
        'msg_welcome': '欢迎来到ZeroForums0',
        'msg_encrypted': '所有消息均为端到端加密',
        'msg_no_conversations': '暂无对话',
        'msg_no_posts': '暂无帖子',
        'msg_loading': '加载中...',
        'msg_error': '发生错误',
        'msg_success': '成功',
        
        // Errors
        'error_username_taken': '用户名已被占用',
        'error_username_invalid': '用户名必须为3-50个字符',
        'error_captcha_invalid': '验证码验证失败',
        'error_login_failed': '登录失败',
        'error_session_expired': '会话已过期，请重新登录',
        'error_network': '网络错误，请重试',
        
        // Footer
        'footer_developed_by': '开发者：Sherlock',
        'footer_telegram': 'Telegram: @tx_5w',
        'footer_instagram': 'Instagram: @j.86vb',
        'footer_tiktok': 'TikTok: @default_room105'
      }
    };
  }

  /**
   * Get Russian translations
   */
  getRussianTranslations() {
    return {
      _meta: {
        name: 'Russian',
        nativeName: 'Русский',
        isRTL: false
      },
      _strings: {
        // Platform name (immutable)
        'platform_name': 'ZeroForums0',
        
        // Navigation
        'nav_home': 'Главная',
        'nav_chat': 'Чат',
        'nav_forum': 'Форум',
        'nav_profile': 'Профиль',
        'nav_settings': 'Настройки',
        'nav_logout': 'Выйти',
        
        // Authentication
        'auth_register': 'Регистрация',
        'auth_login': 'Вход',
        'auth_username': 'Имя пользователя',
        'auth_profile_image': 'Аватар',
        'auth_captcha': 'CAPTCHA',
        'auth_register_btn': 'Создать аккаунт',
        'auth_login_btn': 'Войти',
        'auth_already_account': 'Уже есть аккаунт?',
        'auth_no_account': 'Нет аккаунта?',
        
        // Chat
        'chat_title': 'Шифрованный чат',
        'chat_new_conversation': 'Новый разговор',
        'chat_search': 'Поиск по разговорам...',
        'chat_message_placeholder': 'Введите ваше зашифрованное сообщение...',
        'chat_send': 'Отправить',
        'chat_attach': 'Прикрепить',
        'chat_voice': 'Голос',
        'chat_gps': 'Поделиться местоположением',
        'chat_delete': 'Удалить для всех',
        'chat_group': 'Групповой чат',
        'chat_invite': 'Код приглашения',
        'chat_admin': 'Администратор',
        'chat_user': 'Пользователь',
        
        // Forum
        'forum_title': 'Шифрованный форум',
        'forum_new_post': 'Новая запись',
        'forum_search': 'Поиск записей...',
        'forum_title_placeholder': 'Заголовок записи...',
        'forum_content_placeholder': 'Напишите вашу зашифрованную запись...',
        'forum_tags': 'Теги',
        'forum_reply': 'Ответить',
        'forum_replies': 'Ответы',
        'forum_attachments': 'Вложения',
        
        // Security
        'security_wipe': 'Очистить всё',
        'security_wipe_confirm': 'Это навсегда удалит все ваши данные. Введите "WIPE_EVERYTHING" для подтверждения.',
        'security_locked': 'Аккаунт заблокирован',
        'security_locked_msg': 'Слишком много неудачных попыток входа. Попробуйте позже.',
        'security_captcha': 'Пройдите проверку',
        
        // Messages
        'msg_welcome': 'Добро пожаловать в ZeroForums0',
        'msg_encrypted': 'Все сообщения зашифрованы сквозным шифрованием',
        'msg_no_conversations': 'Пока нет разговоров',
        'msg_no_posts': 'Пока нет записей',
        'msg_loading': 'Загрузка...',
        'msg_error': 'Произошла ошибка',
        'msg_success': 'Успешно',
        
        // Errors
        'error_username_taken': 'Имя пользователя уже занято',
        'error_username_invalid': 'Имя пользователя должно быть от 3 до 50 символов',
        'error_captcha_invalid': 'Проверка CAPTCHA не пройдена',
        'error_login_failed': 'Ошибка входа',
        'error_session_expired': 'Сессия истекла, пожалуйста, войдите снова',
        'error_network': 'Ошибка сети, пожалуйста, попробуйте еще раз',
        
        // Footer
        'footer_developed_by': 'Разработано Sherlock',
        'footer_telegram': 'Telegram: @tx_5w',
        'footer_instagram': 'Instagram: @j.86vb',
        'footer_tiktok': 'TikTok: @default_room105'
      }
    };
  }
}

// Export singleton instance
export const i18nInstance = new i18n();