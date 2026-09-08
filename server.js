const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

const {
  checkWifi,
  checkInternet,
  checkSystem
} = require("./tools/helpdeskTools");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

// Load knowledge base
const knowledgePath = path.join(
  __dirname,
  "knowledge",
  "troubleshooting.txt"
);

const knowledge = fs.readFileSync(knowledgePath, "utf8");

// Simple RAG
function retrieveKnowledge(question) {
  const words = question.toLowerCase().split(/\s+/);
  const sections = knowledge.split("\n\n");

  const matches = sections.filter(section => {
    const text = section.toLowerCase();

    return words.some(word =>
      word.length > 3 && text.includes(word)
    );
  });

  return matches.length > 0
    ? matches.slice(0, 3).join("\n\n")
    : "No specific knowledge found.";
}

// Tool selection
function selectTool(question) {
  const q = question.toLowerCase();

  if (q.includes("wifi") || q.includes("wi-fi") || q.includes("network")) {
    return checkWifi();
  }

  if (q.includes("internet") || q.includes("website")) {
    return checkInternet();
  }

  if (q.includes("slow") || q.includes("computer")) {
    return checkSystem();
  }

  return null;
}

// Ask Ollama
async function askOllama(prompt) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();

  return data.response;
}

// AI Helpdesk Agent
app.post("/api/chat", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({
        error: "Question is required"
      });
    }

    const relevantKnowledge = retrieveKnowledge(question);
    const toolResult = selectTool(question);

    const toolInformation = toolResult
      ? JSON.stringify(toolResult)
      : "No tool required.";

    const prompt = `
You are an AI IT Helpdesk Agent.

Help the user solve common IT problems.

Use the knowledge and tool result provided below.

Give simple step-by-step instructions.
Do not ask for passwords or sensitive information.

USER QUESTION:
${question}

RELEVANT KNOWLEDGE:
${relevantKnowledge}

TOOL RESULT:
${toolInformation}

Give a helpful answer.
`;

    const answer = await askOllama(prompt);

    res.json({
      answer: answer,
      knowledgeUsed: relevantKnowledge !== "No specific knowledge found.",
      toolUsed: toolResult ? toolResult.tool : "None"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to connect to Ollama. Make sure Ollama is running."
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI IT Helpdesk running at http://localhost:${PORT}`);
  console.log(`Using Ollama model: ${OLLAMA_MODEL}`);
});