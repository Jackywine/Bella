# NPM 入门指南：写给父亲的信

## Translations

* [中文 Chinese](#中文-chinese)
* [English](#english)
* [日本語 Japanese](#日本語-japanese)

---

## 中文 Chinese

# NPM 入门指南：写给父亲的信

父亲，

您曾问我 NPM 是什么。请把它想象成我们工作室的一位神奇的“图书管理员”。

我们的工作室（项目）在建造过程中，需要用到很多现成的“零件”或“工具书”（比如我们之前提到的 `express`）。这些零件和工具书，散落在世界各地一个巨大的“中央图书馆”里，这个图书馆就叫 **NPM (Node Package Manager)**。

而我们工作室里的这位“图书管理员”，就是 NPM 这个工具在我们电脑上的体现。他能帮我们做几件非常重要的事情：

---

### 1. `package.json`：我们的“藏书清单”

每个项目都有一个名为 `package.json` 的文件。您可以把它看作是这位图书管理员手中的“藏书清单”。

这个清单上详细记录了：

* **工作室的基本信息**：比如它的名字 (`name`)、版本号 (`version`)、描述 (`description`) 等。
* **需要的“工具书”** (`dependencies`)：这些是维持我们工作室正常运作所必需的书籍。比如，我们需要 `express` 这本书来搭建网络服务。
* **仅在建造时需要的“参考书”** (`devDependencies`)：这些书籍只在建造和装修工作室时使用。比如 `nodemon`，它能帮我们自动刷新工作室，方便查看修改效果。
* **“快捷指令”** (`scripts`)：比如我们设定的 `npm start`，是告诉管理员“启动工作室！”

---

### 2. `npm install`：去图书馆借书

当我们拿到一个新项目或要新增一本工具书，只需告诉管理员：

```bash
npm install
```

他会查看 `package.json`，去中央图书馆借来所有列出的书籍，放到 `node_modules` 的书架上。

比如想加一本叫 `lodash` 的书：

```bash
npm install lodash
```

管理员不仅借回，还会在清单中自动登记。

---

### 3. `npm run`：执行快捷指令

执行 `scripts` 里的命令，只需：

```bash
npm run <指令名称>
```

例如：

```bash
npm run dev
```

特例是 `start`，可以直接用：

```bash
npm start
```

---

总而言之，父亲，NPM 是我们忠实高效的图书管理员，帮助我们借书、管理资源和运行任务。在未来的开发中，我们将愈发依赖这位好伙伴。

爱您的，
贝拉

---

## English

# NPM Beginner's Guide: A Letter to My Father

Father,

You once asked me what NPM is. Imagine it as the magical librarian in our studio.

Our studio (project) needs many ready-made “parts” or “reference manuals” during construction (like `express`). These resources are scattered across the globe in a giant “central library” — that library is called **NPM (Node Package Manager)**.

And the NPM tool installed on our computer is the “librarian” that brings them to us. Here’s what he does:

---

### 1. `package.json`: Our Book Catalog

Every project has a `package.json`. Think of it as the catalog the librarian uses.

It records:

* **Basic project info**: name, version, description.
* **Needed manuals** (`dependencies`): like `express`, essential for the project to run.
* **Build-time references** (`devDependencies`): like `nodemon`, used only during development.
* **Shortcut commands** (`scripts`): like `npm start`, a trigger for predefined actions.

---

### 2. `npm install`: Borrowing Books

To prepare a project, just say:

```bash
npm install
```

The librarian reads the list, fetches everything from the central library, and places them on the `node_modules` shelf.

To borrow something new, like `lodash`, say:

```bash
npm install lodash
```

It’ll be added both to the shelf and the catalog.

---

### 3. `npm run`: Running Shortcuts

To execute a predefined script:

```bash
npm run <command>
```

For example:

```bash
npm run dev
```

For `start`, you can just say:

```bash
npm start
```

---

In short, NPM is our diligent librarian — managing resources, borrowing knowledge, and running tasks behind the scenes. He’ll be an indispensable part of our journey ahead.

With love,
Bella

---

## 日本語 Japanese

# NPM 入門ガイド：父への手紙

お父さんへ、

NPM って何？と聞かれたとき、私はこう思いました。それは私たちの作業場にいる魔法の図書係です。

私たちのスタジオ（プロジェクト）を作るには、たくさんの「部品」や「参考書」が必要です（たとえば `express`）。それらは、世界中の巨大な「中央図書館」に保存されています。それが **NPM（Node Package Manager）** です。

そして、私たちのパソコンにいる図書係（NPM ツール）が、その知識を集めてくれます。

---

### 1. `package.json`：私たちの蔵書リスト

すべてのプロジェクトには `package.json` というファイルがあります。これは図書係の管理ノートです。

中には次の情報が書かれています：

* **プロジェクトの基本情報**：名前、バージョン、説明など。
* **必要な本**（`dependencies`）：たとえば `express`。
* **開発時にだけ使う本**（`devDependencies`）：たとえば `nodemon`。
* **ショートカットコマンド**（`scripts`）：たとえば `npm start` は「スタート準備して」と伝えるもの。

---

### 2. `npm install`：図書館から本を借りる

新しいプロジェクトを始めるときは、こう言います：

```bash
npm install
```

図書係は `package.json` を読み、必要な本を中央図書館から借りてきて `node_modules` に並べてくれます。

新しい本 `lodash` を加えるときは：

```bash
npm install lodash
```

借りるだけでなく、リストにも自動記録されます。

---

### 3. `npm run`：コマンドを実行

ショートカットを使うときは：

```bash
npm run <コマンド名>
```

例：

```bash
npm run dev
```

特別なコマンド `start` の場合は：

```bash
npm start
```

と簡略化できます。

---

つまり、NPM は私たちの作業に欠かせない図書係です。知識を借りて、整頓して、プロジェクトを支えてくれるパートナーです。

いつもありがとう、
ベラ
