// core.js - Bella's Brain (v3)
// Bella's core AI logic, supporting a hybrid architecture of local models and cloud APIs

import { pipeline, env, AutoTokenizer, AutoModelForSpeechSeq2Seq } from './vendor/transformers.js';
import CloudAPIService from './cloudAPI.js';
import { ConversationContext } from './conversationContext.js';
import { PerformanceMonitor } from './performanceMonitor.js';

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
        this.performanceMonitor = new PerformanceMonitor({
            responseTimeThreshold: 5000,
            successRateThreshold: 90,
            maxMetricsHistory: 1000
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
            
            // Record detailed performance metrics
            this.performanceMonitor.recordThinkingMetrics({
                provider: this.useCloudAPI ? 'cloud' : 'local',
                mode: this.currentMode,
                processingTime,
                success: true,
                inputLength: sanitizedPrompt.length,
                outputLength: cleanedResponse.length,
                cacheHit: false, // TODO: Implement caching
                retryCount: 0
            });
            
            return cleanedResponse;
            
        } catch (error) {
            console.error('Error during thinking process:', error);
            
            // Log failure metrics
            const processingTime = Date.now() - startTime;
            this.logPerformanceMetrics(processingTime, this.useCloudAPI ? 'cloud' : 'local', false);
            
            const errorResponse = this.handleThinkingError(error, prompt);
            
            // Record error metrics
            this.performanceMonitor.recordThinkingMetrics({
                provider: this.useCloudAPI ? 'cloud' : 'local',
                mode: this.currentMode,
                processingTime,
                success: false,
                inputLength: prompt.length,
                outputLength: errorResponse.length,
                errorType: error.message.includes('timeout') ? 'timeout' : 'processing_error',
                retryCount: 0
            });
            
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

    // Enhanced thinking execution with comprehensive fallback mechanisms
    async executeThinkingWithFallback(prompt) {
        const fallbackChain = this.buildFallbackChain();
        let lastError = null;
        let attemptCount = 0;
        
        for (const provider of fallbackChain) {
            attemptCount++;
            try {
                console.log(`Attempt ${attemptCount}: Trying ${provider.name} provider...`);
                
                const response = await this.executeWithProvider(provider, prompt);
                
                // Log successful fallback if not the first attempt
                if (attemptCount > 1) {
                    console.log(`Successfully recovered using ${provider.name} after ${attemptCount - 1} failed attempts`);
                }
                
                return response;
                
            } catch (error) {
                lastError = error;
                console.warn(`${provider.name} provider failed (attempt ${attemptCount}): ${error.message}`);
                
                // If this is a critical error that shouldn't trigger fallback, break early
                if (this.isCriticalError(error)) {
                    console.error('Critical error detected, stopping fallback chain');
                    break;
                }
                
                // Add delay between attempts to avoid overwhelming services
                if (attemptCount < fallbackChain.length) {
                    await this.delay(Math.min(1000 * attemptCount, 3000)); // Progressive delay up to 3 seconds
                }
            }
        }
        
        // All providers failed, create comprehensive error
        const errorMessage = this.createComprehensiveErrorMessage(fallbackChain, lastError);
        throw new Error(errorMessage);
    }

    // Build intelligent fallback chain based on current configuration and availability
    buildFallbackChain() {
        const chain = [];
        
        // Primary provider (user's preference)
        if (this.useCloudAPI && this.cloudAPI.isConfigured()) {
            chain.push({ name: 'cloud-primary', type: 'cloud', provider: this.cloudAPI.getCurrentProvider().name });
        } else if (this.llm) {
            chain.push({ name: 'local-primary', type: 'local' });
        }
        
        // Secondary fallback (opposite of primary)
        if (this.useCloudAPI) {
            if (this.llm) {
                chain.push({ name: 'local-fallback', type: 'local' });
            }
        } else {
            if (this.cloudAPI.isConfigured()) {
                chain.push({ name: 'cloud-fallback', type: 'cloud', provider: this.cloudAPI.getCurrentProvider().name });
            }
        }
        
        // Tertiary fallback (try other cloud providers if available)
        if (this.useCloudAPI) {
            const availableProviders = this.getAvailableCloudProviders();
            const currentProvider = this.cloudAPI.getCurrentProvider().name;
            
            for (const provider of availableProviders) {
                if (provider !== currentProvider) {
                    chain.push({ name: `cloud-${provider}`, type: 'cloud', provider });
                }
            }
        }
        
        // Emergency fallback (backup response system)
        chain.push({ name: 'emergency-backup', type: 'backup' });
        
        return chain;
    }

    // Execute thinking with specific provider
    async executeWithProvider(providerConfig, prompt) {
        switch (providerConfig.type) {
            case 'cloud':
                // Temporarily switch to the specified cloud provider if needed
                const originalProvider = this.cloudAPI.getCurrentProvider().name;
                if (providerConfig.provider && providerConfig.provider !== originalProvider) {
                    this.cloudAPI.switchProvider(providerConfig.provider);
                }
                
                try {
                    const response = await this.thinkWithCloudAPI(prompt);
                    return response;
                } finally {
                    // Restore original provider
                    if (providerConfig.provider && providerConfig.provider !== originalProvider) {
                        this.cloudAPI.switchProvider(originalProvider);
                    }
                }
                
            case 'local':
                return await this.thinkWithLocalModel(prompt);
                
            case 'backup':
                return this.getEmergencyBackupResponse(prompt);
                
            default:
                throw new Error(`Unknown provider type: ${providerConfig.type}`);
        }
    }

    // Check if error is critical and shouldn't trigger fallback
    isCriticalError(error) {
        const criticalPatterns = [
            'invalid prompt',
            'prompt too long',
            'malformed input',
            'security violation'
        ];
        
        const message = error.message.toLowerCase();
        return criticalPatterns.some(pattern => message.includes(pattern));
    }

    // Get available cloud providers that are configured
    getAvailableCloudProviders() {
        return this.cloudAPI.getConfiguredProviders();
    }

    // Create comprehensive error message for complete failure
    createComprehensiveErrorMessage(fallbackChain, lastError) {
        const attemptedProviders = fallbackChain.map(p => p.name).join(', ');
        return `All thinking providers failed after ${fallbackChain.length} attempts. Tried: ${attemptedProviders}. Last error: ${lastError?.message || 'Unknown error'}`;
    }

    // Emergency backup response system for complete thinking engine failures
    getEmergencyBackupResponse(originalPrompt) {
        console.log('Using emergency backup response system');
        
        // Analyze prompt for context clues to provide relevant backup response
        const prompt = originalPrompt.toLowerCase();
        
        // Greeting responses
        if (this.isGreeting(prompt)) {
            return this.getBackupGreetingResponse();
        }
        
        // Question responses
        if (this.isQuestion(prompt)) {
            return this.getBackupQuestionResponse();
        }
        
        // Help requests
        if (this.isHelpRequest(prompt)) {
            return this.getBackupHelpResponse();
        }
        
        // Emotional support
        if (this.isEmotionalContent(prompt)) {
            return this.getBackupEmotionalResponse();
        }
        
        // Default backup response
        return this.getDefaultBackupResponse();
    }

    // Helper methods for prompt analysis
    isGreeting(prompt) {
        const greetingPatterns = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', '你好', 'こんにちは'];
        return greetingPatterns.some(pattern => prompt.includes(pattern));
    }

    isQuestion(prompt) {
        const questionPatterns = ['what', 'how', 'why', 'when', 'where', 'who', 'which', '?'];
        return questionPatterns.some(pattern => prompt.includes(pattern));
    }

    isHelpRequest(prompt) {
        const helpPatterns = ['help', 'assist', 'support', 'guide', 'explain', 'show me'];
        return helpPatterns.some(pattern => prompt.includes(pattern));
    }

    isEmotionalContent(prompt) {
        const emotionalPatterns = ['sad', 'happy', 'angry', 'frustrated', 'excited', 'worried', 'anxious', 'feel'];
        return emotionalPatterns.some(pattern => prompt.includes(pattern));
    }

    // Backup response generators
    getBackupGreetingResponse() {
        const responses = [
            "Hello! I'm here and ready to chat, though I'm running on backup systems right now.",
            "Hi there! My main thinking systems are having issues, but I'm still here to help as best I can.",
            "Hey! I'm experiencing some technical difficulties, but I'm glad you're here to chat.",
            "Hello! I'm operating in backup mode right now, but I'm still happy to talk with you."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getBackupQuestionResponse() {
        const responses = [
            "That's a great question! I'm having some technical issues right now, but I'd love to discuss it once my systems are back online.",
            "I wish I could give you a proper answer right now, but my thinking capabilities are temporarily limited. Could you try asking again in a moment?",
            "That sounds like something I'd normally love to explore with you! My AI systems are having trouble, but I'll be back to full capacity soon.",
            "I'm interested in your question, but I'm running on backup systems that can't process complex queries right now. Please try again shortly!"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getBackupHelpResponse() {
        const responses = [
            "I'd love to help you with that! Unfortunately, my main assistance systems are temporarily unavailable. Please try again in a few moments.",
            "I'm here to help, but I'm currently running on limited backup systems. Once my full capabilities are restored, I'll be much more useful!",
            "I want to provide you with the best help possible, but my systems are having issues right now. Please be patient while I get back to full functionality.",
            "I'm in backup mode right now, so my ability to help is quite limited. Please try your request again once my systems are fully operational."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getBackupEmotionalResponse() {
        const responses = [
            "I can sense there's something important you want to share. While my systems are having issues, I want you to know I'm here for you.",
            "I wish I could provide better emotional support right now, but my empathy systems are temporarily limited. Please know that I care about how you're feeling.",
            "Even though I'm running on backup systems, I want you to know that your feelings matter. I'll be back to full capacity to support you soon.",
            "I may not be able to respond as thoughtfully as usual due to technical issues, but I want you to know I'm listening and I care."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getDefaultBackupResponse() {
        const responses = [
            "I'm currently experiencing technical difficulties with my main thinking systems. I'm working to resolve this and will be back to normal soon!",
            "My AI capabilities are temporarily limited due to system issues. Please bear with me while I get everything back online.",
            "I'm running on backup systems right now, which limits my ability to have our usual engaging conversations. I'll be back to full capacity shortly!",
            "Technical difficulties are affecting my main processing systems. I apologize for the inconvenience and am working to restore full functionality."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Utility method for adding delays between fallback attempts
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Think using cloud API with comprehensive error handling
    async thinkWithCloudAPI(prompt) {
        try {
            if (!this.cloudAPI.isConfigured()) {
                throw new Error('Cloud API not properly configured - missing API key or invalid configuration');
            }
            
            const enhancedPrompt = this.enhancePromptForMode(prompt);
            
            // Add timeout wrapper for cloud API calls
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Cloud API timeout - request took too long')), 10000); // 10 second timeout
            });
            
            const apiPromise = this.cloudAPI.chat(enhancedPrompt);
            const response = await Promise.race([apiPromise, timeoutPromise]);
            
            if (!response || typeof response !== 'string') {
                throw new Error('Cloud API returned invalid or empty response');
            }
            
            // Validate response quality
            if (response.trim().length < 2) {
                throw new Error('Cloud API response too short after processing');
            }
            
            return response;
            
        } catch (error) {
            console.error('Cloud API processing error:', error);
            
            // Enhance error message with more specific information
            let enhancedError = error.message;
            
            if (error.message.includes('401') || error.message.includes('403')) {
                enhancedError = 'Cloud API authentication failed - please check your API key';
            } else if (error.message.includes('429')) {
                enhancedError = 'Cloud API rate limit exceeded - too many requests';
            } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
                enhancedError = 'Cloud API server error - service temporarily unavailable';
            } else if (error.message.includes('timeout')) {
                enhancedError = 'Cloud API request timed out - service may be overloaded';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                enhancedError = 'Network error - unable to reach cloud API service';
            }
            
            throw new Error(`Cloud API failed: ${enhancedError}`);
        }
    }

    // Think using local model with comprehensive error handling and processing
    async thinkWithLocalModel(prompt) {
        if (!this.llm) {
            throw new Error('Local LLM model not initialized - model failed to load during startup');
        }
        
        try {
            const bellaPrompt = this.enhancePromptForMode(prompt, true);
            
            // Validate prompt length to prevent memory issues
            if (bellaPrompt.length > 2000) {
                throw new Error('Prompt too long for local model processing');
            }
            
            // Add timeout for local model processing
            const processingPromise = this.llm(bellaPrompt, {
                max_new_tokens: 200,      // Increased for more complete responses
                temperature: 0.75,        // Balanced creativity and consistency
                top_k: 50,               // Diverse vocabulary selection
                top_p: 0.92,             // Nucleus sampling for quality
                do_sample: true,         // Enable sampling for creativity
                repetition_penalty: 1.25, // Stronger penalty to avoid repetition
                pad_token_id: 0,         // Prevent padding issues
                eos_token_id: 1,         // Proper end-of-sequence handling
            });
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Local model processing timeout - computation took too long')), 8000); // 8 second timeout
            });
            
            const result = await Promise.race([processingPromise, timeoutPromise]);
            
            if (!result || !result[0] || !result[0].generated_text) {
                throw new Error('Local model returned invalid or empty result structure');
            }
            
            // Enhanced text cleaning and processing
            let response = result[0].generated_text;
            
            // Validate initial response
            if (typeof response !== 'string') {
                throw new Error('Local model returned non-string response');
            }
            
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
            
            // Remove common artifacts and clean up
            response = response
                .replace(/\[INST\].*?\[\/INST\]/g, '') // Remove instruction tokens
                .replace(/\<\|.*?\|\>/g, '') // Remove special tokens
                .replace(/^\s*[-*•]\s*/, '') // Remove bullet points at start
                .trim();
            
            // Final validation
            if (!response || response.length < 3) {
                throw new Error('Generated response too short after cleaning and processing');
            }
            
            // Check for repetitive content
            if (this.isResponseRepetitive(response)) {
                throw new Error('Local model generated repetitive content');
            }
            
            return response.trim();
            
        } catch (error) {
            console.error('Local model processing error:', error);
            
            // Enhance error message with more specific information
            let enhancedError = error.message;
            
            if (error.message.includes('timeout')) {
                enhancedError = 'Local model processing timed out - computation too complex';
            } else if (error.message.includes('memory') || error.message.includes('allocation')) {
                enhancedError = 'Local model ran out of memory - prompt may be too complex';
            } else if (error.message.includes('invalid result')) {
                enhancedError = 'Local model produced malformed output';
            } else if (error.message.includes('repetitive')) {
                enhancedError = 'Local model generated repetitive or low-quality content';
            }
            
            throw new Error(`Local model failed: ${enhancedError}`);
        }
    }

    // Check if response contains repetitive patterns
    isResponseRepetitive(response) {
        // Check for repeated phrases (3+ words repeated)
        const words = response.toLowerCase().split(/\s+/);
        const phrases = [];
        
        for (let i = 0; i < words.length - 2; i++) {
            const phrase = words.slice(i, i + 3).join(' ');
            phrases.push(phrase);
        }
        
        // Count phrase occurrences
        const phraseCounts = {};
        phrases.forEach(phrase => {
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
        });
        
        // Check if any phrase repeats more than twice
        return Object.values(phraseCounts).some(count => count > 2);
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

    // Enhanced error handling with comprehensive fallback system
    handleThinkingError(error, originalPrompt) {
        console.error('Handling thinking error:', error);
        
        // Categorize error types for appropriate responses
        const errorType = this.categorizeError(error);
        
        switch (errorType) {
            case 'timeout':
                return this.getTimeoutResponse();
            case 'invalid_input':
                return this.getInvalidInputResponse();
            case 'system_failure':
                return this.getSystemFailureResponse();
            case 'empty_response':
                return this.getEmptyResponseFallback(originalPrompt);
            case 'network_error':
                return this.getNetworkErrorResponse();
            case 'authentication_error':
                return this.getAuthenticationErrorResponse();
            case 'rate_limit_error':
                return this.getRateLimitErrorResponse();
            case 'model_error':
                return this.getModelErrorResponse();
            case 'configuration_error':
                return this.getConfigurationErrorResponse();
            default:
                return this.getGenericErrorResponse();
        }
    }

    // Categorize errors for more precise handling
    categorizeError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('timeout') || message.includes('processing timeout')) {
            return 'timeout';
        } else if (message.includes('invalid prompt') || message.includes('invalid input')) {
            return 'invalid_input';
        } else if (message.includes('both providers failed') || message.includes('system failure')) {
            return 'system_failure';
        } else if (message.includes('response too short') || message.includes('empty response')) {
            return 'empty_response';
        } else if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
            return 'network_error';
        } else if (message.includes('401') || message.includes('403') || message.includes('unauthorized') || message.includes('authentication')) {
            return 'authentication_error';
        } else if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
            return 'rate_limit_error';
        } else if (message.includes('model not initialized') || message.includes('model failed') || message.includes('model error')) {
            return 'model_error';
        } else if (message.includes('not configured') || message.includes('configuration')) {
            return 'configuration_error';
        } else {
            return 'generic';
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

    // Get network error response
    getNetworkErrorResponse() {
        const networkErrorResponses = [
            "I'm having trouble connecting to my thinking services right now. Let me try a different approach.",
            "My connection seems unstable at the moment. Please give me a moment to reconnect.",
            "I'm experiencing network issues. Let me try to process that locally instead.",
            "There seems to be a connectivity problem. I'll attempt to use my offline capabilities."
        ];
        return networkErrorResponses[Math.floor(Math.random() * networkErrorResponses.length)];
    }

    // Get authentication error response
    getAuthenticationErrorResponse() {
        const authErrorResponses = [
            "I'm having trouble accessing my cloud services. Let me try using my local capabilities instead.",
            "There's an authentication issue with my external services. I'll switch to offline mode for now.",
            "My cloud access seems to be having issues. Let me process that using my built-in knowledge.",
            "I can't connect to my external AI services right now, but I can still help using my local processing."
        ];
        return authErrorResponses[Math.floor(Math.random() * authErrorResponses.length)];
    }

    // Get rate limit error response
    getRateLimitErrorResponse() {
        const rateLimitResponses = [
            "I'm being asked to slow down by my cloud services. Let me try using my local processing instead.",
            "My external services are busy right now. I'll switch to my offline capabilities to help you.",
            "I've reached my usage limit with cloud services. Let me handle this with my built-in intelligence.",
            "The cloud services are at capacity. I'll use my local processing to continue our conversation."
        ];
        return rateLimitResponses[Math.floor(Math.random() * rateLimitResponses.length)];
    }

    // Get model error response
    getModelErrorResponse() {
        const modelErrorResponses = [
            "My thinking model is having some difficulties. Let me try to restart and get back to you.",
            "There's an issue with my AI processing. I'm working to resolve it and will be back shortly.",
            "My language model seems to be having trouble. Let me try a different approach to help you.",
            "I'm experiencing some technical issues with my AI brain. Please bear with me while I sort this out."
        ];
        return modelErrorResponses[Math.floor(Math.random() * modelErrorResponses.length)];
    }

    // Get configuration error response
    getConfigurationErrorResponse() {
        const configErrorResponses = [
            "My settings seem to need adjustment. Let me try to reconfigure and help you properly.",
            "There's a configuration issue I need to resolve. I'll work on fixing this right away.",
            "My system setup needs some attention. Let me try to sort this out and get back to helping you.",
            "I need to check my configuration settings. Please give me a moment to get everything working properly."
        ];
        return configErrorResponses[Math.floor(Math.random() * configErrorResponses.length)];
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

    // Get comprehensive performance report
    getPerformanceReport() {
        return this.performanceMonitor.getPerformanceReport();
    }

    // Get optimization recommendations
    getOptimizationRecommendations() {
        return this.performanceMonitor.getOptimizationRecommendations();
    }

    // Reset performance monitoring
    resetPerformanceMonitoring() {
        this.performanceMonitor.reset();
    }

    // Get performance alerts
    getPerformanceAlerts() {
        const report = this.performanceMonitor.getPerformanceReport();
        return report.alerts.filter(alert => !alert.resolved);
    }
}

// ES6 module export
export { BellaAI };