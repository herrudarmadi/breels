<?php
require_once '../config.php';
require_once '../videos.php';

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
        if (preg_match('/\/api\/videos\.php\/popular/', $path)) {
            echo json_encode(getPopularVideos());
        } elseif (preg_match('/\/api\/videos\.php\/(\d+)/', $path, $matches)) {
            $id = $matches[1];
            echo json_encode(getVideo($id));
        } else {
            echo json_encode(getVideos());
        }
        break;
    case 'POST':
        if (preg_match('/\/api\/videos\.php\/(\d+)\/view/', $path, $matches)) {
            $id = $matches[1];
            echo json_encode(logVideoView($id, $user_id));
        } else {
            $data = json_decode(file_get_contents('php://input'), true);
            if ($user_id) {
                echo json_encode(createVideo($data, $user_id));
            } else {
                echo json_encode(['error' => 'Unauthorized']);
            }
        }
        break;
    case 'PUT':
        if (preg_match('/\/api\/videos\.php\/(\d+)/', $path, $matches)) {
            $id = $matches[1];
            $data = json_decode(file_get_contents('php://input'), true);
            if ($user_id) {
                echo json_encode(updateVideo($id, $data, $user_id));
            } else {
                echo json_encode(['error' => 'Unauthorized']);
            }
        }
        break;
    case 'DELETE':
        if (preg_match('/\/api\/videos\.php\/(\d+)/', $path, $matches)) {
            $id = $matches[1];
            if ($user_id) {
                echo json_encode(deleteVideo($id, $user_id));
            } else {
                echo json_encode(['error' => 'Unauthorized']);
            }
        }
        break;
}
?>