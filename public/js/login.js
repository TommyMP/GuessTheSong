
// Gestione del form di login
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  // Recupero dei valori dal form
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value;

  // Hashing della password con bcrypt
  //const salt = bcrypt.genSaltSync(10);
  //const hashedPassword = bcrypt.hashSync(password, salt);

  // Invio dei dati al server tramite fetch
  fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Salvataggio del token nel Local Storage
      localStorage.setItem('token', data.token);

      window.location.href = `/lobby?token=${data.token}`

      // Connessione a Socket.IO con il token
      // const socket = io({
      //   auth: { token: data.token },
      // });

      // // Esempio di utilizzo del socket
      // socket.on('connect', () => {
      //   console.log('Connesso al server Socket.IO');
      // });
    })
    .catch((error) => console.error(error));
});


// Gestione del form di registrazione
const registrationForm = document.getElementById('registrationForm');
registrationForm.addEventListener('submit', (event) => {
  event.preventDefault();

  // Recupero dei valori dal form
  const username = document.getElementById('usernameR').value;
  const email = document.getElementById('emailR').value;
  const password = document.getElementById('passwordR').value;

  // Hashing della password con bcrypt
  //const salt = bcrypt.genSaltSync(10);
  //const hashedPassword = bcrypt.hashSync(password, salt);

  // Invio dei dati al server tramite fetch
  fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Salvataggio del token nel Local Storage
      localStorage.setItem('token', data.token);
      window.location.href = `/lobby?token=${data.token}`

      
    })
    .catch((error) => console.error(error));
});

// Connessione a Socket.IO con il token
setInterval(() => { console.log(localStorage.getItem('token'))},5000);


// const socket = io({
//   auth: { token: localStorage.getItem('token') },
// });

// // Esempio di utilizzo del socket
// socket.on('connect', () => {
//   console.log('Connesso al server Socket.IO');
// });
