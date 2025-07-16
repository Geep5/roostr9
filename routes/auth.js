const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    const isValid = await User.validatePassword(password, user.password_hash);
    
    if (!isValid) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'An error occurred' });
  }
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
      return res.render('register', { error: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      return res.render('register', { error: 'Password must be at least 6 characters' });
    }
    
    const user = await User.create(username, password);
    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error.message === 'Username already exists' 
      ? error.message 
      : 'An error occurred during registration';
    res.render('register', { error: errorMessage });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;