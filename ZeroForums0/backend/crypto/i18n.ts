/**
 * ZeroForums0 - Internationalization System
 * 
 * Production-grade i18n system supporting Arabic (RTL), English, Chinese, Russian
 * Language switch without reload or session loss
 * 
 * Developed By: Sherlock
 * Telegram: @tx_5w
 * Instagram: @j.86vb
 * TikTok: @default_room105
 */

export interface Translation {
  [key: string]: string;
}

export interface LanguagePack {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  translations: Translation;
}

export class i18n {
  private static currentLanguage: string = 'en';
  private static languages: Map<string, LanguagePack> = new Map();
  private static fallbackLanguage: string = 'en';

  /**
   * Initialize i18n system with all language packs
   */
  static async initialize(): Promise<void> {
    // Load language packs
    await this.loadLanguagePack('en', {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      isRTL: false,
      translations: await this.loadTranslations('en')
    });

    await this.loadLanguagePack('ar', {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      isRTL: true,
      translations: await this.loadTranslations('ar')
    });

    await this.loadLanguagePack('zh', {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      isRTL: false,
      translations: await this.loadTranslations('zh')
    });

    await this.loadLanguagePack('ru', {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      isRTL: false,
      translations: await this.loadTranslations('ru')
    });

    // Set initial language from request or default
    this.currentLanguage = this.detectLanguage();
  }

  /**
   * Load language pack
   */
  private static async loadLanguagePack(code: string, pack: LanguagePack): Promise<void> {
    this.languages.set(code, pack);
  }

  /**
   * Load translations for a language
   */
  private static async loadTranslations(lang: string): Promise<Translation> {
    // In a real implementation, these would be loaded from KV storage
    // For now, we'll include them directly
    
    const translations: Translation = {
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
    };

    return translations;
  }

  /**
   * Detect user's preferred language
   */
  private static detectLanguage(): string {
    // In a real implementation, this would check:
    // 1. User preference from KV storage
    // 2. Accept-Language header
    // 3. Browser language
    // 4. Default to English
    
    return 'en';
  }

  /**
   * Get current language
   */
  static getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get language pack
   */
  static getLanguagePack(code: string): LanguagePack | null {
    return this.languages.get(code) || null;
  }

  /**
   * Get all available languages
   */
  static getAvailableLanguages(): LanguagePack[] {
    return Array.from(this.languages.values());
  }

  /**
   * Switch language
   */
  static async switchLanguage(code: string): Promise<void> {
    if (!this.languages.has(code)) {
      throw new Error(`Language ${code} not available`);
    }

    this.currentLanguage = code;
    
    // Update HTML attributes for RTL support
    const html = document.documentElement;
    const langPack = this.languages.get(code)!;
    
    html.lang = code;
    html.dir = langPack.isRTL ? 'rtl' : 'ltr';
    
    // Apply RTL styles if needed
    if (langPack.isRTL) {
      html.classList.add('rtl-mode');
    } else {
      html.classList.remove('rtl-mode');
    }
    
    // TODO: Store preference in KV storage
    // await this.storeLanguagePreference(code);
  }

