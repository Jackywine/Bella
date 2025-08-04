// core.js - Bella's Brain (v3)
// Bella's core AI logic, supporting a hybrid architecture of local models and cloud APIs

import { pipeline, env, AutoTokenizer, AutoModelForSpeechSeq2Seq } from './vendor/transformers.js';
import CloudAPIService from './cloudAPI.js';
import { ConversationContext } from './conversationContext.js';

// Local model configuration
env.allowLocalModels = true;
env.useBrowserCache = false;
env.allowRemoteModels = false;
env.backends.onnx.logLevel = 'verbose';
env.localModelPath = './models/';


class BellaAI {
    static instance = null;

    static async getInstance() {
        if (this.instance === null) {
            this.instance = new BellaAI();
            await this.instance.init();
        }
        return this.instance;
    }

    constructor() {
        this.cloudAPI = new CloudAPIService();
        this.useCloudAPI = false; // Default to using local model
        this.currentMode = 'casual'; // Chat modes: casual, assistant, creative
        this.conversationContext = new ConversationContext({
            maxHistoryLength: 10,
            maxContextAge: 30 * 60 * 1000 // 30 minutes
        });
    }

    async init() {
        console.log('Initializing Bella\'s core AI...');
        
        // Priority loading of LLM model (chat functionality)
        try {
            console.log('Loading LLM model...');
            this.llm = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M');
            console.log('LLM model loaded successfully.');
        } catch (error) {
            console.error('Failed to load LLM model:', error);
            // LLM loading failure doesn't block initialization
        }
        
        // Attempt to load ASR model (voice recognition)
        try {
            console.log('Loading ASR model...');
            const modelPath = 'Xenova/whisper-asr';
            const tokenizer = await AutoTokenizer.from_pretrained(modelPath);
            const model = await AutoModelForSpeechSeq2Seq.from_pretrained(modelPath);
            this.asr = await pipeline('automatic-speech-recognition', model, { tokenizer });
            console.log('ASR model loaded successfully.');
        } catch (error) {
            console.warn('ASR model failed to load, voice recognition will be disabled:', error);
            // ASR loading failure doesn't affect chat functionality
            this.asr = null;
        }

        // TTS model temporarily disabled
        // try {
        //     console.log('Loading TTS model...');
        //     this.tts = await pipeline('text-to-speech', 'Xenova/speecht5_tts', { quantized: false });
        //     console.log('TTS model loaded successfully.');
        // } catch (error) {
        //     console.warn('TTS model failed to load, voice synthesis will be disabled:', error);
        //     this.tts = null;
        // }

        console.log('Bella\'s core AI initialized successfully.');
    }

