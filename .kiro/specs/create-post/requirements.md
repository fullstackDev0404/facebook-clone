# Requirements Document

## Introduction

This feature adds the ability for authenticated users to create posts on the Facebook clone platform. A post consists of optional text content and an optional image upload. The server exposes a `POST /api/posts` endpoint protected by JWT auth middleware. Multer handles multipart file uploads and stores images on disk under `uploads/posts/`. The client's `Feed` component gains a functional `CreatePost` form that submits to this endpoint and prepends the new post to the feed.

## Glossary

- **Post_API**: The Express route handler registered at `POST /api/posts` on the server.
- **Post_Controller**: The controller function that validates input, invokes Prisma, and returns the response.
- **Multer_Middleware**: The multer instance configured to accept a single image file field named `image`.
- **Auth_Middleware**: The existing JWT verification middleware at `server/src/middleware/auth.js` that populates `req.user`.
- **CreatePost_Component**: The React component in `client/src/component/Feed.tsx` that renders the post composition UI.
- **Post_API_Client**: The `postsApi` object added to `client/src/lib/api.js` that wraps `POST /api/posts` calls.
- **Uploaded_Image**: A file accepted by Multer_Middleware with MIME type `image/jpeg`, `image/png`, `image/gif`, or `image/webp` and size ≤ 5 MB.
- **Post_Record**: A row in the `posts` table created by Prisma with fields `id`, `content`, `image`, `authorId`, `createdAt`, `updatedAt`.

---

## Requirements

### Requirement 1: Authenticated Post Creation Endpoint

**User Story:** As an authenticated user, I want to submit a POST request with text and/or an image so that a new post is persisted and returned to me.

#### Acceptance Criteria

1. WHEN a request is received at `POST /api/posts` without a valid Bearer token, THE Post_API SHALL return HTTP 401 with `{ "error": "No token provided" }`.
2. WHEN a request is received at `POST /api/posts` with a valid Bearer token and at least one of `content` (non-empty string) or `image` (valid Uploaded_Image), THE Post_Controller SHALL create a Post_Record in the database and return HTTP 201 with the Post_Record including the author's `id`, `firstName`, `lastName`, and `avatar`.
3. WHEN a request is received at `POST /api/posts` with a valid Bearer token but neither `content` nor `image` is provided, THE Post_Controller SHALL return HTTP 400 with `{ "error": "Post must have text content or an image" }`.
4. WHEN a database error occurs during post creation, THE Post_Controller SHALL pass the error to the Express error handler, which SHALL return HTTP 500 with `{ "error": "Internal server error" }`.

---

### Requirement 2: Image Upload Validation

**User Story:** As a developer, I want uploaded images to be validated for type and size so that the server only stores safe, reasonably-sized files.

#### Acceptance Criteria

1. WHEN a file is attached to the `image` field with a MIME type other than `image/jpeg`, `image/png`, `image/gif`, or `image/webp`, THE Multer_Middleware SHALL reject the request and THE Post_API SHALL return HTTP 400 with `{ "error": "Only image files are allowed" }`.
2. WHEN a file is attached to the `image` field with a size greater than 5 MB, THE Multer_Middleware SHALL reject the request and THE Post_API SHALL return HTTP 400 with `{ "error": "Image must be 5 MB or smaller" }`.
3. WHEN a valid Uploaded_Image is accepted, THE Multer_Middleware SHALL store the file under `uploads/posts/` with a unique filename and THE Post_Controller SHALL persist the relative file path in the `image` field of the Post_Record.
4. WHERE no file is attached to the `image` field, THE Post_Controller SHALL set the `image` field of the Post_Record to `null`.

---

### Requirement 3: Post Route Registration

**User Story:** As a developer, I want the posts route to be registered in the Express router so that the endpoint is reachable under `/api/posts`.

#### Acceptance Criteria

1. THE Post_API SHALL be reachable at the path `/api/posts` on the Express server.
2. THE Post_API SHALL apply Auth_Middleware before Post_Controller for every request to `POST /api/posts`.
3. THE Post_API SHALL apply Multer_Middleware before Post_Controller for every request to `POST /api/posts`.

---

### Requirement 4: Client API Integration

**User Story:** As a frontend developer, I want a typed API helper for creating posts so that the CreatePost_Component can call the server without duplicating fetch logic.

#### Acceptance Criteria

1. THE Post_API_Client SHALL send a `POST` request to `/posts` using `multipart/form-data` encoding, appending `content` as a string field and `image` as a file field when an image is selected.
2. WHEN the server returns any response, THE Post_API_Client SHALL resolve with whatever value is present in the response body, even if the body is malformed, missing fields, or does not match the expected Post_Record structure.
3. WHEN the server returns a non-2xx status, THE Post_API_Client SHALL throw an `ApiError` with the server's error message and HTTP status code.
4. THE Post_API_Client SHALL attach the JWT Bearer token from `localStorage` to the `Authorization` header of every request.

---

### Requirement 5: CreatePost UI Component

**User Story:** As a logged-in user, I want a compose box in the feed so that I can type a post, optionally attach a photo, and submit it.

#### Acceptance Criteria

1. THE CreatePost_Component SHALL display a text area that accepts free-form text input for the post content.
2. WHEN the user clicks the "Photo/video" button, THE CreatePost_Component SHALL open a file picker restricted to image file types.
3. WHEN the user selects an image file, THE CreatePost_Component SHALL display a preview of the selected image above the action buttons.
4. WHEN the user clicks the "Post" button with at least one of text content or a selected image present, THE CreatePost_Component SHALL call Post_API_Client and disable the submit button until the request completes.
5. WHEN the API call completes (regardless of server response status, including HTTP 500), THE CreatePost_Component SHALL prepend the returned data to the displayed post list and reset the text area and image selection to empty.
6. WHEN Post_API_Client throws an ApiError, THE CreatePost_Component SHALL display the error message to the user without navigating away.
7. WHILE a post submission is in progress, THE CreatePost_Component SHALL display a loading indicator on the submit button.
8. IF the user clicks "Post" with no text content and no image selected, THE CreatePost_Component SHALL display the message "Please add some text or a photo before posting" and SHALL NOT submit the request.
