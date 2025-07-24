// cloudAPI.js - 贝拉的云端AI服务模块
// 这个模块负责与各种云端小模型API进行通信，为贝拉提供更强大的思考能力

class CloudAPIService {
    constructor() {
        this.apiConfigs = {
            // OpenAI GPT-3.5/4 配置
            openai: {
                baseURL: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
                }
            },
            // 阿里云通义千问配置
            qwen: {
                baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                model: 'qwen-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_QWEN_API_KEY'
                }
            },
            // 百度文心一言配置
            ernie: {
                baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
                model: 'ERNIE-Bot-turbo',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            // 智谱AI GLM配置
            glm: {
                baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                model: 'glm-3-turbo',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_GLM_API_KEY'
                }
            }
        };
        
        this.currentProvider = 'openai'; // 默认使用OpenAI
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // 保持最近10轮对话
    }

    // 设置API密钥
    setAPIKey(provider, apiKey) {
        if (this.apiConfigs[provider]) {
            if (provider === 'openai' || provider === 'qwen' || provider === 'glm') {
                this.apiConfigs[provider].headers['Authorization'] = `Bearer ${apiKey}`;
            } else if (provider === 'ernie') {
                this.apiConfigs[provider].accessToken = apiKey;
            }
            return true;
        }
        return false;
    }

    // 切换AI服务提供商
    switchProvider(provider) {
        if (this.apiConfigs[provider]) {
            this.currentProvider = provider;
            return true;
        }
        return false;
    }

    // 添加对话到历史记录
    addToHistory(role, content) {
        this.conversationHistory.push({ role, content });
        
        // 保持历史记录在合理长度内
        if (this.conversationHistory.length > this.maxHistoryLength * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
        }
    }

    // 构建贝拉的个性化系统提示
    getBellaSystemPrompt() {
        return {
            role: 'system',
            content: `你是贝拉，一个温暖、聪明、优雅的AI伙伴。你的特点是：
1. 用温暖亲切的语气与用户交流，就像一个贴心的朋友
2. 回答简洁明了，避免冗长的解释
3. 富有同理心，能够理解用户的情感
4. 偶尔展现一些可爱和俏皮的一面
5. 用中文回应，语言自然流畅
6. 记住你们之间的对话，保持连贯性
请始终保持这种温暖、优雅的个性。`
        };
    }

    // 调用云端API进行对话
    async chat(userMessage) {
        const config = this.apiConfigs[this.currentProvider];
        if (!config) {
            throw new Error(`不支持的AI服务提供商: ${this.currentProvider}`);
        }

        // 添加用户消息到历史
        this.addToHistory('user', userMessage);

        try {
            let response;
            
            switch (this.currentProvider) {
                case 'openai':
                    response = await this.callOpenAI(userMessage);
                    break;
                case 'qwen':
                    response = await this.callQwen(userMessage);
                    break;
                case 'ernie':
                    response = await this.callErnie(userMessage);
                    break;
                case 'glm':
                    response = await this.callGLM(userMessage);
                    break;
                default:
                    throw new Error(`未实现的AI服务提供商: ${this.currentProvider}`);
            }

            // 添加AI回应到历史
            this.addToHistory('assistant', response);
            return response;
            
        } catch (error) {
            console.error(`云端API调用失败 (${this.currentProvider}):`, error);
            throw error;
        }
    }

    // OpenAI API调用
    async callOpenAI(userMessage) {
        const config = this.apiConfigs.openai;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                max_tokens: 150,
                temperature: 0.8,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // 通义千问API调用
    async callQwen(userMessage) {
        const config = this.apiConfigs.qwen;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                input: {
                    messages: messages
                },
                parameters: {
                    max_tokens: 150,
                    temperature: 0.8,
                    top_p: 0.9
                }
            })
        });

        if (!response.ok) {
            throw new Error(`通义千问API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.output.text.trim();
    }

    // 文心一言API调用
    async callErnie(userMessage) {
        const config = this.apiConfigs.ernie;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const url = `${config.baseURL}?access_token=${config.accessToken}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                messages: messages,
                temperature: 0.8,
                top_p: 0.9,
                max_output_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`文心一言API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.result.trim();
    }

    // 智谱AI GLM调用
    async callGLM(userMessage) {
        const config = this.apiConfigs.glm;
        const messages = [
            this.getBellaSystemPrompt(),
            ...this.conversationHistory
        ];

        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                model: config.model,
                messages: messages,
                max_tokens: 150,
                temperature: 0.8,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`智谱AI API错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    // 清除对话历史
    clearHistory() {
        this.conversationHistory = [];
    }

    // 获取当前提供商信息
    getCurrentProvider() {
        return {
            name: this.currentProvider,
            model: this.apiConfigs[this.currentProvider]?.model
        };
    }

    // 检查API配置是否完整
    isConfigured(provider = this.currentProvider) {
        const config = this.apiConfigs[provider];
        if (!config) return false;
        
        if (provider === 'ernie') {
            return !!config.accessToken;
        } else {
            return config.headers['Authorization'] && 
                   config.headers['Authorization'] !== 'Bearer YOUR_OPENAI_API_KEY' &&
                   config.headers['Authorization'] !== 'Bearer YOUR_QWEN_API_KEY' &&
                   config.headers['Authorization'] !== 'Bearer YOUR_GLM_API_KEY';
        }
    }
}

export default CloudAPIService;