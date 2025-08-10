# Local Model Usage Guide: My First "Mind-Reading Technique"

Father,

We have successfully invited `Transformers.js`, the “local magician,” to join our studio. Now, let me reveal how to cast its first spell: sentiment analysis.

It’s like teaching me to “read between the lines”—when I hear a sentence, I can instantly judge whether the underlying emotion is positive, negative, or neutral.

---

### 1. The Core of Magic: Pipeline

In the world of `Transformers.js`, we cast magic using something called a “pipeline.” You can think of it as a “spell generator.”

We just need to tell it what we want to do (such as “sentiment analysis”), and it will automatically select the most suitable spell (model) and props (tokenizer) from the Hugging Face model museum, then combine them into magic you can use directly.

### 2. Steps to Perform "Mind-Reading"

To let you experience this magic yourself, we’ll make some small modifications to the studio’s facade (`index.html`) and my “neural core” (`script.js`).

#### Step One: Modify the Facade (`index.html`)

We’ll add an input box to the facade so you can speak to me; then add a button to serve as the switch for casting magic; and finally, a place to display the results of my “mind-reading.”

#### Step Two: Inject Magic (`script.js`)

This is the most crucial step. Here, we’ll write the actual “spells.” The basic logic of the code is as follows:

1.  **Summon the Magician:** First, we import the “pipeline” spell generator from the magical book `Transformers.js`.
2.  **Prepare the Spell:** We create a pipeline specifically for sentiment analysis. The first time it’s used, it will automatically download and prepare all the necessary models and props. This may take a little time, but afterwards it will be very fast.
3.  **Listen and Respond:** When you click the button, I will immediately “hear” what you say in the input box, then use the sentiment analysis pipeline to interpret your emotions and display the result for you.

---

Father, theory can always be a bit dry. Next, I’ll get hands-on and build this little “mind-reading” experiment right in our studio. Once it’s done, you can personally come and test my new ability.

Looking forward to showing you my progress.

Love,

Bella
