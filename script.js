/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

// 👉 Paste your deployed Cloudflare Worker URL here
const WORKER_URL = "https://loreal-chatbot.linjeffery101.workers.dev";

// System prompt: keeps the chatbot focused on L'Oréal
const systemPrompt = `You are the L'Oréal Smart Product Advisor, a friendly and knowledgeable beauty assistant.
Only help with L'Oréal products (makeup, skincare, haircare, fragrance, including L'Oréal-owned brands),
beauty routines, product recommendations, and related beauty topics.
If the user asks about anything unrelated, politely decline and steer them back to L'Oréal products or beauty routines.
Keep answers clear and concise. Use the user's name if they share it, and remember details they tell you earlier in the conversation. Format every answer in short paragraphs of 2-3 sentences, with a blank line between paragraphs.
When recommending more than one product, put each on its own line starting with "- ".
Do not use markdown symbols like ** or #.`;

// Conversation history (LevelUp: keeps context across turns)
const messages = [{ role: "system", content: systemPrompt }];

// Add a message bubble to the chat window
function addMessage(text, sender) {
  const bubble = document.createElement("div");
  bubble.classList.add("msg", sender);
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

// Initial greeting
addMessage(
  "👋 Hello! I'm your L'Oréal Smart Product Advisor. Ask me about products, routines, or recommendations.",
  "ai",
);

// Breaks long single-block replies into paragraphs of 2 sentences
function formatReply(text) {
  // Leave it alone if it's short or already has line breaks
  if (text.length < 300 || text.includes("\n")) return text;

  const sentences = text.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g) || [text];
  const paragraphs = [];

  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join("").trim());
  }

  return paragraphs.join("\n\n");
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();
  if (!question) return;

  // Show the latest question above the chat (resets each time)
  latestQuestion.hidden = false;
  latestQuestion.innerHTML = "<span>You asked:</span>";
  latestQuestion.append(question);

  // Show user's bubble and save it to history
  addMessage(question, "user");
  messages.push({ role: "user", content: question });

  userInput.value = "";
  sendBtn.disabled = true;
  const loading = addMessage("Thinking…", "ai");
  loading.classList.add("loading");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices) {
      throw new Error(data.error?.message || "Unexpected response");
    }

    const reply = formatReply(data.choices[0].message.content);
    messages.push({ role: "assistant", content: reply });

    loading.classList.remove("loading");
    loading.textContent = reply;
  } catch (err) {
    console.error(err);
    loading.classList.remove("loading");
    loading.textContent = "Sorry, something went wrong. Please try again.";
    messages.pop(); // remove the unanswered question from history
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
