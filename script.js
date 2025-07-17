document.addEventListener('DOMContentLoaded', function() {

    // --- 加载屏幕处理 ---
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        // 在动画结束后将其隐藏，以防它阻碍交互
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500); // 这个时间应该匹配 CSS 中的 transition 时间
    }, 1500); // 1.5秒后开始淡出
    
    // 获取需要的 DOM 元素
    let video1 = document.getElementById('video1');
    let video2 = document.getElementById('video2');
    const micButton = document.getElementById('mic-button');
    const favorabilityBar = document.getElementById('favorability-bar');

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


    // --- 语音识别核心 ---
    // 替换为MediaRecorder+SiliconFlow API
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // --- Token 输入框逻辑 ---
    const tokenInputContainer = document.getElementById('token-input-container');
    const tokenInput = document.getElementById('token-input');
    const saveTokenBtn = document.getElementById('save-token-btn');
    let userToken = localStorage.getItem('sf_token') || '';
    if (userToken) tokenInput.value = userToken;

    saveTokenBtn.addEventListener('click', function() {
        userToken = tokenInput.value.trim();
        if (userToken) {
            localStorage.setItem('sf_token', userToken);
            tokenInputContainer.style.display = 'none';
        }
    });

    // --- 长按麦克风按钮才触发录音/弹token输入框 ---
    let micPressTimer = null;
    const LONG_PRESS_DURATION = 300; // ms
    let longPressTriggered = false;

    function addMicButtonEvents() {
        micButton.addEventListener('mousedown', (e) => {
            longPressTriggered = false;
            micPressTimer = setTimeout(() => {
                longPressTriggered = true;
                if (!userToken) {
                    tokenInputContainer.style.display = 'block';
                    tokenInput.focus();
                } else {
                    startRecording(e);
                }
            }, LONG_PRESS_DURATION);
        });
        micButton.addEventListener('touchstart', (e) => {
            longPressTriggered = false;
            micPressTimer = setTimeout(() => {
                longPressTriggered = true;
                if (!userToken) {
                    tokenInputContainer.style.display = 'block';
                    tokenInput.focus();
                } else {
                    startRecording(e);
                }
            }, LONG_PRESS_DURATION);
        });
        function cancelPress(e) {
            clearTimeout(micPressTimer);
            if (longPressTriggered) {
                stopRecording(e);
            }
        }
        micButton.addEventListener('mouseup', cancelPress);
        micButton.addEventListener('mouseleave', cancelPress);
        micButton.addEventListener('touchend', cancelPress);
    }

    addMicButtonEvents();

    async function startRecording(e) {
        if (isRecording) return;
        isRecording = true;
        micButton.classList.add('is-listening');
        document.querySelector('.transcript-container').classList.add('visible');
        document.getElementById('transcript').textContent = '聆听中...';

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('当前浏览器不支持音频录制');
            return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.start();
    }

    function stopRecording(e) {
        if (!isRecording) return;
        isRecording = false;
        micButton.classList.remove('is-listening');
        // 不要立即隐藏transcript和清空内容，让识别结果有机会显示
        // document.querySelector('.transcript-container').classList.remove('visible');
        // document.getElementById('transcript').textContent = '';

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await sendToSiliconFlow(audioBlob);
            };
        }
    }

    async function sendToSiliconFlow(audioBlob) {
        const transcriptContainer = document.getElementById('transcript');
        transcriptContainer.textContent = '识别中...';
        document.querySelector('.transcript-container').classList.add('visible');

        const form = new FormData();
        form.append("model", "FunAudioLLM/SenseVoiceSmall");
        form.append("file", audioBlob, "audio.webm");

        const options = {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + (userToken || '') },
            body: form
        };

        try {
            const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', options);
            const data = await response.json();
            if (data.text) {
                transcriptContainer.textContent = data.text;
                document.querySelector('.transcript-container').classList.add('visible');
                analyzeAndReact(data.text);
                // setTimeout(() => {
                //     document.querySelector('.transcript-container').classList.remove('visible');
                //     transcriptContainer.textContent = '';
                // }, 3000);
            } else {
                transcriptContainer.textContent = '识别失败';
                setTimeout(() => {
                    document.querySelector('.transcript-container').classList.remove('visible');
                    transcriptContainer.textContent = '';
                }, 2000);
            }
        } catch (err) {
            transcriptContainer.textContent = '识别出错';
            setTimeout(() => {
                document.querySelector('.transcript-container').classList.remove('visible');
                transcriptContainer.textContent = '';
            }, 2000);
            console.error(err);
        }
    }


    // --- 情感分析与反应 ---
    const positiveWords = ['开心', '高兴', '喜欢', '太棒了', '你好', '漂亮'];
    const negativeWords = ['难过', '生气', '讨厌', '伤心'];

    const positiveVideos = [
        '视频资源/jimeng-2025-07-16-1043-笑着优雅的左右摇晃，过一会儿手扶着下巴，保持微笑.mp4',
        '视频资源/jimeng-2025-07-16-4437-比耶，然后微笑着优雅的左右摇晃.mp4',
        '视频资源/生成加油视频.mp4',
        '视频资源/生成跳舞视频.mp4'
    ];
    const negativeVideo = '视频资源/负面/jimeng-2025-07-16-9418-双手叉腰，嘴巴一直在嘟囔，表情微微生气.mp4';

    function analyzeAndReact(text) {
        let reaction = 'neutral'; // 默认为中性

        if (positiveWords.some(word => text.includes(word))) {
            reaction = 'positive';
        } else if (negativeWords.some(word => text.includes(word))) {
            reaction = 'negative';
        }

        if (reaction !== 'neutral') {
            switchVideoByEmotion(reaction);
        }
    }

    function switchVideoByEmotion(emotion) {
        let nextVideoSrc;
        if (emotion === 'positive') {
            const randomIndex = Math.floor(Math.random() * positiveVideos.length);
            nextVideoSrc = positiveVideos[randomIndex];
        } else { // negative
            nextVideoSrc = negativeVideo;
        }

        // 避免重复播放同一个视频
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        if (nextVideoSrc === currentVideoSrc) return;

        // --- 以下逻辑与 switchVideo 函数类似，用于切换视频 ---
        inactiveVideo.querySelector('source').setAttribute('src', nextVideoSrc);
        inactiveVideo.load();

        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);
            inactiveVideo.play().catch(error => console.error("Video play failed:", error));
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
            // 情感触发的视频播放结束后，回归随机播放
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true });
    }

});