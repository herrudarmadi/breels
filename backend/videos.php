<?php
require_once 'config.php';

function getUserFromToken($token) {
    // Simple implementation: assume token is user_id for demo
    // In real, decode JWT or check DB
    return (int)$token;
}

function getVideos($user_id = null) {
    global $pdo;
    if ($user_id) {
        $stmt = $pdo->prepare('SELECT id, title, description, categories, tags, duration, upload_date, uploader_id, views, likes, thumbnail_url, video_url, privacy FROM videos WHERE uploader_id = ? ORDER BY upload_date DESC');
        $stmt->execute([$user_id]);
    } else {
        $stmt = $pdo->query('SELECT id, title, description, categories, tags, duration, upload_date, uploader_id, views, likes, thumbnail_url, video_url, privacy FROM videos ORDER BY upload_date DESC');
    }
    return $stmt->fetchAll();
}

function getPopularVideos($limit = 10) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT id, title, description, categories, tags, duration, upload_date, uploader_id, views, likes, thumbnail_url, video_url, privacy FROM videos ORDER BY views DESC LIMIT ?');
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function getVideo($id) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT * FROM videos WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function createVideo($data, $uploader_id) {
    global $pdo;
    $stmt = $pdo->prepare('INSERT INTO videos (title, description, categories, tags, duration, uploader_id, thumbnail_url, video_url, privacy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $data['title'],
        $data['description'],
        json_encode($data['categories']),
        json_encode($data['tags']),
        $data['duration'],
        $uploader_id,
        $data['thumbnail_url'],
        $data['video_url'],
        $data['privacy']
    ]);
    return ['id' => $pdo->lastInsertId()];
}

function updateVideo($id, $data, $uploader_id) {
    global $pdo;
    $stmt = $pdo->prepare('UPDATE videos SET title = ?, description = ?, categories = ?, tags = ? WHERE id = ? AND uploader_id = ?');
    $stmt->execute([
        $data['title'],
        $data['description'],
        json_encode($data['categories']),
        json_encode($data['tags']),
        $id,
        $uploader_id
    ]);
    return ['success' => true];
}

function deleteVideo($id, $uploader_id) {
    global $pdo;
    $stmt = $pdo->prepare('DELETE FROM videos WHERE id = ? AND uploader_id = ?');
    $stmt->execute([$id, $uploader_id]);
    return ['success' => true];
}

function logVideoView($video_id, $viewer_id = null) {
    global $pdo;

    $stmt = $pdo->prepare('INSERT INTO content_views (content_type, content_id, viewer_id) VALUES (?, ?, ?)');
    $stmt->execute(['video', $video_id, $viewer_id]);

    $stmt = $pdo->prepare('UPDATE videos SET views = views + 1 WHERE id = ?');
    $stmt->execute([$video_id]);

    if ($viewer_id) {
        updateUserPreferences($viewer_id, $video_id, 'video');
    }

    return ['success' => true];
}

function updateUserPreferences($user_id, $video_id) {
    global $pdo;

    $video = getVideo($video_id);
    if (!$video) {
        return;
    }

    $categories = json_decode($video['categories'] ?? '[]', true) ?: [];
    $tags = json_decode($video['tags'] ?? '[]', true) ?: [];

    $stmt = $pdo->prepare('INSERT INTO user_preferences (user_id, preference_type, preference_value, score) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE score = score + 1');

    foreach ($categories as $category) {
        if ($category) {
            $stmt->execute([$user_id, 'category', $category]);
        }
    }

    foreach ($tags as $tag) {
        if ($tag) {
            $stmt->execute([$user_id, 'tag', $tag]);
        }
    }
}

function getUserPreferences($user_id, $limit = 10) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT preference_type, preference_value, score FROM user_preferences WHERE user_id = ? ORDER BY score DESC LIMIT ?');
    $stmt->execute([$user_id, $limit]);
    return $stmt->fetchAll();
}

function getVideoViewers($video_id, $limit = 20) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT vv.viewer_id, u.username, vv.viewed_at FROM video_views vv LEFT JOIN users u ON vv.viewer_id = u.id WHERE vv.video_id = ? ORDER BY vv.viewed_at DESC LIMIT ?');
    $stmt->execute([$video_id, $limit]);
    return $stmt->fetchAll();
}
?>