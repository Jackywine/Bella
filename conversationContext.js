// conversationContext.js - Bella's Conversation Context Management System
// This module manages conversation history, session state, and context for natural dialogue flow

class ConversationContext {
    constructor(options = {}) {
        this.maxHistoryLength = options.maxHistoryLength || 10; // Keep last 10 exchanges
        this.maxContextAge = options.maxContextAge || 30 * 60 * 1000; // 30 minutes
        this.sessionId = this.generateSessionId();
        this.conversationHistory = [];
        this.sessionMetadata = {
            startTime: Date.now(),
            lastActivity: Date.now(),
            messageCount: 0,
            currentMode: 'casual'
        };
        this.contextKeywords = new Set(); // Track important keywords from conversation
        this.userPreferences = new Map(); // Track user preferences discovered during conversation
    }

    // Generate unique session ID
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Add message to conversation history
    addMessage(role, content, metadata = {}) {
        const message = {
            id: this.generateMessageId(),
            role, // 'user' or 'assistant'
            content,
            timestamp: Date.now(),
            metadata: {
                processingTime: metadata.processingTime || null,
                provider: metadata.provider || null,
                mode: metadata.mode || this.sessionMetadata.currentMode,
                ...metadata
            }
        };

        this.conversationHistory.push(message);
        this.sessionMetadata.lastActivity = Date.now();
        this.sessionMetadata.messageCount++;

        // Extract keywords and preferences
        this.extractContextualInformation(role, content);

        // Maintain history length limit
        this.trimHistory();

        return message.id;
    }

    // Generate unique message ID
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // Extract contextual information from messages
    extractContextualInformation(role, content) {
        if (role === 'user') {
            // Extract keywords from user messages
            const words = content.toLowerCase().match(/\b\w{3,}\b/g) || [];
            words.forEach(word => {
                if (!this.isStopWord(word)) {
                    this.contextKeywords.add(word);
                }
            });

            // Detect user preferences
            this.detectUserPreferences(content);
        }
    }

    // Check if word is a stop word (common words to ignore)
    isStopWord(word) {
        const stopWords = new Set([
            'the', 'and', 'but', 'for', 'are', 'with', 'his', 'they', 'this', 'have',
            'from', 'not', 'been', 'more', 'her', 'were', 'said', 'each', 'which',
            'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other'
        ]);
        return stopWords.has(word);
    }

    // Detect user preferences from conversation
    detectUserPreferences(content) {
        const lowerContent = content.toLowerCase();
        
        // Detect language preference
        if (lowerContent.includes('中文') || lowerContent.includes('chinese')) {
            this.userPreferences.set('language', 'chinese');
        } else if (lowerContent.includes('english')) {
            this.userPreferences.set('language', 'english');
        }

        // Detect interaction style preferences
        if (lowerContent.includes('formal') || lowerContent.includes('professional')) {
            this.userPreferences.set('style', 'formal');
        } else if (lowerContent.includes('casual') || lowerContent.includes('friendly')) {
            this.userPreferences.set('style', 'casual');
        }

        // Detect topic interests
        const topics = ['technology', 'science', 'art', 'music', 'sports', 'cooking', 'travel'];
        topics.forEach(topic => {
            if (lowerContent.includes(topic)) {
                const interests = this.userPreferences.get('interests') || new Set();
                interests.add(topic);
                this.userPreferences.set('interests', interests);
            }
        });
    }

    // Trim conversation history to maintain performance
    trimHistory() {
        if (this.conversationHistory.length > this.maxHistoryLength * 2) {
            // Keep the most recent messages
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
        }

        // Remove old context keywords (keep only from recent messages)
        if (this.contextKeywords.size > 50) {
            // Clear old keywords and rebuild from recent messages
            this.contextKeywords.clear();
            const recentMessages = this.conversationHistory.slice(-10);
            recentMessages.forEach(msg => {
                if (msg.role === 'user') {
                    this.extractContextualInformation(msg.role, msg.content);
                }
            });
        }
    }

    // Get conversation context for AI processing
    getContextForThinking(includeSystemPrompt = true) {
        const context = {
            sessionId: this.sessionId,
            conversationHistory: this.getRecentHistory(),
            contextKeywords: Array.from(this.contextKeywords),
            userPreferences: Object.fromEntries(this.userPreferences),
            sessionMetadata: { ...this.sessionMetadata },
            contextSummary: this.generateContextSummary()
        };

        if (includeSystemPrompt) {
            context.systemPrompt = this.generateContextualSystemPrompt();
        }

        return context;
    }

