// DOM-Elemente laden
const searchInput = document.querySelector('.search-input');
const searchDropdown = document.querySelector('.search-dropdown');

console.log('searchInput gefunden:', searchInput);
console.log('searchDropdown gefunden:', searchDropdown);

// Sucht Spieler anhand des eingegebenen Namens via TheSportsDB
async function searchPlayers(name) {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${name}`;
    console.log('API wird aufgerufen:', url);
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('API Antwort:', data);
        return data;
    } catch (error) {
        console.error('API Fehler:', error);
        return false;
    }
}

// Zeigt die Spielervorschläge im Dropdown an
function showDropdown(players) {
    searchDropdown.innerHTML = '';

    players.forEach(function(player) {
        const item = `<div class="dropdown-item">${player.strPlayer} – ${player.strTeam}</div>`;
        searchDropdown.innerHTML += item;
    });

    searchDropdown.style.display = 'block';
    console.log('Dropdown wird angezeigt mit', players.length, 'Spielern');
}

// Versteckt das Dropdown
function hideDropdown() {
    searchDropdown.innerHTML = '';
    searchDropdown.style.display = 'none';
}

// Hört auf Eingaben im Suchfeld und zeigt passende Spieler an
searchInput.addEventListener('input', async function(event) {
    const value = event.target.value;
    console.log('Eingabe:', value);

    if (value.length < 2) {
        hideDropdown();
        return;
    }

    const data = await searchPlayers(value);

    if (data && data.player) {
        const soccerPlayers = data.player.filter(function(player) {
            return player.strSport === 'Soccer';
        });
        console.log('Soccer Spieler gefunden:', soccerPlayers.length);
        showDropdown(soccerPlayers);
    } else {
        console.log('Keine Spieler gefunden');
        hideDropdown();
    }
});

// Schliesst das Dropdown wenn ausserhalb geklickt wird
document.addEventListener('click', function(event) {
    if (!searchInput.contains(event.target)) {
        hideDropdown();
    }
});


async function allPlayers() {
    const url = `https://im2.severinfischer.ch/api/players.php`;
    console.log('Alle Spieler werden geladen:', url);
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Alle Spieler geladen:', data);
        return data;
    } catch (error) {
        console.error('Fehler beim Laden aller Spieler:', error);
        return false;
    }
}

// zeige alle spieler in der konsole
allPlayers();