// DOM-Elemente laden
const searchInput = document.querySelector('.search-input');
const searchDropdown = document.querySelector('.search-dropdown');
const guessButton = document.querySelector('.search-button');
const guessRows = document.querySelector('.guess-rows');
const instructionButton = document.querySelector('.instruction-button');
const instructionModal = document.getElementById('instructionModal');
const closeModal = document.getElementById('closeModal');

// Speichert den aktuell ausgewählten Spieler aus dem Dropdown
let selectedPlayer = null;

// Speichert die IDs der bereits geratenen Spieler
let guessedIds = [];

// Alle Premier League Spieler einmal beim Start laden
async function loadPlayers() {
    try {
        const response = await fetch('https://im2.severinfischer.ch/api/players.php');
        return await response.json();
    } catch (error) {
        console.error(error);
        return false;
    }
}

// Zeigt gefilterte Spieler als klickbare Einträge im Dropdown an
function showDropdown(players) {
    searchDropdown.innerHTML = '';

    players.forEach(function(player) {
        const item = document.createElement('div');
        item.classList.add('dropdown-item');
        item.innerText = `${player.name} – ${player.team}`;

        // Spieler aus Dropdown auswählen
        item.addEventListener('click', function() {
            selectedPlayer = player;
            searchInput.value = player.name;
            hideDropdown();
        });

        searchDropdown.appendChild(item);
    });

    searchDropdown.style.display = 'block';
}

// Versteckt das Dropdown
function hideDropdown() {
    searchDropdown.innerHTML = '';
    searchDropdown.style.display = 'none';
}

// Fügt eine neue Guess-Zeile ein - neueste erscheint oben weil CSS flex-direction: column-reverse gesetzt ist
function addGuessRow(guessed, target) {
    const nationCorrect = guessed.nationality === target.nationality;
    const teamCorrect = guessed.team === target.team;
    const ageCorrect = guessed.dateOfBirth === target.dateOfBirth;
    const positionCorrect = guessed.position === target.position;

    const row = document.createElement('div');
    row.className = 'guess-row';
    row.innerHTML = `
        <span class="guess-player-name">${guessed.name}</span>
        <span class="guess-badge ${nationCorrect ? 'correct' : 'wrong'}">${guessed.nationality}</span>
        <span class="guess-badge ${teamCorrect ? 'correct' : 'wrong'}">${guessed.team}</span>
        <span class="guess-badge ${ageCorrect ? 'correct' : 'wrong'}">${guessed.dateOfBirth}</span>
        <span class="guess-badge ${positionCorrect ? 'correct' : 'wrong'}">${guessed.position || '–'}</span>
        <span class="guess-badge correct">PL</span>
    `;

    guessRows.appendChild(row);
}

// Färbt den nächsten Kreis grün (richtig) oder rot (falsch) ein
function updateCircle(isCorrect) {
    const circles = document.querySelectorAll('.attempt-circle');
    const index = guessedIds.length - 1;
    if (!circles[index]) return;

    if (isCorrect) {
        circles[index].style.border = '2px solid #00FF85';
        circles[index].style.backgroundColor = 'rgba(0, 255, 133, 0.23)';
    } else {
        circles[index].style.border = '2px solid #FF0004';
        circles[index].style.backgroundColor = 'rgba(255, 0, 4, 0.23)';
    }
}

// Alle Spieler laden und einen zufälligen Ziel-Spieler auswählen
const allPlayers = await loadPlayers();
const randomIndex = Math.floor(Math.random() * allPlayers.length);
const targetPlayer = allPlayers[randomIndex];
console.log('Ziel-Spieler (nur zum Testen):', targetPlayer.name);

// Hört auf Eingaben und filtert die Spielerliste lokal
searchInput.addEventListener('input', function(event) {
    const value = event.target.value.toLowerCase();

    if (value.length < 2) {
        hideDropdown();
        return;
    }

    const filteredPlayers = allPlayers.filter(function(player) {
        return player.name.toLowerCase().includes(value);
    }).slice(0, 6);

    if (filteredPlayers.length > 0) {
        showDropdown(filteredPlayers);
    } else {
        hideDropdown();
    }
});

