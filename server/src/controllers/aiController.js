const { BookRepo } = require('../models/Book');
const { NoteRepo } = require('../models/Note');
const { ChatRepo } = require('../models/Chat');
const { UserRepo } = require('../models/User');
const GeminiService = require('../services/geminiService');

const handleChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, bookId, chatId } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt query is required.' });
    }

    // Load contextual user data
    let bookContext = null;
    let userNotes = [];

    if (bookId) {
      bookContext = await BookRepo.findById(bookId);
      if (bookContext && String(bookContext.userId) === String(userId)) {
        userNotes = await NoteRepo.findByBook(userId, bookId);
      }
    } else {
      userNotes = await NoteRepo.findByUser(userId);
    }

    const readingHistory = await BookRepo.findByUser(userId);

    // Get AI response via GeminiService
    const aiResponseText = await GeminiService.generateChatResponse({
      prompt: prompt.trim(),
      bookContext,
      userNotes,
      readingHistory
    });

    // Save chat message into persistent conversation
    let conversation = null;
    if (chatId) {
      conversation = await ChatRepo.findById(chatId);
    }

    if (!conversation) {
      const title = bookContext ? `Query on ${bookContext.title}` : (prompt.slice(0, 30) + '...');
      conversation = await ChatRepo.create({
        userId,
        bookId: bookId || null,
        title,
        messages: []
      });
    }

    const updatedMessages = [
      ...(conversation.messages || []),
      { role: 'user', content: prompt.trim(), timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponseText, timestamp: new Date().toISOString() }
    ];

    const savedChat = await ChatRepo.updateMessages(conversation._id || conversation.id, updatedMessages);

    return res.json({
      chatId: savedChat._id || savedChat.id,
      response: aiResponseText,
      messages: savedChat.messages
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
    const user = await UserRepo.findById(userId);
    const readingHistory = await BookRepo.findByUser(userId);
    const userNotes = await NoteRepo.findByUser(userId);

    const recommendations = await GeminiService.generateRecommendations({
      readingHistory,
      favoriteGenres: (user && user.favoriteGenres) ? user.favoriteGenres : [],
      userNotes
    });

    return res.json({ recommendations });
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
