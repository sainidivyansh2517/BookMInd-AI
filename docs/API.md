# 📖 BookMind AI — REST API Specification

This document details all available HTTP endpoints in the BookMind AI Backend API.

**Base URL**: `/api`  
**Authentication Header**: `Authorization: Bearer <JWT_TOKEN>`  
**Default Content-Type**: `application/json`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Creates a new reader account.
- **Auth Required**: No
- **Rate Limit**: 100 requests per 15 minutes
- **Request Body**:
  ```json
  {
    "name": "Grace Hopper",
    "email": "grace@navy.mil",
    "password": "secretPassword123!",
    "readingGoal": 25,
    "favoriteGenres": ["Computer Science", "History", "Leadership"]
  }
  ```
- **Validation Rules**:
  - `name`: string, 1 to 100 characters.
  - `email`: valid RFC email format, normalized to lowercase.
  - `password`: string, 6 to 128 characters.
  - `readingGoal`: optional integer between 1 and 1000 (default: 24).
  - `favoriteGenres`: optional array of strings.
- **Response (201 Created)**:
  ```json
  {
    "message": "Account created successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "67be...",
      "name": "Grace Hopper",
      "email": "grace@navy.mil",
      "readingGoal": 25,
      "favoriteGenres": ["Computer Science", "History", "Leadership"],
      "avatar": ""
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure or email already registered.

---

### `POST /api/auth/login`
Authenticates an existing user.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "grace@navy.mil",
    "password": "secretPassword123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Logged in successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "67be...",
      "name": "Grace Hopper",
      "email": "grace@navy.mil",
      "readingGoal": 25,
      "favoriteGenres": ["Computer Science", "History", "Leadership"],
      "avatar": ""
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid email or password.

---

### `GET /api/auth/me`
Fetches current authenticated user profile.
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "67be...",
      "name": "Grace Hopper",
      "email": "grace@navy.mil",
      "readingGoal": 25,
      "favoriteGenres": ["Computer Science", "History", "Leadership"],
      "avatar": ""
    }
  }
  ```

---

### `PUT /api/auth/profile`
Updates reader profile and preferences.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "Admiral Grace Hopper",
    "readingGoal": 30,
    "favoriteGenres": ["Compilers", "Technology", "History"],
    "avatar": "https://example.com/avatar.jpg"
  }
  ```
- **Validation**:
  - `name`: max 100 chars.
  - `readingGoal`: integer between 1 and 1000.
  - `passwordHash` and `email` cannot be modified via this route (protected against mass assignment).
- **Response (200 OK)**:
  ```json
  {
    "message": "Profile updated successfully.",
    "user": { ... }
  }
  ```

---

## 2. Personal Library Endpoints (`/api/books`)

### `GET /api/books`
Retrieves books in user's library with filtering, searching, and pagination.
- **Auth Required**: Yes
- **Query Parameters**:
  - `status`: optional enum (`all`, `want_to_read`, `currently_reading`, `completed`).
  - `search`: optional string query across title, authors, and genres.
  - `sort`: optional string (`recent`, `title`, `author`, `rating`).
  - `page`: optional integer (e.g., `1`).
  - `limit`: optional integer (e.g., `15`, max `100`).
- **Response (200 OK)**:
  ```json
  {
    "books": [
      {
        "_id": "67be...",
        "userId": "67be...",
        "title": "Clean Code",
        "authors": ["Robert C. Martin"],
        "coverUrl": "https://covers.openlibrary.org/b/id/12345-L.jpg",
        "totalPages": 464,
        "progressPages": 210,
        "status": "currently_reading",
        "rating": 5,
        "genres": ["Software Engineering", "Clean Code"],
        "addedAt": "2026-03-01T10:00:00.000Z"
      }
    ]
  }
  ```

---

### `POST /api/books`
Adds a book to the user's personal collection.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "openLibraryId": "OL12345W",
    "title": "Structure and Interpretation of Computer Programs",
    "authors": ["Harold Abelson", "Gerald Jay Sussman"],
    "coverUrl": "https://covers.openlibrary.org/b/id/8231996-L.jpg",
    "publishYear": 1996,
    "totalPages": 657,
    "genres": ["Computer Science", "Lisp"],
    "status": "want_to_read",
    "rating": 5
  }
  ```
- **Validation Rules**:
  - `title`: required, max 250 characters.
  - `status`: `want_to_read`, `currently_reading`, or `completed`.
  - `totalPages`: positive integer (1 to 50,000).
  - Duplicate check: rejects duplicates within the user's library by `openLibraryId` or matching title.
- **Response (201 Created)**: Returns `{ message: "...", book: { ... } }`.

---

