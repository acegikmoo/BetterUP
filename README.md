# BetterUP

A lightweight, self-hosted website uptime monitor. Checks your sites every 10 seconds, stores response metrics in InfluxDB, and sends email alerts when something goes down — with a 30-minute cooldown to prevent alert fatigue.

---

## Features

- HTTP checks every 10 seconds per website
- Email alerts on downtime with 30-minute cooldown per site
- Per-user monitor management
- Response time and status written to InfluxDB on every tick
- Stateless JWT auth with 7-day tokens
- Decoupled Redis stream architecture for checks and notifications

---

## Architecture

![System Architecture](frontend/public/architecture.png)

---

## Tech Stack

| Layer           | Technology                                                 |
| --------------- | ---------------------------------------------------------- |
| Frontend        | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| API             | Rust, [Poem](https://github.com/poem-web/poem)             |
| Worker          | Rust, Tokio, reqwest                                       |
| Notification    | Rust, Lettre (SMTP)                                        |
| Database        | PostgreSQL (SQLx)                                          |
| Cache / Streams | Redis                                                      |
| Metrics         | InfluxDB v2                                                |

---

## Getting Started

**Prerequisites:** Rust (stable), Node.js 20+ / Bun, PostgreSQL 15+, Redis 7+, InfluxDB v2

```bash
git clone https://github.com/acegikmoo/BetterUP
cd BetterUP
```

---

## Environment Variables

**`backend/.env`** — copy from `backend/.env.example`:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here

DATABASE_URL=postgres://postgres:postgres@localhost:5432/betterup
REDIS_URL=redis://localhost:6379

INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token_here
INFLUXDB_ORG=your_org

SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_smtp_app_password
```

**`frontend/.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Running Locally

```bash
# Migrate database
cd backend
cargo install sqlx-cli
sqlx migrate run --source store/migrations

# Start API (http://localhost:5000)
cargo run -p api

# Start worker (separate terminal)
cargo run -p worker

# Start notification service (separate terminal)
cargo run -p notification

# Start frontend (http://localhost:3000)
cd ../frontend
bun install && bun dev
```

---

## Deployment

Backend on [Render](https://render.com), frontend on [Vercel](https://vercel.com).

### Render

| Service      | Command                     | Type              |
| ------------ | --------------------------- | ----------------- |
| API          | `cargo run -p api`          | Web Service       |
| Worker       | `cargo run -p worker`       | Background Worker |
| Notification | `cargo run -p notification` | Background Worker |

> Worker and Notification bind a dummy listener on `:8080` to pass Render's health check.

### Vercel

```bash
cd frontend && vercel deploy
```

Set `NEXT_PUBLIC_API_URL` to your Render API URL in Vercel project settings.

---

## API Endpoints

Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path           | Protected | Description          |
| ------ | -------------- | --------- | -------------------- |
| `POST` | `/auth/signup` | No        | Register an account  |
| `POST` | `/auth/signin` | No        | Sign in, returns JWT |

### Websites

| Method   | Path            | Protected | Description        |
| -------- | --------------- | --------- | ------------------ |
| `GET`    | `/websites`     | Yes       | List monitors      |
| `POST`   | `/websites`     | Yes       | Add a monitor      |
| `GET`    | `/websites/:id` | Yes       | Get one monitor    |
| `PATCH`  | `/websites/:id` | Yes       | Update URL or name |
| `DELETE` | `/websites/:id` | Yes       | Remove a monitor   |

### Regions

| Method | Path       | Protected | Description     |
| ------ | ---------- | --------- | --------------- |
| `GET`  | `/regions` | No        | List regions    |
| `POST` | `/regions` | No        | Create a region |

---

## Project Structure

```
.
├── backend/
│   ├── api/            # HTTP API server (Poem)
│   │   └── src/
│   │       ├── main.rs     # Routes, handlers, JWT issuance
│   │       ├── auth.rs     # JWT extractor middleware
│   │       └── input.rs    # Request body types
│   ├── worker/         # Uptime checker, InfluxDB writer
│   ├── notification/   # Email dispatcher, reads Redis stream
│   ├── redis_lib/      # Shared Redis client (streams, cooldown keys)
│   ├── store/          # SQLx models + migrations
│   ├── db_processor/   # Placeholder for future use
│   └── Cargo.toml
│
└── frontend/src/
    ├── app/            # Pages: root, login, signup, dashboard
    ├── api/            # Typed fetch client + token storage
    ├── components/
    │   ├── ui/         # shadcn/ui primitives
    │   ├── dashboard/  # Header, Stats, EmptyState
    │   └── website/    # WebsiteCard, Add/Edit/Delete dialogs
    ├── hooks/          # useWebsites, create/update/delete hooks
    └── lib/            # cn() utility
```

---

## Database Schema

```sql
CREATE TABLE "user" (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,        -- bcrypt hash
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE website (
  id         TEXT PRIMARY KEY,
  url        TEXT NOT NULL,
  name       TEXT,
  time_added TIMESTAMP DEFAULT NOW(),
  user_id    TEXT NOT NULL REFERENCES "user"(id)
);

CREATE TABLE region (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
```

---

## Roadmap

- [ ] Multi-region workers
- [ ] Response time charts in the dashboard
- [ ] Incident history per monitor
- [ ] Webhook / Slack alerts
- [ ] Public status pages
- [ ] Configurable check intervals
- [ ] Two-factor authentication

---

## Contributing

1. Fork and create a branch: `git checkout -b feat/your-feature`
2. Commit: `git commit -m "feat: describe your change"`
3. Open a pull request with a clear description of what changed and why.

---

## License

MIT
