const joinForm = document.getElementById('joinForm');
const howtoplay = document.getElementById('howtoplay');
const rankings = document.getElementById('rankings');
const howtoplayICON = document.getElementById('howtoplayICON');
const rankingsICON = document.getElementById('rankingsICON');

const group1 = document.querySelectorAll('[data-group="1"');
const group2 = document.querySelectorAll('[data-group="2"');



document.addEventListener('DOMContentLoaded', function () {
    setInterval(GetRanks, 1000);
});

function GetRanks() {
    fetch('/rankings'+"?ms="+Date.now())
        .then(response => response.json())
        .then(data => {
            console.log(data);
            outputRankings(data);
        })
        .catch(error => {
            console.error('Errore nella richiesta:', error);
        });
}

howtoplay.addEventListener('click', (e) => {
    if (howtoplayICON.classList.contains('fa-chevron-up')) {
        howtoplayICON.classList.remove('fa-chevron-up');
        howtoplayICON.classList.add('fa-chevron-down');
        group1.forEach((el) => { el.hidden = true });
    }
    else {
        howtoplayICON.classList.remove('fa-chevron-down');
        howtoplayICON.classList.add('fa-chevron-up');
        group1.forEach((el) => { el.hidden = false });
    }
});

rankings.addEventListener('click', (e) => {
    if (rankingsICON.classList.contains('fa-chevron-up')) {
        rankingsICON.classList.remove('fa-chevron-up');
        rankingsICON.classList.add('fa-chevron-down');
        group2.forEach((el) => { el.hidden = true });
    }
    else {
        rankingsICON.classList.remove('fa-chevron-down');
        rankingsICON.classList.add('fa-chevron-up');
        group2.forEach((el) => { el.hidden = false });
    }
});

joinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const stanza = document.getElementById('stanza').value;
    const tema = document.getElementById('tema').value;

    window.location.href = `/game?stanza=${stanza}&tema=${tema}&token=${token}`;
});

const userList = document.getElementById("users");

function outputRankings(users) {
    console.log(users[0]);
    console.log(users[0].rapporto);
    userList.innerHTML = `
        ${users.map((user, index) => `
            <tr>
                <th class="col-1 elc" scope="row">${index + 1}</th>
                <td class="col-9 elc">${user.username}</td>
                <td class="elc">${user.rapporto == 0 ? 0 : user.rapporto.toFixed(4)}</td>
            </tr>`
    ).join('')}`;
}