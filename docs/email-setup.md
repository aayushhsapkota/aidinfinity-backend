# Email System & Deliverability

Aid Infinity needed to reliably send and receive email from a real business
address (`info@aidinfinityservices.com.au`) — not a generic Gmail account —
without messages landing in spam. Here's everything set up to make that work:

This was intentionally built on **free tools** (Cloudflare + Gmail + Brevo)
instead of **Google Workspace** — a small business like this doesn't need
Workspace's paid features (shared drives, admin console, multiple seats,
etc.) just to have a professional `@yourdomain.com` inbox. This setup gets
the same result — a branded, authenticated business email — at no
recurring cost.

## 1. Custom domain email (Cloudflare Email Routing)
- Configured Cloudflare Email Routing so mail to `info@aidinfinityservices.com.au` forwards to Gmail.
- Set up Gmail's "Send mail as" so replies also go out *from* the business address.
- Added a professional signature/footer to the info@ mailbox.

## 2. Email authentication (SPF, DKIM, DMARC)
Three DNS TXT records were added in Cloudflare so receiving mail servers trust outgoing mail:

| Record | Purpose |
|---|---|
| **SPF**   | Lists which servers (Google, Brevo) are allowed to send on behalf of the domain |
| **DKIM**  | Digitally signs outgoing mail so it can be verified as genuinely from this domain, not spoofed |
| **DMARC** | Tells inboxes what to do if a message fails SPF/DKIM, and where to send authentication reports |

## 3. Root-cause fix with Brevo
Gmail's own servers don't sign mail with this domain's DKIM key, so replies sent "as" info@ were failing DMARC alignment and landing in spam. Fixed by:
- Creating a [Brevo](https://www.brevo.com) account and verifying the domain (adds Brevo's own SPF + DKIM records)
- Routing Gmail's outgoing mail through **Brevo's SMTP relay** instead of Gmail's default servers
- Confirmed via DMARC aggregate reports that DKIM now passes cleanly with `disposition=none`

## 4. Reliable contact form (EmailJS → Brevo API)
The site's contact form uses **EmailJS**. It was originally connected to Gmail via OAuth, but Google expires that token roughly every 7 days, requiring a manual reconnect. Switched the EmailJS service to **Brevo's transactional email API**, authenticated with a static API key instead:
- No more expiring tokens or manual reconnects
- Free tier covers 300 emails/day — well within contact-form volume
- Outgoing "From" address set to `info@aidinfinityservices.com.au` for a consistent, branded sender

**Result:** Business email sends and receives reliably from the real domain, passes authentication checks, avoids spam folders, and the contact form runs maintenance-free.
