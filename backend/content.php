<?php
require_once 'config.php';

function getQuizzes($user_id = null) {
    global $pdo;
    if ($user_id) {
        $stmt = $pdo->prepare('SELECT id, title, question, options, correct_answer, categories, tags, uploader_id, views, created_at FROM quizzes WHERE uploader_id = ? ORDER BY created_at DESC');
        $stmt->execute([$user_id]);
    } else {
        $stmt = $pdo->query('SELECT id, title, question, options, correct_answer, categories, tags, uploader_id, views, created_at FROM quizzes ORDER BY created_at DESC');
    }
    return $stmt->fetchAll();
}

function getQuiz($id) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT * FROM quizzes WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function createQuiz($data, $uploader_id) {
    global $pdo;
    $stmt = $pdo->prepare('INSERT INTO quizzes (title, question, options, correct_answer, categories, tags, uploader_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $data['title'],
        $data['question'],
        json_encode($data['options']),
        $data['correct_answer'],
        json_encode($data['categories']),
        json_encode($data['tags']),
        $uploader_id
    ]);
    return ['id' => $pdo->lastInsertId()];
}

function logQuizView($quiz_id, $viewer_id = null) {
    global $pdo;
    $stmt = $pdo->prepare('INSERT INTO content_views (content_type, content_id, viewer_id) VALUES (?, ?, ?)');
    $stmt->execute(['quiz', $quiz_id, $viewer_id]);
    $stmt = $pdo->prepare('UPDATE quizzes SET views = views + 1 WHERE id = ?');
    $stmt->execute([$quiz_id]);
    if ($viewer_id) {
        updateUserPreferences($viewer_id, $quiz_id, 'quiz');
    }
    return ['success' => true];
}

function getSlideshows($user_id = null) {
    global $pdo;
    if ($user_id) {
        $stmt = $pdo->prepare('SELECT id, title, images, categories, tags, uploader_id, views, created_at FROM slideshows WHERE uploader_id = ? ORDER BY created_at DESC');
        $stmt->execute([$user_id]);
    } else {
        $stmt = $pdo->query('SELECT id, title, images, categories, tags, uploader_id, views, created_at FROM slideshows ORDER BY created_at DESC');
    }
    return $stmt->fetchAll();
}

function getSlideshow($id) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT * FROM slideshows WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function createSlideshow($data, $uploader_id) {
    global $pdo;
    $stmt = $pdo->prepare('INSERT INTO slideshows (title, images, categories, tags, uploader_id) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([
        $data['title'],
        json_encode($data['images']),
        json_encode($data['categories']),
        json_encode($data['tags']),
        $uploader_id
    ]);
    return ['id' => $pdo->lastInsertId()];
}

function logSlideshowView($slideshow_id, $viewer_id = null) {
    global $pdo;
    $stmt = $pdo->prepare('INSERT INTO content_views (content_type, content_id, viewer_id) VALUES (?, ?, ?)');
    $stmt->execute(['slideshow', $slideshow_id, $viewer_id]);
    $stmt = $pdo->prepare('UPDATE slideshows SET views = views + 1 WHERE id = ?');
    $stmt->execute([$slideshow_id]);
    if ($viewer_id) {
        updateUserPreferences($viewer_id, $slideshow_id, 'slideshow');
    }
    return ['success' => true];
}

function updateUserPreferences($user_id, $content_id, $content_type) {
    global $pdo;
    if ($content_type === 'video') {
        $video = getVideo($content_id);
        $categories = json_decode($video['categories'] ?? '[]', true) ?: [];
        $tags = json_decode($video['tags'] ?? '[]', true) ?: [];
    } elseif ($content_type === 'quiz') {
        $quiz = getQuiz($content_id);
        $categories = json_decode($quiz['categories'] ?? '[]', true) ?: [];
        $tags = json_decode($quiz['tags'] ?? '[]', true) ?: [];
    } elseif ($content_type === 'slideshow') {
        $slideshow = getSlideshow($content_id);
        $categories = json_decode($slideshow['categories'] ?? '[]', true) ?: [];
        $tags = json_decode($slideshow['tags'] ?? '[]', true) ?: [];
    } else {
        return;
    }

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

function getFeed() {
    global $pdo;
    $videos = $pdo->query('SELECT id, title, description, categories, tags, duration, upload_date, uploader_id, views, likes, thumbnail_url, video_url, privacy, "video" as type FROM videos ORDER BY upload_date DESC')->fetchAll();
    $quizzes = $pdo->query('SELECT id, title, question, options, correct_answer, categories, tags, uploader_id, views, created_at, "quiz" as type FROM quizzes ORDER BY created_at DESC')->fetchAll();
    $slideshows = $pdo->query('SELECT id, title, images, categories, tags, uploader_id, views, created_at, "slideshow" as type FROM slideshows ORDER BY created_at DESC')->fetchAll();

    $feed = array_merge($videos, $quizzes, $slideshows);
    usort($feed, function($a, $b) {
        $a_time = isset($a['upload_date']) ? $a['upload_date'] : $a['created_at'];
        $b_time = isset($b['upload_date']) ? $b['upload_date'] : $b['created_at'];
        return strtotime($b_time) - strtotime($a_time);
    });
    return $feed;
}
?>