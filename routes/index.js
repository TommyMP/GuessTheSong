const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const path = require('path');


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

module.exports = router;
