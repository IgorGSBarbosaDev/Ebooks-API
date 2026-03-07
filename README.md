# Ebooks API

REST API for managing ebooks, built with Node.js, TypeScript, Express and Prisma.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** Prisma 7 + PostgreSQL
- **Validation:** Zod
- **File Upload:** Multer
- **Database:** PostgreSQL 16 (Docker)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/IgorGSBarbosaDev/Ebooks-API.git
cd Ebooks-API

# 2. Install dependencies
npm install

# 3. Start the database
docker-compose up -d

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# 5. Run migrations and generate Prisma client
npm run prisma:migrate
npm run prisma:generate

# 6. Start the development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/ebooks"
PORT=3000
```

## API Endpoints

Base URL: `http://localhost:3000`

---

### Ebooks

#### `POST /ebooks`
Create a new ebook. The `slug` is auto-generated from the title.

**Request body:**
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "description": "A handbook of agile software craftsmanship"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "slug": "clean-code",
  "description": "A handbook of agile software craftsmanship",
  "coverPath": "",
  "createdAt": "2026-03-07T00:00:00.000Z",
  "updatedAt": "2026-03-07T00:00:00.000Z"
}
```

---

#### `GET /ebooks`
List ebooks with pagination and optional filtering.

**Query parameters:**

| Parameter | Type   | Default | Description               |
|-----------|--------|---------|---------------------------|
| `page`    | number | `1`     | Page number               |
| `limit`   | number | `10`    | Items per page (max: 100) |
| `title`   | string | —       | Filter by title (partial) |
| `author`  | string | —       | Filter by author (partial)|

**Response `200`:**
```json
{
  "data": [...],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

#### `GET /ebooks/:slug`
Get a single ebook by its slug.

**Response `200`:** Ebook object  
**Response `404`:** `{ "error": "Ebook not found" }`

---

#### `PUT /ebooks/:slug`
Update an ebook. If the title is changed, the slug is regenerated automatically.

**Request body** (all fields optional):
```json
{
  "title": "Clean Code 2nd Edition",
  "author": "Robert C. Martin",
  "description": "Updated description"
}
```

**Response `200`:** Updated ebook object

---

#### `DELETE /ebooks/:slug`
Delete an ebook. If a cover image exists, it is also removed from disk.

**Response `204`:** No content

---

#### `POST /ebooks/:slug/cover`
Upload a cover image for an ebook. Accepts `multipart/form-data`.

**Form field:** `cover` — image file (JPEG, PNG, etc.)

**Response `200`:** Updated ebook object with `coverPath`

---

### Static Files

#### `GET /covers/:filename`
Serve cover images.

---

## Scripts

| Command                  | Description                        |
|--------------------------|------------------------------------|
| `npm run dev`            | Start dev server with hot reload   |
| `npm run build`          | Compile TypeScript to `dist/`      |
| `npm start`              | Run compiled app from `dist/`      |
| `npm run prisma:migrate` | Run database migrations            |
| `npm run prisma:generate`| Regenerate Prisma client           |
| `npm run lint`           | Lint source files                  |
| `npm run format`         | Format source files with Prettier  |

## Data Model

```
Ebook {
  id          String    @id (UUID)
  title       String    (max 200)
  author      String    (max 200)
  slug        String    (max 200, unique per title)
  description String
  coverPath   String
  createdAt   DateTime
  updatedAt   DateTime
}
```