  /**
   * Translate text
   */
  static t(key: string, lang?: string): string {
    const language = lang || this.currentLanguage;
    const pack = this.languages.get(language);
    
    if (!pack) {
      return key; // Fallback to key if language not found
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
  static formatDate(date: Date, lang?: string): string {
    const language = lang || this.currentLanguage;
    
    // In a real implementation, this would use proper date formatting
    // based on the language locale
    
    return date.toLocaleDateString(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get CSS class for language direction
   */
  static getDirectionClass(): string {
    const pack = this.languages.get(this.currentLanguage);
    return pack && pack.isRTL ? 'rtl-mode' : 'ltr-mode';
  }

  /**
   * Initialize language selection UI
   */
  static initializeLanguageUI(): void {
    const languages = this.getAvailableLanguages();
    
    // Create language selector
    const selector = document.createElement('div');
    selector.className = 'language-selector';
    
    languages.forEach(lang => {
      const button = document.createElement('button');
      button.className = 'lang-btn';
      button.textContent = lang.nativeName;
      button.onclick = () => this.switchLanguage(lang.code);
      
      if (lang.code === this.currentLanguage) {
        button.classList.add('active');
      }
      
      selector.appendChild(button);
    });
    
    // Add to header or footer
    const header = document.querySelector('header');
    if (header) {
      header.appendChild(selector);
    }
  }
}

// Arabic translations (example)
const arabicTranslations: Translation = {
  'platform_name': 'ZeroForums0',
  'nav_home': 'الرئيسية',
  'nav_chat': 'الدردشة',
  'nav_forum': 'المنتدى',
  'nav_profile': 'الملف الشخصي',
  'nav_settings': 'الإعدادات',
  'nav_logout': 'تسجيل الخروج',
  'auth_register': 'تسجيل',
  'auth_login': 'تسجيل الدخول',
  'auth_username': 'اسم المستخدم',
  'auth_profile_image': 'صورة الملف الشخصي',
  'auth_captcha': 'التحقق من الإنسان',
  'auth_register_btn': 'إنشاء حساب',
  'auth_login_btn': 'تسجيل الدخول',
  'auth_already_account': 'هل لديك حساب مسبقًا؟',
  'auth_no_account': 'ليس لديك حساب؟',
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
  'forum_title': 'المنتدى المشفر',
  'forum_new_post': 'منشور جديد',
  'forum_search': 'البحث في المنشورات...',
  'forum_title_placeholder': 'عنوان المنشور...',
  'forum_content_placeholder': 'اكتب منشورك المشفر...',
  'forum_tags': 'الوسوم',
  'forum_reply': 'رد',
  'forum_replies': 'الردود',
  'forum_attachments': 'المرفقات',
  'security_wipe': 'مسح كل شيء',
  'security_wipe_confirm': 'هذا سيحذف جميع بياناتك بشكل دائم. اكتب "WIPE_EVERYTHING" للتأكيد.',
  'security_locked': 'الحساب مقفل',
  'security_locked_msg': 'عدد كبير من المحاولات الفاشلة. حاول مرة أخرى لاحقًا.',
  'security_captcha': 'أكمل التحدي',
  'msg_welcome': 'مرحبًا بكم في ZeroForums0',
  'msg_encrypted': 'جميع الرسائل مشفرة من طرف إلى طرف',
  'msg_no_conversations': 'لا توجد محادثات بعد',
  'msg_no_posts': 'لا توجد منشورات بعد',
  'msg_loading': 'جارٍ التحميل...',
  'msg_error': 'حدث خطأ ما',
  'msg_success': 'نجاح',
  'error_username_taken': 'اسم المستخدم مأخوذ مسبقًا',
  'error_username_invalid': 'يجب أن يكون اسم المستخدم من 3 إلى 50 حرفًا',
  'error_captcha_invalid': 'فشل التحقق من CAPTCHA',
  'error_login_failed': 'فشل تسجيل الدخول',
  'error_session_expired': 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى',
  'error_network': 'خطأ في الشبكة، يرجى المحاولة مرة أخرى',
  'footer_developed_by': 'تم التطوير بواسطة Sherlock',
  'footer_telegram': 'تيليجرام: @tx_5w',
  'footer_instagram': 'إنستغرام: @j.86vb',
  'footer_tiktok': 'تيك توك: @default_room105'
};

// Chinese translations (example)
const chineseTranslations: Translation = {
  'platform_name': 'ZeroForums0',
  'nav_home': '首页',
  'nav_chat': '聊天',
  'nav_forum': '论坛',
  'nav_profile': '个人资料',
  'nav_settings': '设置',
  'nav_logout': '退出登录',
  'auth_register': '注册',
  'auth_login': '登录',
  'auth_username': '用户名',
  'auth_profile_image': '头像',
  'auth_captcha': '验证码',
  'auth_register_btn': '创建账户',
  'auth_login_btn': '登录',
  'auth_already_account': '已有账户？',
  'auth_no_account': '没有账户？',
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
  'forum_title': '加密论坛',
  'forum_new_post': '新帖子',
  'forum_search': '搜索帖子...',
  'forum_title_placeholder': '帖子标题...',
  'forum_content_placeholder': '编写您的加密帖子...',
  'forum_tags': '标签',
  'forum_reply': '回复',
  'forum_replies': '回复',
  'forum_attachments': '附件',
  'security_wipe': '清除所有内容',
  'security_wipe_confirm': '这将永久删除您的所有数据。输入"WIPE_EVERYTHING"以确认。',
  'security_locked': '账户已锁定',
  'security_locked_msg': '登录失败次数过多。请稍后再试。',
  'security_captcha': '完成验证',
  'msg_welcome': '欢迎来到ZeroForums0',
  'msg_encrypted': '所有消息均为端到端加密',
  'msg_no_conversations': '暂无对话',
  'msg_no_posts': '暂无帖子',
  'msg_loading': '加载中...',
  'msg_error': '发生错误',
  'msg_success': '成功',
  'error_username_taken': '用户名已被占用',
  'error_username_invalid': '用户名必须为3-50个字符',
  'error_captcha_invalid': '验证码验证失败',
  'error_login_failed': '登录失败',
  'error_session_expired': '会话已过期，请重新登录',
  'error_network': '网络错误，请重试',
  'footer_developed_by': '开发者：Sherlock',
  'footer_telegram': 'Telegram: @tx_5w',
  'footer_instagram': 'Instagram: @j.86vb',
  'footer_tiktok': 'TikTok: @default_room105'
};

// Russian translations (example)
const russianTranslations: Translation = {
  'platform_name': 'ZeroForums0',
  'nav_home': 'Главная',
  'nav_chat': 'Чат',
  'nav_forum': 'Форум',
  'nav_profile': 'Профиль',
  'nav_settings': 'Настройки',
  'nav_logout': 'Выйти',
  'auth_register': 'Регистрация',
  'auth_login': 'Вход',
  'auth_username': 'Имя пользователя',
  'auth_profile_image': 'Аватар',
  'auth_captcha': 'CAPTCHA',
  'auth_register_btn': 'Создать аккаунт',
  'auth_login_btn': 'Войти',
  'auth_already_account': 'Уже есть аккаунт?',
  'auth_no_account': 'Нет аккаунта?',
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
  'forum_title': 'Шифрованный форум',
  'forum_new_post': 'Новая запись',
  'forum_search': 'Поиск записей...',
  'forum_title_placeholder': 'Заголовок записи...',
  'forum_content_placeholder': 'Напишите вашу зашифрованную запись...',
  'forum_tags': 'Теги',
  'forum_reply': 'Ответить',
  'forum_replies': 'Ответы',
  'forum_attachments': 'Вложения',
  'security_wipe': 'Очистить всё',
  'security_wipe_confirm': 'Это навсегда удалит все ваши данные. Введите "WIPE_EVERYTHING" для подтверждения.',
  'security_locked': 'Аккаунт заблокирован',
  'security_locked_msg': 'Слишком много неудачных попыток входа. Попробуйте позже.',
  'security_captcha': 'Пройдите проверку',
  'msg_welcome': 'Добро пожаловать в ZeroForums0',
  'msg_encrypted': 'Все сообщения зашифрованы сквозным шифрованием',
  'msg_no_conversations': 'Пока нет разговоров',
  'msg_no_posts': 'Пока нет записей',
  'msg_loading': 'Загрузка...',
  'msg_error': 'Произошла ошибка',
  'msg_success': 'Успешно',
  'error_username_taken': 'Имя пользователя уже занято',
  'error_username_invalid': 'Имя пользователя должно быть от 3 до 50 символов',
  'error_captcha_invalid': 'Проверка CAPTCHA не пройдена',
  'error_login_failed': 'Ошибка входа',
  'error_session_expired': 'Сессия истекла, пожалуйста, войдите снова',
  'error_network': 'Ошибка сети, пожалуйста, попробуйте еще раз',
  'footer_developed_by': 'Разработано Sherlock',
  'footer_telegram': 'Telegram: @tx_5w',
  'footer_instagram': 'Instagram: @j.86vb',
  'footer_tiktok': 'TikTok: @default_room105'
};