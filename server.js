const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const router = require('./routes/index');
const socketioJwt = require('socketio-jwt');

const authRouter = require('./routes/auth');
const User = require('./models/User');
const authController = require('./controllers/authController');

const { ingressoUtente, utenteCorrente, uscitaUtente, getListaUtenti, resettaPunti } = require('./utils/utenti');
const { getStanza, eliminaStanza } = require('./utils/stanze');

require('dotenv').config();


var SpotifyWebApi = require('spotify-web-api-node');


var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENTID,
  clientSecret: process.env.SPOTIFY_CLIENTSECRET
});

// Generazione Token Spotify
refreshToken();


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
app.use('/', router);



io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }

    // console.log("handshake token " + token);
    // console.log("decoded token " + decoded);
    // console.log("decoded username " + decoded.username);

    User.findOne({ username: decoded.username })
      .then((user) => {
        if (!user) {
          return next(new Error('Authentication error'));
        }

        console.log("handshake username " + user.username)
        socket.username = user.username;
        next();
      })
      .catch((err) => next(err));
  });
});

io.on('connection', (socket) => {
  console.log('A client has connected');

  socket.on('joinRoom', ({ stanza }) => {
    username = socket.username;
    console.log("joined username " + username)
    if (getListaUtenti(stanza).length == 0)
      eliminaStanza(stanza);

    const utente = ingressoUtente(socket.id, username, stanza, 0.0);
    socket.join(utente.stanza);

    // Invio alla stanza la lista degli utenti
    io.to(utente.stanza).emit('roomUsers', {
      stanza: utente.stanza,
      utenti: getListaUtenti(utente.stanza)
    });

    if (utente.admin) {
      socket.emit('admin');
    }
  });

  // Ascolto di messaggi
  socket.on('chatMessage', (msg) => {
    const utente = utenteCorrente(socket.id);
    stanza = getStanza(utente.stanza);


    // controlli sul tentativo di indovinare
    if (msg.toLowerCase().includes(stanza.titoloTracciaCorrente.toLowerCase()) && stanza.titoloIndovinato == 0) {
      stanza.titoloIndovinato = 1;
      io.to(utente.stanza).emit('title', stanza.titoloTracciaCorrente);
      utente.punti += 1;

      if (stanza.artistiDaIndovinare.length == 0) {
        prossimaTraccia(stanza.nome, stanza.turno);
      }
    }
    if (stanza.artistiDaIndovinare.some(a => msg.toLowerCase().includes(a))) {
      lunghezzaPrima = stanza.artistiDaIndovinare.length;


      stanza.artistiDaIndovinare = stanza.artistiDaIndovinare.filter(g => !msg.toLowerCase().includes(g));
      lunghezzaDopo = stanza.artistiDaIndovinare.length;



      let listaArtistiIndovinati = stanza.listaArtistiCorrenti.filter(x => !stanza.artistiDaIndovinare.includes(x.toLowerCase()));

      artistiIndovinati = lunghezzaPrima - lunghezzaDopo;
      io.to(utente.stanza).emit('artists', { guessed: listaArtistiIndovinati, allartists: stanza.listaArtistiCorrenti });
      utente.punti += artistiIndovinati;

      if (stanza.artistiDaIndovinare.length == 0 && stanza.titoloIndovinato == 1) {
        prossimaTraccia(stanza.nome, stanza.turno);
      }

    }

  });

  // Ascolto comandi
  socket.on('chatCommand', ({ comando, args }) => {
    const utente = utenteCorrente(socket.id);
    console.log(utente);
    if (utente.admin) {
      eseguiComando(utente.stanza, comando, args);
    }
  });


  // Disconnessione di un client
  socket.on('disconnect', () => {
    const utente = uscitaUtente(socket.id);

    if (utente) {
      if (getListaUtenti(utente.stanza).length == 0) {
        eliminaStanza(utente.stanza);
      }


      // Info stanza
      io.to(utente.stanza).emit('roomUsers', {
        stanza: utente.stanza,
        utenti: getListaUtenti(utente.stanza)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

async function eseguiComando(stanza, comando, args) {
  console.log(stanza);
  console.log(comando);
  console.log(args);
  switch (comando) {
      case 'playlist':
          if(args[0] == 'ranked') {
            getStanza(stanza).official = true;
            args[0] = 'https://open.spotify.com/playlist/0VmTGQy2F6D3vejCvg00dJ?si=449104d0fd65451e'; 
          } else {
            official = false;
          }
          console.log(args[0]);
          getStanza(stanza).idPlaylist = args[0].replace('https://open.spotify.com/playlist/', '').split('?')[0]; 
          
          spotifyApi.getPlaylist(getStanza(stanza).idPlaylist).then(async function (data) {

              getStanza(stanza).nomePlaylist = data.body.name;
              getStanza(stanza).imgPlaylist = data.body.images[0].url;

              let totaleTracce = data.body.tracks.total;
              traccePlaylist = await listaTracce(getStanza(stanza).idPlaylist, totaleTracce);

              getStanza(stanza).tracceRiproducibili = traccePlaylist.filter(t => t.track.preview_url != null);

              io.to(stanza).emit('playlist', {name: data.body.name, image: data.body.images[0].url, totalTracks: totaleTracce, playableTracks: getStanza(stanza).tracceRiproducibili.length});
          }, function (err) { console.log(err) });
          break;
      case 'turns':
          getStanza(stanza).totaleTurni = Number(args);
          io.to(stanza).emit('turns', Number(args));
          break;
      case 'startGame':
          if(getStanza(stanza).official) {
          getListaUtenti(stanza).forEach(utente => {
              console.log(utente.username);
              //User.findOne({username: utente.username}).then((user) => console.log(user));
              User.updateOne({username: utente.username}, {$inc: {officialGamesPlayed: 1}})
              .then(() => {
              })
              .catch((error) => {
              });;
              //User.findOne({username: utente.username}).then((user) => console.log(user));
          }); }
          getStanza(stanza).riproduzioneInCorso = true;
          getStanza(stanza).turno = 1;
          resettaPunti(stanza);
          io.to(stanza).emit('roomUsers', {
              room: stanza,
              users: getListaUtenti(stanza)
          });
          io.to(stanza).emit('turn', getStanza(stanza).turno);
          setTimeout(() => { riproduciTraccia(stanza) }, 5000);
          break;
  }
}

function refreshToken() {
  spotifyApi.clientCredentialsGrant().then(
    function (data) {
      console.log('The access token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);

      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);
    },
    function (err) {
      console.log('Something went wrong when retrieving an access token', err);
    }
  );

  setTimeout(refreshToken, 3000000);
}

let timeoutImmagine;
function riproduciTraccia(nomeStanza) {
    

    let stanza = getStanza(nomeStanza);

    let indiceTraccia = Math.floor(Math.random() * stanza.tracceRiproducibili.length);
    let traccia;
    traccia = stanza.tracceRiproducibili.splice(indiceTraccia,1)[0].track;

    artisti = [];
    traccia.artists.forEach(a => artisti.push(a.name));
    artistiDaIndovinare = [];
    artisti.forEach(a => artistiDaIndovinare.push(a.toLowerCase()));

    stanza.titoloTracciaCorrente = filtraTitolo(traccia.name);

    stanza.listaArtistiCorrenti = artisti;
    stanza.titoloIndovinato = 0;
    stanza.artistiDaIndovinare = artistiDaIndovinare;
    //stanza.hasBeenSkipped = false;
    stanza.imgTraccia = traccia.album.images[0].url;
    io.to(nomeStanza).emit('artistsN', artisti.length);

    console.log("timeout set");
    timeoutImmagine = setTimeout(() => {io.to(nomeStanza).emit('songimage', stanza.imgTraccia)}, 15000)

    const turnoInAttesa = stanza.turno;
    io.to(nomeStanza).emit('songpreview', traccia.preview_url);

    console.log(stanza.titoloTracciaCorrente);
    console.log(stanza.listaArtistiCorrenti);

    setTimeout(() => { prossimaTraccia(nomeStanza, turnoInAttesa) }, 30000);
}

// Skip alla traccia successiva
function prossimaTraccia(nomeStanza, turnoChiamata) {

  let stanza = getStanza(nomeStanza);


  if (stanza.turno == turnoChiamata && stanza.riproduzioneInCorso) {
      io.to(nomeStanza).emit('stopSong', {title: stanza.titoloTracciaCorrente, artists: stanza.listaArtistiCorrenti, image: stanza.imgTraccia});
      stanza.turno += 1;
      console.log("timeout clear");
      clearTimeout(timeoutImmagine);
      
      io.to(nomeStanza).emit('roomUsers', {
          stanza: nomeStanza,
          utenti: getListaUtenti(nomeStanza)
      });


      if (stanza.turno - 1 == stanza.totaleTurni) {
          stanza.riproduzioneInCorso = false; //possibile problema
          io.to(nomeStanza).emit('gameOver');
          if(stanza.official)
              User.updateOne({username: getListaUtenti(nomeStanza)[0].username}, {$inc: {officialGamesWon: 1}})
              .then(() => {
              })
              .catch((error) => {
              });;;
      }
      else {
          io.to(nomeStanza).emit('turn', stanza.turno);
          setTimeout(() => { riproduciTraccia(nomeStanza) }, 5000);
      }
  }

}

// Ottiene una lista completa delle tracce di una playlist, chiedendo 100 tracce per volta
async function listaTracce(idPlaylist, totale) {
  var numeroGruppi = Math.floor(totale / 100) + 1;
  var promises = [];
  for (let numGruppo = 0; numGruppo < numeroGruppi; numGruppo++) {
      var promise = listaTracceParziale(idPlaylist, numGruppo * 100);
      promises.push(promise);
  }
  var traccia = await Promise.all(promises);
  var tracce = [];
  for (let i = 0; i < traccia.length; i++) {
      tracce = tracce.concat(traccia[i].body.items);
  }
  return tracce;
}

// Ottiene 100 tracce (numero massimo definito dall'API) della playlist a partire dall'offset
async function listaTracceParziale(idPlaylist, offset) {
  var tracce = await spotifyApi.getPlaylistTracks(idPlaylist, { market: 'IT', offset: offset });
  return tracce;
}

// RegEx per rimuovere dai titoli eventuali parti aggiuntive come: "feat. X", "Radio Edit", "Y Remix", "2011 Remastered", "(Extended Version), ecc"
function filtraTitolo(titolo) {
  titolo = titolo.replace(/\([^\)].+?\)/g, '').replace(/\[[^\]].+?\]/g, '').replace(/-.*((with)|(feat)).*/gi,'').replace(/-.*((remix)|(rmx)).*/gi,'').replace(/-.*((radio)|(edit)).*/gi,'').replace(/-.*(remaster).*/gi, '').replace(/[ \t]+$/g, '');
  return titolo;
}




//TODO: impostazioni visualizzazione immagine
//TODO: visualizzazione risposta inviata precedentemente
//TODO: annuncio vincitore
//TODO: selezione playlist ufficiale
//TODO: controllo che ci siano 2 o più giocatori per la playlist ufficiale
//TODO: tasto skip
//TODO: classifica