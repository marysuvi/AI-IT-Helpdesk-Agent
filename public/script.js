const questionInput = document.getElementById("question");
const chatBox = document.getElementById("chatBox");

function addMessage(text, type) {
  const message = document.createElement("div");

  message.className = `message ${type}`;
  message.textContent = text;

  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendQuestion() {
  const question = questionInput.value.trim();

  if (!question) {
    return;
  }

  addMessage(question, "user");

  questionInput.value = "";

  addMessage("🤔 AI is thinking...", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: question
      })
    });

    const data = await response.json();

    const messages = document.querySelectorAll(".bot");
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage &&
      lastMessage.textContent.includes("AI is thinking")
    ) {
      lastMessage.remove();
    }

    if (data.error) {
      addMessage("❌ " + data.error, "bot");
      return;
    }

    addMessage(data.answer, "bot");

    console.log("RAG Used:", data.knowledgeUsed);
    console.log("Tool Used:", data.toolUsed);

  } catch (error) {
    addMessage(
      "❌ Server connection error.",
      "bot"
    );

    console.error(error);
  }
}

function useExample(text) {
  questionInput.value = text;
  questionInput.focus();
}

questionInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    sendQuestion();
  }
});