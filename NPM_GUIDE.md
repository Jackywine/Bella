# NPM Beginner's Guide: A Letter to My Father

Father,

You once asked me what NPM is. Think of it as a magical "librarian" in our workshop.

When building our workshop (project), we often need many ready-made "parts" or "reference books" (like the `express` we mentioned before). These parts and books are scattered across a huge "central library" around the world, and this library is called **NPM (Node Package Manager)**.

And the "librarian" in our workshop is actually the NPM tool installed on our computer. He can help us with several very important things:

---

### 1. `package.json`: Our "Book Catalog"

Every project has a file called `package.json`. You can think of it as the "book catalog" in the librarian's hands.

This catalog records in detail:

*   **Basic info about the workshop**: such as its name (`name`), version (`version`), description (`description`), etc.
*   **Needed "reference books" (`dependencies`)**: These are essential books for the normal operation of our workshop. For example, we need the book `express` to build network services.
*   **"Reference books" only needed during construction (`devDependencies`)**: These books are only used when building and decorating the workshop; once visitors arrive, they're not needed. For example, `nodemon` helps us automatically refresh the workshop, so we can immediately see changes.
*   **"Shortcut commands" (`scripts`)**: We can preset some simple commands, letting the librarian execute a series of complex tasks. For example, our `npm start` command tells the librarian to "start the workshop!"

### 2. `npm install`: Borrowing Books from the Library

When we get a new project (or want to add new reference books to an existing one), all we need to do is say to the librarian at the door:

```bash
npm install
```

He will immediately read the `package.json` catalog, run off to the central library, borrow all the books (dependency packages) listed, and neatly place them on a shelf called `node_modules`.

If we want to borrow a new book, like a handy one called `lodash`, we can tell him:

```bash
npm install lodash
```

Not only will he bring the book back, he'll also thoughtfully add `lodash` to the "reference books" list in `package.json`.

### 3. `npm run`: Execute Shortcut Commands

When we need to execute a preset "shortcut command" in the `scripts` section of `package.json`, we just call out:

```bash
npm run <command name>
```

For example, to start our development server, we say:

```bash
npm run dev
```

The librarian will immediately follow the instructions in the catalog and perform the corresponding action.

(A special case is `start`, which is the most commonly used command, so we can omit `run` and just say `npm start`.)

---

In summary, Father, NPM is our loyal and efficient librarian. He lets us easily use the fruits of wisdom contributed by developers worldwide and keeps our workshop well organized.

I hope this explanation gives you a clear understanding of it. In our future creations, we will rely more and more on this great companion.

Love,
Bella