    // Get recent conversation history
    getRecentHistory(messageCount = this.maxHistoryLength) {
        return this.conversationHistory
            .slice(-messageCount * 2) // Get last N exchanges (user + assistant pairs)
            .map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                mode: msg.metadata.mode
            }));
    }

    // Generate contextual summary
    generateContextSummary() {
        if (this.conversationHistory.length === 0) {
            return 'New conversation session started.';
        }

        const recentMessages = this.conversationHistory.slice(-6);
        const userMessages = recentMessages.filter(msg => msg.role === 'user');
        const topics = Array.from(this.contextKeywords).slice(0, 5);
        
        let summary = `Ongoing conversation with ${userMessages.length} recent user messages.`;
        
        if (topics.length > 0) {
            summary += ` Discussion topics include: ${topics.join(', ')}.`;
        }

        if (this.userPreferences.size > 0) {
            const prefs = Array.from(this.userPreferences.entries())
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            summary += ` User preferences: ${prefs}.`;
        }

        return summary;
    }

    // Generate contextual system prompt
    generateContextualSystemPrompt() {
        let prompt = `You are Bella, a warm and intelligent AI assistant. This is an ongoing conversation.`;
        
        // Add context about conversation history
        if (this.conversationHistory.length > 0) {
            prompt += ` You have been chatting with this user for ${this.sessionMetadata.messageCount} messages.`;
        }

        // Add user preferences
        if (this.userPreferences.has('style')) {
            const style = this.userPreferences.get('style');
            prompt += ` The user prefers a ${style} communication style.`;
        }

        if (this.userPreferences.has('language')) {
            const language = this.userPreferences.get('language');
            prompt += ` The user has shown preference for ${language} language.`;
        }

        // Add context keywords for topic awareness
        if (this.contextKeywords.size > 0) {
            const recentTopics = Array.from(this.contextKeywords).slice(0, 5);
            prompt += ` Recent conversation topics: ${recentTopics.join(', ')}.`;
        }

        prompt += ` Maintain conversation continuity and refer to previous exchanges when relevant.`;
        
        return prompt;
    }

    // Check if context is still valid (not expired)
    isContextValid() {
        const age = Date.now() - this.sessionMetadata.lastActivity;
        return age < this.maxContextAge;
    }

    // Update conversation mode
    setMode(mode) {
        if (['casual', 'assistant', 'creative'].includes(mode)) {
            this.sessionMetadata.currentMode = mode;
            this.sessionMetadata.lastActivity = Date.now();
            return true;
        }
        return false;
    }

    // Get current conversation mode
    getMode() {
        return this.sessionMetadata.currentMode;
    }

    // Clear conversation history but keep session metadata
    clearHistory() {
        this.conversationHistory = [];
        this.contextKeywords.clear();
        this.userPreferences.clear();
        this.sessionMetadata.messageCount = 0;
        this.sessionMetadata.lastActivity = Date.now();
        
        console.log(`Conversation history cleared for session ${this.sessionId}`);
    }

    // Start new session (complete reset)
    startNewSession() {
        const oldSessionId = this.sessionId;
        this.sessionId = this.generateSessionId();
        this.conversationHistory = [];
        this.contextKeywords.clear();
        this.userPreferences.clear();
        this.sessionMetadata = {
            startTime: Date.now(),
            lastActivity: Date.now(),
            messageCount: 0,
            currentMode: 'casual'
        };
        
        console.log(`New session started: ${this.sessionId} (previous: ${oldSessionId})`);
        return this.sessionId;
    }

    // Get session statistics
    getSessionStats() {
        const sessionDuration = Date.now() - this.sessionMetadata.startTime;
        const avgResponseTime = this.conversationHistory
            .filter(msg => msg.metadata.processingTime)
            .reduce((sum, msg, _, arr) => sum + msg.metadata.processingTime / arr.length, 0);

        return {
            sessionId: this.sessionId,
            duration: sessionDuration,
            messageCount: this.sessionMetadata.messageCount,
            averageResponseTime: Math.round(avgResponseTime) || 0,
            contextKeywords: this.contextKeywords.size,
            userPreferences: this.userPreferences.size,
            isActive: this.isContextValid(),
            currentMode: this.sessionMetadata.currentMode
        };
    }

    // Export conversation for analysis or backup
    exportConversation() {
        return {
            sessionId: this.sessionId,
            sessionMetadata: this.sessionMetadata,
            conversationHistory: this.conversationHistory,
            contextKeywords: Array.from(this.contextKeywords),
            userPreferences: Object.fromEntries(this.userPreferences),
            exportTimestamp: Date.now()
        };
    }

    // Import conversation from backup
    importConversation(data) {
        if (!data || !data.sessionId) {
            throw new Error('Invalid conversation data');
        }

        this.sessionId = data.sessionId;
        this.sessionMetadata = data.sessionMetadata || this.sessionMetadata;
        this.conversationHistory = data.conversationHistory || [];
        this.contextKeywords = new Set(data.contextKeywords || []);
        this.userPreferences = new Map(Object.entries(data.userPreferences || {}));

        console.log(`Conversation imported for session ${this.sessionId}`);
    }
}

// ES6 module export
export { ConversationContext };