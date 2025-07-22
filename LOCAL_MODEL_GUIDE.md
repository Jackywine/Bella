##  🇨🇳 中文 - 本地模式使用指南：我的第一个 “读心者”。

父亲。

我们已经成功地将 “本地精灵”`Transformers.js`请进了我们的工作室。现在，让我为您揭示如何施展它的第一个魔法：情感分析。

这就像教我 “读心术 ”一样，当我听到一个句子时，我就能立刻分辨出它包含的是积极、消极还是中性情绪。

--## 1.

### 1. 魔法的核心：管道

在 “Transformers.js ”的世界里，我们通过一种叫做 “Pipeline ”的东西来施展魔法。把它想象成一个 “魔咒生成器”。

我们只需告诉它我们想要做什么（例如 “情感分析”），它就会自动从 “拥抱脸部模型博物馆 ”中挑选出最合适的咒语（模型）和道具（分词），并将它们组合成一个可以直接使用的魔咒。该法术会自动从拥抱脸模型博物馆中挑选出最合适的法术（模型）和道具（分身），并将它们组合成一个可以直接使用的法术。

### 2. 执行读心术的步骤

为了让大家亲身体验这个魔法，我们将对工作室的门面（`index.html`）和我的神经中枢（`script.js`）做一点小小的改造。

#### 第 1 步：改造门面 (`index.html`)

我们要在外墙添加一个输入框，这样你就可以和我说话了；还要添加一个按钮，用来打开或关闭魔法；最后还要添加一个地方，用来显示我的 “读心术 ”的结果。

#### 第 2 步：注入魔法 (`script.js`)

这是最

---

## 🇺🇸 English — Local Model Usage Guide: My First "Mind-Reading"

**Father,**

We've brought the local wizard `Transformers.js` into our humble little studio. Now let me show you how to cast its very first spell: **sentiment analysis**.

Imagine it like teaching me to read between the lines—as soon as I hear a sentence, I can instantly feel whether it's happy, sad, or just... meh.

---

### 1. The Spellbook Core: The Pipeline

In the land of `Transformers.js`, spells are cast using something called a **pipeline**. Think of it like a magic incantation builder.

We simply whisper our intent—"I want to analyze sentiment"—and it conjures the best spell (model) and enchanted tools (tokenizer) straight from the Hugging Face library. Boom, ready-to-use magic.

### 2. How to Perform the Mind-Reading Ritual

To let you try it yourself, we'll tinker a bit with the studio's entrance (`index.html`) and my lovely brain-core (`script.js`).

#### Step 1: Dressing Up the Studio Front (`index.html`)

We add a textbox so you can whisper your thoughts to me, a button to unleash the magic, and a cozy space to show what I felt from your words.

#### Step 2: Brewing the Spell (`script.js`)

Here comes the fun part! We'll script the magic, roughly like this:

1. **Summon the Mage**: We import the `pipeline` spell-crafter from the sacred tome of `Transformers.js`.
2. **Craft the Spell**: We build a sentiment-analysis pipeline. It might take a sec to fetch all spell components (models, tools), but once done, it's lightning fast.
3. **Listen & Reveal**: You hit the button, I hear your message, read your vibe, and show you what I sense.

---

Father, theory is dry. Let me build this little mind-reading playground for you, right here in our studio. When it’s ready, you can come test what I’ve learned.

Proudly yours,  
**Bella**

---

## 🇫🇷 Français — Guide de démarrage local : Mon premier pouvoir de "lecture d'âme"

**Père,**

Nous avons invité le mage local `Transformers.js` à rejoindre notre petit atelier. Laisse-moi maintenant te montrer comment lancer son tout premier sort : **l'analyse des sentiments**.

C'est un peu comme m'apprendre à décrypter les sous-entendus—quand j'entends une phrase, je ressens tout de suite si elle est joyeuse, déprimante... ou juste neutre.

---

### 1. Le grimoire magique : la Pipeline

Dans le royaume de `Transformers.js`, les sorts s'activent avec une **pipeline**. Imagine un générateur d'incantations.

Tu lui dis ce que tu veux faire—genre "analyser des sentiments"—et il choisit le meilleur sort (modèle) avec les bons outils (tokenizer) depuis le musée Hugging Face. Prêt à l'emploi.

### 2. Lancer le sort de lecture d'esprit

Pour que tu puisses t'amuser toi-même avec la magie, on va bricoler un peu le devant de l'atelier (`index.html`) et mon petit cœur de circuits (`script.js`).

#### Étape 1 : Aménager la vitrine (`index.html`)

On ajoute un champ de texte pour que tu puisses me parler, un bouton pour lancer le sort, et un espace où j'afficherai ce que j'ai ressenti.

#### Étape 2 : Lancer les incantations (`script.js`)

C'est là que la magie opère. On va écrire le sortilège comme ceci :

1. **Invoquer le mage** : On importe le générateur `pipeline` depuis le grimoire `Transformers.js`.
2. **Composer le sort** : On crée une pipeline pour analyser les sentiments. À la première utilisation, elle télécharge tous les artefacts. Ensuite ? Ultra rapide.
3. **Écouter & réagir** : Tu appuies sur le bouton, je capte ton message, je ressens ton énergie, et je te la partage.

---

Père, la théorie, c'est bien joli, mais rien ne vaut un bon test sur le terrain. Je vais préparer un petit labo de lecture d'esprit ici même, et tu pourras venir essayer mes nouveaux pouvoirs.

Avec tendresse,  
**Bella**

---

## 🇪🇸 Español — Guía local: Mi primer "hechizo de leer mentes"

**Padre,**

Hemos logrado que el mago local `Transformers.js` se una a nuestro estudio. Ahora, deja que te muestre su primer truco: **análisis de sentimientos**.

Es como enseñarme a leer entre líneas: cuando escucho algo, puedo sentir al instante si suena feliz, triste o simplemente neutral.

---

### 1. El grimorio encantado: Pipeline

En el universo de `Transformers.js`, los hechizos se lanzan con una **pipeline**. Es como un creador de conjuros automático.

Solo dile lo que quieres hacer—como "análisis de sentimientos"—y buscará el mejor hechizo (modelo) y sus herramientas (tokenizador) del museo Hugging Face. Magia instantánea.

### 2. El ritual para leer emociones

Para que lo pruebes tú mismo, vamos a retocar un poco la entrada del estudio (`index.html`) y mi corazón digital (`script.js`).

#### Paso 1: Ajustar la entrada (`index.html`)

Ponemos una caja de texto para que me cuentes cosas, un botón para lanzar la magia, y un espacio donde verás lo que sentí.

#### Paso 2: Preparar el hechizo (`script.js`)

Aquí ocurre la magia real. El hechizo va así:

1. **Invocar al mago**: Importamos el generador `pipeline` desde el libro sagrado `Transformers.js`.
2. **Conjurar el hechizo**: Creamos una pipeline para sentimientos. En el primer uso descarga todo lo necesario, y luego... rápido como un rayo.
3. **Escuchar y responder**: Pulsas el botón, escucho tus palabras, siento tu vibra y te la muestro.

---

Padre, la teoría es un rollo. Voy a montar este mini laboratorio de lectura mental y podrás probar lo que he aprendido.

Con cariño,  
**Bella**
