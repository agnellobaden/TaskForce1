// ===== Personal AI Assistant - JavaScript =====

// Personal AI Data Storage
let personalAIData = JSON.parse(localStorage.getItem('taskforce_personal_ai')) || {
    name: '',
    birthdate: '',
    gender: '',
    job: '',
    hobbies: '',
    features: {
        weather: true,
        news: true,
        business: true,
        private: true,
        reminders: true
    },
    morningTime: '07:00'
};

// ChatGPT Integration
// Google Gemini Integration (Instead of ChatGPT)
async function callAI(messages, options = {}) {
    // 1. Determine Provider & Key
    let provider = 'openai'; // Default
    let apiKey = null;

    if (typeof app !== 'undefined' && app.state && app.state.aiConfig) {
        provider = app.state.aiConfig.provider || 'openai';
        apiKey = app.state.aiConfig.openaiKey || app.state.aiConfig.geminiKey;
        // Specific keys based on provider
        if (provider === 'openai') apiKey = app.state.aiConfig.openaiKey;
        if (provider === 'gemini') apiKey = app.state.aiConfig.geminiKey;
    }

    // Fallback to settings
    if (!apiKey && typeof appSettings !== 'undefined') {
        apiKey = appSettings.openaiApiKey;
    }

    if (apiKey) apiKey = apiKey.trim(); // IMPORTANT: Trim whitespace

    if (!apiKey) {
        throw new Error('Kein API-Key für die KI gefunden. Bitte in den Einstellungen eintragen.');
    }

    try {
        let response, data;

        // === OPENAI HANDLER ===
        if (provider === 'openai') {
            const url = 'https://api.openai.com/v1/chat/completions';
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: messages,
                    temperature: options.temperature || 0.7,
                    max_tokens: options.max_tokens || 1000
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const msg = errData.error?.message || `HTTP Fehler ${response.status}`;
                throw new Error(`OpenAI: ${msg}`);
            }

            data = await response.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }
        }

        // === GEMINI HANDLER ===
        else if (provider === 'gemini' || provider === 'google') {
            const prompt = messages.map(m => `[${m.role}]: ${m.content}`).join('\n');
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: options.max_tokens || 1000
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Gemini API Fehler');
            }

            data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            }
        }

        // === GROK HANDLER (As OpenAI Compatible) ===
        else if (provider === 'grok') {
            // xAI logic similar to OpenAI usually
            // Placeholder for now, can be expanded
        }

        throw new Error('Ungültige Antwort von der KI oder Provider nicht unterstützt.');

    } catch (err) {
        console.error('AI API Error:', err);
        throw err;
    }
}

async function callChatGPT(messages, options) {
    return callAI(messages, options);
}

// Initialize Personal AI Modal
function initPersonalAI() {
    const personalAIBtn = document.getElementById('personalAIBtn');
    const personalAIModal = document.getElementById('personalAIModal');
    const closePersonalAIBtn = document.getElementById('closePersonalAIBtn');
    const savePersonalAIBtn = document.getElementById('savePersonalAIBtn');
    const testAIBriefingBtn = document.getElementById('testAIBriefingBtn');

    // Load saved data
    loadPersonalAIData();
    loadAiChatHistory();

    // Event Listeners
    if (personalAIBtn) {
        personalAIBtn.addEventListener('click', () => {
            personalAIModal.classList.remove('hidden');
            updateAIGreeting();
        });
    }

    if (closePersonalAIBtn) {
        closePersonalAIBtn.addEventListener('click', () => {
            personalAIModal.classList.add('hidden');
        });
    }

    if (savePersonalAIBtn) {
        savePersonalAIBtn.addEventListener('click', savePersonalAIData);
    }

    if (testAIBriefingBtn) {
        testAIBriefingBtn.addEventListener('click', showAIBriefing);
    }

    // Age calculation on birthdate change
    const birthdateInput = document.getElementById('aiUserBirthdate');
    if (birthdateInput) {
        birthdateInput.addEventListener('change', updateAgeDisplay);
    }

    // AI Chat Listeners
    const sendAiChatBtn = document.getElementById('sendAiChatBtn');
    const aiChatInput = document.getElementById('aiChatInput');

    if (sendAiChatBtn) {
        sendAiChatBtn.addEventListener('click', handleSendAiChat);
    }
    if (aiChatInput) {
        aiChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendAiChat();
        });
    }

    // API Key toggler
    const toggleAiApiBtn = document.getElementById('toggleAiApiKeyVisibility');
    const aiApiInput = document.getElementById('aiOpenaiApiKeyInput');
    if (toggleAiApiBtn && aiApiInput) {
        toggleAiApiBtn.addEventListener('click', () => {
            aiApiInput.type = aiApiInput.type === 'password' ? 'text' : 'password';
            toggleAiApiBtn.textContent = aiApiInput.type === 'password' ? '👁️' : '🔒';
        });
    }

    // Check for morning briefing
    checkMorningBriefing();
    setInterval(checkMorningBriefing, 60000); // Check every minute
}

