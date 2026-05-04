<?php
require_once '../config.php';
require_once '../videos.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (preg_match('/\/api\/user\.php\/(\d+)\/preferences/', $path, $matches)) {
    $user_id = $matches[1];
    echo json_encode(getUserPreferences($user_id));
    return;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
