<?php
//Import config
$config = require __DIR__ . '/config.php';
// api-url
$url = 'https://api.football-data.org/v4/competitions/PL/teams?season=2025'; // url der api mit cors-problemen, z.B. https://leafletjs.com/reference.html

// do request
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FAILONERROR => true,
    CURLOPT_HTTPHEADER => [
        'X-Auth-Token: ' . $config['API_KEY']
    ]
]);
$response = curl_exec($ch);

// error handling
if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'error' => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

// end request
curl_close($ch);


// Transform response to JSON
$data = json_decode($response, true);
$players = [];
foreach ($data['teams'] as $team) {
    foreach ($team['squad'] as $player) {
        $birthDate = new DateTime($player['dateOfBirth']);
        $today = new DateTime();
        $age = $today->diff($birthDate)->y;
        $players[] = [
            'id' => $player['id'],
            'name' => $player['name'],
            'position' => $player['position'],
            'dateOfBirth' => $age,
            'nationality' => $player['nationality'],
            'team' => $team['name']
        ];
    }
}
$response = json_encode($players);

// return as JSON
header('Content-Type: application/json; charset=utf-8');
echo $response;