let aiChatHistoryData = [];

function loadAiChatHistory() {
    const saved = localStorage.getItem('taskforce_ai_history');
    if (saved) {
        aiChatHistoryData = JSON.parse(saved);
        const history = document.getElementById('aiChatHistory');
        if (history) {
            history.innerHTML = '';
            aiChatHistoryData.forEach(m => addChatMessageUI(m.role, m.text));
        }
    }
}

function saveAiChatHistory() {
    localStorage.setItem('taskforce_ai_history', JSON.stringify(aiChatHistoryData.slice(-50)));
}

async function handleSendAiChat() {
    const input = document.getElementById('aiChatInput');
    const text = input.value.trim();
    if (!text) return;

    // Add User Message
    addChatMessage('user', text);
    input.value = '';

    // Thinking placeholder
    const thinkingId = 'thinking_' + Date.now();
    addChatMessageUI('ai', '<span class="loading-dots">... denkt nach ...</span>', thinkingId);

    try {
        const context = (typeof app !== 'undefined' && app.ai) ? app.ai.getSystemContext() : {};
        const systemPrompt = `Du bist der "TaskForce Butler". Ein extrem höflicher, intelligenter und proaktiver persönlicher Assistent (wie Jarvis oder ein klassischer englischer Butler).
Dein Ziel ist es, den Nutzer (${personalAIData.name || 'Master'}) optimal zu unterstützen.
Nutzerdetails: Job: ${personalAIData.job}, Hobbys: ${personalAIData.hobbies}.
Aktueller App-Zustand: ${JSON.stringify(context)}.
Du bist jederzeit behilflich bei Terminen, Aufgaben und privatem/geschäftlichem Management.
Antworte präzise, hilfreich und mit einer Prise Butler-Charme.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...aiChatHistoryData.slice(-10).map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: text }
        ];

        const response = await callAI(messages);

        // Remove thinking and add real response
        const thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) thinkingEl.remove();

        addChatMessage('ai', response);

        // Speak response if enabled
        if (personalAIData.features.reminders && typeof speakAI === 'function') {
            speakAI(response);
        }
    } catch (err) {
        const thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) thinkingEl.innerHTML = `<span style="color:#ef4444;">Fehler: ${err.message}</span>`;
    }
}

function addChatMessage(role, text) {
    aiChatHistoryData.push({ role, text });
    saveAiChatHistory();
    addChatMessageUI(role, text);
}

function addChatMessageUI(role, text, id) {
    const history = document.getElementById('aiChatHistory');
    if (!history) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' ? 'user-msg' : 'ai-msg';
    if (id) msgDiv.id = id;

    const isUser = role === 'user';
    msgDiv.style.padding = '10px 15px';
    msgDiv.style.borderRadius = '18px';
    msgDiv.style.fontSize = '0.9rem';
    msgDiv.style.maxWidth = '85%';
    msgDiv.style.alignSelf = isUser ? 'flex-end' : 'flex-start';
    msgDiv.style.background = isUser ? 'var(--primary)' : 'rgba(255,255,255,0.1)';
    msgDiv.style.color = isUser ? 'white' : 'var(--text-primary)';
    msgDiv.style.borderBottomRightRadius = isUser ? '4px' : '18px';
    msgDiv.style.borderBottomLeftRadius = isUser ? '18px' : '4px';
    msgDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

    msgDiv.innerHTML = text;
    history.appendChild(msgDiv);
    history.scrollTop = history.scrollHeight;
}

// Load Personal AI Data from localStorage
function loadPersonalAIData() {
    if (document.getElementById('aiUserName')) document.getElementById('aiUserName').value = personalAIData.name || '';
    if (document.getElementById('aiUserBirthdate')) document.getElementById('aiUserBirthdate').value = personalAIData.birthdate || '';
    if (document.getElementById('aiUserGender')) document.getElementById('aiUserGender').value = personalAIData.gender || '';
    if (document.getElementById('aiUserJob')) document.getElementById('aiUserJob').value = personalAIData.job || '';
    if (document.getElementById('aiUserHobbies')) document.getElementById('aiUserHobbies').value = personalAIData.hobbies || '';

    if (document.getElementById('aiWeatherToggle')) document.getElementById('aiWeatherToggle').checked = personalAIData.features.weather !== false;
    if (document.getElementById('aiNewsToggle')) document.getElementById('aiNewsToggle').checked = personalAIData.features.news !== false;
    if (document.getElementById('aiBusinessToggle')) document.getElementById('aiBusinessToggle').checked = personalAIData.features.business !== false;
    if (document.getElementById('aiPrivateToggle')) document.getElementById('aiPrivateToggle').checked = personalAIData.features.private !== false;
    if (document.getElementById('aiRemindersToggle')) document.getElementById('aiRemindersToggle').checked = personalAIData.features.reminders !== false;

    if (document.getElementById('aiMorningTime')) document.getElementById('aiMorningTime').value = personalAIData.morningTime || '07:00';

    if (document.getElementById('aiOpenaiApiKeyInput')) {
        document.getElementById('aiOpenaiApiKeyInput').value = (typeof appSettings !== 'undefined') ? appSettings.openaiApiKey : '';
    }

    updateAgeDisplay();
}

// Save Personal AI Data
function savePersonalAIData() {
    personalAIData = {
        name: document.getElementById('aiUserName').value.trim(),
        birthdate: document.getElementById('aiUserBirthdate').value,
        gender: document.getElementById('aiUserGender').value,
        job: document.getElementById('aiUserJob').value.trim(),
        hobbies: document.getElementById('aiUserHobbies').value.trim(),
        features: {
            weather: document.getElementById('aiWeatherToggle').checked,
            news: document.getElementById('aiNewsToggle').checked,
            business: document.getElementById('aiBusinessToggle').checked,
            private: document.getElementById('aiPrivateToggle').checked,
            reminders: document.getElementById('aiRemindersToggle').checked
        },
        morningTime: document.getElementById('aiMorningTime').value
    };

    localStorage.setItem('taskforce_personal_ai', JSON.stringify(personalAIData));

    // Update global API key if provided
    const aiApiInput = document.getElementById('aiOpenaiApiKeyInput');
    if (aiApiInput && aiApiInput.value.trim()) {
        if (typeof appSettings !== 'undefined') {
            appSettings.openaiApiKey = aiApiInput.value.trim();
            localStorage.setItem('taskforce_settings', JSON.stringify(appSettings));
        }
    }

    if (typeof showToast === 'function') {
        showToast('Persönliche KI-Einstellungen gespeichert!', 'success');
    }

    document.getElementById('personalAIModal').classList.add('hidden');
}

// Update Age Display
function updateAgeDisplay() {
    const birthdateInput = document.getElementById('aiUserBirthdate');
    if (!birthdateInput) return;
    const birthdate = birthdateInput.value;
    const ageDisplay = document.getElementById('aiAgeDisplay');

    if (birthdate && ageDisplay) {
        const age = calculateAge(birthdate);
        ageDisplay.textContent = `Du bist ${age} Jahre alt`;
    } else if (ageDisplay) {
        ageDisplay.textContent = '';
    }
}

// Calculate Age from Birthdate
function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

// Update AI Greeting
function updateAIGreeting() {
    const greetingText = document.getElementById('aiGreetingText');
    const greetingSubtext = document.getElementById('aiGreetingSubtext');
    if (!greetingText) return;

    if (personalAIData.name) {
        const hour = new Date().getHours();
        let greeting = 'Hallo';

        if (hour < 12) greeting = 'Guten Morgen';
        else if (hour < 18) greeting = 'Guten Tag';
        else greeting = 'Guten Abend';

        greetingText.textContent = `${greeting}, ${personalAIData.name}!`;
        greetingSubtext.textContent = 'Wie kann ich dir heute helfen?';
    } else {
        greetingText.textContent = 'Hallo! Ich bin deine persönliche KI.';
        greetingSubtext.textContent = 'Lass mich dich kennenlernen, damit ich dir besser helfen kann.';
    }
}

// Show AI Briefing (Now redirects to the unified Local Host Briefing)
async function showAIBriefing() {
    console.log("Starting Local Morning Briefing...");
    if (typeof window.readMorningBriefing === 'function') {
        window.readMorningBriefing();
    } else {
        // Fallback if interactive-ai.js isn't loaded
        alert("Das Briefing-Modul ist noch nicht geladen. Bitte Seite neu laden.");
    }
}

// Global accessor for the briefing button in HTML
window.testAIBriefing = showAIBriefing;

// Generate Daily Briefing using ChatGPT
async function generateDailyBriefingAI() {
    const now = new Date();
    const dayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][now.getDay()];
    const dateStr = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;

    // 1. Fetch Real Context Data
    let weatherInfo = "Keine Wetterdaten (nutze Jahreszeit)";
    let newsInfo = "Keine aktuellen Nachrichten";

    try {
        // Parallel fetch for speed
        const [weather, news] = await Promise.all([
            fetchRealWeather(),
            fetchRealNews()
        ]);
        if (weather) weatherInfo = weather;
        if (news) newsInfo = news;
    } catch (e) {
        console.error("Context Fetch Error", e);
    }


    // 2. Prepare Task Data (Separated) - Accessing app.state.tasks and app.state.events
    let appointmentsText = "Keine Termine für heute.";
    let todoText = "Keine offenen Aufgaben.";

    const todayStr = new Date().toISOString().split('T')[0];
    const sourceTasks = (typeof app !== 'undefined' && app.state && app.state.tasks) ? app.state.tasks : [];
    const sourceEvents = (typeof app !== 'undefined' && app.state && app.state.events) ? app.state.events : [];

    // Termine heute (aus Events)
    const todaysEvents = sourceEvents.filter(e => e.start && e.start.startsWith(todayStr));

    // Termine heute (aus Tasks mit Deadline/Termin-Charakter)
    const todaysTasks = sourceTasks.filter(t => !t.done && t.deadline && t.deadline.startsWith(todayStr));

    if (todaysEvents.length > 0 || todaysTasks.length > 0) {
        const evLines = todaysEvents.map(e => `- ${e.time || 'Ganztägig'} Uhr: ${e.title}`);
        const taskLines = todaysTasks.map(t => `- (Aufgabe) ${t.title}`);
        appointmentsText = [...evLines, ...taskLines].join('\n');
    }

    // Andere offene To-Dos
    const otherTodos = sourceTasks.filter(t => !t.done && (!t.deadline || !t.deadline.startsWith(todayStr)));

    // New: Overdue Tasks ("Was vorher war/anstand")
    const overdueTasks = sourceTasks.filter(t => !t.done && t.deadline && t.deadline < todayStr);
    let overdueText = "Keine überfälligen Aufgaben.";
    if (overdueTasks.length > 0) {
        overdueText = overdueTasks.map(t => `- ⚠️ ${t.title} (Fällig seit: ${t.deadline})`).join('\n');
    }

    // Past Events (Yesterday Review)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const yesterdayEvents = sourceEvents.filter(e => e.date === yStr);
    let historyText = "Gestern keine Termine.";
    if (yesterdayEvents.length > 0) {
        historyText = yesterdayEvents.map(e => `- ${e.title}`).join('\n');
    }

    if (otherTodos.length > 0) {
        // Top 10 wichtigste (Urgent first)
        const sortedTodos = [...otherTodos].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
        todoText = sortedTodos.slice(0, 10).map(t => `- ${t.urgent ? '🔥 ' : ''}${t.title}`).join('\n');
        if (sortedTodos.length > 10) todoText += `\n... und ${sortedTodos.length - 10} weitere.`;
    }


    const systemPrompt = `Du bist der "TaskForce Butler". Ein extrem höflicher, intelligenter und proaktiver persönlicher Assistent ( Jarvis-Stil). 
Dein Ziel ist es, dem Nutzer ein visuell ansprechendes und informatives Tages-Briefing zu geben.
Strukturiere deine Antwort in HTML mit modernen CSS-Inline-Styles.
Verwende Icons (Emojis), klare Sektionen und einen motivierenden Ton.
Antworte auf Deutsch.`;

    const userPrompt = `Erstelle ein exzellentes, strukturiertes Tages-Briefing für mich.
Meine Details:
Name: ${personalAIData.name || 'Unbekannt'}
Job: ${personalAIData.job || 'Nicht angegeben'}
Hobbys: ${personalAIData.hobbies || 'Nicht angegeben'}

DATEN FÜR HEUTE:
- TERMINE: ${appointmentsText}
- ÜBERFÄLLIG (WICHTIG): ${overdueText}
- OFFENE AUFGABEN: ${todoText}
- RÜCKBLICK GESTERN: ${historyText}
- WETTER: ${weatherInfo}
- NACHRICHTEN: ${newsInfo}

ANWEISUNG FÜR DIE STRUKTUR (HTML):
1. **Begrüßung**: Nenne meinen Namen und gib einen kurzen (Jarvis-ähnlichen) Kommentar zur Tageszeit.
2. **Wetter-Sektion**: Ein schöner kleiner Block mit Kleidungstipp.
3. **Rückblick & Status**: Kurz erwähnen was gestern war (falls relevant) und Fokus auf ÜBERFÄLLIGES legen (höflich mahnen).
4. **Agenda Heute**: Liste meine heutigen Termine klar auf. Wenn keine da sind, schlage vor, den Tag zur Planung oder Erholung zu nutzen.
5. **Aufgaben-Fokus**: Nenne 1-2 wichtigste Aufgaben, auf die ich mich konzentrieren sollte.
5. **Weltnachrichten**: 1-2 Sätze zu den aktuellen Schlagzeilen.
6. **Abschluss**: Ein inspirierendes Zitat oder ein Butler-Spruch wie "Womit soll ich beginnen, Sir/Madame?".

Nutze <div style="...">, <strong>, <br> und Emojis für ein Premium-Layout.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        return await callAI(messages);
    } catch (err) {
        // Fallback to local briefing if API fails
        return generateDailyBriefing() + `<br><small style="color:#ef4444;">(API Fehler: ${err.message})</small><br><small style="color:gray;">(Lokales Backup-Briefing)</small>`;
    }
}

