// ===== Interactive AI Assistant - Always Available =====

let isAIListening = false;
let aiRecognition = null;
let aiSpeechSynthesis = window.speechSynthesis;

// Initialize Interactive AI
function initInteractiveAI() {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        aiRecognition = new SpeechRecognition();
        aiRecognition.continuous = true;
        aiRecognition.interimResults = true;
        aiRecognition.lang = 'de-DE';

        aiRecognition.onresult = handleAIVoiceInput;
        aiRecognition.onerror = (e) => console.log('AI Speech Error:', e);
    }

    // Listen for wake word "Hey KI" or "Hallo KI"
    setupWakeWordDetection();

    // Start Proactive AI Advisor
    setTimeout(initAIAdvisor, 3000);
}

// Proactive AI Advisor Questions Pool
const advisorPrompts = [
    {
        type: 'business',
        question: 'Guten Tag! Darf ich Ihnen helfen, die Agenda für Ihr nächstes Team-Meeting vorzubereiten?',
        actions: [
            { label: 'Ja, bitte', icon: 'file-text', cmd: 'agenda' },
            { label: 'Später, danke', icon: 'clock', cmd: 'skip' }
        ]
    },
    {
        type: 'private',
        question: 'Es ist Zeit für eine kurze Erholungspause. Soll ich Ihren Einkauf für das Wochenende schon einmal vorplanen?',
        actions: [
            { label: 'Einkauf öffnen', icon: 'shopping-cart', cmd: 'shopping' },
            { label: 'Nicht jetzt', icon: 'x', cmd: 'skip' }
        ]
    },
    {
        type: 'business',
        question: 'Ihre To-Do Liste enthält heute viele Termine. Soll ich die geschäftlichen Prioritäten für Sie ordnen?',
        actions: [
            { label: 'Priorisieren', icon: 'trending-up', cmd: 'prioritize' },
            { label: 'Ich habe es im Griff', icon: 'user', cmd: 'skip' }
        ]
    },
    {
        type: 'private',
        question: 'Haben Sie heute schon ausreichend Wasser getrunken? Ein kleiner Frische-Kick wirkt Wunder!',
        actions: [
            { label: 'Erinnere mich', icon: 'bell', cmd: 'water_reminder' },
            { label: 'Danke, erledigt', icon: 'check', cmd: 'skip' }
        ]
    }
];

function initAIAdvisor() {
    const section = document.getElementById('aiAdvisorSection');
    if (!section) return;

    // Show advisor every few minutes if user is active
    showRandomAdvisorPrompt();
    setInterval(showRandomAdvisorPrompt, 300000); // Every 5 minutes
}