### `GET /api/books/:id`
Retrieves single book details and attached user notes.
- **Auth Required**: Yes (enforces resource ownership).
- **Response (200 OK)**:
  ```json
  {
    "book": { ... },
    "notes": [ ... ]
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: User does not own this book resource.
  - `404 Not Found`: Book does not exist.

---

### `PUT /api/books/:id`
Updates book progress, status, or review.
- **Auth Required**: Yes (enforces resource ownership).
- **Request Body**:
  ```json
  {
    "progressPages": 464,
    "status": "completed",
    "rating": 5,
    "review": "A masterpiece on procedural abstraction."
  }
  ```
- **Validation**:
  - `progressPages`: non-negative integer, cannot exceed `totalPages`.
  - Auto-completion: if `progressPages >= totalPages`, status is automatically marked as `completed`.
- **Response (200 OK)**: Returns updated book.

---

### `DELETE /api/books/:id`
Removes a book from the user's library.
- **Auth Required**: Yes (enforces resource ownership).
- **Behavior**: Cascades deletion to all personal notes attached to this book.
- **Response (200 OK)**: `{ "message": "Book removed from library." }`.

---

### `GET /api/books/search`
Searches OpenLibrary bibliographic records.
- **Auth Required**: Yes
- **Query Parameters**:
  - `q`: search query (title, author, or ISBN).
  - `limit`: max results (default: 15, max: 30).
- **Response (200 OK)**:
  ```json
  {
    "results": [
      {
        "openLibraryId": "OL257943W",
        "title": "The Pragmatic Programmer",
        "authors": ["Andrew Hunt", "David Thomas"],
        "publishYear": 1999,
        "totalPages": 352,
        "genres": ["Software development"],
        "coverUrl": "https://covers.openlibrary.org/b/id/8231856-L.jpg"
      }
    ]
  }
  ```

---

## 3. Reading Notes Endpoints (`/api/notes`)

### `GET /api/notes`
Fetches user notes with optional filtering.
- **Auth Required**: Yes
- **Query Parameters**: `bookId`, `tag`, `search`, `page`, `limit`
- **Response (200 OK)**:
  ```json
  {
    "notes": [
      {
        "_id": "67be...",
        "userId": "67be...",
        "bookId": "67be...",
        "title": "On Layered Architecture",
        "content": "Keep presentation decoupled from domain services.",
        "tags": ["architecture", "clean-code"],
        "book": {
          "id": "67be...",
          "title": "Clean Code",
          "coverUrl": "...",
          "authors": ["Robert C. Martin"]
        },
        "createdAt": "2026-03-01T12:00:00.000Z",
        "updatedAt": "2026-03-01T12:00:00.000Z"
      }
    ]
  }
  ```

---

### `POST /api/notes`
Creates a new personal note.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "Broken Windows Theory in Software",
    "content": "Don't leave bad code, bad designs, or failing tests unfixed.",
    "bookId": "67be...",
    "tags": ["craftsmanship", "habits"]
  }
  ```
- **Validation**:
  - `title`: required, max 200 characters.
  - `content`: required, max 50,000 characters.
  - `bookId`: if provided, validates that the book exists **and belongs to the authenticated user** (returns `403 Forbidden` if user attempts to attach note to another user's book).
- **Response (201 Created)**: Returns `{ message: "...", note: { ... } }`.

---

### `PUT /api/notes/:id`
Updates an existing note.
- **Auth Required**: Yes (enforces ownership).

### `DELETE /api/notes/:id`
Deletes an existing note.
- **Auth Required**: Yes (enforces ownership).

---

## 4. AI Assistant & Recommendations (`/api/ai`)

### `POST /api/ai/chat`
Ask natural-language questions about saved books or personal reading notes.
- **Auth Required**: Yes
- **Rate Limit**: 30 queries per minute
- **Request Body**:
  ```json
  {
    "prompt": "Synthesize my notes on software architecture",
    "bookId": "optional_book_id",
    "chatId": "optional_existing_chat_id",
    "stream": true
  }
  ```
- **Validation**:
  - `prompt`: required, max 4,000 characters.
  - `bookId`: verified against authenticated user.
- **Streaming Response (`text/event-stream`)**:
  - Emits real-time tokens: `data: {"chunk": "..."}\n\n`
  - Completion event: `data: {"done": true, "chatId": "...", "fullText": "...", "isFallback": false}\n\n`
- **Non-Streaming Response (`stream: false`)**:
  ```json
  {
    "chatId": "67be...",
    "response": "### Architectural Insights\n\nBased on your notes...",
    "isFallback": false,
    "messages": [ ... ]
  }
  ```

---

### `GET /api/ai/recommendations`
Returns personalized book recommendations grounded in library history and note topics.
- **Auth Required**: Yes
- **Query Parameters**: `refresh=true` (forces fresh AI generation, bypassing the 12-hour server cache).
- **Response (200 OK)**:
  ```json
  {
    "recommendations": [
      {
        "title": "Essentialism: The Disciplined Pursuit of Less",
        "author": "Greg McKeown",
        "genre": "Productivity & Focus",
        "reason": "Tailored to your notes emphasizing deep focus and deliberate daily habits.",
        "isFallback": false
      }
    ],
    "cached": true,
    "isFallback": false,
    "generatedAt": "2026-03-01T12:00:00.000Z"
  }
  ```

---

## 5. Health & Diagnostic Endpoints

### `GET /api/health`
System liveness check.
- **Auth Required**: No
- **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "service": "BookMind AI Backend",
    "uptimeSeconds": 1420,
    "timestamp": "2026-03-01T12:30:00.000Z",
    "storage": {
      "mode": "mongodb",
      "connected": true
    }
  }
  ```

### `GET /api/ready`
Readiness probe for container orchestration / health monitors.
- **Auth Required**: No
- **Response (200 OK or 503 Service Unavailable)**:
  - Returns `200 OK` when storage engine is ready.
  - Returns `503 Service Unavailable` if in production and MongoDB is disconnected.