// Schliesst das Dropdown wenn ausserhalb geklickt wird
document.addEventListener('click', function(event) {
    if (!searchInput.contains(event.target)) {
        hideDropdown();
    }
});

// Öffnet das Anleitungs-Modal
if (instructionButton) {
    instructionButton.addEventListener('click', function() {
        instructionModal.classList.add('active');
    });
}

// Schliesst das Modal über den X-Button
if (closeModal) {
    closeModal.addEventListener('click', function() {
        instructionModal.classList.remove('active');
    });
}

// Schliesst das Modal bei Klick auf den Hintergrund
if (instructionModal) {
    instructionModal.addEventListener('click', function(event) {
        if (event.target === instructionModal) {
            instructionModal.classList.remove('active');
        }
    });
}

//WIN & LOSE Result Card

guessButton.addEventListener('click', function handleGuessClick(e) {
    if (!selectedPlayer) return;
    if (guessedIds.includes(selectedPlayer.id)) return;
    if (!Array.isArray(guessedIds)) guessedIds = [];

    guessedIds.push(selectedPlayer.id);
    const attemptNumber = guessedIds.length;

    const currentTarget = (typeof targetPlayer !== 'undefined') ? targetPlayer : window.targetPlayer || null;
    const isCorrect = currentTarget && selectedPlayer.id === currentTarget.id;

    try { addGuessRow(selectedPlayer, currentTarget); } catch (err) { console.warn('addGuessRow:', err); }
    try { if (typeof updateCircle === 'function') updateCircle(isCorrect); } catch (err) {}

    // Zähler aktualisieren z.B. 1/10, 2/10 etc.
    const attemptsCounter = document.querySelector('#attempts-count');
    if (attemptsCounter) attemptsCounter.innerText = `${attemptNumber}/10`;

    if (searchInput) searchInput.value = '';
    selectedPlayer = null;
    guessButton.blur();

    const targetName = currentTarget ? (currentTarget.name || currentTarget.player || 'der Spieler') : 'der Spieler';


    // WIN: Zeige Winning-Screen
    if (isCorrect) {
        disableGuessing();
        showResultCard(true, attemptNumber, targetName);
        return;
    }

    // LOSE: Nach 10 Versuchen
    if (attemptNumber >= 10) {
        disableGuessing();
        showResultCard(false, attemptNumber, targetName);
        return;
    }
});

function disableGuessing() {
    if (guessButton) guessButton.disabled = true;
    if (searchInput) {
        searchInput.disabled = true;
        searchInput.classList.add('disabled');
    }
    if (searchDropdown) searchDropdown.style.display = 'none';
}

