// DOM-Elemente laden
const searchInput = document.querySelector('.search-input');
const searchDropdown = document.querySelector('.search-dropdown');
const guessButton = document.querySelector('.search-button');
const guessRows = document.querySelector('.guess-rows');
const instructionButton = document.querySelector('.instruction-button');
const instructionModal = document.getElementById('instructionModal');
const closeModal = document.getElementById('closeModal');

// Logo für Restart klickbar machen
const logoImg = document.querySelector('nav img');
if (logoImg) {
    logoImg.style.cursor = 'pointer';
    logoImg.addEventListener('click', function() {
        location.reload();
    });
}

// Speichert den aktuell ausgewählten Spieler aus dem Dropdown
let selectedPlayer = null;

// Speichert die IDs der bereits geratenen Spieler
let guessedIds = [];

// Speichert alle Spieler global (für Zugriff im ganzen Script)
let allPlayers = [];

// Speichert den aktuell ausgewählten Zielspieler
let targetPlayer = null;

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
item.playerData = player;

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

function getFirstDropdownPlayer() {
    const items = searchDropdown.querySelectorAll('.dropdown-item');
    if (items.length === 0) return null;

    return items[0].playerData;
}

// Sucht einen Spieler in der gesamten Spielerliste anhand des Namens
function findPlayerByName(name) {
    // Eingabe wird bereinigt (Leerzeichen entfernen + alles klein schreiben)
    const normalized = name.trim().toLowerCase();

    // Durchsucht alle Spieler und sucht den ersten, der exakt passt
    return allPlayers.find(player =>
        player.name.toLowerCase() === normalized
    );
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
// Initialisiert das Spiel: lädt Spieler und setzt zufälligen Zielspieler
async function init() {
    // API Daten laden und global speichern
    allPlayers = await loadPlayers();

    // Zufälligen Spieler als Ziel wählen
    const randomIndex = Math.floor(Math.random() * allPlayers.length);
    targetPlayer = allPlayers[randomIndex];

    // Nur für Debugging (kann später entfernt werden)
    console.log('Ziel-Spieler (nur zum Testen):', targetPlayer.name);
}

// Spiel starten
init();

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
    if (!selectedPlayer) {
    selectedPlayer = findPlayerByName(searchInput.value);
}
if (!selectedPlayer) return;
    if (guessedIds.includes(selectedPlayer.id)) return;
    if (!Array.isArray(guessedIds)) guessedIds = [];

    guessedIds.push(selectedPlayer.id);
    const attemptNumber = guessedIds.length;

    const currentTarget = targetPlayer; window.targetPlayer || null;
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
    if (win && window.lottie) {
        const trophyContainer = card.querySelector('.result-trophy');
        if (trophyContainer) {
            window.lottie.loadAnimation({
                container: trophyContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: './animations/trophy.json'
            });
        }
    }

    // Restart Button Handler
    const rb = card.querySelector('.result-restart');
    if (rb) {
        rb.addEventListener('click', () => location.reload());
    }
}

 // Enter-Taste soll Guess-Button klicken
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {

        // Falls Dropdown offen → nimm ersten Vorschlag
        const first = getFirstDropdownPlayer();

        if (first) {
            selectedPlayer = first;
            searchInput.value = first.name;
        }

        guessButton.click();
    }
});