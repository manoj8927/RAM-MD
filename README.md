## ⚡ Professional WhatsApp Menu

RAM-MD uses a **categorized, searchable, mobile-friendly menu** instead of sending its entire command list in a single image caption. The default theme is **Neon**. The menu falls back to text when the cover image is unavailable.

| Send to bot | Action |
| --- | --- |
| `.menu` / `.help` | Professional main menu with cover and categories |
| `.menu 1` | Open numbered category 1 |
| `.menu download` | Downloads: YouTube, Instagram, Facebook, TikTok and RAM API |
| `.menu games` | Games, puzzles and challenges |
| `.menu group` | Group and admin commands |
| `.menu ai` | AI commands |
| `.menu all` | Full list split into WhatsApp-friendly messages |
| `.menu search video` | Find a command by name |
| `.menuset` | Owner-only menu customization panel |
| `.settings` | Owner-only current bot and group settings |

The menu displays the actual **Public/Private mode**, uptime, category count and branding. Owner-only commands are not listed for nonowners. Some listed commands require group-admin rights, an API key or a working third-party service.

### 🎨 Menu appearance (owner/sudo only)

```text
.menuset
.menuset style neon
.menuset style classic
.menuset style minimal
.menuset image on
.menuset image off
.menuset imageurl https://example.com/cover.jpg
.menuset footer RAM-MD • SANJOY MAHATO
.menuset reset
```

Changes save in `data/menuSettings.json` and survive a restart **when the data directory is persistent**. Only public HTTPS image URLs are accepted. Avoid putting credentials, tokens or private files in the menu image URL.

### 🧰 Command reliability changes

- Fixed the `.move <1-9>` Tic-Tac-Toe route (previously referenced an undefined handler).
- Avoided lowercasing user-supplied `.tts`, `.trt` and `.ss` arguments.
- Applied complete-token matching for owner/admin commands so similar command names cannot accidentally match.
- Group administration commands consistently require an admin/owner and the bot to be a group admin.
- Unknown commands now show a short hint instead of invoking the group chatbot.
- Fixed the main message handler error scope and tightened owner phone/LID identity checks.
- `.alive` reports the actual bot mode. `.ping` returns a single status message.

To check source-level regressions after updating:

```bash
npm install
npm test
```

**Testing limitations:** Passing source tests does not verify Baileys connectivity or every media service. Test on a paired bot; real download/AI/Free Fire API commands also depend on external providers and valid credentials.

---

🤖 『ＲＡＭ－ＭＤ』⚡

<p align="center">
  <img src="https://raw.githubusercontent.com/manoj8927/IMG-url/main/manu.jpg" width="100%" alt="RAM-MD Banner"/>
</p><p align="center">
  <b>⚡ A Powerful WhatsApp Bot | Group Management & Automation ⚡</b>
</p><p align="center">
  <a href="https://github.com/manoj8927/RAM-MD">
    <img src="https://img.shields.io/badge/GitHub-RAM--MD-black?style=for-the-badge&logo=github"/>
  </a>
  <img src="https://img.shields.io/badge/JavaScript-100%25-yellow?style=for-the-badge&logo=javascript"/>
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>
</p>---

✨ About RAM-MD

RAM-MD is a powerful WhatsApp automation bot built using the Baileys library.

It helps WhatsApp group admins manage their groups easily with powerful commands, automation tools and useful features.

🚀 Features

- 🤖 WhatsApp Automation
- 👥 Group Management
- 📢 Tag All Members
- 🔇 Mute & Unmute
- 🛡️ Admin Tools
- ⚡ Fast Command Processing
- 🎨 Premium Bot Branding
- 🔧 Custom Configuration
- 📦 Modular Commands
- ❤️ More Features Coming Soon!

📥 Installation
## ☁️ FREE DEPLOYMENT ON OPTIKLINK

Deploy your **RAM-MD WhatsApp Bot** for free using OptikLink hosting.

### 📥 Step 1 — Download GitHub Repository