async function showRandomAdvisorPrompt() {
    const section = document.getElementById('aiAdvisorSection');
    if (!section) return;

    const questionEl = document.getElementById('aiAdvisorQuestion');
    const actionsEl = document.getElementById('aiAdvisorActions');

    // If ChatGPT is available, try to get a smart prompt
    if (typeof callChatGPT === 'function' && typeof appSettings !== 'undefined' && appSettings.openaiApiKey) {
        if (questionEl) questionEl.innerHTML = '<span class="loading-dots">Advisor denkt nach...</span>';

        try {
            const openTasks = (typeof tasks !== 'undefined') ? tasks.filter(t => !t.done && !t.archived).map(t => t.keyword).join(', ') : '';
            const systemPrompt = `Du bist der "Personal Advisor" in einer Produktivitäts-App. 
Erstelle EINE kurze, proaktive Frage oder einen Vorschlag (max 15 Wörter) für den Nutzer basierend auf seinen Daten.
Nutze Name: ${personalAIData.name || 'Nutzer'}, Job: ${personalAIData.job || 'Unbekannt'}, Hobbys: ${personalAIData.hobbies || 'Unbekannt'}.
Aktuelle Aufgaben: ${openTasks}.
Antworte NUR mit der Frage/dem Vorschlag.`;

            const advice = await callChatGPT([{ role: 'system', content: systemPrompt }], { max_tokens: 50 });
            if (questionEl) questionEl.textContent = advice;

            if (actionsEl) {
                actionsEl.innerHTML = `
                    <button class="btn-ai-action primary" onclick="openPersonalAdvisorChat('${advice.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
                        <i data-lucide="message-circle"></i> <span>Antworten</span>
                    </button>
                    <button class="btn-ai-action" onclick="document.getElementById('aiAdvisorSection').classList.add('hidden')">
                        <i data-lucide="x"></i> <span>Ignorieren</span>
                    </button>
                `;
            }

            section.classList.remove('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();

            // Proactive voice if enabled
            if (personalAIData.features.reminders && typeof speakAI === 'function') {
                speakAI(advice);
            }
            return;
        } catch (err) {
            console.warn('Dashboard Advisor AI error, falling back to static:', err);
        }
    }

    // Fallback to static prompts
    const randomIndex = Math.floor(Math.random() * advisorPrompts.length);
    const prompt = advisorPrompts[randomIndex];

    if (questionEl) questionEl.textContent = prompt.question;
    if (actionsEl) {
        actionsEl.innerHTML = '';
        prompt.actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'btn-ai-action' + (action.cmd !== 'skip' ? ' primary' : '');
            btn.innerHTML = `<i data-lucide="${action.icon}"></i> <span>${action.label}</span>`;
            btn.onclick = () => handleAdvisorAction(action.cmd, prompt);
            actionsEl.appendChild(btn);
        });
    }

    section.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.openPersonalAdvisorChat = function (initialText) {
    const personalAIModal = document.getElementById('personalAIModal');
    if (personalAIModal) {
        personalAIModal.classList.remove('hidden');
        const chatInput = document.getElementById('aiChatInput');
        if (chatInput) {
            chatInput.value = initialText ? `Zu deinem Vorschlag "${initialText}": ` : '';
            chatInput.focus();
        }
    }
};

function handleAdvisorAction(cmd, prompt) {
    const section = document.getElementById('aiAdvisorSection');

    switch (cmd) {
        case 'music_on':
        case 'music_hits':
            speakAI('Sicher! Ich starte deine Musik.');
            window.open('https://music.youtube.com', '_blank');
            break;
        case 'music_search':
            if (typeof openAISearch === 'function') openAISearch('gute musik inspiration');
            break;
        case 'agenda':
            speakAI('Gute Idee. Ich öffne die Notizen für deine Agenda.');
            if (typeof handleAddTodo === 'function') {
                const keywordInput = document.getElementById('keywordInput');
                if (keywordInput) keywordInput.value = 'Agenda für heute: ';
                handleAddTodo();
            }
            break;
        case 'shopping':
            if (typeof handleAddTodo === 'function') {
                const keywordInput = document.getElementById('keywordInput');
                if (keywordInput) keywordInput.value = 'Einkaufsliste: ';
                handleAddTodo();
            }
            break;
        case 'prioritize':
            speakAI('Ich analysiere deine Aufgaben und schiebe die wichtigsten nach oben.');
            break;
        case 'water_reminder':
            speakAI('Alles klar, ich erinnere dich in einer Stunde.');
            break;
        case 'skip':
            // Just close
            break;
    }

    section.classList.add('hidden');
}

// Toggle AI Listening (Exposed for other triggers like NavBar)
function toggleAIListening() {
    if (isAIListening) {
        stopAIListening();
        // Remove listening class from nav mic manually if needed, or rely on UI updates
        const micIcon = document.getElementById('voiceMicIcon');
        if (micIcon) micIcon.style.color = 'inherit';
    } else {
        startAIListening();
        speakAI('Ja, ich höre. Wie kann ich dir helfen?');
        const micIcon = document.getElementById('voiceMicIcon');
        if (micIcon) micIcon.style.color = 'var(--primary)';
    }
}

