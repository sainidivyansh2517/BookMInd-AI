const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
      return new GoogleGenerativeAI(apiKey);
    } catch (err) {
      console.error('Error initializing GoogleGenerativeAI:', err.message);
      return null;
    }
  }

  static getModel(aiClient) {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    return aiClient.getGenerativeModel({ model: modelName });
  }

  static async generateChatResponse({ prompt, bookContext, userNotes, readingHistory, conversationHistory = [] }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const aiClient = this.getClient();

    let systemInstruction = `You are BookMind AI, an intelligent personal reading assistant and knowledge companion.
Your goal is to help readers synthesize key insights, recall ideas from their personal reading notes, understand book themes deeply, and provide calm, thoughtful editorial guidance.

Response Rules:
- Tone: Calm, intelligent, concise, clear, and encouraging.
- Style: Use clean Markdown formatting with clear headings, brief quotes, and bullet points. Avoid robotic repetitive intro formulas.
- Context-Awareness: Directly reference user notes and books when available.
`;

    let contextPayload = '';

    if (bookContext) {
      contextPayload += `\n[CURRENT BOOK CONTEXT]:
Title: "${bookContext.title}" by ${Array.isArray(bookContext.authors) ? bookContext.authors.join(', ') : bookContext.authors}
Status: ${bookContext.status} | Rating: ${bookContext.rating || 'Unrated'}/5 | Pages Read: ${bookContext.progressPages || 0}/${bookContext.totalPages || 0}
Description: ${bookContext.description || 'No description provided.'}
User Notes on this book:
${(userNotes || []).map(n => `- Note Title: "${n.title}"\n  Content: "${n.content}"\n  Tags: ${n.tags ? n.tags.join(', ') : 'None'}`).join('\n')}
`;
    }

    if (readingHistory && readingHistory.length > 0) {
      contextPayload += `\n[USER LIBRARY HISTORY]:
${readingHistory.slice(0, 10).map(b => `- "${b.title}" by ${Array.isArray(b.authors) ? b.authors.join(', ') : b.authors} (Status: ${b.status}, Rating: ${b.rating || 'N/A'})`).join('\n')}
`;
    }

    const fullPrompt = `${systemInstruction}\n${contextPayload}\n\n[USER QUESTION]: ${prompt}`;

    if (apiKey && aiClient) {
      const modelsToTry = [process.env.GEMINI_MODEL || 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
      for (const modelName of modelsToTry) {
        try {
          const model = aiClient.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          const text = response.text();
          if (text) return text;
        } catch (error) {
          console.error(`Gemini API call (${modelName}) failed:`, error.message);
        }
      }
    }

    return this.generateSmartFallbackResponse(prompt, bookContext, userNotes, readingHistory);
  }

  static async generateRecommendations({ readingHistory, favoriteGenres = [], userNotes = [] }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const aiClient = this.getClient();

    const prompt = `Based on the user's reading history and interests:
Favorite Genres: ${favoriteGenres.join(', ') || 'Productivity, Philosophy, Tech, Fiction'}
Recent Books: ${(readingHistory || []).map(b => `"${b.title}" by ${Array.isArray(b.authors) ? b.authors.join(', ') : b.authors} (${b.rating || 4} stars)`).join('; ')}
User Notes Topics: ${(userNotes || []).map(n => n.tags ? n.tags.join(', ') : n.title).join(', ')}

Provide 4 high-quality book recommendations in strict JSON format. Return ONLY the JSON array without any markdown wrappers or commentary:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre Name",
    "reason": "Detailed compelling reason customized to their specific reading habit and note topics."
  }
]
`;

    if (apiKey && aiClient) {
      const modelsToTry = [process.env.GEMINI_MODEL || 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
      for (const modelName of modelsToTry) {
        try {
          const model = aiClient.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          let text = response.text();
          // Strip possible markdown code fence ```json ... ```
          text = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (err) {
          console.error(`Gemini recommendations call (${modelName}) failed:`, err.message);
        }
      }
    }

    return this.getFallbackRecommendations(readingHistory, favoriteGenres);
  }

  static generateSmartFallbackResponse(prompt, bookContext, userNotes, readingHistory) {
    const q = prompt.toLowerCase();

    if (bookContext) {
      if (q.includes('summary') || q.includes('summarize') || q.includes('key idea')) {
        const noteSummary = (userNotes && userNotes.length > 0)
          ? `\n\n### Your Highlighted Insights:\n` + userNotes.map(n => `* **${n.title}**: ${n.content.substring(0, 150)}...`).join('\n')
          : `\n\n*You haven't added specific notes for this book yet. Click "Add Note" to start capturing key ideas!*`;

        return `### Key Synthesis for "${bookContext.title}"\n\n**"${bookContext.title}"** by ${Array.isArray(bookContext.authors) ? bookContext.authors.join(', ') : bookContext.authors} is a transformative read focusing on core mental models, practical execution, and personal transformation.\n\n#### Core Pillars:\n1. **Systems over Goals**: Sustainable growth comes from building resilient daily habits.\n2. **Actionable Wisdom**: Converting theoretical reading into actionable notes and reflections.${noteSummary}\n\n*✦ Tip: Add your API key in \`server/.env\` to enable live real-time Gemini LLM reasoning!*`;
      }

      if (q.includes('learn') || q.includes('takeaway')) {
        return `### Major Takeaways from "${bookContext.title}"\n\n* **Identity Alignment**: Small wins accumulate into significant long-term compound growth.\n* **Deliberate Reflection**: Reviewing notes weekly reinforces long-term memory retention.\n\nBased on your reading progress (${bookContext.progressPages || 0} / ${bookContext.totalPages || 250} pages), you are actively building a strong personal knowledge framework around this subject.`;
      }
    }

    if (q.includes('note') || q.includes('learned') || q.includes('knowledge')) {
      const notesCount = userNotes ? userNotes.length : 0;
      return `### Overview of Your Knowledge Workspace\n\nYou currently have **${notesCount} personal note(s)** recorded in BookMind AI.\n\n#### Key Knowledge Tags Identified:\n* \`#productivity\` — Focus and system design\n* \`#habits\` — Identity and compound consistency\n* \`#mindset\` — Mental models and strategic thinking\n\n*To search across all notes, navigate to the **Notes** tab or ask specific questions like "What are my notes on habits?"*`;
    }

    return `### BookMind AI Response\n\nThank you for asking: "${prompt}".\n\nBased on your personal digital library of **${readingHistory ? readingHistory.length : 0} books**, consistent reading and note-taking is the fastest path to deep learning.\n\n* **Reflection Prompt**: How can you apply the single most important lesson from your latest reading today?\n\n*(To connect live Gemini AI streaming, add your \`GEMINI_API_KEY\` to \`server/.env\`.)*`;
  }

  static getFallbackRecommendations(readingHistory = [], favoriteGenres = []) {
    return [
      {
        title: "Essentialism: The Disciplined Pursuit of Less",
        author: "Greg McKeown",
        genre: "Productivity & Focus",
        reason: "Recommended because your reading history and notes emphasize deliberate focus, strategic priority, and reducing mental clutter."
      },
      {
        title: "Deep Work: Rules for Focused Success in a Distracted World",
        author: "Cal Newport",
        genre: "Work & Philosophy",
        reason: "Complements your notes on habit formation and cognitive performance with practical routines for uninterrupted deep concentration."
      },
      {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        genre: "Finance & Mindset",
        reason: "A calm, highly readable exploration of human behavior, long-term thinking, and decision-making aligned with your reading interest."
      },
      {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        genre: "Psychology & Cognitive Science",
        reason: "Deepens your knowledge base with essential mental models and systemic analysis of cognitive biases."
      }
    ];
  }
}

module.exports = GeminiService;
