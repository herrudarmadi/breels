# Breels - YouTube Shorts Clone

A web application mimicking YouTube Shorts with React frontend and PHP backend.

## Features

- Vertical scrolling video feed with swipe gestures
- Mini trivia quizzes between content, skippable
- Image slideshows with auto-advance and swipe navigation
- Analytics: view tracking, popularity stats, user preference scoring
- CRUD API for videos, quizzes, slideshows with user privileges

## Setup

### Backend

1. Set up MySQL database.
2. Run `schema.sql` to create tables.
3. Configure `config.php` with your DB credentials.
4. Serve the backend with a PHP server (e.g., Apache or `php -S localhost:8000`).

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## API Endpoints

- GET /api/content.php/feed - Get unified feed of videos, quizzes, slideshows
- GET /api/videos.php - Get all videos
- GET /api/videos.php/{id} - Get video by ID
- POST /api/videos.php - Create video (requires auth)
- PUT /api/videos.php/{id} - Update video (requires auth, owner only)
- DELETE /api/videos.php/{id} - Delete video (requires auth, owner only)
- POST /api/videos.php/{id}/view - Track a video view
- GET /api/content.php/quizzes - Get all quizzes
- GET /api/content.php/quiz/{id} - Get quiz by ID
- POST /api/content.php/quiz - Create quiz (requires auth)
- POST /api/content.php/quiz/{id}/view - Track a quiz view
- GET /api/content.php/slideshows - Get all slideshows
- GET /api/content.php/slideshow/{id} - Get slideshow by ID
- POST /api/content.php/slideshow - Create slideshow (requires auth)
- POST /api/content.php/slideshow/{id}/view - Track a slideshow view
- GET /api/videos.php/popular - Get popular videos ordered by views
- GET /api/user.php/{id}/preferences - Get user preference weights by category and tag

## Video Metadata

- title
- description
- categories (JSON array)
- tags (JSON array)
- duration (seconds)
- upload_date
- uploader_id
- views
- likes
- thumbnail_url
- video_url
- privacy (public/private/unlisted)
- language (suggested addition)
- subtitles (suggested addition)
- comments count (suggested addition)# breels
