const express = require('express');
const router = express.Router();
const bitcoin = require('bitcoinjs-lib');
const User = require('../models/user');

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  try {
    const { privateKey } = req.body;
    
    // Validate private key format
    if (!User.validatePrivateKey(privateKey)) {
      return res.render('login', { error: 'Invalid private key format. Please enter a 64-character hex string.' });
    }
    
    // Create or get user from private key
    const user = await User.createFromPrivateKey(privateKey);
    
    req.session.userId = user.id;
    req.session.address = user.address;
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'Invalid private key or login failed' });
  }
});

router.get('/create-wallet', (req, res) => {
  res.render('create-wallet');
});

router.post('/create-wallet', (req, res) => {
  try {
    // Generate new Bitcoin key pair
    const keyPair = bitcoin.ECPair.makeRandom();
    const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
    const privateKey = keyPair.privateKey.toString('hex');
    
    // Render the page with the generated wallet info
    res.render('create-wallet', {
      privateKey,
      address
    });
  } catch (error) {
    console.error('Wallet creation error:', error);
    res.render('create-wallet', { error: 'Failed to create wallet' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Remove the old register route since we don't need it anymore
router.get('/register', (req, res) => {
  res.redirect('/create-wallet');
});

module.exports = router;