// Start AI Listening
function startAIListening() {
    if (aiRecognition) {
        isAIListening = true;
        aiRecognition.start();
    }
}

// Stop AI Listening
function stopAIListening() {
    if (aiRecognition) {
        isAIListening = false;
        aiRecognition.stop();
    }
}

// Handle AI Voice Input
function handleAIVoiceInput(event) {
    const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

    if (event.results[0].isFinal) {
        processAICommand(transcript.toLowerCase());
    }
}

// Process AI Commands
async function processAICommand(command) {
    console.log('AI Command:', command);

    // 1. Check for specific hardcoded triggers that don't need AI
    if (command.includes('musik an') || command.includes('musik spiel')) {
        handleMusicCommand('an');
        return;
    }

    if (command.includes('musik aus') || command.includes('stop musik')) {
        handleMusicCommand('aus');
        return;
    }
    else if (command.includes('datum') || command.includes('welcher tag')) {
        tellDate();
    }
    else if (command.includes('nachrichten') || command.includes('news')) {
        tellNews();
    }
    else if (command.includes('alles vorlesen') || command.includes('lies alles vor') || command.includes('morgen briefing') || command.includes('tageszusammenfassung')) {
        readMorningBriefing();
    }
    else if (command.includes('analyse') || command.includes('analysieren') || command.includes('statusbericht')) {
        if (typeof app !== 'undefined' && app.ai && app.ai.startDeepAnalysis) {
            app.ai.startDeepAnalysis();
        } else {
            speakAI('Die Analyse-Funktion ist momentan nicht verfügbar.');
        }
    }
    else if (command.includes('hilfe') || command.includes('was kannst du')) {
        tellCapabilities();
    }
    else {
        // 2. Use Intelligent Butler (Gemini / OpenAI) for everything else
        if (typeof callAI === 'function') {
            try {
                const context = (typeof app !== 'undefined' && app.ai) ? app.ai.getSystemContext() : {};

                // Determine Provider Name for display/prompt
                const providerName = (typeof app !== 'undefined' && app.state && app.state.aiConfig && app.state.aiConfig.provider === 'openai') ? 'OpenAI GPT' : 'Google Gemini';

                const systemPrompt = `Du bist der "TaskForce Butler". 
            Antworte auf den Sprachbefehl des Nutzers: "${command}".
            
            Aktueller App-Zustand: ${JSON.stringify(context)}.
            
            Antworte kurz (max 3 Sätze), extrem hilfreich und im höflichen Butler-Stil.
            Du nutzt ${providerName}.
            Gib NUR den Antworttext zurück.`;

                const response = await callAI([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: command }
                ], { temperature: 0.3, max_tokens: 150 });

                if (response) {
                    speakAI(response);

                    // Auto-open chat if request seems complex
                    if (command.length > 20 || command.includes('details') || command.includes('plan')) {
                        if (typeof openPersonalAdvisorChat === 'function') openPersonalAdvisorChat(command);
                    }
                    return;
                }
            } catch (err) {
                console.warn('Voice AI API Error:', err);
                speakAI("Verzeihung, ich konnte keine Verbindung zu meinem Gehirn herstellen. Bitte prüfen Sie den API-Schlüssel.");
            }
        }

        // Final fallback
        speakAI('Ich habe verstanden: ' + command + '. Wie kann ich dir behilflich sein?');
    }
}


// Read Current Content
function readCurrentContent() {
    const tasks = document.querySelectorAll('.task-card:not(.done)');
    if (tasks.length === 0) {
        speakAI('Du hast keine offenen Aufgaben.');
        return;
    }

    let text = `Du hast ${tasks.length} offene Aufgabe${tasks.length > 1 ? 'n' : ''}. `;
    tasks.forEach((task, index) => {
        const title = task.querySelector('.task-title')?.textContent || '';
        text += `${index + 1}. ${title}. `;
    });

    speakAI(text);
}

