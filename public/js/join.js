const joinForm = document.getElementById('joinForm');

joinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const stanza = document.getElementById('stanza').value;
    const tema = document.getElementById('tema').value;

    window.location.href = `/game?stanza=${stanza}&tema=${tema}&token=${token}`;
})