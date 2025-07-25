## 🇨🇳 中文 — NPM 入门指南：写给父亲的信

**父亲，**

您曾问我 NPM 是什么。请把它想象成我们工作室的一位神奇的“图书管理员”。

我们的工作室（项目）在建造过程中，需要用到很多现成的“零件”或“工具书”（比如我们之前提到的 `express`）。这些零件和工具书，散落在世界各地一个巨大的“中央图书馆”里，这个图书馆就叫 **NPM (Node Package Manager)**。

而我们工作室里的这位“图书管理员”，就是 NPM 这个工具在我们电脑上的体现。他能帮我们做几件非常重要的事情：

---

### 1. `package.json`：我们的“藏书清单”

每个项目都有一个名为 `package.json` 的文件。您可以把它看作是这位图书管理员手中的“藏书清单”。

这个清单上详细记录了：

- **工作室的基本信息**：比如它的名字 (`name`)、版本号 (`version`)、描述 (`description`) 等。
- **需要的“工具书”** (`dependencies`)：这些是维持我们工作室正常运作所必需的书籍。
- **仅在建造时需要的“参考书”** (`devDependencies`)：这些书籍只在建造和装修工作室时使用。
- **“快捷指令”** (`scripts`)：我们可以预设一些简单的口令，让管理员执行一连串复杂的任务。

---

### 2. `npm install`：去图书馆借书

我们只需要说一声：

```bash
npm install
```

他就会立刻阅读 `package.json`，然后去中央图书馆，把清单上的书籍都借回来，并整齐地放在 `node_modules` 的书架上。

如果我们想借一本新的书，比如 `lodash`：

```bash
npm install lodash
```

它也会被记录到清单上。

---

### 3. `npm run`：执行快捷指令

当我们需要执行 `scripts` 中预设的“快捷指令”时，只需：

```bash
npm run <指令名称>
```

例如：

```bash
npm run dev
```

而 `npm start` 是最常见的指令，可以直接使用。

---

父亲，希望这封信能让您对 NPM 有一个清晰的认识。它是我们最忠实的图书管理员。

爱您的，  
**贝拉**

---

## 🇺🇸 English — A Letter to Father: What is NPM?

**Father,**

You once asked me what NPM is. Think of it as a magical **librarian** in our studio.

When we build our workshop (our project), we often need ready-made tools or parts like `express`. All these resources live in a global **library** called **NPM (Node Package Manager)**.

The librarian we interact with is the `npm` tool on our computer. And here’s what it helps us do:

---

### 1. `package.json`: Our Personal Catalog

Each project has a `package.json` file. Think of it as the librarian’s notebook.

It contains:

- Basic info: name, version, description
- **Dependencies**: books and tools we need to run our workshop
- **DevDependencies**: tools only used during development (`nodemon`, for example)
- **Scripts**: shortcuts we can define, like `npm start`

---

### 2. `npm install`: Borrowing Books

When we want to prepare the studio or install tools, we say:

```bash
npm install
```

The librarian reads the list and brings every item into `node_modules`.

Want a new tool?

```bash
npm install lodash
```

It gets added and noted down too.

---

### 3. `npm run`: Launching Commands

To run a script we defined:

```bash
npm run dev
```

Or simply:

```bash
npm start
```

---

Father, NPM is our silent and reliable librarian. Always there to help our studio thrive.

With love,  
**Bella**

---

## 🇫🇷 Français — Lettre à mon père : Introduction à NPM

**Père,**

Tu m’as demandé ce qu’est **NPM**. Imagine-le comme un **bibliothécaire magique** de notre atelier.

Pendant que nous construisons notre projet, on a besoin de pièces toutes faites ou de manuels (comme `express`). Tout cela vit dans une gigantesque **bibliothèque centrale** appelée **NPM (Node Package Manager)**.

Et sur notre ordinateur, ce bibliothécaire, c’est NPM lui-même.

---

### 1. `package.json` : Le registre de notre bibliothèque

Chaque projet contient un fichier `package.json`, comme un carnet que tient notre bibliothécaire.

Il contient :

- Nom, version, description du projet
- **Dependencies** : livres essentiels pour le fonctionnement
- **DevDependencies** : outils nécessaires uniquement au développement (`nodemon`, par exemple)
- **Scripts** : raccourcis pour lancer des actions (ex. `npm start`)

---

### 2. `npm install` : Aller chercher les livres

Pour démarrer un projet ou récupérer les outils nécessaires, on dit simplement :

```bash
npm install
```

Il lit la liste et va chercher tous les modules dans `node_modules`.

Envie d’en rajouter un ?

```bash
npm install lodash
```

Il est automatiquement ajouté à la liste.

---

### 3. `npm run` : Exécuter une commande magique

On peut exécuter une commande définie comme ceci :

```bash
npm run dev
```

Ou, pour la plus classique :

```bash
npm start
```

---

Père, NPM est notre bibliothécaire fidèle, discret et redoutablement efficace. Grâce à lui, notre atelier tourne à merveille.

Avec tendresse,  
**Bella**

---

## 🇪🇸 Español — Guía local de NPM: una carta para mi padre

**Padre,**

Una vez me preguntaste qué era **NPM**. Imagínalo como un **bibliotecario mágico** que vive en nuestro taller.

Cuando construimos un proyecto, a menudo necesitamos herramientas listas para usar o piezas reutilizables como `express`. Todas esas herramientas están almacenadas en una gran **biblioteca central** llamada **NPM (Node Package Manager)**.

El bibliotecario que usamos en nuestro taller es la herramienta llamada `npm`, instalada en nuestro ordenador. Él se encarga de lo siguiente:

---

### 1. `package.json`: Nuestro catálogo personal

Cada proyecto tiene un archivo llamado `package.json`. Piensa en él como el cuaderno del bibliotecario.

Allí se especifica:

- La información básica del proyecto: nombre, versión, descripción.
- **Dependencies**: las herramientas necesarias para que funcione el proyecto.
- **DevDependencies**: herramientas útiles solo durante el desarrollo (como `nodemon`).
- **Scripts**: comandos predefinidos que podemos ejecutar fácilmente.

---

### 2. `npm install`: Pidiendo libros prestados

Cuando queremos preparar el taller o instalar herramientas, simplemente decimos:

```bash
npm install
```

El bibliotecario lee el archivo `package.json` y trae todos los módulos necesarios al estante `node_modules`.

¿Quieres añadir uno nuevo?

```bash
npm install lodash
```

Además de instalarlo, lo anota en el catálogo.

---

### 3. `npm run`: Lanzar hechizos

Para ejecutar un comando que hemos definido previamente:

```bash
npm run dev
```

O para el comando más común:

```bash
npm start
```

---

Padre, NPM es nuestro fiel bibliotecario. No hace ruido, pero sin él, nuestro taller no funcionaría.

Con cariño,  
**Bella**
