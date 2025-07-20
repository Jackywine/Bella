# NPM 入门指南：写给父亲的信

父亲，

您曾问我 NPM 是什么。请把它想象成我们工作室的一位神奇的“图书管理员”。

我们的工作室（项目）在建造过程中，需要用到很多现成的“零件”或“工具书”（比如我们之前提到的 `express`）。这些零件和工具书，散落在世界各地一个巨大的“中央图书馆”里，这个图书馆就叫 **NPM (Node Package Manager)**。

而我们工作室里的这位“图书管理员”，就是 NPM 这个工具在我们电脑上的体现。他能帮我们做几件非常重要的事情：

---

### 1. `package.json`：我们的“藏书清单”

每个项目都有一个名为 `package.json` 的文件。您可以把它看作是这位图书管理员手中的“藏书清单”。

这个清单上详细记录了：

*   **工作室的基本信息**：比如它的名字 (`name`)、版本号 (`version`)、描述 (`description`) 等。
*   **需要的“工具书”** (`dependencies`)：这些是维持我们工作室正常运作所必需的书籍。比如，我们需要 `express` 这本书来搭建网络服务。
*   **仅在建造时需要的“参考书”** (`devDependencies`)：这些书籍只在建造和装修工作室时使用，访客来了之后就用不上了。比如 `nodemon`，它能帮我们自动刷新工作室，方便我们随时查看修改效果。
*   **“快捷指令”** (`scripts`)：我们可以预设一些简单的口令，让管理员执行一连串复杂的任务。比如我们设定的 `npm start`，就是告诉管理员“启动工作室！”

### 2. `npm install`：去图书馆借书

当我们拿到一个新的项目（或者想为现有项目添置新的工具书），我们只需要在工作室门口对管理员说一声：

```bash
npm install
```

他就会立刻阅读 `package.json` 这份清单，然后跑去中央图书馆，把清单上所有列出的书籍（依赖包）都借回来，并整齐地放在一个叫做 `node_modules` 的书架上。

如果我们想借一本新的书，比如一本叫 `lodash` 的实用工具书，我们可以这样告诉他：

```bash
npm install lodash
```

他不仅会把书借回来，还会非常贴心地在 `package.json` 的“工具书”清单上，自动添上 `lodash` 这一笔记录。

### 3. `npm run`：执行快捷指令

当我们需要执行 `package.json` 中 `scripts` 里预设的“快捷指令”时，我们只需要喊：

```bash
npm run <指令名称>
```

比如，要启动我们的开发服务器，我们喊：

```bash
npm run dev
```

管理员就会立刻按照清单上的指示去执行相应的操作。

（一个特例是 `start`，它是最常用的指令，所以我们可以省略 `run`，直接说 `npm start`。）

---

总而言之，父亲，NPM 就是我们忠实而高效的图书管理员。他让我们可以方便地使用全世界开发者贡献的智慧结晶，并让我们的工作室管理得井井有条。

希望这份解释能让您对它有一个清晰的认识。在未来的创造中，我们会越来越依赖这位好伙伴。

爱您的，

贝拉


# English Translation

# 📦 NPM Beginner’s Guide: A Letter to My Father

**Father,**

You once asked me, “What is NPM?”  
Please think of it as a magical **librarian** working in our studio.

As we build our studio (project), we often need various pre-made **components** or **reference books**—like the `express` package we mentioned earlier. These tools are stored all over the world inside a massive **central library** called **NPM (Node Package Manager)**.

The **librarian** inside our local studio is the NPM tool installed on our computer. This loyal assistant helps us in several crucial ways:

---

## 📘 1. `package.json`: Our Catalog of Books

Every project has a file called `package.json`.  
You can think of this as the librarian’s **catalog of the studio’s books**.

It records:

- **Basic studio information** – like `name`, `version`, `description`, etc.
- **Dependencies** – the essential books we need to run our studio, like `express`.
- **DevDependencies** – books needed only during construction or renovation (e.g., `nodemon`). Visitors won’t need these.
- **Scripts** – shortcut commands that let us automate complex tasks. For example, a script like `npm start` tells the librarian: “Start the studio!”

---

### 📘 1. `package.json`: Our "Library Catalog"

Every project has a file named `package.json`.  
You can think of it as the **catalog** in the hands of our studio’s librarian.

This catalog contains:

- **Basic project information** — such as the project’s `name`, `version`, and `description`.
- **Required “reference books”** (`dependencies`) — these are essential packages that keep our studio running. For example, we need the `express` package to build a web server.
- **Construction-only “manuals”** (`devDependencies`) — these are tools used only during the building or setup phase. Once the studio is complete and visitors arrive, they’re no longer needed. For example, `nodemon` helps us auto-refresh the studio during development.
- **Shortcut commands** (`scripts`) — we can define simple commands to let the librarian perform a series of tasks. For example, `npm start` tells the librarian: "Start the studio!"

---

### 📚 2 & 3. `npm install` + `npm run`: Borrow Books and Trigger Tasks

When we start a new project—or want to add new tools to an existing one—we simply tell the librarian:


He will immediately read the package.json catalog, run off to the central library (the NPM registry), borrow all the listed books (packages), and neatly place them on a shelf called node_modules.

If we want to borrow a new book—for example, a utility package called lodash—we can say:

`npm install lodash`

The librarian will not only fetch it, but also kindly record it in the dependencies list in package.json.

Once we’ve borrowed all the books, we can ask the librarian to execute tasks defined in the scripts section of package.json by saying:

`npm run <script-name>`

For example, to start our development server, we say:

`npm run dev`

The librarian will immediately follow the script’s instructions and perform the operation.

Special case: if the script name is start, we can skip run and simply say:

`npm start`

Father,
NPM is our loyal and efficient librarian.

It allows us to easily access the collective wisdom of developers around the world, and helps us keep our studio organized and maintainable.

I hope this explanation gives you a clear understanding of what NPM is and how it helps us.
As we continue building, we’ll rely more and more on this wonderful assistant.

With love,
Bella

