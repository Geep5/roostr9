const express = require('express');
const router = express.Router();
const Wallet = require('../models/wallet');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const wallets = await Wallet.findByUserId(req.session.userId);
    res.render('dashboard', {
      user: { 
        username: req.session.address,
        address: req.session.address 
      },
      wallets
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('An error occurred');
  }
});

router.post('/wallet/create', requireAuth, async (req, res) => {
  try {
    await Wallet.create(req.session.userId);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Wallet creation error:', error);
    res.redirect('/dashboard');
  }
});

router.get('/wallet/:id', requireAuth, async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    
    if (!wallet || wallet.user_id !== req.session.userId) {
      return res.redirect('/dashboard');
    }
    
    const transactions = await Wallet.getTransactions(wallet.id);
    
    res.render('wallet', {
      user: { 
        username: req.session.address,
        address: req.session.address 
      },
      wallet: {
        id: wallet.id,
        address: wallet.address,
        balance: wallet.balance
      },
      transactions
    });
  } catch (error) {
    console.error('Wallet view error:', error);
    res.redirect('/dashboard');
  }
});

router.post('/wallet/:id/send', requireAuth, async (req, res) => {
  try {
    const { recipientAddress, amount } = req.body;
    const wallet = await Wallet.findById(req.params.id);
    
    if (!wallet || wallet.user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // In a real implementation, you would:
    // 1. Create and sign a Bitcoin transaction
    // 2. Broadcast it to the Bitcoin network
    // 3. Get the transaction hash
    
    // For demo purposes, we'll simulate a transaction
    await Wallet.updateBalance(wallet.id, -amount);
    await Wallet.createTransaction(wallet.id, 'send', amount, recipientAddress);
    
    res.json({ success: true, message: 'Transaction sent' });
  } catch (error) {
    console.error('Send transaction error:', error);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// Demo endpoint to simulate receiving Bitcoin
router.post('/wallet/:id/receive', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    const wallet = await Wallet.findById(req.params.id);
    
    if (!wallet || wallet.user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await Wallet.updateBalance(wallet.id, amount);
    await Wallet.createTransaction(wallet.id, 'receive', amount, wallet.address);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Receive transaction error:', error);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

module.exports = router;