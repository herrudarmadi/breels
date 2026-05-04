<?php
require_once '../config.php';
require_once '../content.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$user_id = null;
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    $user_id = getUserFromToken($token);
}

switch ($method) {
    case 'GET':
        if (preg_match('/\/api\/content\.php\/feed/', $path)) {
            echo json_encode(getFeed());
        } elseif (preg_match('/\/api\/content\.php\/quizzes/', $path)) {
            echo json_encode(getQuizzes());
        } elseif (preg_match('/\/api\/content\.php\/slideshows/', $path)) {
            echo json_encode(getSlideshows());
        } elseif (preg_match('/\/api\/content\.php\/quiz\/(\d+)/', $path, $matches)) {
            $id = $matches[1];
            echo json_encode(getQuiz($id));
        } elseif (preg_match('/\/api\/content\.php\/slideshow\/(\d+)/', $path, $matches)) {
            $id = $matches[1];
            echo json_encode(getSlideshow($id));
        }
        break;
    case 'POST':
        if (preg_match('/\/api\/content\.php\/quiz\/(\d+)\/view/', $path, $matches)) {
            $id = $matches[1];
            echo json_encode(logQuizView($id, $user_id));
        } elseif (preg_match('/\/api\/content\.php\/slideshow\/(\d+)\/view/', $path, $matches)) {
            $id = $matches[1];
            echo json_encode(logSlideshowView($id, $user_id));
        } elseif (preg_match('/\/api\/content\.php\/quiz/', $path)) {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($user_id) {
                echo json_encode(createQuiz($data, $user_id));
            } else {
                echo json_encode(['error' => 'Unauthorized']);
            }
        } elseif (preg_match('/\/api\/content\.php\/slideshow/', $path)) {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($user_id) {
                echo json_encode(createSlideshow($data, $user_id));
            } else {
                echo json_encode(['error' => 'Unauthorized']);
            }
        }
        break;
}
?>