    async think(prompt, options = {}) {
        const startTime = Date.now();
        const maxProcessingTime = options.maxProcessingTime || 5000; // 5 second requirement
        
        try {
            // Input validation
            if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
                throw new Error('Invalid prompt: prompt must be a non-empty string');
            }
            
            // Sanitize input
            const sanitizedPrompt = this.sanitizeInput(prompt.trim());
            
            // Add user message to conversation context
            this.conversationContext.addMessage('user', sanitizedPrompt, {
                timestamp: startTime,
                mode: this.currentMode
            });
            
            // Create processing timeout
            const processingPromise = this.executeThinkingWithFallback(sanitizedPrompt);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Processing timeout')), maxProcessingTime);
            });
            
            // Race between processing and timeout
            const response = await Promise.race([processingPromise, timeoutPromise]);
            
            // Validate and clean response
            const cleanedResponse = this.validateAndCleanResponse(response);
            
            // Add assistant response to conversation context
            const processingTime = Date.now() - startTime;
            this.conversationContext.addMessage('assistant', cleanedResponse, {
                processingTime,
                provider: this.useCloudAPI ? 'cloud' : 'local',
                mode: this.currentMode
            });
            
            // Log performance metrics
            this.logPerformanceMetrics(processingTime, this.useCloudAPI ? 'cloud' : 'local', true);
            
            return cleanedResponse;
            
        } catch (error) {
            console.error('Error during thinking process:', error);
            
            // Log failure metrics
            const processingTime = Date.now() - startTime;
            this.logPerformanceMetrics(processingTime, this.useCloudAPI ? 'cloud' : 'local', false);
            
            const errorResponse = this.handleThinkingError(error, prompt);
            
            // Add error response to context
            this.conversationContext.addMessage('assistant', errorResponse, {
                processingTime,
                provider: this.useCloudAPI ? 'cloud' : 'local',
                mode: this.currentMode,
                isError: true
            });
            
            return errorResponse;
        }
    }

    // Enhanced thinking execution with robust fallback mechanisms
    async executeThinkingWithFallback(prompt) {
        let primaryError = null;
        let fallbackError = null;
        
        try {
            // Primary provider attempt
            if (this.useCloudAPI && this.cloudAPI.isConfigured()) {
                console.log('Attempting cloud API processing...');
                return await this.thinkWithCloudAPI(prompt);
            } else {
                console.log('Attempting local model processing...');
                return await this.thinkWithLocalModel(prompt);
            }
        } catch (error) {
            primaryError = error;
            console.warn(`Primary provider failed: ${error.message}`);
            
            // Fallback attempt
            try {
                if (this.useCloudAPI) {
                    console.log('Cloud API failed, falling back to local model...');
                    return await this.thinkWithLocalModel(prompt);
                } else {
                    console.log('Local model failed, falling back to cloud API...');
                    if (this.cloudAPI.isConfigured()) {
                        return await this.thinkWithCloudAPI(prompt);
                    } else {
                        throw new Error('Cloud API not configured for fallback');
                    }
                }
            } catch (error) {
                fallbackError = error;
                console.error(`Fallback provider also failed: ${error.message}`);
                
                // Both providers failed, throw combined error
                throw new Error(`Both providers failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
            }
        }
    }

    // Think using cloud API with enhanced error handling
    async thinkWithCloudAPI(prompt) {
        try {
            if (!this.cloudAPI.isConfigured()) {
                throw new Error('Cloud API not properly configured');
            }
            
            const enhancedPrompt = this.enhancePromptForMode(prompt);
            const response = await this.cloudAPI.chat(enhancedPrompt);
            
            if (!response || typeof response !== 'string') {
                throw new Error('Cloud API returned invalid response');
            }
            
            return response;
            
        } catch (error) {
            console.error('Cloud API processing error:', error);
            throw new Error(`Cloud API failed: ${error.message}`);
        }
    }

    // Think using local model with optimized LLM parameters and processing
    async thinkWithLocalModel(prompt) {
        if (!this.llm) {
            throw new Error('Local LLM model not initialized');
        }
        
        try {
            const bellaPrompt = this.enhancePromptForMode(prompt, true);
            
            // Optimized LLM parameters for better responses
            const result = await this.llm(bellaPrompt, {
                max_new_tokens: 200,      // Increased for more complete responses
                temperature: 0.75,        // Balanced creativity and consistency
                top_k: 50,               // Diverse vocabulary selection
                top_p: 0.92,             // Nucleus sampling for quality
                do_sample: true,         // Enable sampling for creativity
                repetition_penalty: 1.25, // Stronger penalty to avoid repetition
                pad_token_id: 0,         // Prevent padding issues
                eos_token_id: 1,         // Proper end-of-sequence handling
            });
            
            if (!result || !result[0] || !result[0].generated_text) {
                throw new Error('Local model returned invalid result');
            }
            
            // Enhanced text cleaning and processing
            let response = result[0].generated_text;
            
            // Remove prompt part more robustly
            const promptIndex = response.indexOf(bellaPrompt);
            if (promptIndex !== -1) {
                response = response.substring(promptIndex + bellaPrompt.length).trim();
            }
            
            // Remove various response prefixes
            response = response.replace(/^(Bella's response:|Bella's professional response:|Bella's creative response:|Bella:|Assistant:|AI:|Response:)/i, '').trim();
            
            // Remove incomplete sentences at the end
            const sentences = response.split(/[.!?]+/);
            if (sentences.length > 1 && sentences[sentences.length - 1].trim().length < 10) {
                sentences.pop();
                response = sentences.join('.') + (sentences.length > 0 ? '.' : '');
            }
            
            // Final validation
            if (!response || response.length < 3) {
                throw new Error('Generated response too short after processing');
            }
            
            return response.trim();
            
        } catch (error) {
            console.error('Local model processing error:', error);
            throw new Error(`Local model failed: ${error.message}`);
        }
    }

    // Enhance prompts based on mode and conversation context
    enhancePromptForMode(prompt, isLocal = false) {
        // Get conversation context
        const context = this.conversationContext.getContextForThinking(true);
        const recentHistory = context.conversationHistory.slice(-6); // Last 3 exchanges
        
        // Build context-aware prompt
        let contextualPrompt = '';
        
        // Add system prompt with context
        if (context.systemPrompt) {
            contextualPrompt += context.systemPrompt + '\n\n';
        }
        
        // Add recent conversation history for context
        if (recentHistory.length > 0) {
            contextualPrompt += 'Recent conversation:\n';
            recentHistory.forEach(msg => {
                const role = msg.role === 'user' ? 'User' : 'Bella';
                contextualPrompt += `${role}: ${msg.content}\n`;
            });
            contextualPrompt += '\n';
        }
        
        // Add current user message
        contextualPrompt += `User: ${prompt}\nBella:`;
        
        // For local models, add mode-specific instructions
        if (isLocal) {
            const modeInstructions = {
                casual: 'Respond in a warm, conversational tone with natural language.',
                assistant: 'Provide clear, helpful information in a professional yet approachable manner.',
                creative: 'Use creative thinking and vivid language to provide unique perspectives.'
            };
            
            const instruction = modeInstructions[this.currentMode] || modeInstructions.casual;
            contextualPrompt = `${instruction}\n\n${contextualPrompt}`;
        }
        
        return contextualPrompt;
    }

    // Sanitize user input to prevent injection and ensure quality
    sanitizeInput(prompt) {
        // Remove potentially harmful characters and normalize whitespace
        return prompt
            .replace(/[<>]/g, '') // Remove HTML-like brackets
            .replace(/\s+/g, ' ') // Normalize whitespace
            .substring(0, 1000); // Limit length to prevent abuse
    }

    // Validate and clean AI response
    validateAndCleanResponse(response) {
        if (!response || typeof response !== 'string') {
            throw new Error('Invalid response: response must be a non-empty string');
        }
        
        let cleaned = response.trim();
        
        // Remove common AI artifacts
        cleaned = cleaned
            .replace(/^(AI:|Assistant:|Bella:|Response:)/i, '') // Remove prefixes
            .replace(/\[.*?\]/g, '') // Remove bracketed content
            .replace(/\*\*.*?\*\*/g, (match) => match.replace(/\*\*/g, '')) // Clean markdown bold
            .replace(/\n{3,}/g, '\n\n') // Normalize excessive line breaks
            .trim();
        
        // Ensure minimum response quality
        if (cleaned.length < 2) {
            throw new Error('Response too short or empty after cleaning');
        }
        
        // Ensure maximum response length for UI compatibility
        if (cleaned.length > 2000) {
            cleaned = cleaned.substring(0, 1997) + '...';
        }
        
        return cleaned;
    }

    // Enhanced error handling with contextual responses
    handleThinkingError(error, originalPrompt) {
        console.error('Handling thinking error:', error);
        
        // Categorize error types for appropriate responses
        if (error.message.includes('timeout')) {
            return this.getTimeoutResponse();
        } else if (error.message.includes('Invalid prompt')) {
            return this.getInvalidInputResponse();
        } else if (error.message.includes('Both providers failed')) {
            return this.getSystemFailureResponse();
        } else if (error.message.includes('Response too short')) {
            return this.getEmptyResponseFallback(originalPrompt);
        } else {
            return this.getGenericErrorResponse();
        }
    }

    // Get timeout-specific error response
    getTimeoutResponse() {
        const timeoutResponses = [
            "I'm taking a bit longer to process that than usual. Let me try a simpler approach...",
            "My thoughts are moving slowly right now. Could you try rephrasing your question?",
            "I need more time to think about that properly. Can we try something else for now?",
            "Processing is taking longer than expected. Let me give you a quick response instead."
        ];
        return timeoutResponses[Math.floor(Math.random() * timeoutResponses.length)];
    }

    // Get invalid input error response
    getInvalidInputResponse() {
        const invalidInputResponses = [
            "I didn't quite understand that. Could you try asking in a different way?",
            "That doesn't seem like something I can help with. What else would you like to know?",
            "I'm having trouble processing that input. Could you rephrase your question?",
            "Let's try that again with a clearer question. What would you like to talk about?"
        ];
        return invalidInputResponses[Math.floor(Math.random() * invalidInputResponses.length)];
    }

    // Get system failure error response
    getSystemFailureResponse() {
        const systemFailureResponses = [
            "I'm experiencing some technical difficulties right now. Please bear with me while I sort things out.",
            "Both my thinking systems are having issues. I'll try to get back to normal soon.",
            "I'm having trouble accessing my knowledge right now. Let me try to help in a simpler way.",
            "My AI systems are temporarily unavailable. I apologize for the inconvenience."
        ];
        return systemFailureResponses[Math.floor(Math.random() * systemFailureResponses.length)];
    }

    // Get fallback response for empty AI responses
    getEmptyResponseFallback(originalPrompt) {
        // Try to provide a contextual response based on prompt keywords
        const prompt = originalPrompt.toLowerCase();
        
        if (prompt.includes('hello') || prompt.includes('hi') || prompt.includes('你好')) {
            return "Hello! I'm here and ready to chat. What would you like to talk about?";
        } else if (prompt.includes('how') || prompt.includes('what') || prompt.includes('why')) {
            return "That's an interesting question. Let me think about it and get back to you with a better answer.";
        } else if (prompt.includes('help')) {
            return "I'd be happy to help! Could you be more specific about what you need assistance with?";
        } else {
            return this.getGenericErrorResponse();
        }
    }

    // Get generic error response
    getGenericErrorResponse() {
        const errorResponses = [
            "I'm sorry, I'm having trouble processing that right now. Let me try to reorganize my thoughts...",
            "Hmm... I need to think about this a bit more. Please wait a moment.",
            "I seem to be having a bit of trouble with that. Give me a second to sort things out.",
            "Let me rephrase my thoughts. Just a moment please.",
            "I didn't quite catch that. Could you try asking in a different way?"
        ];
        
        return errorResponses[Math.floor(Math.random() * errorResponses.length)];
    }

    // Log performance metrics for monitoring
    logPerformanceMetrics(processingTime, provider, success) {
        const metrics = {
            timestamp: new Date().toISOString(),
            processingTime,
            provider,
            success,
            mode: this.currentMode
        };
        
        console.log('Thinking Performance Metrics:', metrics);
        
        // Store metrics for potential future analysis
        if (!this.performanceMetrics) {
            this.performanceMetrics = [];
        }
        
        this.performanceMetrics.push(metrics);
        
        // Keep only last 100 metrics to prevent memory issues
        if (this.performanceMetrics.length > 100) {
            this.performanceMetrics = this.performanceMetrics.slice(-100);
        }
        
        // Warn if processing time exceeds requirements
        if (processingTime > 5000) {
            console.warn(`Processing time exceeded 5 second requirement: ${processingTime}ms`);
        }
    }

    // Set chat mode
    setChatMode(mode) {
        if (['casual', 'assistant', 'creative'].includes(mode)) {
            this.currentMode = mode;
            this.conversationContext.setMode(mode);
            return true;
        }
        return false;
    }

    // Switch AI service provider
    switchProvider(provider) {
        if (provider === 'local') {
            this.useCloudAPI = false;
            return true;
        } else {
            const success = this.cloudAPI.switchProvider(provider);
            if (success) {
                this.useCloudAPI = true;
            }
            return success;
        }
    }

    // Set API key
    setAPIKey(provider, apiKey) {
        return this.cloudAPI.setAPIKey(provider, apiKey);
    }

    // Clear conversation history
    clearHistory() {
        this.cloudAPI.clearHistory();
        this.conversationContext.clearHistory();
    }

    // Get current configuration
    getCurrentConfig() {
        return {
            useCloudAPI: this.useCloudAPI,
            provider: this.useCloudAPI ? this.cloudAPI.getCurrentProvider() : { name: 'local', model: 'LaMini-Flan-T5-77M' },
            mode: this.currentMode,
            isConfigured: this.useCloudAPI ? this.cloudAPI.isConfigured() : true
        };
    }

    // Process audio input
    async listen(audioData) {
        if (!this.asr) {
            throw new Error('Speech recognition model not initialized');
        }
        const result = await this.asr(audioData);
        return result.text;
    }

    // Generate speech from text
    async speak(text) {
        if (!this.tts) {
            throw new Error('Speech synthesis model not initialized');
        }
        // We need speaker embeddings for SpeechT5
        const speaker_embeddings = 'models/Xenova/speecht5_tts/speaker_embeddings.bin';
        const result = await this.tts(text, {
            speaker_embeddings,
        });
        return result.audio;
    }

    // Get cloud API service instance (for external access)
    getCloudAPIService() {
        return this.cloudAPI;
    }

    // Get performance metrics for monitoring
    getPerformanceMetrics() {
        return {
            metrics: this.performanceMetrics || [],
            summary: this.getMetricsSummary()
        };
    }

    // Get summary of performance metrics
    getMetricsSummary() {
        if (!this.performanceMetrics || this.performanceMetrics.length === 0) {
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                successRate: 0,
                providerUsage: {}
            };
        }

        const total = this.performanceMetrics.length;
        const successful = this.performanceMetrics.filter(m => m.success).length;
        const totalTime = this.performanceMetrics.reduce((sum, m) => sum + m.processingTime, 0);
        
        const providerUsage = {};
        this.performanceMetrics.forEach(m => {
            providerUsage[m.provider] = (providerUsage[m.provider] || 0) + 1;
        });

        return {
            totalRequests: total,
            averageResponseTime: Math.round(totalTime / total),
            successRate: Math.round((successful / total) * 100),
            providerUsage
        };
    }

    // Get conversation context information
    getConversationContext() {
        return this.conversationContext.getContextForThinking(false);
    }

    // Get conversation history
    getConversationHistory(messageCount = 10) {
        return this.conversationContext.getRecentHistory(messageCount);
    }

    // Get session statistics
    getSessionStats() {
        return this.conversationContext.getSessionStats();
    }

    // Start new conversation session
    startNewSession() {
        return this.conversationContext.startNewSession();
    }

    // Check if conversation context is still valid
    isContextValid() {
        return this.conversationContext.isContextValid();
    }

    // Export conversation for backup
    exportConversation() {
        return this.conversationContext.exportConversation();
    }

    // Import conversation from backup
    importConversation(data) {
        return this.conversationContext.importConversation(data);
    }
}

// ES6 module export
export { BellaAI };