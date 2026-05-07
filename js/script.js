// DOM-Elemente laden
const searchInput = document.querySelector('.search-input');
const searchDropdown = document.querySelector('.search-dropdown');
const guessButton = document.querySelector('.search-button');
const guessRows = document.querySelector('.guess-rows');

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

// Vergleicht den geratenen Spieler mit dem Ziel-Spieler und fügt eine Zeile in die Tabelle ein
function addGuessRow(guessed, target) {
    const nationCorrect = guessed.nationality === target.nationality;
    const teamCorrect = guessed.team === target.team;
    const ageCorrect = guessed.dateOfBirth === target.dateOfBirth;
    const positionCorrect = guessed.position === target.position;

    const row = `
        <div class="guess-row">
            <span class="guess-player-name">${guessed.name}</span>
            <span class="guess-badge ${nationCorrect ? 'correct' : 'wrong'}">${guessed.nationality}</span>
            <span class="guess-badge ${teamCorrect ? 'correct' : 'wrong'}">${guessed.team}</span>
            <span class="guess-badge ${ageCorrect ? 'correct' : 'wrong'}">${guessed.dateOfBirth}</span>
            <span class="guess-badge ${positionCorrect ? 'correct' : 'wrong'}">${guessed.position || '–'}</span>
            <span class="guess-badge correct">PL</span>
        </div>
    `;

    guessRows.innerHTML += row;
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

// Färbt den nächsten Kreis grün oder rot ein
function updateCircle(isCorrect) {
    const circles = document.querySelectorAll('.attempt-circle');
    const index = guessedIds.length - 1;
    console.log('Kreis wird gefärbt:', index, isCorrect);
    if (!circles[index]) return;
    circles[index].classList.add(isCorrect ? 'correct' : 'wrong');
}

// Guess-Button: vergleicht den ausgewählten Spieler mit dem Ziel-Spieler
guessButton.addEventListener('click', function() {
    if (!selectedPlayer) return;

    // Verhindert denselben Spieler zweimal zu raten
    if (guessedIds.includes(selectedPlayer.id)) return;

    const isCorrect = selectedPlayer.id === targetPlayer.id;

    guessedIds.push(selectedPlayer.id);
    addGuessRow(selectedPlayer, targetPlayer);
    updateCircle(isCorrect);

    // Prüft ob der richtige Spieler erraten wurde
    if (isCorrect) {
        console.log('Gewonnen! Der Spieler war:', targetPlayer.name);
    }

    searchInput.value = '';
    selectedPlayer = null;
});

// Schliesst das Dropdown wenn ausserhalb geklickt wird
document.addEventListener('click', function(event) {
    if (!searchInput.contains(event.target)) {
        hideDropdown();
    }
});
