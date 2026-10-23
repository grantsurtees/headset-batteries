# Headset Batteries: setup

Three one-time jobs, all in a web browser on your laptop. No command line.

1. Put the app online (GitHub Pages), so it has a fixed address.
2. Make the Google Sheet that stores your data, with its sync script.
3. Connect each device, and bring your data across from the claude.ai version.

---

## 1. Put the app online (GitHub Pages)

1. Sign in at **github.com**, or create a free account.
2. Top right **+** → **New repository**.
   - Repository name: `headset-batteries`
   - Choose **Public**. Free GitHub Pages needs a public repository. Your data isn't in it, only the app.
   - Click **Create repository**.
3. On the new repository's page, click **uploading an existing file**.
4. Drag in everything from the `site` folder: `index.html`, `sw.js`, `manifest.webmanifest`, the four icon files, `SETUP.md` and the `apps-script` folder. Click **Commit changes**.
5. Go to **Settings** → **Pages** (left menu).
   - Source: **Deploy from a branch**
   - Branch: **main**, folder **/ (root)** → **Save**
6. After a minute or two, the page shows your address:
   **`https://YOUR-GITHUB-NAME.github.io/headset-batteries/`**
   That's the app. Bookmark it.

**Updates later.** Either drag the changed files in the same way (**Add file → Upload files**), or let Claude publish them for you (see the note at the end).

---

## 2. Make the Google Sheet and its sync script

1. Go to **sheets.new**, which makes a new Google Sheet. Name it `Headset Batteries data`.
2. Menu **Extensions → Apps Script**.
3. Delete the sample code in the editor. Paste the whole of `apps-script/Code.gs`, then click the **Save** (disk) icon.
4. Set your passphrase:
   - Left side, **Project Settings** (gear icon) → scroll to **Script properties** → **Add script property**.
   - Property: `PASSPHRASE`
   - Value: a long passphrase only you know, for example four random words.
   - **Save script properties**.
5. Deploy it as a web app:
   - Top right **Deploy → New deployment**.
   - Click the gear next to "Select type" → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy**.
6. Google asks you to authorise the script:
   - **Authorize access** → choose your Google account.
   - If you see "Google hasn't verified this app", click **Advanced → Go to … (unsafe)**. It's your own script. Then **Allow**.
7. Copy the **Web app URL**. It ends in `/exec`.
8. Check it: paste that URL into a new browser tab. You should see `{"ok":true,"app":"headset-batteries",…}`.

The script makes a tab called **records** in the sheet the first time a device syncs. One row is one entry. You can look at it, but don't edit rows by hand.

**If you ever change the script:** Deploy → **Manage deployments** → pencil icon → Version: **New version** → **Deploy**. This keeps the same URL.

**Security:** "Anyone" only means the script can be reached without a Google login. Every request must carry your passphrase, and the script refuses anything without it. The URL and passphrase are stored only in each browser where you enter them, never in the app's files.

---

## 3. Connect your devices and bring your data across

### Laptop (do this first)

1. In the **old claude.ai page**: **Log** tab → **Export JSON**. This saves `battery-backup-YYYY-MM-DD.json` to Downloads.
   (A copy of your claude.ai data as of 23 Oct 2026 is also in the `migration` folder. Use a fresh export if you've changed anything since.)
2. Open the new app at your GitHub Pages address.
3. **Log** tab → **Import backup (JSON or CSV)…** → choose that file → **Import**.
4. **Log** tab → **Sync** → paste the Web app URL and your passphrase → **Save and sync**.
   The status top right should change to **Synced HH:MM**.

### Each Android phone (Firefox)

1. Open your GitHub Pages address in Firefox.
2. Tap **Set up sync** (or **Log** tab → **Sync**), paste the URL and passphrase → **Save and sync**.
   The phone pulls everything down. Typing the URL is fiddly, so email or message it to yourself from the laptop.
3. Add it to the home screen: Firefox menu **⋮** → **Add app to Home screen** (some versions say **Install**). It then opens like an app, without the address bar.

---

## Day to day

- **Battery changed** saves on the device instantly and syncs a second later.
- With no signal, the status shows **Offline · N changes waiting to send**. They're sent automatically when you're back online, or next time you open the app.
- Other devices' changes are pulled in when you open the app and when you switch back to it.
- Tap the status pill (top right) to sync immediately.
- If the same entry was changed on two devices, the most recent change wins. Deleted entries are kept as "deleted" markers, so deletions sync too.