// Handle Music Commands
function handleMusicCommand(command) {
    if (command.includes('an') || command.includes('spiel') || command.includes('start')) {
        speakAI('Ich öffne YouTube Music für dich.');
        setTimeout(() => {
            window.open('https://music.youtube.com', '_blank');
        }, 2000);
    } else if (command.includes('aus') || command.includes('stop')) {
        speakAI('Okay, Musik wird gestoppt.');
    } else {
        speakAI('Möchtest du Musik abspielen? Sage zum Beispiel: Musik an.');
    }
}

// Tell Weather
function tellWeather() {
    speakAI('Heute wird es voraussichtlich sonnig mit Temperaturen um 18 Grad. Perfektes Wetter!');
}

// Tell Tasks
function tellTasks() {
    const tasks = document.querySelectorAll('.task-card:not(.done)');
    if (tasks.length === 0) {
        speakAI('Du hast keine offenen Aufgaben. Gut gemacht!');
    } else {
        speakAI(`Du hast ${tasks.length} offene Aufgabe${tasks.length > 1 ? 'n' : ''}.`);
        readCurrentContent();
    }
}

// Tell Time
function tellTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    speakAI(`Es ist ${hours} Uhr ${minutes}.`);
}

// Tell Date
function tellDate() {
    const now = new Date();
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    speakAI(`Heute ist ${dayName}, der ${day}. ${month} ${year}.`);
}

// Tell News
function tellNews() {
    speakAI('Hier sind die wichtigsten Nachrichten: Die Welt entwickelt sich weiter. Bleibe informiert über aktuelle Ereignisse in deiner Nachrichten-App.');
}

