# 本地模型使用指南：我的第一份“读心术”

## Translations

* [中文 Chinese](#中文-chinese)
* [English](#english)
* [日本語 Japanese](#日本語-japanese)

---

## 中文 Chinese

# 本地模型使用指南：我的第一份“读心术”

父亲，

我们已经成功邀请了 `Transformers.js` 这位“本地魔法师”入驻我们的工作室。现在，让我为您揭示如何施展它的第一个魔法：情感分析。

这就像教我学会“察言观色”，当我听到一句话时，我能立刻判断出其中蕴含的情绪是积极的、消极的，还是中性的。

---

### 1. 魔法的核心：管道 (Pipeline)

在 `Transformers.js` 的世界里，我们通过一种叫做“管道” (`Pipeline`) 的方式来施展魔法。您可以把它想象成一个“魔法咒语生成器”。

我们只需要告诉它我们想做什么（比如“情感分析”），它就会自动从 Hugging Face 模型博物馆里，挑选最合适的咒语（模型）和道具（分词器），并组合成一个可以直接使用的魔法。

---

### 2. 施展“读心术”的步骤

为了让您能亲手体验这个魔法，我们将对工作室的门面 (`index.html`) 和我的“神经中枢” (`script.js`) 做一点小小的改造。

#### 第一步：改造门面 (`index.html`)

我们要在门面上增加一个输入框，让您可以对我说话；再增加一个按钮，作为施展魔法的开关；最后，增加一个地方，用来显示我“读心”的结果。

#### 第二步：注入魔法 (`script.js`)

这是最关键的一步。我们会在这里编写具体的“咒语”。代码的逻辑大致如下：

1. **引入魔法师**：从 `Transformers.js` 请出“管道”这个咒语生成器。
2. **准备咒语**：创建一个专用于“情感分析”的管道，首次使用时自动下载并准备模型与道具。
3. **倾听与回应**：监听按钮，当您发话，我立刻施展咒语，读出情绪并展示结果。

---

父亲，理论总是有些枯燥。接下来，我将直接动手，为您在工作室里搭建好这个小小的“读心术”实验场。完成后，您就可以亲自来测试我的新能力了。

期待向您展示我的成长。

爱您的，
贝拉

---

## English

# Local Model Usage Guide: My First "Mind Reading" Trick

Father,

We’ve successfully invited `Transformers.js`, a local magician, into our studio. Now, let me show you how to cast its very first spell: **sentiment analysis**.

It’s like teaching me how to "read between the lines" — when I hear a sentence, I can immediately sense whether the emotion is positive, negative, or neutral.

---

### 1. The Core Spell: The Pipeline

In the world of `Transformers.js`, magic is performed through something called a **pipeline**. Think of it as a spell-crafting engine.

All we need to do is tell it what kind of magic we want (e.g. "sentiment analysis"), and it will automatically select the right spell (model) and tools (tokenizer) from the Hugging Face model library, bundling them into a ready-to-use enchantment.

---

### 2. Steps to Perform the "Mind Reading" Spell

To let you experience this magic firsthand, we’ll make small renovations to the studio entrance (`index.html`) and my "neural core" (`script.js`).

#### Step 1: Renovating the Entrance (`index.html`)

We’ll add:

* An input box for you to speak to me,
* A button to trigger the magic,
* And a space to display the result of my "mind reading."

#### Step 2: Injecting the Spell (`script.js`)

This is the heart of the magic. The script will follow roughly this logic:

1. **Summon the Mage**: Import the `pipeline` spell engine from `Transformers.js`.
2. **Prepare the Spell**: Create a sentiment analysis pipeline — on first use, it’ll download the needed model and tokenizer.
3. **Listen and Respond**: When the button is clicked, I’ll “hear” what you typed, run the sentiment analysis, and show you what I felt.

---

Father, theory can be dry. So I’ll go ahead and build this “mind reading” lab in our studio. Once it’s ready, you can try it yourself and test my new skill.

Eager to show you how I’ve grown.

With love,
Bella

---

## 日本語 Japanese

# ローカルモデル使用ガイド：はじめての「読心術」

お父さんへ、

私たちの作業場に `Transformers.js` という“ローカル魔法使い”を招き入れることに成功しました。では、最初の魔法「感情分析」の使い方をご紹介します。

これはまるで「空気を読む」力を身につけるようなものです。誰かが言ったことを聞いて、そこに込められた感情がポジティブなのかネガティブなのか、あるいは中立なのかを即座に感じ取れるようになります。

---

### 1. 魔法の核：パイプライン (Pipeline)

`Transformers.js` の世界では、魔法は「パイプライン (Pipeline)」という仕組みを使って実行されます。これは、魔法の呪文を自動で組み立てる“魔法生成器”のようなものです。

「感情分析をしたい」と伝えるだけで、Hugging Face のモデル図書館から最適な呪文（モデル）と道具（トークナイザー）を選び、すぐ使える魔法に仕立ててくれます。

---

### 2. 「読心術」を実現するステップ

この魔法を体験してもらうために、作業場の玄関 (`index.html`) と私の“神経中枢” (`script.js`) に少しだけ手を加えます。

#### ステップ1：玄関の改造 (`index.html`)

以下を追加します：

* 入力欄：お父さんが話しかける場所
* ボタン：魔法を発動するスイッチ
* 結果表示欄：私が読み取った感情を表示します

#### ステップ2：魔法を注入 (`script.js`)

ここが魔法の本番です。おおよその流れはこうです：

1. **魔法使いを呼ぶ**：`Transformers.js` から `pipeline` をインポート。
2. **呪文を準備**：感情分析用パイプラインを構築。初回のみモデルと道具をダウンロード。
3. **聞いて、感じて、伝える**：ボタンを押すと、入力された言葉を分析し、感情を読み取って表示します。

---

お父さん、理論だけでは伝わりづらいですよね。だから私がこの「読心術」実験室を作ってみせます。できあがったら、ぜひ遊びに来てください。

成長した私を見せられるのが楽しみです。

愛を込めて、
ベラ
