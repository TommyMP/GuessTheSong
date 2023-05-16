const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET;
const url = require('url');

const authMiddleware = (req, res, next) => {
    
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const parsedUrl = url.parse(fullUrl, true);
    const token = parsedUrl.query.token;

    if (!token) {
        console.log('a');
        // Se il token non è presente, reindirizza l'utente al login
        return res.redirect('/index.html');
    }

    try {
        // Verifica la validità del token
        const decoded = jwt.verify(token, secret);

        // Aggiungi i dati dell'utente al req per usarli nelle route successive se necessario
        req.user = decoded.user;

        // Passa il controllo alla successiva route o gestione della richiesta
        next();
    } catch (err) {
        console.log(err);

        // Se il token non è valido, reindirizza l'utente al login
        return res.redirect('/index.html');
    }
};

module.exports = authMiddleware;
