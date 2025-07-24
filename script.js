// 导入BellaAI核心模块
import { BellaAI } from './core.js';
import { ChatInterface } from './chatInterface.js';

document.addEventListener('DOMContentLoaded', async function() {
    // --- Get all necessary DOM elements first ---
    const transcriptDiv = document.getElementById('transcript');
    const loadingScreen = document.getElementById('loading-screen');
    const video1 = document.getElementById('video1');
    const video2 = document.getElementById('video2');
    const micButton = document.getElementById('mic-button');


    // --- AI Core Initialization ---
    let bellaAI;
    let chatInterface;
    
    // 首先初始化聊天界面（不依赖AI）
    try {
        chatInterface = new ChatInterface();
        console.log('聊天界面初始化成功');
        console.log('ChatInterface实例创建完成:', chatInterface);
        console.log('聊天容器元素:', chatInterface.chatContainer);
        console.log('聊天容器是否在DOM中:', document.body.contains(chatInterface.chatContainer));
        
        // 自动显示聊天界面（调试用）
        setTimeout(() => {
            console.log('尝试自动显示聊天界面...');
            chatInterface.show();
            console.log('聊天界面已自动显示');
            console.log('聊天界面可见性:', chatInterface.getVisibility());
            console.log('聊天容器类名:', chatInterface.chatContainer.className);
        }, 2000);
    } catch (error) {
        console.error('聊天界面初始化失败:', error);
    }
    
    // 然后尝试初始化AI核心
    micButton.disabled = true;
    transcriptDiv.textContent = '正在唤醒贝拉的核心...';
    try {
        bellaAI = await BellaAI.getInstance();
        console.log('Bella AI 初始化成功');
        
        // 设置聊天界面的AI回调函数
        if (chatInterface) {
            chatInterface.onMessageSend = async (message) => {
                try {
                    chatInterface.showTypingIndicator();
                    const response = await bellaAI.think(message);
                    chatInterface.hideTypingIndicator();
                    chatInterface.addMessage('assistant', response);
                } catch (error) {
                    console.error('AI处理错误:', error);
                    chatInterface.hideTypingIndicator();
                    chatInterface.addMessage('assistant', '抱歉，我现在有点困惑，请稍后再试...');
                }
            };
        }
        
        micButton.disabled = false;
        transcriptDiv.textContent = '贝拉已准备好，请点击麦克风开始对话。';
    } catch (error) {
        console.error('Failed to initialize Bella AI:', error);
        transcriptDiv.textContent = 'AI模型加载失败，但聊天界面仍可使用。';
        
        // 即使AI失败，也提供基本的聊天功能
        if (chatInterface) {
            chatInterface.onMessageSend = async (message) => {
                chatInterface.showTypingIndicator();
                setTimeout(() => {
                    chatInterface.hideTypingIndicator();
                    const fallbackResponses = [
                        '我的AI核心还在加载中，请稍后再试...',
                        '抱歉，我现在无法正常思考，但我会努力学习的！',
                        '我的大脑还在启动中，请给我一点时间...',
                        '系统正在更新，暂时无法提供智能回复。'
                    ];
                    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
                    chatInterface.addMessage('assistant', randomResponse);
                }, 1000);
            };
        }
        
        // 禁用语音功能，但保持界面可用
        micButton.disabled = true;
    }

    // --- Loading screen handling ---
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        // Hide it after the animation to prevent it from blocking interactions
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            // 显示聊天控制面板
            const chatControlPanel = document.querySelector('.chat-control-panel');
            if (chatControlPanel) {
                chatControlPanel.classList.add('visible');
            }
        }, 500); // This time should match the transition time in CSS
    }, 1500); // Start fading out after 1.5 seconds

    let activeVideo = video1;
    let inactiveVideo = video2;

    // 视频列表
    const videoList = [
        '视频资源/3D 建模图片制作.mp4',
        '视频资源/jimeng-2025-07-16-1043-笑着优雅的左右摇晃，过一会儿手扶着下巴，保持微笑.mp4',
        '视频资源/jimeng-2025-07-16-4437-比耶，然后微笑着优雅的左右摇晃.mp4',
        '视频资源/生成加油视频.mp4',
        '视频资源/生成跳舞视频.mp4',
        '视频资源/负面/jimeng-2025-07-16-9418-双手叉腰，嘴巴一直在嘟囔，表情微微生气.mp4'
    ];

    // --- 视频交叉淡入淡出播放功能 ---
    function switchVideo() {
        // 1. 选择下一个视频
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        let nextVideoSrc = currentVideoSrc;
        while (nextVideoSrc === currentVideoSrc) {
            const randomIndex = Math.floor(Math.random() * videoList.length);
            nextVideoSrc = videoList[randomIndex];
        }

        // 2. 设置不活动的 video 元素的 source
        inactiveVideo.querySelector('source').setAttribute('src', nextVideoSrc);
        inactiveVideo.load();

        // 3. 当不活动的视频可以播放时，执行切换
        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            // 确保事件只触发一次
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);

            // 4. 播放新视频
            inactiveVideo.play().catch(error => {
                console.error("Video play failed:", error);
            });

            // 5. 切换 active class 来触发 CSS 过渡
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');

            // 6. 更新角色
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];

            // 为新的 activeVideo 绑定 ended 事件
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true }); // 使用 { once: true } 确保事件只被处理一次
    }

    // 初始启动
    activeVideo.addEventListener('ended', switchVideo, { once: true });
    
    // 聊天控制按钮事件
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatTestBtn = document.getElementById('chat-test-btn');
    
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            if (chatInterface) {
                console.log('聊天按钮被点击');
                console.log('点击前聊天界面状态:', chatInterface.getVisibility());
                console.log('点击前聊天容器类名:', chatInterface.chatContainer.className);
                
                chatInterface.toggle();
                
                console.log('点击后聊天界面状态:', chatInterface.getVisibility());
                console.log('点击后聊天容器类名:', chatInterface.chatContainer.className);
                console.log('聊天界面切换，当前状态:', chatInterface.getVisibility());
                
                // 更新按钮状态
                const isVisible = chatInterface.getVisibility();
                chatToggleBtn.innerHTML = isVisible ? 
                    '<i class="fas fa-times"></i><span>关闭</span>' : 
                    '<i class="fas fa-comments"></i><span>聊天</span>';
                console.log('按钮文本更新为:', chatToggleBtn.innerHTML);
            }
        });
    }
    
    if (chatTestBtn) {
        chatTestBtn.addEventListener('click', () => {
            if (chatInterface) {
                const testMessages = [
                    '你好！我是贝拉，很高兴见到你！',
                    '聊天界面工作正常，所有功能都已就绪。',
                    '这是一条测试消息，用来验证界面功能。'
                ];
                const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
                chatInterface.addMessage('assistant', randomMessage);
                
                // 如果聊天界面未显示，则自动显示
                if (!chatInterface.getVisibility()) {
                    chatInterface.show();
                    chatToggleBtn.innerHTML = '<i class="fas fa-times"></i><span>关闭</span>';
                }
                
                console.log('测试消息已添加:', randomMessage);
            }
        });
    }


    // --- 语音识别核心 ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    // 检查浏览器是否支持语音识别
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // 持续识别
        recognition.lang = 'zh-CN'; // 设置语言为中文
        recognition.interimResults = true; // 获取临时结果

        recognition.onresult = async (event) => {
            const transcriptContainer = document.getElementById('transcript');
            let final_transcript = '';
            let interim_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            // Update interim results
            transcriptContainer.textContent = `你: ${final_transcript || interim_transcript}`;

            // Once we have a final result, process it with the AI
            if (final_transcript && bellaAI) {
                const userText = final_transcript.trim();
                transcriptContainer.textContent = `你: ${userText}`;

                // 如果聊天界面已打开，也在聊天窗口中显示
                if (chatInterface && chatInterface.getVisibility()) {
                    chatInterface.addMessage('user', userText);
                }

                try {
                    // Let Bella think
                    const thinkingText = document.createElement('p');
                    thinkingText.textContent = '贝拉正在思考...';
                    thinkingText.style.color = '#888';
                    thinkingText.style.fontStyle = 'italic';
                    transcriptContainer.appendChild(thinkingText);
                    
                    const response = await bellaAI.think(userText);
                    
                    transcriptContainer.removeChild(thinkingText);
                    const bellaText = document.createElement('p');
                    bellaText.textContent = `贝拉: ${response}`;
                    bellaText.style.color = '#ff6b9d';
                    bellaText.style.fontWeight = 'bold';
                    bellaText.style.marginTop = '10px';
                    transcriptContainer.appendChild(bellaText);

                    // 如果聊天界面已打开，也在聊天窗口中显示
                    if (chatInterface && chatInterface.getVisibility()) {
                        chatInterface.addMessage('assistant', response);
                    }

                    // TTS功能暂时禁用，将在下一阶段激活
                    // TODO: 激活语音合成功能
                    // const audioData = await bellaAI.speak(response);
                    // const blob = new Blob([audioData], { type: 'audio/wav' });
                    // const audioUrl = URL.createObjectURL(blob);
                    // const audio = new Audio(audioUrl);
                    // audio.play();

                } catch (error) {
                    console.error('Bella AI processing error:', error);
                    const errorText = document.createElement('p');
                    const errorMsg = '贝拉处理时遇到问题，但她还在努力学习中...';
                    errorText.textContent = errorMsg;
                    errorText.style.color = '#ff9999';
                    transcriptContainer.appendChild(errorText);
                    
                    if (chatInterface && chatInterface.getVisibility()) {
                        chatInterface.addMessage('assistant', errorMsg);
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
        };

    } else {
        console.log('您的浏览器不支持语音识别功能。');
        // 可以在界面上给用户提示
    }

    // --- 麦克风按钮交互 ---
    let isListening = false;

    micButton.addEventListener('click', function() {
        if (!SpeechRecognition) return; // 如果不支持，则不执行任何操作

        isListening = !isListening;
        micButton.classList.toggle('is-listening', isListening);
        const transcriptContainer = document.querySelector('.transcript-container');
        const transcriptText = document.getElementById('transcript');

        if (isListening) {
            transcriptText.textContent = '聆听中...'; // 立刻显示提示
            transcriptContainer.classList.add('visible');
            recognition.start();
        } else {
            recognition.stop();
            transcriptContainer.classList.remove('visible');
            transcriptText.textContent = ''; // 清空文本
        }
    });




});