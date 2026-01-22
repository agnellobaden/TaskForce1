# SCHRITT-FÜR-SCHRITT: JETZT DEPLOYEN

## 📋 VORBEREITUNG (Einmalig)

### 1. Git installieren (falls nicht vorhanden)
Download: https://git-scm.com/download/win
→ Standard-Installation (alles auf "Next")

### 2. Accounts erstellen
- GitHub: https://github.com/signup
- Netlify: https://app.netlify.com/signup (mit GitHub anmelden)

---

## 🚀 DEPLOYMENT STARTEN

### KOPIERE DIESE BEFEHLE UND FÜHRE SIE AUS:

**Schritt 1: PowerShell öffnen**
- Windows-Taste + X
- "Windows PowerShell" oder "Terminal" wählen

**Schritt 2: Zum Projekt navigieren**
```powershell
cd "c:\Users\aagne\OneDrive\Desktop\TaskForce1-main"
```

**Schritt 3: Git initialisieren**
```powershell
git init
git add .
git commit -m "🚀 TaskForce Pro - Production Ready v1.0"
```

**Schritt 4: GitHub Repository erstellen**
1. Öffne Browser: https://github.com/new
2. Repository Name: `taskforce-pro`
3. Private: Ja
4. Klicke "Create repository"
5. **KOPIERE DIE URL** (sieht aus wie: `https://github.com/USERNAME/taskforce-pro.git`)

**Schritt 5: Code hochladen**
```powershell
# ERSETZE "USERNAME" mit deinem GitHub-Username!
git remote add origin https://github.com/USERNAME/taskforce-pro.git
git branch -M main
git push -u origin main
```

**Falls Fehler "Authentication failed":**
→ Nutze Personal Access Token:
1. GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Alle Scopes aktivieren
4. Token kopieren
5. Als Passwort beim git push verwenden

**Schritt 6: Netlify Deployment**
1. Öffne: https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. "GitHub" wählen
4. Repository `taskforce-pro` wählen
5. Deploy settings:
   - Build command: *(leer)*
   - Publish directory: `./`
6. "Deploy site" klicken

⏱️ **WARTE 2-3 MINUTEN...**

---

## ✅ ERFOLGREICH!

**Deine App ist jetzt live!**

URL: `https://[random-name].netlify.app`

**Nächste Schritte:**
1. Öffne die URL
2. Registriere einen Test-User
3. Erstelle einige Termine/Aufgaben
4. Teste auf Mobile
5. Installiere die PWA

---

## 🔄 UPDATES DEPLOYEN (SPÄTER)

Wenn du Änderungen gemacht hast:

```powershell
cd "c:\Users\aagne\OneDrive\Desktop\TaskForce1-main"
git add .
git commit -m "Update: Beschreibung der Änderung"
git push
```

→ Netlify deployed automatisch! (1-2 Minuten)

---

## 🎨 CUSTOM DOMAIN (Optional)

**Willst du eine eigene Domain wie `taskforce-app.com`?**

1. Domain kaufen: https://namecheap.com (~10€/Jahr)
2. In Netlify: Domain settings → Add custom domain
3. DNS-Einträge bei Namecheap hinzufügen (Netlify zeigt dir wie)
4. Warte 24h → Fertig!

---

## ❓ PROBLEME?

### "git: command not found"
→ Git installieren: https://git-scm.com/download

### "Permission denied"
→ Personal Access Token verwenden (siehe Schritt 5)

### "Build failed on Netlify"
→ Check Netlify Logs: Site → Deploys → Click newest deploy

### "PWA installiert sich nicht"
→ HTTPS prüfen (Netlify macht das automatisch nach ~1 Minute)

---

## 📞 SUPPORT

Bei Fragen:
1. Check Browser Console (F12)
2. Lies `DEPLOYMENT_GUIDE.md`
3. Check Netlify Deploy Logs

---

**🎉 VIEL ERFOLG MIT DEM DEPLOYMENT!**
