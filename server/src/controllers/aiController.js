const { BookRepo } = require('../models/Book');
const { NoteRepo } = require('../models/Note');
const { ChatRepo } = require('../models/Chat');
const { UserRepo } = require('../models/User');
const { RecommendationRepo } = require('../models/Recommendation');
const GeminiService = require('../services/geminiService');

const handleChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, bookId, chatId, stream = true } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt query is required.' });
    }

    // Load contextual user data with strict ownership verification
    let bookContext = null;
    let userNotes = [];

    if (bookId) {
      bookContext = await BookRepo.findById(bookId);
      if (!bookContext || String(bookContext.userId) !== String(userId)) {
        return res.status(403).json({ message: 'Access denied: You do not own this book resource.' });
      }
      userNotes = await NoteRepo.findByBook(userId, bookId);
    } else {
      userNotes = await NoteRepo.findByUser(userId, { limit: 12 });
      if (Array.isArray(userNotes)) {
        // ok
      } else if (userNotes && userNotes.notes) {
        userNotes = userNotes.notes;
      }
    }

    // Fetch lightweight library history
    const booksData = await BookRepo.findByUser(userId, { limit: 8 });
    const readingHistory = Array.isArray(booksData) ? booksData : (booksData.books || []);

    // Load or initialize conversation
    let conversation = null;
    if (chatId) {
      const existing = await ChatRepo.findById(chatId);
      if (existing && String(existing.userId) === String(userId)) {
        conversation = existing;
      }
    }

    if (!conversation) {
      const title = bookContext ? `Query on ${bookContext.title}` : (prompt.slice(0, 32) + '...');
      conversation = await ChatRepo.create({
        userId,
        bookId: bookId || null,
        title,
        messages: []
      });
    }

    const convId = conversation._id || conversation.id;
    const conversationHistory = conversation.messages || [];

    // Check if client requested streaming
    const isStreamRequested = stream !== false;

    if (isStreamRequested) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let fullResponseText = '';

      try {
        fullResponseText = await GeminiService.generateChatStream({
          prompt: prompt.trim(),
          bookContext,
          userNotes,
          readingHistory,
          conversationHistory,
          onChunk: (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk, chatId: convId })}\n\n`);
          }
        });

        // Persist messages atomically after streaming completes
        const now = new Date().toISOString();
        await ChatRepo.appendMessages(convId, [
          { role: 'user', content: prompt.trim(), timestamp: now },
          { role: 'assistant', content: fullResponseText, timestamp: now }
        ]);

        res.write(`data: ${JSON.stringify({ done: true, chatId: convId, fullText: fullResponseText })}\n\n`);
        return res.end();
      } catch (streamErr) {
        console.error('Streaming handler error:', streamErr);
        res.write(`data: ${JSON.stringify({ error: 'Streaming interrupted', done: true })}\n\n`);
        return res.end();
      }
    }

    // Standard Non-streaming response
    const aiResponseText = await GeminiService.generateChatResponse({
      prompt: prompt.trim(),
      bookContext,
      userNotes,
      readingHistory,
      conversationHistory
    });

    const now = new Date().toISOString();
    const savedChat = await ChatRepo.appendMessages(convId, [
      { role: 'user', content: prompt.trim(), timestamp: now },
      { role: 'assistant', content: aiResponseText, timestamp: now }
    ]);

    return res.json({
      chatId: convId,
      response: aiResponseText,
      messages: savedChat ? savedChat.messages : []
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      message: 'BookMind AI could not process that request right now. Please try again.'
    });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { refresh } = req.query;

    // Check persistent cache first unless explicitly refreshing
    if (!refresh || refresh === 'false') {
      const cached = await RecommendationRepo.findByUser(userId);
      if (cached && cached.recommendations && cached.recommendations.length > 0) {
        return res.json({
          recommendations: cached.recommendations,
          cached: true,
          generatedAt: cached.generatedAt
        });
      }
    }

    // Cache miss or refresh requested: generate fresh recommendations
    const [user, booksData, notesData] = await Promise.all([
      UserRepo.findById(userId),
      BookRepo.findByUser(userId, { limit: 12 }),
      NoteRepo.findByUser(userId, { limit: 12 })
    ]);

    const readingHistory = Array.isArray(booksData) ? booksData : (booksData.books || []);
    const userNotes = Array.isArray(notesData) ? notesData : (notesData.notes || []);

    const recommendations = await GeminiService.generateRecommendations({
      readingHistory,
      favoriteGenres: (user && user.favoriteGenres) ? user.favoriteGenres : [],
      userNotes
    });

    // Save to cache with 12-hour TTL
    await RecommendationRepo.saveRecommendations(userId, recommendations, 12);

    return res.json({
      recommendations,
      cached: false,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('getRecommendations error:', error);
    return res.status(500).json({ message: 'Failed to generate recommendations.' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.query;

    const chats = await ChatRepo.findByUser(userId, bookId || null);
    return res.json({ chats });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch chat history.' });
  }
};

const clearChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatId = req.params.id;

    const chat = await ChatRepo.findById(chatId);
    if (!chat || String(chat.userId) !== String(userId)) {
      return res.status(404).json({ message: 'Chat conversation not found.' });
    }

    await ChatRepo.deleteById(chatId);
    return res.json({ message: 'Conversation cleared successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to clear chat.' });
  }
};

module.exports = {
  handleChat,
  getRecommendations,
  getChatHistory,
  clearChatHistory
};
