# Care Bridge Backend

Express + MongoDB backend for **Aid Infinity Disability Services**, an NDIS provider in New South Wales, Australia. It stores website contact enquiries and powers an AI chat assistant backed by Google Gemini (the API key stays server-side).

Live site: <https://aidinfinityservices.com.au>

## Features

- **Enquiry API** — accept and persist contact-form submissions in MongoDB.
- **Chat API** — proxy chat messages to Gemini with a domain-specific system prompt and conversation history.
- CORS enabled for browser clients.

## Requirements

- Node.js **18+** (ES modules; developed on Node 22)
- MongoDB (local or hosted)
- A Google Gemini API key

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/enquiry_db
GEMINI_API_KEY=your-gemini-api-key
```

## Running

```bash
npm start
```

The server listens on `0.0.0.0:$PORT` and exits if the MongoDB connection fails.

## Deployment

Production runs on an **Amazon EC2** instance:

- **App** — the Express server runs under **pm2** (process name `my-app`), so it survives crashes and reboots (`pm2 save` persists the process list).
- **Reverse proxy** — **Nginx** sits in front of the app and terminates TLS, with certificates issued by **Let's Encrypt** and managed/auto-renewed by **Certbot**.
- **Database** — **MongoDB Atlas**. Point `MONGODB_URI` in the server's `.env` at the Atlas connection string.
- **CI/CD** — pushing to `master` triggers the [`Deploy to EC2`](.github/workflows/deploy.yml) GitHub Action, which SSHes into the instance, runs `git pull`, `npm install`, then `pm2 restart my-app && pm2 save`.

Email sending/receiving and DNS deliverability (SPF, DKIM, DMARC, Cloudflare Email Routing, Brevo SMTP relay) are documented separately in [`docs/email-setup.md`](docs/email-setup.md).

## API

### `POST /api/enquiry`

Submit a new enquiry. All fields are required.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "0400 000 000",
  "subject": "Support enquiry",
  "message": "I'd like to know more about SIL."
}
```

Responses: `201` with the saved document, `400` if a field is missing, `500` on server error.

### `GET /api/enquiries`

Return all enquiries, newest first.

### `POST /api/chat`

Send a message to the Gemini-backed assistant.

```json
{
  "message": "Am I eligible for NDIS?",
  "history": [
    { "role": "user", "parts": [{ "text": "Hi" }] },
    { "role": "model", "parts": [{ "text": "Hello! How can I help?" }] }
  ]
}
```

Response: `{ "reply": "..." }`. `history` is optional. Returns `400` if `message` is missing.

## Data model

`Enquiry`: `name`, `email`, `phone`, `subject`, `message` (all required strings) and `createdAt` (defaults to now).

## Project structure

| File | Purpose |
| --- | --- |
| `server.js` | Express app, MongoDB connection, route definitions |
| `gemini.js` | `getChatResponse()` — Gemini call and system prompt |