**Repository:** [https://github.com/manoj8927/RAM-MD](https://github.com/manoj8927/RAM-MD)

**Direct ZIP Download:**

[Download RAM-MD ZIP](https://github.com/manoj8927/RAM-MD/archive/refs/heads/main.zip)

### 🌐 Step 2 — Create OptikLink Account

1. Visit [https://optiklink.net/](https://optiklink.net/)
2. Click **Sign in**.
3. Sign in using your Discord account.
4. Open the hosting dashboard.
5. Find the free hosting / bot hosting section.

### 🖥️ Step 3 — Create Server

1. Click **Create Server**.
2. Select Node.js / Bot Hosting if available.
3. Enter your server name: `RAM-MD`.
4. Select an available free allocation.
5. Create your server.

### 📂 Step 4 — Upload Bot Files

1. Open your server panel.
2. Go to **File Manager**.
3. Upload the downloaded `main.zip`.
4. Extract the ZIP archive.
5. Make sure `package.json` and `index.js` are in the server's main directory.

### ⚙️ Step 5 — Configure Node.js

Use these settings:

| Configuration   | Value                          |
| --------------- | ------------------------------ |
| Runtime         | Node.js                        |
| Node Version    | 18+                            |
| Main File       | index.js                       |
| Install Command | npm install --legacy-peer-deps |
| Start Command   | npm start                      |

### 📦 Step 6 — Install Dependencies

Open the server console and run:

```bash
npm install --legacy-peer-deps
```

Wait until installation finishes.

### 🔧 Step 7 — Configure Bot

Configure the required settings in:

- `config.js`
- `settings.js`

Follow the bot's pairing instructions to connect WhatsApp.

**Important:** Keep your WhatsApp session files private and persistent. Never share your session credentials.

### 🚀 Step 8 — Start RAM-MD

Run:

```bash
npm start
```

If configuration and dependencies are correct, the bot should start.

### 🔄 Step 9 — Keep Your Server Online

- Check your server regularly.
- Back up your session folder.
- Monitor console errors.
- Follow OptikLink's free hosting activity rules.

**OptikLink Free Hosting Notice:** Its published terms require dashboard login at least once every 3 days to keep free servers online. Servers may be deleted after 7 days of inactivity.

### 🔗 Important Links

- [GitHub Repository](https://github.com/manoj8927/RAM-MD)
- [Download ZIP](https://github.com/manoj8927/RAM-MD/archive/refs/heads/main.zip)
- [OptikLink Website](https://optiklink.net/)
- [OptikLink Login](https://optiklink.net/auth)
- [OptikLink Terms](https://optiklink.net/tos)

---

 ❤️ DEPLOYED WITH RAM-MD 

 ## 🖥️ VPS SPECIAL DEPLOYMENT

Deploy your **『ＲＡＭ－ＭＤ』⚡ WhatsApp Bot** on any Linux VPS with 24/7 server availability.

### 📥 Step 1: Connect to VPS

Connect using SSH:

```bash
ssh root@YOUR_VPS_IP
```

### ⚙️ Step 2: Update VPS

```bash
sudo apt update && sudo apt upgrade -y
```

### 📦 Step 3: Install Node.js & Git

```bash
sudo apt install nodejs npm git -y
```

Check versions:

```bash
node -v
npm -v
git --version
```

### 📂 Step 4: Clone RAM-MD

```bash
git clone https://github.com/manoj8927/RAM-MD.git
```

### 📁 Step 5: Open Bot Directory

```bash
cd RAM-MD
```

### 🔧 Step 6: Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 🔑 Step 7: Configure WhatsApp

Configure the required files:

- `config.js`
- `settings.js`

Follow the WhatsApp pairing instructions and securely save your session files.

### 🚀 Step 8: Start RAM-MD

```bash
npm start
```

### ♻️ Step 9: Run Bot 24/7 Using PM2

Install PM2:

```bash
sudo npm install -g pm2
```

Start bot:

```bash
pm2 start npm --name RAM-MD -- start
```

Check status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs RAM-MD
```

Enable automatic restart:

```bash
pm2 startup
pm2 save
```

### 🔄 Step 10: Update Bot

```bash
cd RAM-MD
git pull
npm install --legacy-peer-deps
pm2 restart RAM-MD
```

### 🌟 VPS Benefits

- ⚡ 24/7 Bot Hosting
- 🚀 Better Performance
- 🔄 Automatic Restart with PM2
- 📦 Full Server Control
- 🛡️ Linux VPS Support
- 🔧 Easy Updates

### ⚠️ Important Notes

- Use a supported Node.js LTS version.
- Keep your WhatsApp session private.
- Configure firewall and SSH security.
- VPS uptime depends on your hosting provider.
- Follow WhatsApp's terms of service.

### 🔗 Useful Links

- GitHub: [https://github.com/manoj8927/RAM-MD](https://github.com/manoj8927/RAM-MD)
- Download ZIP: [https://github.com/manoj8927/RAM-MD/archive/refs/heads/main.zip](https://github.com/manoj8927/RAM-MD/archive/refs/heads/main.zip)

---

\<p align="center">   ❤️ VPS DEPLOYMENT — RAM-MD \</p>

\<p align="center">   MADE WITH LOVE BY SANJOY X TECH \</p>



📂 Repository

GitHub: https://github.com/manoj8927/RAM-MD

👑 Owner Information

Details| Information
Bot Name| 『ＲＡＭ－ＭＤ』⚡
Owner| Sanjoy Mahato
Developer| Sanjoy X Tech
Language| JavaScript
Library| Baileys
Platform| WhatsApp

🌐 Connect With Us

- GitHub Repository: https://github.com/manoj8927/RAM-MD

⚠️ Disclaimer

- This project is intended for educational and automation purposes.
- Use responsibly.
- Respect WhatsApp's terms of service.
- The owner is not responsible for misuse.

---

<p align="center">
  <b>❤️ MADE WITH LOVE BY SANJOY X TECH</b>
</p><p align="center">
  <b>『ＲＡＭ－ＭＤ』⚡</b>
</p>
