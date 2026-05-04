-- Create database
CREATE DATABASE IF NOT EXISTS breels;

USE breels;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, email) VALUES
('herru', 'password123', 'herru@binus.ac.id');

-- Videos table
CREATE TABLE videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    categories JSON,
    tags JSON,
    duration INT, -- in seconds
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploader_id INT,
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    thumbnail_url VARCHAR(500),
    video_url VARCHAR(500) NOT NULL,
    privacy ENUM('public', 'private', 'unlisted') DEFAULT 'public',
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);
insert into videos (title, description, categories, tags, duration, uploader_id, thumbnail_url, video_url) values
('Sample Video', 'This is a sample video description.', '["education", "fun"]', '["sample", "video"]', 120, 1, '/content/thumbnail.jpg', '/content/video001.mp4');

-- Video views history
CREATE TABLE video_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    viewer_id INT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Unified content views for all types
CREATE TABLE content_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type ENUM('video', 'quiz', 'slideshow') NOT NULL,
    content_id INT NOT NULL,
    viewer_id INT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_content (content_type, content_id),
    FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- User preference scoring
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preference_type ENUM('category', 'tag') NOT NULL,
    preference_value VARCHAR(255) NOT NULL,
    score INT DEFAULT 0,
    UNIQUE KEY user_pref_unique (user_id, preference_type, preference_value),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Quizzes table
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    options JSON NOT NULL, -- array of options
    correct_answer INT NOT NULL, -- index of correct option
    categories JSON,
    tags JSON,
    uploader_id INT,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Slideshows table
CREATE TABLE slideshows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    images JSON NOT NULL, -- array of image URLs
    categories JSON,
    tags JSON,
    uploader_id INT,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO quizzes (title, question, options, correct_answer, categories, tags, uploader_id) VALUES
('Fun Quiz', 'What is 2+2?', '["3", "4", "5", "6"]', 1, '["math"]', '["easy", "quiz"]', 1);

INSERT INTO slideshows (title, images, categories, tags, uploader_id) VALUES
('Nature Slides', '["img1.jpg", "img2.jpg", "img3.jpg"]', '["nature"]', '["beautiful", "slides"]', 1);