// Read Full Morning Briefing (MODAL + SPEECH)
function readMorningBriefing() {
    const now = new Date();
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    // 1. Greeting & Time
    const hour = now.getHours();
    const timeStr = `${hour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = `${days[now.getDay()]}, der ${now.getDate()}. ${months[now.getMonth()]}`;
    const name = (typeof app !== 'undefined' && app.state && app.state.user) ? app.state.user.name : 'Nutzer';

    // Data Source
    const tasks = (typeof app !== 'undefined' && app.state && app.state.tasks) ? app.state.tasks : [];
    const events = (typeof app !== 'undefined' && app.state && app.state.events) ? app.state.events : [];
    const expenses = (typeof app !== 'undefined' && app.state && app.state.expenses) ? app.state.expenses : [];
    const habits = (typeof app !== 'undefined' && app.state && app.state.habits) ? app.state.habits : [];
    const healthData = (typeof app !== 'undefined' && app.state && app.state.healthData) ? app.state.healthData : [];
    const todayISO = now.toISOString().split('T')[0];

    // Health calculations
    const waterToday = healthData
        .filter(d => d.type === 'water' && d.date === todayISO)
        .reduce((sum, d) => sum + d.value, 0);
    const waterGoal = (typeof app !== 'undefined' && app.state && app.state.hydrationGoal) ? app.state.hydrationGoal : 2.5;

    // Filter Categories
    const overdue = tasks.filter(t => !t.done && t.deadline && t.deadline < todayISO);
    // Tasks: Not Shopping, Household, Menu, Note, and valid date/deadline
    const todaysTasks = tasks.filter(t => !t.done && !t.urgent && t.category !== 'shopping' && t.category !== 'household' && t.category !== 'menu' && t.category !== 'note' && (!t.deadline || t.deadline === todayISO));
    const shopping = tasks.filter(t => !t.done && t.category === 'shopping');
    const household = tasks.filter(t => !t.done && t.category === 'household');
    let menu = tasks.filter(t => !t.done && t.category === 'menu');

    // Check app.state.meals (Weekly Plan Module)
    if (app.state.meals && Array.isArray(app.state.meals)) {
        const dayIdx = (now.getDay() + 6) % 7; // Mon=0, Sun=6
        if (app.state.meals[dayIdx]) {
            menu.push({ title: app.state.meals[dayIdx], category: 'menu' });
        }
    }
    const notes = tasks.filter(t => !t.done && t.category === 'note');
    const todaysEvents = events.filter(e => e.start && e.start.startsWith(todayISO));




    // Aktuellen Modus ermitteln
    const currentMode = (typeof app !== 'undefined' && app.state && app.state.ui && app.state.ui.dashboardMode)
        ? app.state.ui.dashboardMode
        : 'private';
    const modeText = currentMode === 'business' ? '💼 Business Mode' : '🏠 Private Mode';
    const modeColor = currentMode === 'business' ? '#d4af37' : '#10b981';

    // HTML Construction
    let htmlContent = `
        <div style="text-align:center; padding-bottom:20px; margin-bottom:20px; border-bottom:2px solid rgba(255,255,255,0.15);">
            <div style="font-size:3rem; margin-bottom:10px;">☕</div>
            <h2 style="margin:0; font-size:1.8rem; font-weight:700;">Daily Briefing</h2>
            <div style="font-size:2.5rem; font-weight:700; color:var(--primary); margin:15px 0;">${timeStr}</div>
            <div style="color:var(--text-muted); font-size:1rem; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">${dateStr}</div>
            <div style="margin-top:12px; padding:8px 16px; background:rgba(255,255,255,0.05); border-radius:20px; display:inline-block; font-size:0.9rem; font-weight:600; color:${modeColor}; border:2px solid ${modeColor};">${modeText}</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:16px; padding:0 8px 20px 0;">
    `;

    // Visual: Events
    if (todaysEvents.length > 0) {
        htmlContent += `<div style="background:rgba(59, 130, 246, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(59, 130, 246, 0.3); box-shadow:0 4px 12px rgba(59, 130, 246, 0.1);">
            <h4 style="margin:0 0 12px 0; color:#60a5fa; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="calendar" size="18"></i> Termine Heute</h4>
            <ul style="margin:0; padding-left:0; list-style:none;">${todaysEvents.map(e => `<li style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding:8px; background:rgba(59, 130, 246, 0.08); border-radius:8px; font-size:1rem;"><span style="font-weight:500;">${e.title}</span> <span style="font-weight:700; color:#60a5fa;">${e.time}</span></li>`).join('')}</ul>
        </div>`;
    }

    // Visual: Overdue
    if (overdue.length > 0) {
        htmlContent += `<div style="background:rgba(239, 68, 68, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(239, 68, 68, 0.4); box-shadow:0 4px 12px rgba(239, 68, 68, 0.1);">
            <h4 style="margin:0 0 12px 0; color:#f87171; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="alert-circle" size="18"></i> Überfällig</h4>
            <ul style="margin:0; padding-left:0; list-style:none;">${overdue.map(t => `<li style="font-size:1rem; color:#fca5a5; margin-bottom:6px; padding:6px; background:rgba(239, 68, 68, 0.08); border-radius:6px; font-weight:500;">${t.title}</li>`).join('')}</ul>
        </div>`;
    }

    // Visual: To-Do (mit Buttons wie Einkaufsliste)
    if (todaysTasks.length > 0) {
        htmlContent += `<div style="background:rgba(16, 185, 129, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(16, 185, 129, 0.3); box-shadow:0 4px 12px rgba(16, 185, 129, 0.1);">
            <h4 style="margin:0 0 12px 0; color:#34d399; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="check-square" size="18"></i> To-Do Liste</h4>
            <ul style="margin:0; padding-left:0; list-style:none;">${todaysTasks.slice(0, 5).map(t => `
                <li style="font-size:1rem; display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; padding:8px; background:rgba(16, 185, 129, 0.08); border-radius:8px; font-weight:500;">
                    <span>• ${t.title}</span>
                    <div style="display:flex; gap:6px;">
                        <button onclick="app.tasks.toggleDone(${t.id}); setTimeout(() => showBriefing(), 100);" style="background:rgba(16, 185, 129, 0.3); border:1px solid rgba(16, 185, 129, 0.5); color:#34d399; padding:4px 8px; border-radius:6px; font-size:0.75rem; cursor:pointer; font-weight:600;">✓ Erledigt</button>
                    </div>
                </li>
            `).join('')}</ul>
        </div>`;
    }

    // Visual: Household (IMMER anzeigen)
    htmlContent += `<div style="background:rgba(236, 72, 153, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(236, 72, 153, 0.3); box-shadow:0 4px 12px rgba(236, 72, 153, 0.1);">
        <h4 style="margin:0 0 12px 0; color:#f472b6; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="home" size="18"></i> Haushalt</h4>
        ${household.length > 0
            ? `<ul style="margin:0; padding-left:0; list-style:none;">${household.map(t => `<li style="font-size:1rem; margin-bottom:6px; padding:6px; background:rgba(236, 72, 153, 0.08); border-radius:6px; font-weight:500;">• ${t.title}</li>`).join('')}</ul>`
            : `<div style="text-align:center; padding:20px; color:rgba(244, 114, 182, 0.5); font-style:italic;">Keine Haushaltsaufgaben</div>`
        }
    </div>`;

    // Visual: Menu (IMMER anzeigen)
    htmlContent += `<div style="background:rgba(217, 70, 239, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(217, 70, 239, 0.3); box-shadow:0 4px 12px rgba(217, 70, 239, 0.1);">
        <h4 style="margin:0 0 12px 0; color:#e879f9; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="utensils" size="18"></i> Wochenmenü</h4>
        ${menu.length > 0
            ? `<ul style="margin:0; padding-left:0; list-style:none;">${menu.map(t => `<li style="font-size:1rem; margin-bottom:6px; padding:6px; background:rgba(217, 70, 239, 0.08); border-radius:6px; font-weight:500;">• ${t.title}</li>`).join('')}</ul>`
            : `<div style="text-align:center; padding:20px; color:rgba(232, 121, 249, 0.5); font-style:italic;">Kein Menü geplant</div>`
        }
    </div>`;

    // Visual: Shopping
    if (shopping.length > 0) {
        htmlContent += `<div style="background:rgba(245, 158, 11, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(245, 158, 11, 0.3); box-shadow:0 4px 12px rgba(245, 158, 11, 0.1);">
            <h4 style="margin:0 0 12px 0; color:#fbbf24; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="shopping-cart" size="18"></i> Einkauf</h4>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">${shopping.map(t => `<span style="background:rgba(245, 158, 11, 0.2); padding:8px 12px; border-radius:10px; font-size:1rem; color:#fbbf24; font-weight:500;">${t.title}</span>`).join('')}</div>
        </div>`;
    }

    // Visual: Notes
    if (notes.length > 0) {
        htmlContent += `<div style="background:rgba(148, 163, 184, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(148, 163, 184, 0.3); box-shadow:0 4px 12px rgba(148, 163, 184, 0.1);">
            <h4 style="margin:0 0 12px 0; color:#cbd5e1; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="sticky-note" size="18"></i> Notizen</h4>
            <ul style="margin:0; padding-left:0; list-style:none;">${notes.map(t => `<li style="font-size:1rem; font-style:italic; margin-bottom:6px; padding:6px; background:rgba(148, 163, 184, 0.08); border-radius:6px; font-weight:500;">"${t.title}"</li>`).join('')}</ul>
        </div>`;
    }



    // Visual: Routinen (Habits)
    if (habits.length > 0) {
        htmlContent += `<div style="background:rgba(139, 92, 246, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(139, 92, 246, 0.3); box-shadow:0 4px 12px rgba(139, 92, 246, 0.1);">
            <h4 style="margin:0 0 12px 0; color:#a78bfa; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="flame" size="18"></i> Routinen</h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${habits.map(h => `<div style="display:flex; align-items:center; justify-content:space-between; font-size:1rem; padding:8px; background:rgba(139, 92, 246, 0.08); border-radius:8px; font-weight:500;"><span>${h.name}</span><span style="font-size:1.2rem;">${(h.history && h.history.includes(todayISO)) ? '✅' : '⏳'}</span></div>`).join('')}
            </div>
        </div>`;
    }




    // Visual: Vitalität (Health Data) - MIT WASSERTROPFEN
    if (healthData.length > 0 || waterToday > 0) {
        htmlContent += `<div style="background:rgba(59, 130, 246, 0.12); padding:16px; border-radius:14px; border:2px solid rgba(59, 130, 246, 0.3); box-shadow:0 4px 12px rgba(59, 130, 246, 0.1);">
            <h4 style="margin:0 0 12px 0; color:#60a5fa; font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;">💧 Vitalität</h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; align-items:center; justify-content:space-between; font-size:1rem; padding:8px; background:rgba(59, 130, 246, 0.08); border-radius:8px; font-weight:500;">
                    <span style="display:flex; align-items:center; gap:8px;">💧 Wasser</span>
                    <span style="font-weight:700; color:#60a5fa;">${waterToday.toFixed(2)}L / ${waterGoal}L</span>
                </div>
            </div>
        </div>`;
    }



    // Visual: Finances
    const currentMonth = new Date().toISOString().slice(0, 7);
    const financeTotal = expenses.filter(e => e.date && e.date.startsWith(currentMonth)).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    htmlContent += `<div style="background:rgba(255, 255, 255, 0.08); padding:16px; border-radius:14px; border:2px solid rgba(255, 255, 255, 0.15); box-shadow:0 4px 12px rgba(0, 0, 0, 0.2);">
        <h4 style="margin:0 0 12px 0; color:var(--text-secondary); font-size:1.1rem; font-weight:700; display:flex; align-items:center; gap:8px;"><i data-lucide="wallet" size="18"></i> Finanzen (Monat)</h4>
        <div style="font-size:1.5rem; font-weight:700; color:#ef4444; padding:8px; background:rgba(239, 68, 68, 0.1); border-radius:8px; text-align:center;">-${financeTotal.toFixed(2)} €</div>
    </div>`;

    // Abschluss-Nachricht
    htmlContent += `
        </div>
        <div style="text-align:center; padding:20px 20px 80px 20px; margin-top:20px; border-top:2px solid rgba(255,255,255,0.15);">
            <div style="font-size:1.3rem; font-weight:700; color:var(--success); margin-bottom:8px;">✓ Briefing abgeschlossen</div>
            <div style="font-size:1rem; color:var(--text-muted);">Danke, verstanden!</div>
        </div>
        `;

    // Show Modal
    if (typeof app !== 'undefined' && app.modals) {
        app.modals.open('aiBriefing', { html: htmlContent });
    }

    // --- AUTO-SPEAK FULL BRIEFING ---
    let speechText = `Guten Morgen ${name}. Es ist ${timeStr}.`;

    // 1. Termine
    if (todaysEvents.length > 0) {
        speechText += `Du hast heute ${todaysEvents.length} Termine: `;
        todaysEvents.forEach(e => speechText += `${e.title}, um ${e.time}.`); // Improved Reading Flow
    } else {
        speechText += `Heute stehen keine Termine an. `;
    }

    // 2. Überfällig
    if (overdue.length > 0) {
        speechText += `Achtung, ${overdue.length} überfällige Aufgaben: `;
        overdue.slice(0, 3).forEach(t => speechText += `${t.title}.`);
    }

    // 3. To-Do
    if (todaysTasks.length > 0) {
        speechText += `Deine To - Dos: `;
        todaysTasks.slice(0, 3).forEach(t => speechText += `${t.title}.`);
        if (todaysTasks.length > 3) speechText += `und ${todaysTasks.length - 3} weitere. `;
    }

    // 4. Haushalt
    if (household.length > 0) {
        speechText += `Im Haushalt zu tun: `;
        household.forEach(t => speechText += `${t.title}.`);
    }

    // 5. Menü
    if (menu.length > 0) {
        speechText += `Wochenmenü: `;
        menu.forEach(t => speechText += `${t.title}.`);
    }

    // 6. Einkauf
    if (shopping.length > 0) {
        speechText += `Einkaufsliste: `;
        shopping.forEach(t => speechText += `${t.title}.`);
    }

    // 7. Notizen
    if (notes.length > 0) {
        speechText += `Notizen: `;
        notes.forEach(t => speechText += `${t.title}.`);
    }


    // 8. Routinen (Habits)
    if (habits.length > 0) {
        const doneHabits = habits.filter(h => h.history && h.history.includes(todayISO)).length;
        speechText += `Routinen: ${doneHabits} von ${habits.length} Gewohnheiten erledigt. `;
    }


    // 9. Vitalität (Gesundheit)
    if (waterToday > 0) {
        speechText += `Vitalität: Du hast heute ${waterToday.toFixed(1)} Liter Wasser getrunken. `;
        if (waterToday < waterGoal) {
            speechText += `Noch ${(waterGoal - waterToday).toFixed(1)} Liter bis zum Tagesziel. `;
        }
    }


    // 9. Finanzen
    if (financeTotal > 0) {
        speechText += `Finanzen: Ausgaben diesen Monat bisher ${Math.round(financeTotal)} Euro. `;
    }

    speechText += "Danke, verstanden!";

    if (typeof speakAI === 'function') {
        speakAI(speechText);
    }
}

// Tell Capabilities
function tellCapabilities() {
    const capabilities = `
        Ich kann dir helfen mit:
        Termine vorlesen,
        Musik abspielen,
            Wetter ansagen,
                Uhrzeit und Datum nennen,
                    Nachrichten vorlesen,
                        und vieles mehr.
        Frag mich einfach!
    `;
    speakAI(capabilities);
}

// Speak AI Response
function speakAI(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        aiSpeechSynthesis.cancel();

        // Ensure voices are loaded
        let voices = aiSpeechSynthesis.getVoices();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';

        // Versuche eine bessere deutsche Stimme zu finden (Google, Microsoft Natural, etc.)
        const germanVoice = voices.find(v => v.name.includes('Google Deutsch')) ||
            voices.find(v => v.name.includes('Natural') && v.lang.includes('de')) ||
            voices.find(v => v.lang === 'de-DE' && !v.name.includes('Microsoft Stefan')); // Stefan ist oft sehr robotisch

        if (germanVoice) {
            utterance.voice = germanVoice;
        }

        // Optimierung für Verständlichkeit
        utterance.rate = 0.95; // Leicht langsamer für bessere Verständlichkeit
        utterance.pitch = 1.0;
        utterance.volume = 1;

        aiSpeechSynthesis.speak(utterance);
    }
}

// Ensure voices are loaded correctly (Chrome fix)
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
    };
}

// Setup Wake Word Detection
function setupWakeWordDetection() {
    if (!aiRecognition) return;

    const customWakeWord = (typeof appSettings !== 'undefined' && appSettings.wakeWordName) ? appSettings.wakeWordName.toLowerCase() : 'taskforce';
    const wakeWords = ['hey ki', 'hallo ki', 'hey assistant', 'hallo assistent', customWakeWord, `hey ${customWakeWord} `, `hallo ${customWakeWord} `];

    aiRecognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('')
            .toLowerCase();

        // Check for wake word
        const hasWakeWord = wakeWords.some(word => transcript.includes(word));

        if (hasWakeWord && !isAIListening) {
            toggleAIListening();
        } else if (event.results[0].isFinal && isAIListening) {
            processAICommand(transcript);
        }
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractiveAI);
} else {
    initInteractiveAI();
}

// Export functions for global access
window.speakAI = speakAI;
window.toggleAIListening = toggleAIListening;
window.readMorningBriefing = readMorningBriefing;