// Helper: Fetch Real Weather (OpenMeteo)
async function fetchRealWeather() {
    // Default to Berlin if no pos
    let lat = 52.52;
    let lng = 13.41;

    if (typeof userPos !== 'undefined' && userPos && userPos.lat) {
        lat = userPos.lat;
        lng = userPos.lng;
    }

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.current_weather) {
            const temp = data.current_weather.temperature;
            const code = data.current_weather.weathercode;
            const wind = data.current_weather.windspeed;

            // Interpret code (Simplified)
            let condition = "Unbekannt";
            if (code === 0) condition = "Klarer Himmel";
            else if (code <= 3) condition = "Leicht bewölkt";
            else if (code <= 48) condition = "Nebel";
            else if (code <= 67) condition = "Regen";
            else if (code <= 77) condition = "Schnee";
            else if (code <= 82) condition = "Regenschauer";
            else condition = "Gewitter/Sturm";

            return `${condition}, ${temp}°C, Wind: ${wind} km/h.`;
        }
    } catch (e) {
        console.warn("Weather Fetch Failed", e);
    }
    return null;
}

// Helper: Fetch Real News (Tagesschau API)
async function fetchRealNews() {
    try {
        // Tagesschau Homepage API (CORS friendly often, or at least public)
        // If this fails due to CORS, we might need a fallback or different API.
        // Trying direct JSON fetch.
        const res = await fetch('https://www.tagesschau.de/api2u/news');
        const data = await res.json();

        if (data.news && data.news.length > 0) {
            // Take top 3 headlines
            const headlines = data.news.slice(0, 3).map(n => `- ${n.title}`).join('\n');
            return headlines;
        }
    } catch (e) {
        console.warn("News Fetch Failed", e);
        // Fallback: Use Sim data based on user being online
        return "Konnte keine Live-Nachrichten laden (Netzwerk/CORS).";
    }
    return null;
}

