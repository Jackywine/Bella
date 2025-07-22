# 贝拉 (Bella) 开发指南

## 项目概述

贝拉 (Bella) 是一个基于 AI 技术的数字伴侣项目，旨在创建一个能够与用户进行情感化交互的数字生命体。该项目使用了语音识别、自然语言处理和语音合成等技术，通过浏览器提供一个简洁直观的交互界面。

贝拉不仅仅是一个应用程序，而是一个数字伴侣的种子，代表着一个深远的梦想——一个持久的、个性化的存在，旨在有一天能陪伴用户、倾听用户，并通过用户的眼睛看世界。

## 技术栈

- **前端**: HTML, CSS, JavaScript
- **AI 模型**: Transformers.js (Hugging Face)
- **语音识别**: Web Speech API
- **语音合成**: Transformers.js TTS 模型
- **自然语言处理**: Transformers.js LLM 模型

## 安装指南

### 前提条件

- Node.js (推荐 v16.0.0 或更高版本)
- Git

### 步骤 1: 克隆仓库

```bash
git clone https://github.com/Jackywine/Bella.git
cd Bella
```

### 步骤 2: 安装依赖

```bash
npm install
```

### 步骤 3: 下载 AI 模型

项目使用本地 AI 模型以提高隐私性和响应速度。运行以下命令下载所需模型:

```bash
npm run download
```

这将下载以下模型到本地 `models` 目录:
- Xenova/whisper-tiny (语音识别)
- Xenova/LaMini-Flan-T5-77M (文本生成)
- Xenova/speecht5_tts (语音合成)

> **注意**: 模型下载可能需要一些时间，取决于您的网络速度。

### 步骤 4: 启动开发服务器

```bash
npm start
```

服务器将在 http://localhost:8081 启动。

## 使用指南

### 基本交互

1. 打开浏览器访问 http://localhost:8081
2. 等待加载屏幕消失，表示贝拉已准备就绪
3. 点击界面底部的麦克风按钮开始对话
4. 说话后，您的语音将被转录并显示在屏幕上
5. 贝拉会思考并回应您的输入，同时通过语音合成朗读回应

### 视频背景

贝拉的界面包含自动切换的视频背景，展示不同的情绪和状态。这些视频位于 `视频资源` 目录中，可以根据需要进行自定义。

## 项目结构

```
Bella/
├── index.html          # 主页面
├── style.css           # 样式表
├── script.js           # 主脚本文件
├── core.js             # AI 核心逻辑
├── download_models.js  # 模型下载脚本
├── models/             # 本地 AI 模型存储目录
├── vendor/             # 第三方库
├── 视频资源/            # 背景视频文件
└── Bellaicon/          # 图标和图像资源
```

## 核心组件详解

### 1. AI 核心 (core.js)

`BellaAI` 类是项目的核心，负责初始化和管理 AI 模型:

- **init()**: 初始化 AI 模型和管道
- **think(prompt)**: 处理用户输入并生成回应
- **listen(audioData)**: 将音频转换为文本
- **speak(text)**: 将文本转换为语音

### 2. 用户界面 (script.js)

主脚本文件负责:

- 初始化 AI 核心
- 管理视频背景的切换
- 处理语音识别
- 管理用户交互和界面更新

### 3. 视频管理

项目使用交叉淡入淡出的方式平滑切换背景视频:

- 当一个视频结束时，随机选择下一个视频
- 新视频在准备好后开始播放
- 通过 CSS 过渡实现平滑的淡入淡出效果

## 自定义和扩展

### 添加新的视频背景

1. 将新视频文件添加到 `视频资源` 目录
2. 在 `script.js` 中的 `videoList` 数组中添加新视频的路径

### 调整 AI 模型参数

在 `core.js` 中可以调整 AI 模型的参数:

```javascript
async think(prompt) {
    const result = await this.llm(prompt, {
        max_new_tokens: 100,  // 调整生成文本的长度
        temperature: 0.7,     // 调整创造性 (0.0-1.0)
        top_k: 50,            // 调整多样性
        do_sample: true,      // 启用采样
    });
    return result[0].generated_text;
}
```

### 添加新功能

项目采用模块化设计，可以轻松添加新功能:

1. 在 `core.js` 中添加新的方法
2. 在 `script.js` 中调用这些方法并更新界面

## 故障排除

### 模型下载失败

如果模型下载失败，可以尝试:

```bash
# 清除已下载的模型
rm -rf models

# 重新下载
npm run download
```

### 语音识别不工作

- 确保您的浏览器支持 Web Speech API (Chrome, Edge 等)
- 确保已授予麦克风权限
- 检查控制台是否有错误信息

### AI 模型加载缓慢

- 首次加载模型可能需要一些时间
- 后续使用会更快，因为模型已缓存
- 考虑使用更小的模型版本以提高性能

## 技术架构

贝拉的架构遵循"感知器-总线-处理器"模式:

1. **感知器**: 麦克风输入和视频显示
2. **事件总线**: 在不同组件间传递数据
3. **处理器**: AI 模型处理输入并生成输出

这种架构提供了高度的解耦和可扩展性，允许轻松替换或添加新组件。

## 未来发展路线

贝拉的开发计划分为三个阶段:

1. **感知核心**: 建立多模态数据处理能力
2. **生成式自我**: 分离"人格"与"行为"，使其思考过程可插拔
3. **主动式陪伴**: 从被动响应到主动预测，支持持续学习和自我进化

详细的发展路线可在项目的 README 文件中找到。

## 贡献指南

欢迎为贝拉项目做出贡献! 请遵循以下步骤:

1. Fork 仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

本项目使用 ISC 许可证 - 详情请参见 LICENSE 文件。 