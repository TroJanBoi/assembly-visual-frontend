# Assembly Visual Backend API Documentation

Base URL: `/api/v2`

## Authentication (`/auth`)

### Register New User
**Endpoint:** `POST /auth/sign-up`

**Description:** Register a new user with email, password, name, and telephone number.

**Request Payload:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword",
  "tel": "1234567890"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid request data"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to register user"
}
```

---

### Login User
**Endpoint:** `POST /auth/login`

**Description:** Authenticate an existing user and retrieve a JWT token.

**Request Payload:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "token": "your_jwt_token_here"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

---

## Google Services (`/google`)

### List Classroom Courses
**Endpoint:** `GET /google/classroom/courses`

**Description:** Retrieve a list of Google Classroom courses for the authenticated user.
**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
[
  {
    "id": "course_id_1",
    "name": "Course Name 1",
    "section": "Section 1",
    ...
  },
  ...
]
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized: User ID not found"
}
```

---

## OAuth (`/api/v2/oauth`)

### Initiate Google Login
**Endpoint:** `GET /oauth/google/login`

**Description:** Redirects the user to Google's OAuth2 consent screen.

**Query Parameters:**
- `state` (required): State parameter for CSRF protection.

**Response (302 Found):**
Redirects to Google OAuth URL.

---

### Google OAuth Callback
**Endpoint:** `GET /oauth/google/callback`

**Description:** Callback URL for Google OAuth2. Exchanges the code for a token and redirects to the frontend.

**Query Parameters:**
- `code` (required): The authorization code returned by Google.

**Response (302 Found):**
Redirects to `http://localhost:3000/success?token=<token>`

---

## Cats (`/cats`)

### Get All Cats
**Endpoint:** `GET /cats`

**Description:** Retrieve all cat information.
**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Whiskers"
  },
  {
    "id": 2,
    "name": "Mittens"
  }
]
```