function showResultCard(win, attempts, targetName) {
    const existing = document.querySelector('.result-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = 'result-card ' + (win ? 'win' : 'lose');
    card.innerHTML = `
      <div class="result-inner">
        <h2>${win ? 'Bravo!' : 'Schade!'}</h2>
        <p>${win
          ? `Du hast ${targetName} im ${attempts}. Versuch erraten.`
          : `Du hast ${targetName} in ${attempts} Versuchen leider nicht erraten.`}</p>
        <button class="result-restart">Neuen Spieler erraten</button>
      </div>
    `;

    // Trophy Animation Container (nur bei Win)
    if (win) {
        const trophyDiv = document.createElement('div');
        trophyDiv.className = 'result-trophy';
        card.appendChild(trophyDiv);
    }

    // Card vor guess-rows einfügen
    const guessRows = document.querySelector('.guess-rows');
    if (guessRows && guessRows.parentElement) {
        guessRows.parentElement.insertBefore(card, guessRows);
    }

    // Lottie Animation laden (nur bei Win)
    if (win) {
        const trophyContainer = card.querySelector('.result-trophy');
        if (trophyContainer && window.lottie) {
            const trophyAnimation = {"nm":"Main Scene","ddd":0,"h":500,"w":500,"meta":{"g":"@lottiefiles/creator@1.88.0"},"layers":[{"ty":0,"nm":"prem-league-logo.svg","sr":1,"st":0,"op":71,"ip":32,"hd":false,"ddd":0,"bm":0,"hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[208.50001241949568,277.50000182457023]},"s":{"a":0,"k":[18.448426214864206,18.44842621486421]},"sk":{"a":0,"k":0},"p":{"a":1,"k":[{"o":{"x":0,"y":0},"i":{"x":0.68,"y":0.19},"s":[-121.53825626394641,188.90507011866234],"t":0},{"o":{"x":0.55,"y":0.06},"i":{"x":0.36,"y":1},"s":[59.78,188.91],"t":10},{"s":[249.99999466187742,188.90507011866234],"t":50}]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":1,"k":[{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[13],"t":33},{"s":[100],"t":34}]}},"w":417,"h":555,"refId":"precomp_Shape Layer - SVG_zrXCyobtv4_c972ce89-2b78-4564-a3d4-6fa4bce8d028","ind":1},{"ty":0,"nm":"Pre-comp 3","sr":1,"st":39,"op":61,"ip":39,"hd":false,"ln":"92","ddd":0,"bm":0,"hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[250,250]},"s":{"a":0,"k":[-100,100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[250,250]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"w":500,"h":500,"refId":"1_1_b543a53d-12ff-4917-a2a3-091f21fad12c","ind":2},{"ty":0,"nm":"Pre-comp 3","sr":1,"st":24,"op":46,"ip":24,"hd":false,"ln":"91","ddd":0,"bm":0,"hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[250,250]},"s":{"a":0,"k":[100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[250,250]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"w":500,"h":500,"refId":"1_1_b543a53d-12ff-4917-a2a3-091f21fad12c","ind":3},{"ty":4,"nm":"Cup 3","sr":1,"st":10,"op":310,"ip":31,"hd":false,"ln":"54","ddd":0,"bm":0,"hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[0.371,-98.838,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","bm":0,"hd":false,"nm":"Cup","it":[{"ty":"sh","bm":0,"hd":false,"nm":"è·¯å¾ 1","d":1,"ks":{"a":1,"k":[{"o":{"x":0.333,"y":0},"i":{"x":0.8,"y":1},"s":[{"c":true,"i":[[-11.815,0],[0,0],[1.176,-11.756],[0,0],[5.492,54.916],[0,0]],"o":[[0,0],[11.815,0],[0,0],[-5.492,54.916],[0,0],[-1.176,-11.756]],"v":[[-49.8,-128.285],[49.3,-128.285],[70.626,-106.958],[62.096,-21.652],[-62.596,-21.652],[-71.126,-106.958]]}],"t":10},{"o":{"x":0.2,"y":0},"i":{"x":0.667,"y":1},"s":[{"c":true,"i":[[0,6.785],[0,0],[0,-11.667],[0,0],[0,55.777],[0,0]],"o":[[0,0],[0,8.035],[0,0],[0,54.652],[0,0],[0,-12.042]],"v":[[-0.25,-128.285],[-0.25,-128.285],[-0.25,-106.958],[-0.25,-21.652],[-0.25,-21.652],[-0.25,-106.958]]}],"t":14},{"o":{"x":0.333,"y":0},"i":{"x":0.667,"y":1},"s":[{"c":true,"i":[[-11.815,0],[0,0],[1.176,-11.756],[0,0],[5.492,54.916],[0,0]],"o":[[0,0],[11.815,0],[0,0],[-5.492,54.916],[0,0],[-1.176,-11.756]],"v":[[-49.8,-128.285],[49.3,-128.285],[70.626,-106.958],[62.096,-21.652],[-62.596,-21.652],[-71.126,-106.958]]}],"t":18},{"o":{"x":0.333,"y":0},"i":{"x":1,"y":1},"s":[{"c":true,"i":[[-11.815,0],[0,0],[1.176,-11.756],[0,0],[5.492,54.916],[0,0]],"o":[[0,0],[11.815,0],[0,0],[-5.492,54.916],[0,0],[-1.176,-11.756]],"v":[[-49.8,-128.285],[49.3,-128.285],[70.626,-106.958],[62.096,-21.652],[-62.596,-21.652],[-71.126,-106.958]]}],"t":24},{"o":{"x":0,"y":0},"i":{"x":0.223,"y":1},"s":[{"c":true,"i":[[0,6.785],[0,0],[0,-11.667],[0,0],[0,55.777],[0,0]],"o":[[0,0],[0,8.035],[0,0],[0,54.652],[0,0],[0,-12.042]],"v":[[-0.25,-128.285],[-0.25,-128.285],[-0.25,-106.958],[-0.25,-21.652],[-0.25,-21.652],[-0.25,-106.958]]}],"t":31},{"s":[{"c":true,"i":[[-11.815,0],[0,0],[1.176,-11.756],[0,0],[5.492,54.916],[0,0]],"o":[[0,0],[11.815,0],[0,0],[-5.492,54.916],[0,0],[-1.176,-11.756]],"v":[[-49.8,-128.285],[49.3,-128.285],[70.626,-106.958],[62.096,-21.652],[-62.596,-21.652],[-71.126,-106.958]]}],"t":50}]}},{"ty":"fl","bm":0,"hd":false,"nm":"Fill 1","c":{"a":0,"k":[1,0.7059,0.2471]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":4,"parent":10},{"ty":4,"nm":"Black Stand","sr":1,"st":10,"op":310,"ip":0,"hd":false,"ln":"45","ddd":0,"bm":0,"hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[0,29.114,0]},"s":{"a":1,"k":[{"o":{"x":0.333,"y":0},"i":{"x":0.833,"y":0.833},"s":[0,0,100],"t":0},{"s":[100,100,100],"t":10}]},"sk":{"a":0,"k":0},"p":{"a":1,"k":[{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[138.235,254.547],"t":0},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[143.584,250.368,0],"t":1},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[157.812,240.556,0],"t":2},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[179.791,229.215,0],"t":3},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[209.087,221.759,0],"t":4},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[243.189,225.873,0],"t":5},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[274.404,246.799,0],"t":6},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[294.84,281.274,0],"t":7},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[299.502,322.507,0],"t":8},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[282.589,360.014,0],"t":9},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[249.984,377.959,0],"t":10},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[228.111,384.013,0],"t":11},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[215.555,387.488,0],"t":12},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[210.454,388.9,0],"t":13},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[210.841,388.792,0],"t":14},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[214.869,387.678,0],"t":15},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[220.951,385.994,0],"t":16},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[227.823,384.092,0],"t":17},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[234.564,382.227,0],"t":18},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[240.567,380.565,0],"t":19},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[245.498,379.201,0],"t":20},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[249.235,378.166,0],"t":21},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[251.813,377.453,0],"t":22},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[253.364,377.023,0],"t":23},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[254.079,376.826,0],"t":24},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[254.164,376.802,0],"t":25},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[253.818,376.898,0],"t":26},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[253.217,377.064,0],"t":27},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[252.503,377.262,0],"t":28},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[251.782,377.461,0],"t":29},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[251.126,377.643,0],"t":30},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[250.576,377.795,0],"t":31},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[250.15,377.913,0],"t":32},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[249.849,377.996,0],"t":33},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[249.66,378.049,0],"t":34},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[249.909,377.98,0],"t":42},{"s":[250.00050974556848,377.98],"t":63}]},"r":{"a":1,"k":[{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[90],"t":2},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[88.052],"t":3},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[83.09],"t":4},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[75.985],"t":5},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[67.277],"t":6},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[57.336],"t":7},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[46.447],"t":8},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[34.86],"t":9},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[10.836],"t":11},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0],"t":12},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-6.514],"t":13},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-10.253],"t":14},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-11.772],"t":15},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-11.657],"t":16},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-10.457],"t":17},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-8.646],"t":18},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-6.599],"t":19},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-4.592],"t":20},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-2.804],"t":21},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-1.336],"t":22},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.223],"t":23},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.544],"t":24},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[1.006],"t":25},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[1.219],"t":26},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[1.245],"t":27},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[1.142],"t":28},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.963],"t":29},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.75],"t":30},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.535],"t":31},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.34],"t":32},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.176],"t":33},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.049],"t":34},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.04],"t":35},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.097],"t":36},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.125],"t":37},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.132],"t":38},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.124],"t":39},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.107],"t":40},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.085],"t":41},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.062],"t":42},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.041],"t":43},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.023],"t":44},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.008],"t":45},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.002],"t":46},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.009],"t":47},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.013],"t":48},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.014],"t":49},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.013],"t":50},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.012],"t":51},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.01],"t":52},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.007],"t":53},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.005],"t":54},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.003],"t":55},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0.001],"t":56},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0],"t":57},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.001],"t":58},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.001],"t":59},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.001],"t":60},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.001],"t":61},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.001],"t":62},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.001],"t":63},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[-0.001],"t":65},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0],"t":66},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0],"t":67},{"o":{"x":0.167,"y":0.167},"i":{"x":0.833,"y":0.833},"s":[0],"t":68},{"s":[0],"t":69}]},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","bm":0,"hd":false,"nm":"Black Stand","it":[{"ty":"sh","bm":0,"hd":false,"nm":"è·¯å¾ 1","d":1,"ks":{"a":0,"k":{"c":true,"i":[[0,0],[-24.605,0],[0,0],[18.303,0]],"o":[[-18.303,0],[0,0],[24.605,0],[0,0]],"v":[[-42.653,-29.114],[-53.962,29.114],[53.962,29.114],[42.653,-29.114]]}}},{"ty":"fl","bm":0,"hd":false,"nm":"Fill 1","c":{"a":0,"k":[0.4784,0.4902,0.5333]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":10,"parent":10},{"ty":4,"nm":"Cup","sr":1,"st":10,"op":310,"ip":0,"hd":false,"ln":"44","ddd":0,"bm":0,"hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[0,-152.895,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","bm":0,"hd":false,"nm":"Cup","it":[{"ty":"sh","bm":0,"hd":false,"nm":"è·¯å¾ 1","d":1,"ks":{"a":0,"k":{"c":true,"i":[[-11.815,0],[0,0],[1.176,-11.756],[0,0],[5.492,54.916],[0,0]],"o":[[0,0],[11.815,0],[0,0],[-5.492,54.916],[0,0],[-1.176,-11.756]],"v":[[-49.55,-73.91],[49.55,-73.91],[70.876,-52.583],[62.346,32.723],[-62.346,32.723],[-70.876,-52.583]]}}},{"ty":"fl","bm":0,"hd":false,"nm":"Fill 1","c":{"a":0,"k":[1,0.7059,0.2471]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":11,"parent":10},{"ty":4,"nm":"Stand","sr":1,"st":10,"op":310,"ip":0,"hd":false,"ln":"43","ddd":0,"bm":0,"hasMask":false,"ao":0,"ks":{"a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[0,-56.636,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}},"shapes":[{"ty":"gr","bm":0,"hd":false,"nm":"Stand","it":[{"ty":"sh","bm":0,"hd":false,"nm":"è·¯å¾ 1","d":1,"ks":{"a":0,"k":{"c":true,"i":[[19.235,36.65],[0,0],[-15.853,-38.082],[0,0]],"o":[[0,0],[-20.405,35.342],[0,0],[17.561,-38.659]],"v":[[-33.841,-56.55],[33.841,-56.55],[25.31,56.55],[-25.31,56.55]]}}},{"ty":"fl","bm":0,"hd":false,"nm":"Fill 1","c":{"a":0,"k":[1,0.5255,0.2706]},"r":1,"o":{"a":0,"k":100}},{"ty":"tr","a":{"a":0,"k":[0,0]},"s":{"a":0,"k":[100,100]},"sk":{"a":0,"k":0},"p":{"a":0,"k":[0,0]},"r":{"a":0,"k":0},"sa":{"a":0,"k":0},"o":{"a":0,"k":100}}]}],"ind":12,"parent":10}],"v":"5.7.0","fr":30,"op":71,"ip":0,"assets":[]};

            window.lottie.loadAnimation({
                container: trophyContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: trophyAnimation
            });
        }
    }

    // Restart Button Handler - HIER nach Trophy Setup
    const rb = card.querySelector('.result-restart');
    if (rb) {
        rb.addEventListener('click', () => location.reload());
    }
}