const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const path = require('path');
const User = require('../models/User');



// Importo le route definite in altri file
const authRoutes = require('./auth');

// Collego le route definite in altri file
router.use('/auth', authRoutes);

// Creazione della route protetta /lobby: per accedervi l'utente deve essere in possesso del token
router.get('/lobby', authMiddleware, (req, res) => {
    // Se l'utente arriva qui, significa che il token è valido e può accedere alla lobby
    res.sendFile(path.join(__dirname, '../public/lobby.html'));
  });

// Creazione della route protetta /game: per accedervi l'utente deve essere in possesso del token
router.get('/game', authMiddleware, (req, res) => {
  // Se l'utente arriva qui, significa che il token è valido e può accedere alla lobby
  res.sendFile(path.join(__dirname, '../public/game.html'));
});

router.get('/rankings', async (req, res) => {
  try {
    const users = await User.find({}, 'username officialGamesPlayed officialGamesWon')
      .sort({ officialGamesWon: -1, officialGamesPlayed: 1 })
      .limit(100);

    res.json(users);
  } catch (error) {
    console.error('Errore nella richiesta:', error);
    res.status(500).json({ error: 'Errore nella richiesta' });
  }
});



module.exports = router;
