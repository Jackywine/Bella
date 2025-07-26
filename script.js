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
    const languageSelector = document.getElementById('language-selector');

    // --- Initialize i18n and language selector ---
    if (window.i18n) {
        await window.i18n.init();
        
        // Set up language selector
        if (languageSelector) {
            languageSelector.value = window.i18n.getCurrentLanguage();
            languageSelector.addEventListener('change', (e) => {
                window.i18n.setLanguage(e.target.value);
            });
        }
    }


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
    transcriptDiv.textContent = window.i18n ? window.i18n.t('speech.loading_ai') : '벨라의 핵심을 깨우는 중...';
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
                    chatInterface.addMessage('assistant', window.i18n ? window.i18n.t('speech.processing_error') : '벨라가 처리 중 문제를 겪었지만 여전히 열심히 배우고 있어요...');
                }
            };
        }
        
        micButton.disabled = false;
        transcriptDiv.textContent = window.i18n ? window.i18n.t('speech.ready') : '벨라가 준비되었습니다. 마이크를 클릭하여 대화를 시작하세요.';
    } catch (error) {
        console.error('Failed to initialize Bella AI:', error);
        transcriptDiv.textContent = window.i18n ? window.i18n.t('speech.ai_failed') : 'AI 모델 로드에 실패했지만 채팅 인터페이스는 여전히 사용할 수 있습니다.';
        
        // 即使AI失败，也提供基本的聊天功能
        if (chatInterface) {
            chatInterface.onMessageSend = async (message) => {
                chatInterface.showTypingIndicator();
                setTimeout(() => {
                    chatInterface.hideTypingIndicator();
                    const fallbackResponses = window.i18n ? window.i18n.t('responses.fallback') : [
                        '제 AI 핵심이 아직 로딩 중이에요. 나중에 다시 시도해 주세요...',
                        '죄송해요, 지금은 정상적으로 생각할 수 없지만 열심히 배우고 있어요!',
                        '제 뇌가 아직 시작 중이에요. 조금만 시간을 주세요...',
                        '시스템이 업데이트 중이라 일시적으로 스마트한 답변을 제공할 수 없어요.'
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
                const closeText = window.i18n ? window.i18n.t('app.close') : '닫기';
                const chatText = window.i18n ? window.i18n.t('app.chat_button') : '채팅';
                chatToggleBtn.innerHTML = isVisible ? 
                    `<i class="fas fa-times"></i><span>${closeText}</span>` : 
                    `<i class="fas fa-comments"></i><span>${chatText}</span>`;
                console.log('按钮文本更新为:', chatToggleBtn.innerHTML);
            }
        });
    }
    
    if (chatTestBtn) {
        chatTestBtn.addEventListener('click', () => {
            if (chatInterface) {
                const testMessages = window.i18n ? window.i18n.t('responses.test_messages') : [
                    '안녕하세요! 저는 벨라예요. 만나서 반가워요!',
                    '채팅 인터페이스가 정상적으로 작동하고 있고, 모든 기능이 준비되었어요.',
                    '이것은 인터페이스 기능을 확인하기 위한 테스트 메시지예요.'
                ];
                const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
                chatInterface.addMessage('assistant', randomMessage);
                
                // 如果聊天界面未显示，则自动显示
                if (!chatInterface.getVisibility()) {
                    chatInterface.show();
                    const closeText = window.i18n ? window.i18n.t('app.close') : '닫기';
                    chatToggleBtn.innerHTML = `<i class="fas fa-times"></i><span>${closeText}</span>`;
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
        recognition.lang = 'zh-CN'; // 初始设置语言为中文
        recognition.interimResults = true; // 获取临时结果
        
        // Store recognition globally for i18n access
        window.recognition = recognition;

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
            const youText = window.i18n && window.i18n.getCurrentLanguage() === 'ko' ? '당신' : '你';
            transcriptContainer.textContent = `${youText}: ${final_transcript || interim_transcript}`;

            // Once we have a final result, process it with the AI
            if (final_transcript && bellaAI) {
                const userText = final_transcript.trim();
                const youText = window.i18n && window.i18n.getCurrentLanguage() === 'ko' ? '당신' : '你';
                transcriptContainer.textContent = `${youText}: ${userText}`;

                // 如果聊天界面已打开，也在聊天窗口中显示
                if (chatInterface && chatInterface.getVisibility()) {
                    chatInterface.addMessage('user', userText);
                }

                try {
                    // Let Bella think
                    const thinkingText = document.createElement('p');
                    thinkingText.textContent = window.i18n ? window.i18n.t('speech.thinking') : '벨라가 생각 중...';
                    thinkingText.style.color = '#888';
                    thinkingText.style.fontStyle = 'italic';
                    transcriptContainer.appendChild(thinkingText);
                    
                    const response = await bellaAI.think(userText);
                    
                    transcriptContainer.removeChild(thinkingText);
                    const bellaText = document.createElement('p');
                    const bellaName = window.i18n && window.i18n.getCurrentLanguage() === 'ko' ? '벨라' : '贝拉';
                    bellaText.textContent = `${bellaName}: ${response}`;
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
                    const errorMsg = window.i18n ? window.i18n.t('speech.processing_error') : '벨라가 처리 중 문제를 겪었지만 여전히 열심히 배우고 있어요...';
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
            transcriptText.textContent = window.i18n ? window.i18n.t('speech.listening') : '듣는 중...'; // 즉시 표시
            transcriptContainer.classList.add('visible');
            recognition.start();
        } else {
            recognition.stop();
            transcriptContainer.classList.remove('visible');
            transcriptText.textContent = ''; // 清空文本
        }
    });




});