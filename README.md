# Gmail Declutter — Free, Local, No API Keys

**Clean your Gmail inbox in minutes. Runs entirely on your machine. Zero cloud. Zero subscriptions.**

Most inbox-cleaning tools cost $10–30/month, require you to hand over Gmail access to some random server, and still don't do a great job. This one runs locally, uses your own Gmail credentials, and never sends your email data anywhere.

---

## What it does

- **Scans your inbox** via Gmail IMAP — finds newsletters, spam, promotions, social notifications
- **Classifies every email** into 4 buckets: `KEEP` / `DELETE` / `UNSUBSCRIBE` / `REVIEW`
- **Auto-unsubscribes** from newsletters using the proper RFC 8058 one-click method
- **Moves junk to Bin** (recoverable for 30 days) or permanently deletes — your choice
- **Empties your Bin** in one click when you're ready
- You **review everything** before any action is taken — nothing happens without your approval

---

## Setup (5 minutes)

### 1. Clone and install

```bash
git clone https://github.com/bhoglu050622/gmail-declutter.git
cd gmail-declutter
npm install
```

### 2. Get a Gmail App Password

Takes 2 minutes. Can be revoked any time from your Google Account.

1. Enable [2-Step Verification](https://myaccount.google.com/security) on your Google account
2. Go to **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**
3. Select **Mail** → click **Generate**
4. Copy the 16-character password (e.g. `xxxx xxxx xxxx xxxx`)

### 3. Create `.env.local`

```bash
cp .env.example .env.local
```

Generate a secret key:

```bash
openssl rand -base64 32
```

Fill in `.env.local`:

```
NEXTAUTH_SECRET=<paste-your-generated-secret>
DATABASE_URL=./data/inbox.db
SCAN_MAX_MESSAGES=5000
```

### 4. Run

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**, enter your Gmail + App Password, and start scanning.

---

## How classification works (no AI, no API keys)

| Signal | Decision |
|---|---|
| Gmail Spam label | DELETE |
| `List-Unsubscribe` header present | UNSUBSCRIBE |
| `Precedence: bulk` or `Precedence: list` | DELETE |
| Sent via Mailchimp / Klaviyo / SendGrid / etc. | UNSUBSCRIBE or DELETE |
| Sender from LinkedIn / Facebook / Twitter / etc. | DELETE |
| Has `In-Reply-To` — you were in this thread | KEEP |
| Security alert keywords in subject | KEEP |
| Receipt / invoice / payment keywords | KEEP |
| Everything else | REVIEW |

---

## Privacy

- Credentials stay on your machine — nothing is sent to any server
- Only email **metadata** is read (sender, subject, headers) — not email body content
- App Password is AES-256 encrypted in your local session cookie
- All data lives in `data/inbox.db` — delete the file to wipe everything
- Revoke the App Password from Google Account settings any time

---

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **imapflow** — Gmail IMAP client
- **better-sqlite3** + Drizzle ORM — local SQLite database
- **nodemailer** — sends mailto unsubscribe emails via Gmail SMTP
- **Tailwind CSS** + shadcn/ui

---

## License

MIT
