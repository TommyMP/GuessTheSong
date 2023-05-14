const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRouter = require('./routes/auth');
const User = require('./models/User');
const authController = require('./controllers/authController');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

const port = process.env.PORT || 3000;
const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRouter);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }

    User.findById(decoded.id)
      .then((user) => {
        if (!user) {
          return next(new Error('Authentication error'));
        }

        socket.user = user;
        next();
      })
      .catch((err) => next(err));
  });
});

io.on('connection', (socket) => {
  console.log('A client has connected');

  // Add socket event listeners here

  socket.on('disconnect', () => {
    console.log('A client has disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
