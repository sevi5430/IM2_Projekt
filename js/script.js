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

// Deaktiviert das Suchfeld nach Spielende
function disableGuessing() {
    guessButton.disabled = true;
    searchInput.disabled = true;
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

// Guess-Button: vergleicht den ausgewählten Spieler mit dem Ziel-Spieler
guessButton.addEventListener('click', function() {
    if (!selectedPlayer) return;
    if (guessedIds.includes(selectedPlayer.id)) return;

    const isCorrect = selectedPlayer.id === targetPlayer.id;

    guessedIds.push(selectedPlayer.id);
    addGuessRow(selectedPlayer, targetPlayer);
    updateCircle(isCorrect);
    // Zähler aktualisieren z.B. 1/10, 2/10 etc.
    document.querySelector('#attempts-count').innerText = `${guessedIds.length}/10`;

    searchInput.value = '';
    selectedPlayer = null;

    if (isCorrect) {
        console.log('Gewonnen! Der Spieler war:', targetPlayer.name);
        disableGuessing();
    } else if (guessedIds.length >= 10) {
        console.log('Verloren! Der Spieler war:', targetPlayer.name);
        disableGuessing();
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
