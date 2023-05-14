const bcrypt = require('bcrypt');

// Gestione del form di login
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  // Recupero dei valori dal form
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  // Hashing della password con bcrypt
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // Invio dei dati al server tramite fetch
  fetch('localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: hashedPassword }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Salvataggio del token nel Local Storage
      localStorage.setItem('token', data.token);

      // Connessione a Socket.IO con il token
      const socket = io({
        auth: { token: data.token },
      });

      // Esempio di utilizzo del socket
      socket.on('connect', () => {
        console.log('Connesso al server Socket.IO');
      });
    })
    .catch((error) => console.error(error));
});

// Gestione del form di registrazione
const registrationForm = document.getElementById('registration-form');
registrationForm.addEventListener('submit', (event) => {
  event.preventDefault();

  // Recupero dei valori dal form
  const name = document.getElementById('registration-name').value;
  const email = document.getElementById('registration-email').value;
  const password = document.getElementById('registration-password').value;

  // Hashing della password con bcrypt
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // Invio dei dati al server tramite fetch
  fetch('localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: hashedPassword }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Salvataggio del token nel Local Storage
      localStorage.setItem('token', data.token);

      // Connessione a Socket.IO con il token
      const socket = io({
        auth: { token: data.token },
      });

      // Esempio di utilizzo del socket
      socket.on('connect', () => {
        console.log('Connesso al server Socket.IO');
      });
    })
    .catch((error) => console.error(error));
});
