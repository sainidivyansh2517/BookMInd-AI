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
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    return aiClient.getGenerativeModel({ model: modelName });
  }

  // Format concise, high-signal system prompt
  static buildPromptPayload({ prompt, bookContext, userNotes = [], readingHistory = [], conversationHistory = [] }) {
    const systemInstruction = `You are BookMind AI, an intelligent, concise personal reading assistant.
Provide clear, thoughtful responses using clean Markdown (headings, bullet points).
Directly reference the reader's notes and books when relevant.`;

    let contextPayload = '';

    if (bookContext) {
      const authors = Array.isArray(bookContext.authors) ? bookContext.authors.join(', ') : (bookContext.authors || 'Unknown');
      const desc = bookContext.description ? bookContext.description.slice(0, 300) : '';
      
      // Limit to 10 most relevant/recent notes, truncating large contents
      const limitedNotes = userNotes.slice(0, 10).map(n => {
        const title = n.title || 'Untitled Note';
        const content = (n.content || '').slice(0, 250);
        const tags = n.tags && n.tags.length ? ` [Tags: ${n.tags.join(', ')}]` : '';
        return `- "${title}": ${content}${tags}`;
      }).join('\n');

      contextPayload += `\n[BOOK CONTEXT]:
Title: "${bookContext.title}" by ${authors}
Status: ${bookContext.status} | Progress: ${bookContext.progressPages || 0}/${bookContext.totalPages || 0} pages | Rating: ${bookContext.rating || 'Unrated'}/5
${desc ? `Description: ${desc}\n` : ''}${limitedNotes ? `User Notes on this book:\n${limitedNotes}\n` : ''}`;
    }

    if (readingHistory && readingHistory.length > 0) {
      // Limit to top 6 books
      contextPayload += `\n[USER RECENT LIBRARY]:\n` + readingHistory.slice(0, 6).map(b => {
        const authors = Array.isArray(b.authors) ? b.authors.join(', ') : (b.authors || 'Unknown');
        return `- "${b.title}" by ${authors} (${b.status})`;
      }).join('\n') + '\n';
    }

    // Limit conversation history to last 6 messages
    let historyPayload = '';
    if (conversationHistory && conversationHistory.length > 0) {
      historyPayload = '\n[RECENT CONVERSATION]:\n' + conversationHistory.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\n';
    }

    return `${systemInstruction}\n${contextPayload}${historyPayload}\n[USER QUESTION]: ${prompt}`;
  }

  // Real-time streaming generator
  static async generateChatStream({ prompt, bookContext, userNotes, readingHistory, conversationHistory = [], onChunk }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const aiClient = this.getClient();
    const fullPrompt = this.buildPromptPayload({ prompt, bookContext, userNotes, readingHistory, conversationHistory });

    if (apiKey && aiClient) {
      try {
        const model = this.getModel(aiClient);
        const result = await model.generateContentStream(fullPrompt);
        let accumulated = '';

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            accumulated += chunkText;
            if (onChunk) {
              onChunk(chunkText);
            }
          }
        }

        if (accumulated) return accumulated;
      } catch (error) {
        console.error('Gemini streaming error:', error.message);
      }
    }

    // Fallback generator if AI is unavailable
    const fallbackText = this.generateSmartFallbackResponse(prompt, bookContext, userNotes, readingHistory);
    if (onChunk) {
      onChunk(fallbackText);
    }
    return fallbackText;
  }

  // Non-streaming chat response with single bounded retry
  static async generateChatResponse({ prompt, bookContext, userNotes, readingHistory, conversationHistory = [] }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const aiClient = this.getClient();
    const fullPrompt = this.buildPromptPayload({ prompt, bookContext, userNotes, readingHistory, conversationHistory });

    if (apiKey && aiClient) {
      const maxRetries = 1;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const model = this.getModel(aiClient);
          const result = await model.generateContent(fullPrompt);
          const response = await result.response;
          const text = response.text();
          if (text) return text;
        } catch (error) {
          console.error(`Gemini API attempt ${attempt + 1} failed:`, error.message);
          // Do not retry on client/auth errors
          if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403') || attempt >= maxRetries) {
            break;
          }
          await new Promise(r => setTimeout(r, 600)); // Short backoff
        }
      }
    }

    return this.generateSmartFallbackResponse(prompt, bookContext, userNotes, readingHistory);
  }

  // Recommendations generator
  static async generateRecommendations({ readingHistory, favoriteGenres = [], userNotes = [] }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const aiClient = this.getClient();

    const genresText = favoriteGenres.length ? favoriteGenres.join(', ') : 'Productivity, Philosophy, Tech, Fiction';
    const recentBooksText = (readingHistory || []).slice(0, 8).map(b => {
      const authors = Array.isArray(b.authors) ? b.authors.join(', ') : (b.authors || '');
      return `"${b.title}" by ${authors} (${b.status})`;
    }).join('; ') || 'No books yet';

    const topNoteTopics = (userNotes || []).slice(0, 10).map(n => n.tags && n.tags.length ? n.tags.join(', ') : n.title).filter(Boolean).join(', ');

    const prompt = `Based on the user's reading history and interests:
Favorite Genres: ${genresText}
Recent Books: ${recentBooksText}
Note Topics: ${topNoteTopics || 'General learning'}

Provide exactly 4 high-quality book recommendations in strict JSON format:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "genre": "Genre Name",
    "reason": "Clear compelling reason tailored to their specific reading habits."
  }
]
Return ONLY the raw JSON array without markdown formatting.`;

    if (apiKey && aiClient) {
      try {
        const model = this.getModel(aiClient);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text() || '';
        text = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error('Gemini recommendations call failed:', err.message);
      }
    }

    return this.getFallbackRecommendations(readingHistory, favoriteGenres);
  }

  static generateSmartFallbackResponse(prompt, bookContext, userNotes, readingHistory) {
    const q = prompt.toLowerCase();

    if (bookContext) {
      if (q.includes('summary') || q.includes('summarize') || q.includes('key idea')) {
        const noteSummary = (userNotes && userNotes.length > 0)
          ? `\n\n### Your Highlighted Insights:\n` + userNotes.slice(0, 5).map(n => `* **${n.title}**: ${(n.content || '').substring(0, 150)}...`).join('\n')
          : `\n\n*You haven't added specific notes for this book yet. Click "Add Note" to start capturing key ideas!*`;

        return `### Key Synthesis for "${bookContext.title}"\n\n**"${bookContext.title}"** by ${Array.isArray(bookContext.authors) ? bookContext.authors.join(', ') : bookContext.authors} explores transformative ideas around deliberate practice, systemic thinking, and actionable knowledge.\n\n#### Core Pillars:\n1. **Systems over Goals**: Sustainable growth comes from building resilient daily habits.\n2. **Actionable Wisdom**: Converting theoretical reading into actionable reflections.${noteSummary}`;
      }

      if (q.includes('learn') || q.includes('takeaway')) {
        return `### Major Takeaways from "${bookContext.title}"\n\n* **Identity Alignment**: Small daily habits compound into long-term mastery.\n* **Deliberate Reflection**: Writing notes reinforces deep memory retention.\n\nReading progress: ${bookContext.progressPages || 0} / ${bookContext.totalPages || 250} pages.`;
      }
    }

    if (q.includes('note') || q.includes('learned') || q.includes('knowledge')) {
      const notesCount = userNotes ? userNotes.length : 0;
      return `### Overview of Your Knowledge Workspace\n\nYou currently have **${notesCount} personal note(s)** recorded in BookMind AI.\n\n#### Key Knowledge Categories:\n* **Productivity & Focus**\n* **Habits & Continuous Learning**\n* **Strategic Decision Making**\n\n*Navigate to the **Notes** tab to browse or search all entries.*`;
    }

    return `### BookMind AI Assistant\n\nThank you for asking: "${prompt}".\n\nBased on your digital reading collection of **${readingHistory ? readingHistory.length : 0} books**, consistent note-taking and regular review turn reading into practical insight.\n\n* **Reflection**: What is the most actionable principle you discovered in your latest reading?`;
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
