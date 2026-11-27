# RAM Downloader API integration

This is an **opt-in** integration of the external RAM Downloader API into RAM-MD. Existing platform-specific commands remain unchanged.

## Commands

- `.ramapi`: check public API health (`GET /api/status`).
- `.ramdl <public-url>`: identify supported platform and request `GET /api/<platform>?url=...` with `x-api-key`. Send a selected combined MP4 video/audio format, or supported SoundCloud MP3/M4A audio.

Accepted domains: YouTube, Instagram, Facebook, TikTok, Twitter/X, Pinterest, SoundCloud. This bot command does not download private media or bypass website restrictions.

## Bot host configuration

Set these only on the **WhatsApp bot host**, in its protected `.env` or hosting environment settings:

```dotenv
RAM_DOWNLOADER_API_URL=https://api.smp-tech.eu.cc
RAM_DOWNLOADER_API_KEY=REPLACE_WITH_YOUR_PRIVATE_API_KEY
RAM_DOWNLOADER_MAX_HEIGHT=720
```

The bot key must match the Altare server's protected `API_KEY`. Do **not** paste either key into GitHub, WhatsApp chats, screenshots, or PR comments. Restart the bot process after changing its environment. This plugin uses the real route `/api/:platform`; the old `RAM_DOWNLOADER_API_PATH` setting is no longer needed.

## API server check

On **Altare**, the installed yt-dlp binary is at `/opt/ram-api-env/bin/yt-dlp`; a plain `yt-dlp --version` may say command not found if the virtualenv is not in PATH.

```bash
/opt/ram-api-env/bin/yt-dlp --version
curl --max-time 15 -fsS http://127.0.0.1:26161/api/status
```

On Altare, the application checks the `x-api-key` header against the server's `API_KEY` and returns `status`, `title`, `thumbnail`, `duration`, `platform`, and `formats`. The media endpoint performs yt-dlp extraction with `--skip-download`. It returns metadata and signed/temporary media URLs; it **does not produce an MP4 file on the API server**. Site restrictions, HTTP 403/429, expiring URLs, formats without combined audio/video, and remote CDN headers may prevent a WhatsApp send.

## Testing checklist

1. Restart the bot after setting the private environment variable. Send `.ramapi` in WhatsApp.
2. Try `.ramdl https://<your-public-media-link>` using public media you are allowed to download.
3. If the bot says `HTTP 401`, verify the bot key matches the Altare API key.
4. If the bot says `HTTP 502` or reports no compatible media, test the same public URL directly with the Altare server; check `pm2 logs ram-api --lines 20 --nostream` without revealing keys or signed URLs.
5. If the API returns metadata but WhatsApp sending fails, the direct CDN URL may be blocked, require headers, or have expired. A **separate authenticated media proxy/streaming route** may be needed; this PR does not add one.

Do not merge as a claim of fully working media downloads until a live WhatsApp end-to-end test has passed. No cookies, authentication bypass, or automatic changes to the existing downloaders are included.
