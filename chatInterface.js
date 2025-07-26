// chatInterface.js - 贝拉的聊天界面组件
// 这个模块负责创建和管理优雅的聊天界面，体现贝拉的温暖个性

class ChatInterface {
    constructor() {
        this.isVisible = false;
        this.messages = [];
        this.maxMessages = 50; // 最多显示50条消息
        this.chatContainer = null;
        this.messageContainer = null;
        this.inputContainer = null;
        this.messageInput = null;
        this.sendButton = null;
        this.toggleButton = null;
        this.settingsPanel = null;
        this.isSettingsVisible = false;
        
        this.init();
    }

    // 初始化聊天界面
    init() {
        this.createChatContainer();
        this.createToggleButton();
        this.createSettingsPanel();
        this.bindEvents();
        this.addWelcomeMessage();
        
        // Listen for language changes
        if (window.i18n) {
            const originalSetLanguage = window.i18n.setLanguage.bind(window.i18n);
            window.i18n.setLanguage = (lang) => {
                originalSetLanguage(lang);
                this.updateInterfaceLanguage();
            };
        }
    }

    // Update interface text based on current language
    updateInterfaceLanguage() {
        if (!window.i18n) return;
        
        // Update chat header
        const titleText = this.chatContainer.querySelector('.bella-title-text h3');
        const statusText = this.chatContainer.querySelector('.bella-status');
        
        if (titleText) {
            titleText.textContent = window.i18n.t('chat.title');
        }
        if (statusText) {
            statusText.textContent = window.i18n.t('chat.status');
        }
        
        // Update input placeholder
        if (this.messageInput) {
            this.messageInput.placeholder = window.i18n.t('chat.input_placeholder');
        }
        
        // Update input hint
        const inputHint = this.chatContainer.querySelector('.bella-input-hint');
        if (inputHint) {
            inputHint.textContent = window.i18n.t('chat.input_hint');
        }
        
        // Update toggle button text
        const toggleText = this.toggleButton.querySelector('.bella-toggle-text');
        if (toggleText) {
            toggleText.textContent = window.i18n.t('chat.toggle_text');
        }
        
        // Update buttons tooltips
        const settingsBtn = this.chatContainer.querySelector('.bella-settings-btn');
        const minimizeBtn = this.chatContainer.querySelector('.bella-minimize-btn');
        const sendBtn = this.chatContainer.querySelector('.bella-send-btn');
        
        if (settingsBtn) {
            settingsBtn.title = window.i18n.t('chat.settings');
        }
        if (minimizeBtn) {
            minimizeBtn.title = window.i18n.t('chat.minimize');
        }
        if (sendBtn) {
            sendBtn.title = window.i18n.t('app.chat_button');
        }
        
        // Update settings panel
        this.updateSettingsLanguage();
    }

    // 创建聊天容器
    createChatContainer() {
        // 主聊天容器
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'bella-chat-container';
        this.chatContainer.innerHTML = `
            <div class="bella-chat-header">
                <div class="bella-chat-title">
                    <div class="bella-avatar">💝</div>
                    <div class="bella-title-text">
                        <h3>벨라</h3>
                        <span class="bella-status">온라인</span>
                    </div>
                </div>
                <div class="bella-chat-controls">
                    <button class="bella-settings-btn" title="설정">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="bella-minimize-btn" title="최소화">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </div>
            <div class="bella-chat-messages"></div>
            <div class="bella-chat-input-container">
                <div class="bella-input-wrapper">
                    <input type="text" class="bella-message-input" placeholder="벨라와 대화해보세요..." maxlength="500">
                    <button class="bella-send-btn" title="전송">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="bella-input-hint">
                    Enter 키로 전송, Shift + Enter 키로 줄바꿈
                </div>
            </div>
        `;

        // 获取关键元素引用
        this.messageContainer = this.chatContainer.querySelector('.bella-chat-messages');
        this.inputContainer = this.chatContainer.querySelector('.bella-chat-input-container');
        this.messageInput = this.chatContainer.querySelector('.bella-message-input');
        this.sendButton = this.chatContainer.querySelector('.bella-send-btn');
        
        document.body.appendChild(this.chatContainer);
    }

    // 创建切换按钮
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'bella-chat-toggle';
        this.toggleButton.innerHTML = `
            <div class="bella-toggle-icon">
                <i class="fas fa-comments"></i>
            </div>
            <div class="bella-toggle-text">벨라와 채팅</div>
        `;
        this.toggleButton.title = '채팅 창 열기';
        
