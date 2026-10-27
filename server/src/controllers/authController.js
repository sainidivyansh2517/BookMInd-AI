const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserRepo } = require('../models/User');
const { RecommendationRepo } = require('../models/Recommendation');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }
  return secret;
};

const generateToken = (userId, email) => {
  return jwt.sign({ id: userId, email }, getJwtSecret(), { expiresIn: '7d' });
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};

const register = async (req, res) => {
  try {
    const { name, email, password, readingGoal, favoriteGenres } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Valid name is required.' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ message: 'Name cannot exceed 100 characters.' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (password.length > 128) {
      return res.status(400).json({ message: 'Password cannot exceed 128 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await UserRepo.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    // Validate reading goal
    let validGoal = 24;
    if (readingGoal !== undefined && readingGoal !== null && readingGoal !== '') {
      const parsedGoal = parseInt(readingGoal, 10);
      if (isNaN(parsedGoal) || parsedGoal < 1 || parsedGoal > 1000) {
        return res.status(400).json({ message: 'Reading goal must be a number between 1 and 1000.' });
      }
      validGoal = parsedGoal;
    }

    // Validate favorite genres
    let validGenres = ['Productivity', 'Self-Improvement', 'Fiction', 'Technology'];
    if (Array.isArray(favoriteGenres)) {
      validGenres = favoriteGenres
        .filter(g => typeof g === 'string' && g.trim())
        .map(g => g.trim().slice(0, 50))
        .slice(0, 20);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserRepo.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      readingGoal: validGoal,
      favoriteGenres: validGenres
    });

    const token = generateToken(newUser._id || newUser.id, newUser.email);

    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        readingGoal: newUser.readingGoal,
        favoriteGenres: newUser.favoriteGenres,
        avatar: newUser.avatar || ''
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Failed to create account. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await UserRepo.findByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id || user.id, user.email);

    res.cookie('token', token, getCookieOptions());

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        readingGoal: user.readingGoal,
        favoriteGenres: user.favoriteGenres,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', getCookieOptions());
  return res.json({ message: 'Logged out successfully.' });
};

const getMe = async (req, res) => {
  try {
    const user = await UserRepo.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    return res.json({
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        readingGoal: user.readingGoal,
        favoriteGenres: user.favoriteGenres,
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user session.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, readingGoal, favoriteGenres, avatar } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty.' });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({ message: 'Name cannot exceed 100 characters.' });
      }
      updateData.name = name.trim();
    }

    if (readingGoal !== undefined) {
      const parsedGoal = parseInt(readingGoal, 10);
      if (isNaN(parsedGoal) || parsedGoal < 1 || parsedGoal > 1000) {
        return res.status(400).json({ message: 'Reading goal must be a valid number between 1 and 1000.' });
      }
      updateData.readingGoal = parsedGoal;
    }

    if (favoriteGenres !== undefined) {
      if (!Array.isArray(favoriteGenres)) {
        return res.status(400).json({ message: 'Favorite genres must be an array.' });
      }
      updateData.favoriteGenres = favoriteGenres
        .filter(g => typeof g === 'string' && g.trim())
        .map(g => g.trim().slice(0, 50))
        .slice(0, 20);
      await RecommendationRepo.invalidateUser(req.user.id);
    }

    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res.status(400).json({ message: 'Avatar must be a string URL.' });
      }
      // Truncate overly long avatar strings
      updateData.avatar = avatar.slice(0, 500);
    }

    const updatedUser = await UserRepo.updateById(req.user.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        readingGoal: updatedUser.readingGoal,
        favoriteGenres: updatedUser.favoriteGenres,
        avatar: updatedUser.avatar || ''
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
};

module.exports = { register, login, logout, getMe, updateProfile };
