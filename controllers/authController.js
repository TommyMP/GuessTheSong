const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {};

authController.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verifica se l'email è già stata utilizzata
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'L\'email è già stata registrata' });
    }

    // Crea l'hash della password
    const hashPassword = await bcrypt.hash(password, 10);

    // Crea un nuovo utente
    const newUser = new User({
      username,
      email,
      password: hashPassword,
    });

    // Salva l'utente nel database
    await newUser.save();

    // Crea il token JWT
    const token = jwt.sign({ username: newUser.username }, process.env.JWT_SECRET);

    return res.status(200).json({ token });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Errore durante la registrazione' });
  }
};

authController.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verifica se l'utente esiste nel database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Username o password errati' });
    }

    // Verifica se la password è corretta
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username o password errati' });
    }

    // Crea il token JWT
    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);

    return res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Errore durante il login' });
  }
};

module.exports = authController;