        document.body.appendChild(this.toggleButton);
    }

    // 创建设置面板
    createSettingsPanel() {
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.className = 'bella-settings-panel';
        this.settingsPanel.innerHTML = `
            <div class="bella-settings-header">
                <h4>채팅 설정</h4>
                <button class="bella-settings-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="bella-settings-content">
                <div class="bella-setting-group">
                    <label>AI 서비스 제공업체</label>
                    <select class="bella-provider-select">
                        <option value="local">로컴 모델</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="qwen">통의천문</option>
                        <option value="ernie">문심일언</option>
                        <option value="glm">지보AI</option>
                    </select>
                </div>
                <div class="bella-setting-group bella-api-key-group" style="display: none;">
                    <label>API 키</label>
                    <input type="password" class="bella-api-key-input" placeholder="API 키를 입력하세요">
                    <button class="bella-api-key-save">저장</button>
                </div>
                <div class="bella-setting-group">
                    <label>채팅 모드</label>
                    <select class="bella-mode-select">
                        <option value="casual">편안한 대화</option>
                        <option value="assistant">스마트 어시스턴트</option>
                        <option value="creative">창의적 파트너</option>
                    </select>
                </div>
                <div class="bella-setting-group">
                    <button class="bella-clear-history">채팅 기록 삭제</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.settingsPanel);
    }

    // 绑定事件
    bindEvents() {
        // 切换聊天窗口
        this.toggleButton.addEventListener('click', () => {
            this.toggle();
        });

        // 最小化按钮
        this.chatContainer.querySelector('.bella-minimize-btn').addEventListener('click', () => {
            this.hide();
        });

        // 设置按钮
        this.chatContainer.querySelector('.bella-settings-btn').addEventListener('click', () => {
            this.toggleSettings();
        });

        // 发送消息
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框事件
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 输入框自动调整高度
        this.messageInput.addEventListener('input', () => {
            this.adjustInputHeight();
        });

        // 设置面板事件
        this.bindSettingsEvents();
    }

    // Update settings panel language
    updateSettingsLanguage() {
        if (!window.i18n) return;
        
        // Update settings header
        const settingsTitle = this.settingsPanel.querySelector('.bella-settings-header h4');
        if (settingsTitle) {
            settingsTitle.textContent = window.i18n.t('settings.title');
        }
        
        // Update labels and options
        const labels = this.settingsPanel.querySelectorAll('label');
        if (labels.length >= 2) {
            labels[0].textContent = window.i18n.t('settings.provider_label');
            labels[1].textContent = window.i18n.t('settings.api_key_label');
            if (labels[2]) labels[2].textContent = window.i18n.t('settings.chat_mode_label');
        }
        
        // Update provider options
        const providerOptions = this.settingsPanel.querySelectorAll('.bella-provider-select option');
        if (providerOptions.length >= 5) {
            providerOptions[0].textContent = window.i18n.t('settings.provider_local');
            providerOptions[1].textContent = window.i18n.t('settings.provider_openai');
            providerOptions[2].textContent = window.i18n.t('settings.provider_qwen');
            providerOptions[3].textContent = window.i18n.t('settings.provider_ernie');
            providerOptions[4].textContent = window.i18n.t('settings.provider_glm');
        }
        
        // Update mode options
        const modeOptions = this.settingsPanel.querySelectorAll('.bella-mode-select option');
        if (modeOptions.length >= 3) {
            modeOptions[0].textContent = window.i18n.t('settings.mode_casual');
            modeOptions[1].textContent = window.i18n.t('settings.mode_assistant');
            modeOptions[2].textContent = window.i18n.t('settings.mode_creative');
        }
        
        // Update buttons
        const apiKeySaveBtn = this.settingsPanel.querySelector('.bella-api-key-save');
        const clearHistoryBtn = this.settingsPanel.querySelector('.bella-clear-history');
        const apiKeyInput = this.settingsPanel.querySelector('.bella-api-key-input');
        
        if (apiKeySaveBtn) {
            apiKeySaveBtn.textContent = window.i18n.t('settings.api_key_save');
        }
        if (clearHistoryBtn) {
            clearHistoryBtn.textContent = window.i18n.t('settings.clear_history');
        }
        if (apiKeyInput) {
            apiKeyInput.placeholder = window.i18n.t('settings.api_key_placeholder');
        }
    }
    
    // 바인드 설정 패널 이벤트
    bindSettingsEvents() {
        // 关闭设置面板
        this.settingsPanel.querySelector('.bella-settings-close').addEventListener('click', () => {
            this.hideSettings();
        });

        // 提供商选择
        const providerSelect = this.settingsPanel.querySelector('.bella-provider-select');
        const apiKeyGroup = this.settingsPanel.querySelector('.bella-api-key-group');
        
        providerSelect.addEventListener('change', (e) => {
            const provider = e.target.value;
            if (provider === 'local') {
                apiKeyGroup.style.display = 'none';
            } else {
                apiKeyGroup.style.display = 'block';
            }
            
            // 触发提供商切换事件
            this.onProviderChange?.(provider);
        });

        // API密钥保存
        this.settingsPanel.querySelector('.bella-api-key-save').addEventListener('click', () => {
            const provider = providerSelect.value;
            const apiKey = this.settingsPanel.querySelector('.bella-api-key-input').value;
            
            if (apiKey.trim()) {
                this.onAPIKeySave?.(provider, apiKey.trim());
                this.showNotification(window.i18n ? window.i18n.t('settings.api_key_saved') : 'API 키가 저장되었습니다', 'success');
            }
        });

        // 清除聊天记录
        this.settingsPanel.querySelector('.bella-clear-history').addEventListener('click', () => {
            this.clearMessages();
            this.onClearHistory?.();
            this.hideSettings();
        });
    }

    // 추가 환영 메시지
    addWelcomeMessage() {
        const welcomeMsg = window.i18n ? window.i18n.t('chat.welcome_message') : '안녕하세요! 저는 벨라, 당신의 AI 동반자예요. 만나서 반가워요! 무엇을 이야기하고 싶으신가요?';
        this.addMessage('assistant', welcomeMsg, true);
    }

    // 切换聊天窗口显示/隐藏
    toggle() {
        console.log('ChatInterface.toggle() 被调用');
        console.log('切换前 isVisible:', this.isVisible);
        
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
        
        console.log('切换后 isVisible:', this.isVisible);
    }

    // 显示聊天窗口
    show() {
        console.log('ChatInterface.show() 被调用');
        console.log('显示前 isVisible:', this.isVisible);
        console.log('显示前 chatContainer.className:', this.chatContainer.className);
        
        this.isVisible = true;
        this.chatContainer.classList.add('visible');
        
        console.log('显示后 isVisible:', this.isVisible);
        console.log('显示后 chatContainer.className:', this.chatContainer.className);
        console.log('chatContainer 计算样式 opacity:', window.getComputedStyle(this.chatContainer).opacity);
        console.log('chatContainer 计算样式 transform:', window.getComputedStyle(this.chatContainer).transform);
        
        this.toggleButton.classList.add('active');
        this.messageInput.focus();
        this.scrollToBottom();
    }

    // 隐藏聊天窗口
    hide() {
        this.isVisible = false;
        this.chatContainer.classList.remove('visible');
        this.toggleButton.classList.remove('active');
        this.hideSettings();
    }

    // 切换设置面板
    toggleSettings() {
        if (this.isSettingsVisible) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }

    // 显示设置面板
    showSettings() {
        this.isSettingsVisible = true;
        this.settingsPanel.classList.add('visible');
    }

    // 隐藏设置面板
    hideSettings() {
        this.isSettingsVisible = false;
        this.settingsPanel.classList.remove('visible');
    }

    // 发送消息
    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text) return;

        // 添加用户消息
        this.addMessage('user', text);
        
        // 清空输入框
        this.messageInput.value = '';
        this.adjustInputHeight();
        
        // 触发消息发送事件
        this.onMessageSend?.(text);
    }

    // 添加消息到聊天界面
    addMessage(role, content, isWelcome = false) {
        const messageElement = document.createElement('div');
        messageElement.className = `bella-message bella-message-${role}`;
        
        if (isWelcome) {
            messageElement.classList.add('bella-welcome-message');
        }

        const timestamp = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div class="bella-message-avatar">
                ${role === 'user' ? '👤' : '💝'}
            </div>
            <div class="bella-message-content">
                <div class="bella-message-text">${this.formatMessage(content)}</div>
                <div class="bella-message-time">${timestamp}</div>
            </div>
        `;

        this.messageContainer.appendChild(messageElement);
        this.messages.push({ role, content, timestamp: Date.now() });

        // 限制消息数量
        if (this.messages.length > this.maxMessages) {
            const oldMessage = this.messageContainer.firstChild;
            if (oldMessage) {
                this.messageContainer.removeChild(oldMessage);
            }
            this.messages.shift();
        }

        // 滚动到底部
        this.scrollToBottom();

        // 添加动画效果
        setTimeout(() => {
            messageElement.classList.add('bella-message-appear');
        }, 10);
    }

    // 格式化消息内容
    formatMessage(content) {
        // 简单的文本格式化，支持换行
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // 显示打字指示器
    showTypingIndicator() {
        const existingIndicator = this.messageContainer.querySelector('.bella-typing-indicator');
        if (existingIndicator) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'bella-typing-indicator';
        typingElement.innerHTML = `
            <div class="bella-message-avatar">💝</div>
            <div class="bella-message-content">
                <div class="bella-typing-dots">
                    <span class="bella-typing-dot"></span>
                    <span class="bella-typing-dot"></span>
                    <span class="bella-typing-dot"></span>
                </div>
            </div>
        `;

        this.messageContainer.appendChild(typingElement);
        this.scrollToBottom();
        
        // 添加显示动画
        setTimeout(() => {
            typingElement.classList.add('bella-typing-show');
        }, 10);
    }

    // 隐藏打字指示器
    hideTypingIndicator() {
        const indicator = this.messageContainer.querySelector('.bella-typing-indicator');
        if (indicator) {
            this.messageContainer.removeChild(indicator);
        }
    }

    // 清除所有消息
    clearMessages() {
        this.messageContainer.innerHTML = '';
        this.messages = [];
        this.addWelcomeMessage();
    }

    // 滚动到底部
    scrollToBottom() {
        setTimeout(() => {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }, 10);
    }

    // 调整输入框高度
    adjustInputHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `bella-notification bella-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('bella-notification-show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('bella-notification-show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 检查聊天窗口是否可见
    getVisibility() {
        return this.isVisible;
    }

    // 设置回调函数
    onMessageSend = null;
    onProviderChange = null;
    onAPIKeySave = null;
    onClearHistory = null;
}

// ES6模块导出
export { ChatInterface };