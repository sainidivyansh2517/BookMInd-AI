const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserRepo } = require('../models/User');
const { RecommendationRepo } = require('../models/Recommendation');

const JWT_SECRET = process.env.JWT_SECRET || 'bookmind_super_secret_jwt_key_2026';

const generateToken = (userId, email) => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    const { name, email, password, readingGoal, favoriteGenres } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existing = await UserRepo.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserRepo.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      readingGoal: readingGoal ? Number(readingGoal) : 24,
      favoriteGenres: favoriteGenres || ['Productivity', 'Self-Improvement', 'Fiction', 'Technology']
    });

    const token = generateToken(newUser._id || newUser.id, newUser.email);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        readingGoal: newUser.readingGoal,
        favoriteGenres: newUser.favoriteGenres,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Failed to create account. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const user = await UserRepo.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id || user.id, user.email);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        readingGoal: user.readingGoal,
        favoriteGenres: user.favoriteGenres,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token');
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
        avatar: user.avatar
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

    if (name) updateData.name = name.trim();
    if (readingGoal !== undefined) updateData.readingGoal = Number(readingGoal);
    if (favoriteGenres) {
      updateData.favoriteGenres = favoriteGenres;
      await RecommendationRepo.invalidateUser(req.user.id);
    }
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await UserRepo.updateById(req.user.id, updateData);

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        readingGoal: updatedUser.readingGoal,
        favoriteGenres: updatedUser.favoriteGenres,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
};

module.exports = { register, login, logout, getMe, updateProfile };

