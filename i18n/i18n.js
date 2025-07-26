class I18n {
    constructor() {
        this.currentLanguage = 'zh-CN';
        this.translations = {};
        this.supportedLanguages = ['en', 'zh-CN', 'ko'];
        this.init();
    }

    async init() {
        await this.loadTranslations();
        this.setLanguage(this.getStoredLanguage() || this.getBrowserLanguage());
    }

    async loadTranslations() {
        for (const lang of this.supportedLanguages) {
            try {
                const response = await fetch(`./i18n/${lang}.json`);
                this.translations[lang] = await response.json();
            } catch (error) {
                console.error(`Failed to load translations for ${lang}:`, error);
            }
        }
    }

    getBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('ko')) return 'ko';
        if (browserLang.startsWith('zh')) return 'zh-CN';
        return 'en';
    }

    getStoredLanguage() {
        return localStorage.getItem('bella-language');
    }

    setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            lang = 'en';
        }
        this.currentLanguage = lang;
        localStorage.setItem('bella-language', lang);
        this.updateUI();
        this.updateSpeechRecognition();
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                value = null;
                break;
            }
        }
        
        return value || key;
    }

    updateUI() {
        document.documentElement.lang = this.currentLanguage;
        document.title = this.t('app.title');
        
        // Update main chat button
        const chatButton = document.querySelector('.chat-button span');
        if (chatButton) {
            chatButton.textContent = this.t('app.chat_button');
        }
        
        // Update chat input placeholder
        const chatInput = document.querySelector('#chat-input');
        if (chatInput) {
            chatInput.placeholder = this.t('app.chat_placeholder');
        }
        
        // Update control panel buttons
        const chatToggleBtn = document.querySelector('#chat-toggle-btn span');
        const chatTestBtn = document.querySelector('#chat-test-btn span');
        
        if (chatToggleBtn) {
            chatToggleBtn.textContent = this.t('app.chat_button');
        }
        
        if (chatTestBtn) {
            chatTestBtn.textContent = this.t('app.test');
        }
    }

    updateSpeechRecognition() {
        if (window.recognition) {
            const langMap = {
                'en': 'en-US',
                'zh-CN': 'zh-CN',
                'ko': 'ko-KR'
            };
            window.recognition.lang = langMap[this.currentLanguage] || 'en-US';
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguages() {
        return this.supportedLanguages;
    }
}

window.i18n = new I18n();