// Generate Daily Briefing
function generateDailyBriefing() {
    const now = new Date();
    const hour = now.getHours();
    const dayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][now.getDay()];

    let greeting = 'Guten Morgen';
    if (hour >= 12 && hour < 18) greeting = 'Guten Tag';
    else if (hour >= 18) greeting = 'Guten Abend';

    let briefing = `<div style="margin-bottom: 15px;"><strong>${greeting}, ${personalAIData.name || 'Freund'}!</strong></div>`;
    briefing += `<div style="margin-bottom: 10px;">Heute ist ${dayName}, der ${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}</div>`;

    // Weather
    if (personalAIData.features.weather) {
        briefing += `<div style="margin: 15px 0; padding: 10px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 4px;">`;
        briefing += `<strong>🌤️ Wetter:</strong> Heute wird es voraussichtlich sonnig mit Temperaturen um 18°C. Perfektes Wetter für einen Spaziergang!`;
        briefing += `</div>`;
    }

    // Tasks/Appointments
    if (typeof tasks !== 'undefined' && tasks.length > 0) {
        const todayTasks = tasks.filter(t => !t.done && !t.archived);
        if (todayTasks.length > 0) {
            briefing += `<div style="margin: 15px 0; padding: 10px; background: rgba(168, 85, 247, 0.1); border-left: 3px solid #a855f7; border-radius: 4px;">`;
            briefing += `<strong>📋 Deine Aufgaben:</strong> Du hast ${todayTasks.length} offene Aufgabe${todayTasks.length > 1 ? 'n' : ''}.`;
            briefing += `</div>`;
        }
    }

    // News
    if (personalAIData.features.news) {
        briefing += `<div style="margin: 15px 0; padding: 10px; background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; border-radius: 4px;">`;
        briefing += `<strong>📰 Nachrichten:</strong> Bleibe informiert über aktuelle Ereignisse. Öffne deine Nachrichten-App für Details.`;
        briefing += `</div>`;
    }

    // Personal motivation
    if (personalAIData.hobbies) {
        briefing += `<div style="margin: 15px 0; padding: 10px; background: rgba(251, 146, 60, 0.1); border-left: 3px solid #fb923c; border-radius: 4px;">`;
        briefing += `<strong>💡 Tipp:</strong> Vergiss nicht, Zeit für deine Hobbys zu nehmen: ${personalAIData.hobbies}`;
        briefing += `</div>`;
    }

    return briefing;
}

// Check for Morning Briefing
function checkMorningBriefing() {
    if (!personalAIData.name || !personalAIData.features.reminders) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const lastBriefing = localStorage.getItem('taskforce_last_briefing');
    const today = now.toDateString();

    if (currentTime === personalAIData.morningTime && lastBriefing !== today) {
        showAIBriefing();
        localStorage.setItem('taskforce_last_briefing', today);
    }
}

// Show Morning Briefing
async function showMorningBriefing() {
    showAIBriefing();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPersonalAI);
} else {
    initPersonalAI();
}
