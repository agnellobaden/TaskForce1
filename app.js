/**
 * MoltBot Organizer - Core Application Logic
 * Featuring: Firebase Cloud Sync, Modern Calendar, and Premium UI
 */

const app = {
    // --- STATE ---
    state: {
        user: {
            name: localStorage.getItem('moltbot_username') || 'User',
            address: localStorage.getItem('moltbot_user_address') || '',
            phone: localStorage.getItem('moltbot_user_phone') || '',
            email: localStorage.getItem('moltbot_user_email') || '',
            birthday: localStorage.getItem('moltbot_user_birthday') || '',
            avatar: localStorage.getItem('moltbot_user_avatar') || '',
            teamName: localStorage.getItem('moltbot_team') || '',
            teamPin: localStorage.getItem('moltbot_pin') || '',
        },
        events: [],
        view: 'dashboard',
        calendarView: 'month',
        currentDate: new Date(),
        todos: [],
        todoFilter: 'all',
        todoCategories: JSON.parse(localStorage.getItem('moltbot_todo_categories')) || ['🛒 Einkauf', '💼 Arbeit', '🏠 Zuhause', '👤 Privat'],
        contacts: JSON.parse(localStorage.getItem('moltbot_contacts')) || [],
        alarms: JSON.parse(localStorage.getItem('moltbot_alarms')) || [],
        nightModeStart: localStorage.getItem('moltbot_night_mode_start') || '01:00',
        nightModeColor: localStorage.getItem('moltbot_night_color') || '#ef4444',
        nightModeBrightness: localStorage.getItem('moltbot_night_brightness') || '1',
        isNightClockFullscreen: false,
        wakeLock: null,
        editingEventId: null,
        editingContactId: null,
        finance: JSON.parse(localStorage.getItem('moltbot_finance')) || [],
        monthlyBudget: parseFloat(localStorage.getItem('moltbot_budget')) || 0,
        contactView: localStorage.getItem('moltbot_contact_view') || 'table',
        favsCollapsed: localStorage.getItem('moltbot_favs_collapsed') === 'true',
        theme: localStorage.getItem('moltbot_theme') || 'dark',
        quickActionLeft: localStorage.getItem('moltbot_qa_left') || 'dashboard',
        quickActionRight: localStorage.getItem('moltbot_qa_right') || 'settings',
        quickActionRight: localStorage.getItem('moltbot_qa_right') || 'settings',
        dockStyle: localStorage.getItem('moltbot_dock_style') || 'compact',
        appName: localStorage.getItem('moltbot_app_name') || 'MoltBot',
        customFont: localStorage.getItem('moltbot_custom_font') || 'Outfit',
        customPrimary: localStorage.getItem('moltbot_custom_primary') || '',
        globalSaturation: parseInt(localStorage.getItem('moltbot_global_saturation')) || 100,
        globalContrast: parseInt(localStorage.getItem('moltbot_global_contrast')) || 100,
        globalBrightness: parseInt(localStorage.getItem('moltbot_global_brightness')) || 100
    },

    // --- INITIALIZATION ---
    init() {
        console.log("MoltBot Initializing...");

        // Load local data first
        this.loadLocal();

        // Apply App Name
        this.updateAppName(this.state.appName);

        // Apply Theme
        this.updateTheme(this.state.theme);

        // Apply Visual Customizations
        this.applyVisuals();

        // Initialize Lucide Icons
        if (window.lucide) lucide.createIcons();

        // Setup Event Listeners
        this.setupEventListeners();

        // Initialize Sync
        this.sync.init();

        // Start Clock Interface
        this.alarm.init();

        // Initial Render & Navigation
        this.navigateTo(this.state.view);
    },

    loadLocal() {
        this.state.user.name = localStorage.getItem('moltbot_username') || 'User';
        this.state.user.address = localStorage.getItem('moltbot_user_address') || '';
        this.state.user.phone = localStorage.getItem('moltbot_user_phone') || '';
        this.state.user.email = localStorage.getItem('moltbot_user_email') || '';
        this.state.user.birthday = localStorage.getItem('moltbot_user_birthday') || '';
        this.state.user.avatar = localStorage.getItem('moltbot_user_avatar') || '';
        this.state.view = localStorage.getItem('moltbot_view') || 'dashboard';

        const savedEvents = localStorage.getItem('moltbot_events');
        if (savedEvents) {
            try {
                this.state.events = JSON.parse(savedEvents);
            } catch (e) { console.error("Error loading events", e); }
        }
        const savedTodos = localStorage.getItem('moltbot_todos');
        if (savedTodos) {
            try {
                this.state.todos = JSON.parse(savedTodos);
            } catch (e) { console.error("Error loading todos", e); }
        }

        const savedContacts = localStorage.getItem('moltbot_contacts');
        if (savedContacts) {
            try {
                this.state.contacts = JSON.parse(savedContacts);
            } catch (e) { console.error("Error loading contacts", e); }
        }

        this.state.theme = localStorage.getItem('moltbot_theme') || 'dark';
        this.state.quickActionLeft = localStorage.getItem('moltbot_qa_left') || 'dashboard';
        this.state.quickActionRight = localStorage.getItem('moltbot_qa_right') || 'settings';
        this.state.dockStyle = localStorage.getItem('moltbot_dock_style') || 'compact';
        this.state.dockStyle = localStorage.getItem('moltbot_dock_style') || 'compact';
        this.state.appName = localStorage.getItem('moltbot_app_name') || 'MoltBot';
        this.state.customFont = localStorage.getItem('moltbot_custom_font') || 'Outfit',
            this.state.customPrimary = localStorage.getItem('moltbot_custom_primary') || '',
            this.state.globalSaturation = parseInt(localStorage.getItem('moltbot_global_saturation')) || 100;
        this.state.globalContrast = parseInt(localStorage.getItem('moltbot_global_contrast')) || 100;
        this.state.globalBrightness = parseInt(localStorage.getItem('moltbot_global_brightness')) || 100;
    },

    saveLocal() {
        localStorage.setItem('moltbot_events', JSON.stringify(this.state.events));
        localStorage.setItem('moltbot_todos', JSON.stringify(this.state.todos));
        localStorage.setItem('moltbot_contacts', JSON.stringify(this.state.contacts));
        localStorage.setItem('moltbot_todo_categories', JSON.stringify(this.state.todoCategories));
    },

    updateUserName(name) {
        if (!name) return;
        this.state.user.name = name;
        localStorage.setItem('moltbot_username', name);
        this.render();
    },

    updateUserData(field, value) {
        this.state.user[field] = value;
        localStorage.setItem(`moltbot_user_${field}`, value);
        this.render();
    },

    handleAvatarUpload(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            this.state.user.avatar = base64;
            localStorage.setItem('moltbot_user_avatar', base64);
            this.render();
            if (app.sync && app.sync.push) app.sync.push();
        };
        reader.readAsDataURL(file);
    },

    updateTheme(theme) {
        this.state.theme = theme;
        localStorage.setItem('moltbot_theme', theme);
        document.body.setAttribute('data-theme', theme);

        // Update active state in theme buttons if on settings page
        if (this.state.view === 'settings') {
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
            });
        }
    },

    updateAppName(name) {
        if (!name) return;
        this.state.appName = name;
        localStorage.setItem('moltbot_app_name', name);

        // Update DOM elements
        const logoText = document.querySelector('.logo span');
        if (logoText) logoText.textContent = name;

        const logoIcon = document.querySelector('.logo-icon');
        if (logoIcon) logoIcon.textContent = name.charAt(0).toUpperCase();

        document.title = `${name} | Smart Team Sync`;

        // Also update settings input if it exists
        const settingsInput = document.getElementById('settingsAppName');
        if (settingsInput) settingsInput.value = name;
    },

    updateVisualSetting(key, value) {
        this.state[key] = value;
        // Map state key to localStorage key correctly
        const storageKeyMap = {
            'customFont': 'moltbot_custom_font',
            'customPrimary': 'moltbot_custom_primary',
            'globalSaturation': 'moltbot_global_saturation',
            'globalContrast': 'moltbot_global_contrast',
            'globalBrightness': 'moltbot_global_brightness'
        };

        if (storageKeyMap[key]) {
            localStorage.setItem(storageKeyMap[key], value);
        }

        this.applyVisuals();
    },

    applyVisuals() {
        const root = document.documentElement;

        // Font
        let fontStack = "'Outfit', sans-serif";
        if (this.state.customFont === 'Serif') fontStack = "Georgia, serif";
        if (this.state.customFont === 'Mono') fontStack = "'Courier New', monospace";
        if (this.state.customFont === 'System') fontStack = "system-ui, -apple-system, sans-serif";
        if (this.state.customFont === 'Dyslexic') fontStack = "'OpenDyslexic', 'Comic Sans MS', sans-serif";

        root.style.setProperty('--font-main', fontStack);

        // Primary Color Override
        if (this.state.customPrimary) {
            root.style.setProperty('--primary', this.state.customPrimary);
            // Calculate a simple alpha version for glow
            // Very basic hex to rgb conversion for simplicity or just use the same color with opacity if possible
            // For now set primary-glow to same color with low opacity using color-mix if supported or just let it be
            // a simple approximation:
            root.style.setProperty('--primary-glow', this.state.customPrimary + '40'); // 25% opacity
        } else {
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-glow');
        }

        // Filters (Saturation, Contrast, Brightness)
        // We apply this to body or html. 
        // Note: filter on body might affect fixed elements weirdly, let's try html or body.
        document.body.style.filter = `
            saturate(${this.state.globalSaturation}%) 
            contrast(${this.state.globalContrast}%) 
            brightness(${this.state.globalBrightness}%)
        `;
    },

    // --- SYNC MODULE (Firebase Cloud) ---
    sync: {
        db: null,
        config: {
            apiKey: "AIzaSyCdiwAhgLBNnIdgvpWW3qpeTaKoSy1nTM0",
            authDomain: "taskforce-91683.firebaseapp.com",
            projectId: "taskforce-91683",
            storageBucket: "taskforce-91683.firebasestorage.app",
            messagingSenderId: "203568113458",
            appId: "1:203568113458:web:666709ae3263977a43592b",
            measurementId: "G-K8GQZGB8KE"
        },
        unsubscribe: null,

        init() {
            if (!window.firebase) {
                console.error("Firebase SDK not found!");
                this.updateUI(false);
                return;
            }

            if (!app.state.user.teamName) {
                console.log("No team name set. Sync offline.");
                this.updateUI(false);
                return;
            }

            try {
                // Initialize Firebase only if not already initialized
                if (!firebase.apps.length) {
                    firebase.initializeApp(this.config);
                }
                this.db = firebase.firestore();
                console.log("Firebase initialized for team:", app.state.user.teamName);
                this.listen();
                this.startPresence();
            } catch (e) {
                console.error("Firebase init failed", e);
                this.updateUI(false);
            }
        },

        connect() {
            const team = document.getElementById('teamInput').value.trim();
            const pin = document.getElementById('teamPin').value.trim();

            if (!team || !pin) return alert("Bitte Sync-Key UND PIN eingeben!");
            if (pin.length < 4) return alert("Der PIN muss 4-stellig sein.");

            app.state.user.teamName = team;
            app.state.user.teamPin = pin;
            localStorage.setItem('moltbot_team', team);
            localStorage.setItem('moltbot_pin', pin);

            // Re-init sync
            this.init();
            app.render();
            alert(`Sichere Verbindung hergestellt! 🔒\nKey: ${team}`);
        },

        listen() {
            if (!this.db || !app.state.user.teamName) return;

            // Use the teamName as a private document ID
            // "Nur Privat" logic: using a dedicated collection
            const docRef = this.db.collection('moltbot_private_sync').doc(app.state.user.teamName);

            // Cancel previous listener if exists
            if (this.unsubscribe) this.unsubscribe();

            this.unsubscribe = docRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data && data.payload) {
                        try {
                            const incoming = JSON.parse(data.payload);
                            // Avoid merging if we just pushed this exact state
                            if (incoming.pushedBy !== app.state.user.name) {
                                app.mergeIncoming(incoming);
                            }
                            this.updateUI(true);
                        } catch (e) { console.error("Sync parse error", e); }
                    }
                } else {
                    console.log("No remote data for this team yet.");
                    this.updateUI(true);
                }
            }, (error) => {
                console.error("Firebase Listen Error:", error);
                this.updateUI(false);
            });
        },

        push() {
            if (!this.db || !app.state.user.teamName) return;

            // Visual feedback for sync button
            const syncBtn = document.querySelector('button[onclick="app.sync.push()"]');
            const syncIcon = syncBtn?.querySelector('i');
            if (syncIcon) syncIcon.classList.add('spinning');

            const payload = {
                events: app.state.events,
                todos: app.state.todos,
                contacts: app.state.contacts,
                updatedAt: Date.now(),
                pushedBy: app.state.user.name,
                pin: app.state.user.teamPin
            };

            this.db.collection('moltbot_private_sync').doc(app.state.user.teamName).set({
                payload: JSON.stringify(payload),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdatedBy: app.state.user.name
            }).then(() => {
                console.log("Cloud Push successful");
                this.updateUI(true);
                if (syncIcon) syncIcon.classList.remove('spinning');
            }).catch(e => {
                console.error("Cloud Push failed", e);
                this.updateUI(false);
                if (syncIcon) syncIcon.classList.remove('spinning');
            });
        },

        startPresence() {
            if (!this.db || !app.state.user.teamName) return;

            const setPresence = () => {
                const team = app.state.user.teamName;
                if (!team) return;

                this.db.collection('moltbot_presence').doc(team).set({
                    [app.state.user.name]: {
                        lastSeen: Date.now(),
                        status: 'online',
                        avatar: app.state.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.state.user.name}`
                    }
                }, { merge: true });
            };

            setPresence();
            setInterval(setPresence, 30000); // Heartbeat every 30s

            // Listen for other members
            this.db.collection('moltbot_presence').doc(app.state.user.teamName)
                .onSnapshot((doc) => {
                    const list = document.getElementById('presenceList');
                    if (!list || !doc.exists) return;

                    const members = doc.data();
                    const now = Date.now();
                    let html = '';

                    Object.entries(members).forEach(([name, data]) => {
                        // Only show if seen in last 5 minutes
                        if (now - data.lastSeen < 300000) {
                            const isMe = name === app.state.user.name;
                            html += `
                                <div class="member-badge ${isMe ? 'is-me' : ''}" title="${name} is online">
                                    <img src="${data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}" alt="${name}">
                                    <span class="status-indicator"></span>
                                    <span class="member-name">${name}</span>
                                </div>
                            `;
                        }
                    });
                    list.innerHTML = html;
                });
        },

        updateUI(online) {
            const dot = document.querySelector('.status-dot');
            const text = document.getElementById('syncStatusText');
            const isConnected = !!app.state.user.teamName;

            if (dot) {
                // If connected but error: red. If not connected: blue (Local). If connected & ok: green.
                if (!isConnected) {
                    dot.style.background = 'var(--accent)'; // Blue for Local
                    dot.classList.remove('online');
                } else {
                    dot.style.background = online ? 'var(--success)' : 'var(--danger)';
                    dot.classList.toggle('online', online);
                }
            }
            if (text) text.textContent = isConnected ? app.state.user.teamName : 'Lokal';

            const display = document.getElementById('currentTeamDisplay');
            if (display) display.textContent = isConnected ? app.state.user.teamName : 'Lokal (Kein Sync active)';

            // If local, show at least the current user in the presence list
            if (!isConnected) {
                const list = document.getElementById('presenceList');
                if (list) {
                    list.innerHTML = `
                        <div class="member-badge is-me" title="Du bist lokal angemeldet">
                            <img src="${app.state.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.state.user.name}`}" alt="Me">
                            <span class="status-indicator" style="background: var(--accent);"></span>
                            <span class="member-name">${app.state.user.name} (Ich)</span>
                        </div>
                    `;
                }
            }
        }
    },

    // --- LOGIC ---
    getFilteredEvents() {
        const filters = {
            work: document.getElementById('filter-work')?.checked ?? true,
            private: document.getElementById('filter-private')?.checked ?? true,
            urgent: document.getElementById('filter-urgent')?.checked ?? true,
            birthday: document.getElementById('filter-birthday')?.checked ?? true,
            holiday: document.getElementById('filter-holiday')?.checked ?? true
        };
        const search = document.querySelector('.search-bar input')?.value.toLowerCase() || '';

        // User Events
        let combined = this.state.events.filter(e => {
            const matchesCategory = filters[e.category] !== false;
            const matchesSearch = e.title.toLowerCase().includes(search) || (e.notes && e.notes.toLowerCase().includes(search));
            return matchesCategory && matchesSearch;
        });

        // Add Holidays if enabled
        if (filters.holiday) {
            const year = this.state.currentDate.getFullYear();
            // Calculate holidays for current, prev and next year to be safe
            const holidays = [
                ...this.holidays.getForYear(year - 1),
                ...this.holidays.getForYear(year),
                ...this.holidays.getForYear(year + 1)
            ];

            // Filter holidays by search
            const matchingHolidays = holidays.filter(h =>
                h.title.toLowerCase().includes(search)
            );

            combined = [...combined, ...matchingHolidays];
        }

        return combined;
    },

    isEventOnDate(e, d) {
        if (!e.date) return false;
        const evDate = new Date(e.date);

        // Year-independent matching for birthdays and holidays
        if (e.category === 'birthday' || e.category === 'holiday') {
            return evDate.getDate() === d.getDate() && evDate.getMonth() === d.getMonth();
        }

        return evDate.toDateString() === d.toDateString();
    },

    mergeIncoming(incoming) {
        if (!incoming.events) return;

        // PRIVACY CHECK: Only merge if PIN matches
        if (incoming.pin !== app.state.user.teamPin) {
            console.error("Sync Error: PIN mismatch! Data ignored.");
            return;
        }

        let changed = false;
        const localMap = new Map(this.state.events.map(e => [e.id, e]));

        incoming.events.forEach(incEvent => {
            const local = localMap.get(incEvent.id);
            if (!local || (incEvent.updatedAt > (local.updatedAt || 0))) {
                localMap.set(incEvent.id, incEvent);
                changed = true;
            }
        });

        if (changed) {
            this.state.events = Array.from(localMap.values());
        }

        // Merge Todos
        if (incoming.todos) {
            const localTodoMap = new Map(this.state.todos.map(t => [t.id, t]));
            incoming.todos.forEach(incTodo => {
                const local = localTodoMap.get(incTodo.id);
                // Simple logic: remote wins if newer or if local doesn't exist
                if (!local || incTodo.createdAt > local.createdAt) {
                    localTodoMap.set(incTodo.id, incTodo);
                    changed = true;
                }
            });
            if (changed) {
                this.state.todos = Array.from(localTodoMap.values());
            }
        }

        // Merge Contacts
        if (incoming.contacts) {
            const localContactMap = new Map(this.state.contacts.map(c => [c.id, c]));
            incoming.contacts.forEach(incContact => {
                const local = localContactMap.get(incContact.id);
                if (!local || incContact.updatedAt > (local.updatedAt || 0)) {
                    localContactMap.set(incContact.id, incContact);
                    changed = true;
                }
            });
            if (changed) {
                this.state.contacts = Array.from(localContactMap.values());
            }
        }

        if (changed) {
            this.saveLocal();
            this.render();
        }
    },

    addEvent(eventData) {
        if (this.state.editingEventId) {
            // Update existing
            const index = this.state.events.findIndex(e => e.id === this.state.editingEventId);
            if (index !== -1) {
                this.state.events[index] = {
                    ...this.state.events[index],
                    ...eventData,
                    updatedAt: Date.now()
                };
            }
            this.state.editingEventId = null;
        } else {
            // Create new
            const newEvent = {
                ...eventData,
                id: Date.now().toString(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.state.events.push(newEvent);
        }

        this.saveLocal();
        this.sync.push();
        this.render();
    },

    editEvent(id) {
        const event = this.state.events.find(e => e.id === id);
        if (!event) return;

        this.state.editingEventId = id;

        // Populate Modal
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventDate').value = event.date || '';
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventPhone').value = event.phone || '';
        document.getElementById('eventEmail').value = event.email || '';
        document.getElementById('eventNotes').value = event.notes || '';
        document.getElementById('eventCategory').value = event.category || 'work';

        // Open Modal
        document.getElementById('modalOverlay').classList.remove('hidden');
    },

    deleteEvent(id) {
        this.state.events = this.state.events.filter(e => e.id !== id);
        this.saveLocal();
        this.sync.push();
        this.render();
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('active');
    },

    // --- NAVIGATION ---
    setupEventListeners() {
        // Nav Items
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // Search
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.render());
        }

        // Modal
        const modal = document.getElementById('modalOverlay');
        const showModal = () => {
            app.state.editingEventId = null;
            document.getElementById('eventForm').reset();
            document.getElementById('eventDate').valueAsDate = new Date();
            document.getElementById('eventColor').value = '#6366f1'; // Reset color
            modal.classList.remove('hidden');
        };
        const sidebarCreate = document.getElementById('sidebarCreateBtn');
        if (sidebarCreate) sidebarCreate.onclick = showModal;

        document.getElementById('closeModalBtn').onclick = () => modal.classList.add('hidden');


        // Todo Input Enter Key
        const todoInput = document.getElementById('todoInput');
        if (todoInput) {
            todoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') app.todo.add();
            });
        }
        // Filters
        ['work', 'private', 'urgent', 'birthday', 'holiday'].forEach(cat => {
            const el = document.getElementById(`filter-${cat}`);
            if (el) el.onchange = () => this.render();
        });

        // Form
        document.getElementById('eventForm').onsubmit = (e) => {
            e.preventDefault();
            const event = {
                title: document.getElementById('eventTitle').value,
                date: document.getElementById('eventDate').value,
                time: document.getElementById('eventTime').value,
                location: document.getElementById('eventLocation').value,
                phone: document.getElementById('eventPhone').value,
                email: document.getElementById('eventEmail').value,
                notes: document.getElementById('eventNotes').value,
                category: document.getElementById('eventCategory').value,
                color: document.getElementById('eventColor').value
            };
            this.addEvent(event);
            modal.classList.add('hidden');
            e.target.reset();
        };

        // Contact Modal
        document.getElementById('closeContactModalBtn').onclick = app.contacts.closeModal;
        document.getElementById('contactForm').onsubmit = (e) => {
            e.preventDefault();
            const contact = {
                name: document.getElementById('contactName').value,
                phone: document.getElementById('contactPhone').value,
                email: document.getElementById('contactEmail').value,
                address: document.getElementById('contactAddress').value,
                birthday: document.getElementById('contactBirthday').value,
                notes: document.getElementById('contactNotes').value,
                isFavorite: document.getElementById('contactIsFavorite').checked
            };
            app.contacts.add(contact);
            app.contacts.closeModal();
            e.target.reset();
        };

        // Contact View Switcher
        const contactViewSelector = document.getElementById('contactViewSelector');
        if (contactViewSelector) {
            contactViewSelector.querySelectorAll('button').forEach(btn => {
                const view = btn.getAttribute('data-view');
                btn.classList.toggle('active', app.state.contactView === view);

                btn.onclick = () => {
                    this.state.contactView = view;
                    localStorage.setItem('moltbot_contact_view', view);
                    contactViewSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.contacts.render();
                };
            });
        }

        // Calendar View Switcher
        const viewSelector = document.getElementById('calendarViewSelector');
        if (viewSelector) {
            viewSelector.querySelectorAll('button').forEach(btn => {
                btn.onclick = () => {
                    this.state.calendarView = btn.getAttribute('data-view');
                    viewSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.render();
                };
            });
        }

        // Calendar Nav
        const prev = document.getElementById('prevMonth');
        const next = document.getElementById('nextMonth');
        if (prev) prev.onclick = () => {
            const step = this.state.calendarView === 'year' ? 12 : (this.state.calendarView === 'month' ? 1 : 0);
            if (step) {
                this.state.currentDate.setMonth(this.state.currentDate.getMonth() - step);
            } else if (this.state.calendarView === 'week') {
                this.state.currentDate.setDate(this.state.currentDate.getDate() - 7);
            } else {
                this.state.currentDate.setDate(this.state.currentDate.getDate() - 1);
            }
            this.calendar.miniDate = new Date(this.state.currentDate);
            this.render();
        };
        if (next) next.onclick = () => {
            const step = this.state.calendarView === 'year' ? 12 : (this.state.calendarView === 'month' ? 1 : 0);
            if (step) {
                this.state.currentDate.setMonth(this.state.currentDate.getMonth() + step);
            } else if (this.state.calendarView === 'week') {
                this.state.currentDate.setDate(this.state.currentDate.getDate() + 7);
            } else {
                this.state.currentDate.setDate(this.state.currentDate.getDate() + 1);
            }
            this.calendar.miniDate = new Date(this.state.currentDate);
            this.render();
        };
    },

    navigateTo(page) {
        this.state.view = page;
        localStorage.setItem('moltbot_view', page);

        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${page}`).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-page') === page);
        });

        // Toggle Header buttons based on view
        const addContactBtn = document.getElementById('addContactBtn');

        if (addContactBtn) {
            addContactBtn.style.display = (page === 'contacts') ? 'flex' : 'none';
        }

        this.render();

        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('active');
        }
    },

    toggleCard(header) {
        const card = header.closest('.collapsible-card');
        card.classList.toggle('is-collapsed');

        const icon = header.querySelector('.toggle-icon');
        if (icon) {
            const isCollapsed = card.classList.contains('is-collapsed');
            icon.setAttribute('data-lucide', isCollapsed ? 'chevron-down' : 'chevron-up');
            if (window.lucide) lucide.createIcons();
        }
    },

    // --- CALENDAR MODULE ---
    calendar: {
        miniDate: new Date(),

        prevMini() {
            this.miniDate.setMonth(this.miniDate.getMonth() - 1);
            this.renderSidebarMini();
        },

        nextMini() {
            this.miniDate.setMonth(this.miniDate.getMonth() + 1);
            this.renderSidebarMini();
        },

        goToday() {
            app.state.currentDate = new Date();
            this.miniDate = new Date();
            app.render();
        },

        renderSidebarMini() {
            const grid = document.getElementById('sidebarMiniGrid');
            const monthHeader = document.getElementById('sidebarMiniMonth');
            if (!grid) return;

            const year = this.miniDate.getFullYear();
            const month = this.miniDate.getMonth();
            monthHeader.textContent = this.miniDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let html = '';
            ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(d => html += `<div class="calendar-day-name">${d}</div>`);

            let emptyCells = firstDay === 0 ? 6 : firstDay - 1;
            for (let i = 0; i < emptyCells; i++) html += '<div class="calendar-cell empty"></div>';

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                html += `<div class="calendar-cell ${isToday ? 'today' : ''}" onclick="app.openCreateAt('${dateStr}')">${d}</div>`;
            }
            grid.innerHTML = html;
        }
    },

    // --- RENDERING ---
    render() {
        // Sync Header Info
        const headerName = document.getElementById('headerUserName');
        if (headerName) headerName.textContent = this.state.user.name;

        const headerAvatar = document.getElementById('headerUserAvatar');
        if (headerAvatar) {
            headerAvatar.src = this.state.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.state.user.name}`;
        }



        // Update Visual Settings Inputs
        const setFont = document.getElementById('settingsFont');
        if (setFont) setFont.value = this.state.customFont || 'Outfit';

        const setPrimary = document.getElementById('settingsPrimaryColor');
        if (setPrimary && this.state.customPrimary) setPrimary.value = this.state.customPrimary;

        const setSat = document.getElementById('inputSat');
        const setSatLabel = document.getElementById('labelSat');
        if (setSat) {
            setSat.value = this.state.globalSaturation;
            if (setSatLabel) setSatLabel.textContent = this.state.globalSaturation + '%';
        }

        const setCon = document.getElementById('inputCon');
        const setConLabel = document.getElementById('labelCon');
        if (setCon) {
            setCon.value = this.state.globalContrast;
            if (setConLabel) setConLabel.textContent = this.state.globalContrast + '%';
        }

        const setBri = document.getElementById('inputBri');
        const setBriLabel = document.getElementById('labelBri');
        if (setBri) {
            setBri.value = this.state.globalBrightness;
            if (setBriLabel) setBriLabel.textContent = this.state.globalBrightness + '%';
        }

        if (this.state.view === 'dashboard') {
            this.renderDashboard();
        } else if (this.state.view === 'calendar') {
            this.renderCalendar();
            this.calendar.renderSidebarMini();
        } else if (this.state.view === 'todo') {
            this.todo.render();
        } else if (this.state.view === 'contacts') {
            this.contacts.render();
        } else if (this.state.view === 'settings') {
            this.todo.render(); // Redraw categories in settings
            const nameInput = document.getElementById('settingsUserName');
            if (nameInput) nameInput.value = this.state.user.name;
            const addrInput = document.getElementById('settingsUserAddress');
            if (addrInput) addrInput.value = this.state.user.address;
            const phoneInput = document.getElementById('settingsUserPhone');
            if (phoneInput) phoneInput.value = this.state.user.phone;
            const emailInput = document.getElementById('settingsUserEmail');
            if (emailInput) emailInput.value = this.state.user.email;
            const bdayInput = document.getElementById('settingsUserBirthday');
            if (bdayInput) bdayInput.value = this.state.user.birthday;

            const avatarPreview = document.getElementById('settingsUserAvatarPreview');
            if (avatarPreview) {
                avatarPreview.src = this.state.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.state.user.name}`;
            }

            // Render Holidays in Settings
            const holList = document.getElementById('settingsHolidayList');
            if (holList) {
                const year = new Date().getFullYear();
                const holidays = this.holidays.getForYear(year).sort((a, b) => a.date.localeCompare(b.date));

                holList.innerHTML = holidays.map(h => {
                    const dateObj = new Date(h.date);
                    const dateStr = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });
                    const isBW = h.isBW ? '<span style="font-size:0.7em; background:var(--primary); color:white; padding:2px 6px; border-radius:4px; margin-left:8px;">BW</span>' : '';
                    return `
                        <div class="glass" style="padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--glass-border);">
                            <span style="font-weight: 500;">${h.title} ${isBW}</span>
                            <span class="text-muted" style="font-size: 0.9rem;">${dateStr}</span>
                        </div>
                    `;
                }).join('');
            }



            // Populate Quick Action Selects
            const qaLeft = document.getElementById('settingsQALeft');
            if (qaLeft) qaLeft.value = this.state.quickActionLeft;
            const qaRight = document.getElementById('settingsQARight');
            if (qaRight) qaRight.value = this.state.quickActionRight;
            const dockStyle = document.getElementById('settingsDockStyle');
            if (dockStyle) dockStyle.value = this.state.dockStyle;

            const qaSettings = document.getElementById('quickActionSettings');
            if (qaSettings) {
                qaSettings.style.display = (this.state.dockStyle === 'full') ? 'none' : 'grid';
            }

            // Highlight Active Theme Button
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-theme') === this.state.theme);
            });
        } else if (this.state.view === 'alarm') {
            this.alarm.render();
        } else if (this.state.view === 'finance') {
            this.finance.render();
        }

        this.renderVoiceDock();
        if (window.lucide) lucide.createIcons();
    },

    updateQuickAction(side, action) {
        if (side === 'Left') {
            this.state.quickActionLeft = action;
            localStorage.setItem('moltbot_qa_left', action);
        } else {
            this.state.quickActionRight = action;
            localStorage.setItem('moltbot_qa_right', action);
        }
        this.renderVoiceDock();
    },

    updateDockStyle(style) {
        this.state.dockStyle = style;
        localStorage.setItem('moltbot_dock_style', style);
        this.renderVoiceDock();
    },

    renderVoiceDock() {
        const actionIcons = {
            dashboard: 'layout-dashboard',
            calendar: 'calendar',
            finance: 'wallet',
            team: 'users',
            contacts: 'book-user',
            todo: 'check-square',
            alarm: 'alarm-clock',
            settings: 'settings'
        };

        const dock = document.querySelector('.voice-dock');
        if (!dock) return;

        // Apply class for CSS
        dock.classList.toggle('is-full-bar', this.state.dockStyle === 'full');

        if (this.state.dockStyle === 'full') {
            dock.innerHTML = `
                <button class="voice-side-btn ${this.state.view === 'dashboard' ? 'active' : ''}" onclick="app.navigateTo('dashboard')"><i data-lucide="layout-dashboard"></i></button>
                <button class="voice-side-btn ${this.state.view === 'calendar' ? 'active' : ''}" onclick="app.navigateTo('calendar')"><i data-lucide="calendar"></i></button>
                <button class="voice-side-btn ${this.state.view === 'finance' ? 'active' : ''}" onclick="app.navigateTo('finance')"><i data-lucide="wallet"></i></button>
                <button class="voice-side-btn ${this.state.view === 'team' ? 'active' : ''}" onclick="app.navigateTo('team')"><i data-lucide="users"></i></button>
                <button id="voiceControlBtn" class="voice-btn" onclick="app.voice.start()"><i data-lucide="mic"></i></button>
                <button class="voice-side-btn ${this.state.view === 'contacts' ? 'active' : ''}" onclick="app.navigateTo('contacts')"><i data-lucide="book-user"></i></button>
                <button class="voice-side-btn ${this.state.view === 'todo' ? 'active' : ''}" onclick="app.navigateTo('todo')"><i data-lucide="check-square"></i></button>
                <button class="voice-side-btn ${this.state.view === 'alarm' ? 'active' : ''}" onclick="app.navigateTo('alarm')"><i data-lucide="alarm-clock"></i></button>
                <button class="voice-side-btn ${this.state.view === 'settings' ? 'active' : ''}" onclick="app.navigateTo('settings')"><i data-lucide="settings"></i></button>
            `;
        } else {
            dock.innerHTML = `
                <button id="qaLeftBtn" class="voice-side-btn left" onclick="app.navigateTo('${this.state.quickActionLeft}')">
                    <i data-lucide="${actionIcons[this.state.quickActionLeft] || 'star'}"></i>
                </button>
                <button id="voiceControlBtn" class="voice-btn" onclick="app.voice.start()">
                    <i data-lucide="mic"></i>
                </button>
                <button id="qaRightBtn" class="voice-side-btn right" onclick="app.navigateTo('${this.state.quickActionRight}')">
                    <i data-lucide="${actionIcons[this.state.quickActionRight] || 'star'}"></i>
                </button>
            `;
        }

        if (window.lucide) lucide.createIcons();
    },



    // --- FINANCE MODULE ---
    finance: {
        chart: null,

        addEntry(e) {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('finAmount').value);
            const date = document.getElementById('finDate').value;
            const source = document.getElementById('finSource').value || 'Ausgabe';

            if (isNaN(amount)) return;

            const entry = {
                id: Date.now().toString(),
                amount,
                date,
                source,
                createdAt: Date.now()
            };

            app.state.finance.push(entry);
            app.saveLocal();

            document.getElementById('financeForm').reset();
            const dateInput = document.getElementById('finDate');
            if (dateInput) dateInput.valueAsDate = new Date();
            this.render();
        },

        deleteEntry(id) {
            app.state.finance = app.state.finance.filter(e => e.id !== id);
            app.saveLocal();
            this.render();
        },

        editBudget() {
            const newBudget = prompt('Bitte gib dein monatliches Budget ein (€):', app.state.monthlyBudget);
            if (newBudget !== null) {
                const b = parseFloat(newBudget);
                app.state.monthlyBudget = isNaN(b) ? 0 : b;
                localStorage.setItem('moltbot_budget', app.state.monthlyBudget);
                this.render();
            }
        },

        clearAll() {
            if (confirm('Möchtest du wirklich den gesamten Finanzverlauf löschen?')) {
                app.state.finance = [];
                app.saveLocal();
                this.render();
            }
        },

        render() {
            const tableBody = document.getElementById('financeTableBody');
            if (!tableBody) return;

            // Ensure date is set to today
            const dateInput = document.getElementById('finDate');
            if (dateInput && !dateInput.value) dateInput.valueAsDate = new Date();

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Today's start
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            // Start of this week (Monday)
            const currentDay = now.getDay();
            const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
            const weekStart = new Date(now.setDate(diff)).setHours(0, 0, 0, 0);

            // Re-fetch now because setDate mutates
            const freshNow = new Date();

            // Calculate Stats (tracking expenses)
            let dailyExpenses = 0;
            let weeklyExpenses = 0;
            let monthlyExpenses = 0;
            let yearlyExpenses = 0;

            app.state.finance.forEach(e => {
                const d = new Date(e.date);
                const time = d.getTime();

                if (d.getFullYear() === currentYear) {
                    yearlyExpenses += e.amount;
                    if (d.getMonth() === currentMonth) {
                        monthlyExpenses += e.amount;
                    }
                }

                if (time >= todayStart) {
                    dailyExpenses += e.amount;
                }

                if (time >= weekStart) {
                    weeklyExpenses += e.amount;
                }
            });

            const remaining = app.state.monthlyBudget - monthlyExpenses;

            // Update UI
            if (document.getElementById('finTodayTotal')) {
                document.getElementById('finTodayTotal').textContent = dailyExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
            }
            if (document.getElementById('finWeekTotal')) {
                document.getElementById('finWeekTotal').textContent = weeklyExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
            }

            document.getElementById('finTotalIncome').textContent = monthlyExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
            document.getElementById('finTotalBudget').textContent = app.state.monthlyBudget.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
            document.getElementById('finRemaining').textContent = (remaining < 0 ? '-' : '') + Math.abs(remaining).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
            document.getElementById('finYearTotal').textContent = yearlyExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

            // Apply warning color if budget is exceeded
            const remainingEl = document.getElementById('finRemaining');
            if (remainingEl) {
                remainingEl.style.color = remaining < 0 ? 'var(--danger)' : 'var(--text-bright)';
            }

            // Render Table (Expenses)
            const sorted = [...app.state.finance].sort((a, b) => new Date(b.date) - new Date(a.date));
            tableBody.innerHTML = sorted.map(e => `
                <tr class="contact-row">
                    <td>${new Date(e.date).toLocaleDateString('de-DE')}</td>
                    <td>${e.source}</td>
                    <td class="text-danger" style="font-weight:600;">- ${e.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                    <td>
                        <button class="btn-icon-danger" onclick="app.finance.deleteEntry('${e.id}')">
                            <i data-lucide="trash-2" size="16"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            this.updateChart();
            if (window.lucide) lucide.createIcons();
        },

        updateChart() {
            const ctx = document.getElementById('financeChart');
            if (!ctx) return;

            const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            const data = new Array(12).fill(0);
            const budgetData = new Array(12).fill(app.state.monthlyBudget);

            app.state.finance.forEach(e => {
                const d = new Date(e.date);
                if (d.getFullYear() === new Date().getFullYear()) {
                    data[d.getMonth()] += e.amount;
                }
            });

            if (this.chart) this.chart.destroy();

            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Ausgaben',
                            data: data,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Budget',
                            data: budgetData,
                            borderColor: '#6366f1',
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: '#94a3b8' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }
    },

    renderDashboard() {
        const title = document.getElementById('dashboardWelcomeTitle');
        if (title) title.textContent = `Willkommen zurück, ${this.state.user.name}! 👋`;

        const list = document.getElementById('dashboardEventList');
        if (!list) return;

        const filtered = this.getFilteredEvents();

        // Check for today's special occasions
        const today = new Date();
        const specials = filtered.filter(e => this.isEventOnDate(e, today) && (e.category === 'birthday' || e.category === 'holiday'));

        // Sort and future logic
        const sorted = [...filtered].sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));

        // For birthdays, we need a special "next occurrence" sorting if we want them in "Next Events"
        // For simplicity, let's keep the core list and add a special header for today

        let html = '';
        if (specials.length > 0) {
            html += `
                <div class="special-reminders animate-in" style="margin-bottom: 25px; background: linear-gradient(135deg, #ffd700, #ff9f43); padding: 20px; border-radius: 20px; color: #000; box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <i data-lucide="party-popper" size="32"></i>
                        <div>
                            <h3 style="margin:0; font-size:1.4rem;">Heute ist was Besonderes!</h3>
                            <p style="margin:5px 0 0; font-weight:600;">${specials.map(s => s.title + (s.category === 'birthday' ? ' 🎂' : ' 🎊')).join(', ')}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        const future = sorted.filter(e => {
            if (e.category === 'birthday' || e.category === 'holiday') {
                // Show if today or in next 30 days regardless of year
                const d = new Date(e.date);
                const nextOcc = new Date(today.getFullYear(), d.getMonth(), d.getDate());
                if (nextOcc < today.setHours(0, 0, 0, 0)) nextOcc.setFullYear(today.getFullYear() + 1);
                const diff = (nextOcc - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= 30;
            }
            return new Date(e.date) >= new Date().setHours(0, 0, 0, 0);
        }).slice(0, 5);

        if (future.length === 0 && specials.length === 0) {
            list.innerHTML = '<div class="empty-state">Keine anstehenden Termine.</div>';
        } else {
            list.innerHTML = html + future.map(e => {
                const d = new Date(e.date);
                const day = d.getDate();
                const month = d.toLocaleString('de-DE', { month: 'short' });
                return `
                    <div class="event-item" onclick="app.editEvent('${e.id}')" style="cursor:pointer; position:relative;">
                        <div class="event-time-box">
                            <span class="event-day">${day}</span>
                            <span class="event-month">${month}</span>
                        </div>
                        <div class="event-info">
                            <h4>${e.title}</h4>
                            <p>${e.time || '--:--'} Uhr ${e.location ? `• ${e.location}` : ''}</p>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px; margin-left:auto;">
                            ${e.location ? `
                                <button class="icon-btn-subtle" onclick="event.stopPropagation(); app.openRoute('${e.location}')" title="Karte öffnen">
                                    <i data-lucide="map" size="20"></i>
                                </button>
                            ` : ''}
                            <div class="event-category-badge category-${e.category}" style="${e.color ? `background:${e.color}; color:white;` : ''}">${e.category}</div>
                            <div class="event-hover-actions">
                                <button onclick="event.stopPropagation(); app.deleteEvent('${e.id}')" class="btn-delete-subtle" title="Löschen">
                                    <i data-lucide="trash-2" size="18"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.renderMiniCalendar();
    },

    toggleFavorites() {
        this.state.favsCollapsed = !this.state.favsCollapsed;
        localStorage.setItem('moltbot_favs_collapsed', this.state.favsCollapsed);
        this.renderFavorites();
    },

    renderFavorites() {
        const container = document.getElementById('quickContactsContainer');
        const bar = document.querySelector('.quick-contacts-bar');
        const toggleBtn = document.getElementById('toggleFavsBtn');
        if (!container) return;

        if (this.state.favsCollapsed) {
            container.classList.add('collapsed');
            if (bar) bar.classList.add('is-collapsed');
            if (toggleBtn) toggleBtn.innerHTML = '<i data-lucide="chevron-down"></i>';
        } else {
            container.classList.remove('collapsed');
            if (bar) bar.classList.remove('is-collapsed');
            if (toggleBtn) toggleBtn.innerHTML = '<i data-lucide="chevron-up"></i>';
        }

        const favs = this.state.contacts.filter(c => c.isFavorite);

        if (favs.length === 0) {
            container.innerHTML = `<div class="text-muted" style="font-size: 0.8rem; padding: 10px;">Keine Favoriten markiert. Klicke auf das Herz oder bearbeite einen Kontakt.</div>`;
            return;
        }

        container.innerHTML = favs.map(c => `
            <div class="quick-contact-item" title="${c.name}">
                <div class="avatar-circle" onclick="app.contacts.edit('${c.id}')">
                    ${c.name.charAt(0).toUpperCase()}
                </div>
                <span>${c.name.split(' ')[0]}</span>
                
                <div class="fav-hover-actions">
                    ${c.phone ? `
                    <a href="tel:${c.phone}" class="fav-action-btn call" title="Anrufen" onclick="event.stopPropagation()">
                        <i data-lucide="phone-forwarded" size="12"></i>
                    </a>` : ''}
                    <button class="fav-action-btn remove" onclick="event.stopPropagation(); app.contacts.toggleFavorite('${c.id}')" title="Als Favorit entfernen">
                        <i data-lucide="x" size="12"></i>
                    </button>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    },

    renderMiniCalendar() {
        const grid = document.getElementById('miniCalendarGrid');
        const monthHeader = document.getElementById('miniCalendarMonth');
        if (!grid) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        monthHeader.textContent = now.toLocaleString('de-DE', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = '';
        ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(d => {
            html += `<div class="calendar-day-name">${d}</div>`;
        });

        let emptyCells = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < emptyCells; i++) html += '<div class="calendar-cell empty"></div>';

        for (let d = 1; d <= daysInMonth; d++) {
            const currentCellDate = new Date(year, month, d);
            const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const hasEvent = this.state.events.some(e => this.isEventOnDate(e, currentCellDate));
            html += `<div class="calendar-cell ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}" onclick="app.openCreateAt('${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}')">${d}</div>`;
        }

        grid.innerHTML = html;
    },

    renderCalendar() {
        const grid = document.getElementById('fullCalendarGrid');
        const monthHeader = document.getElementById('fullCalendarMonth');
        const weekdayHeader = document.getElementById('weekdayHeader');
        if (!grid) return;

        const date = this.state.currentDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const filteredEvents = this.getFilteredEvents();

        // Update headers and grid classes
        grid.className = `calendar-grid-large view-${this.state.calendarView}`;

        if (this.state.calendarView === 'year') {
            monthHeader.textContent = year;
            weekdayHeader.innerHTML = '';
            this.renderYearView(grid, year, filteredEvents);
        } else if (this.state.calendarView === 'month') {
            monthHeader.textContent = date.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
            weekdayHeader.innerHTML = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `<div>${d}</div>`).join('');
            this.renderMonthView(grid, year, month, filteredEvents);
        } else if (this.state.calendarView === 'week') {
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - (date.getDay() === 0 ? 6 : date.getDay() - 1));
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            monthHeader.textContent = `${startOfWeek.getDate()}. - ${endOfWeek.getDate()}. ${endOfWeek.toLocaleString('de-DE', { month: 'short', year: 'numeric' })}`;
            weekdayHeader.innerHTML = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => {
                const dayDate = new Date(startOfWeek);
                dayDate.setDate(startOfWeek.getDate() + i);
                return `<div>${d} ${dayDate.getDate()}</div>`;
            }).join('');
            this.renderWeekView(grid, startOfWeek, filteredEvents);
        } else if (this.state.calendarView === 'day') {
            monthHeader.textContent = date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            weekdayHeader.innerHTML = '';
            this.renderDayView(grid, date, filteredEvents);
        }
    },

    renderEventActions(e) {
        let customStyle = '';
        if (e.color) {
            customStyle = `background: ${e.color}E6; border-left-color: ${e.color};`;
        }
        let html = `<div class="event-pill ${e.category}" title="${e.title}" onclick="event.stopPropagation(); app.editEvent('${e.id}')" style="cursor: pointer; ${customStyle}">
            <div style="font-weight:600;">${e.time ? e.time + ' ' : ''}${e.title}</div>`;

        if (e.location || e.phone || e.email) {
            html += `<div style="display:flex; gap:6px; margin-top:4px;">`;
            if (e.location) html += `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}" target="_blank" class="event-link-btn" title="Navigieren" onclick="event.stopPropagation()"><i data-lucide="map-pin" size="10"></i></a>`;
            if (e.phone) html += `<a href="tel:${e.phone}" class="event-link-btn" title="Anrufen" onclick="event.stopPropagation()"><i data-lucide="phone" size="10"></i></a>`;
            if (e.email) html += `<a href="mailto:${e.email}" class="event-link-btn" title="E-Mail schreiben" onclick="event.stopPropagation()"><i data-lucide="mail" size="10"></i></a>`;
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    },

    toggleMonthLayout() {
        this.state.monthViewMode = this.state.monthViewMode === 'grid' ? 'list' : 'grid';
        this.render();
    },

    renderMonthView(grid, year, month, filteredEvents) {
        const mode = this.state.monthViewMode || 'list';

        // Show/Hide Toggle Button
        const toggleBtn = document.getElementById('monthLayoutToggle');
        if (toggleBtn) {
            toggleBtn.style.display = 'inline-flex';
            toggleBtn.innerHTML = mode === 'grid' ? '<i data-lucide="list"></i>' : '<i data-lucide="grid"></i>';
            toggleBtn.title = mode === 'grid' ? 'Listenansicht' : 'Kalenderansicht';
        }

        if (mode === 'grid') {
            this.renderMonthGridView(grid, year, month, filteredEvents);
        } else {
            this.renderMonthListView(grid, year, month, filteredEvents);
        }
    },

    renderMonthListView(grid, year, month, filteredEvents) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        grid.className = 'calendar-list-view';

        let html = '<div class="agenda-view-container">';

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            // FIX: Manual date string to match local time, avoiding UTC rollback
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = filteredEvents.filter(e => this.isEventOnDate(e, date));
            const isToday = date.toDateString() === new Date().toDateString();

            html += this.renderDayListRow(date, dayEvents, isToday, dateStr);
        }
        html += '</div>';
        grid.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    renderMonthGridView(grid, year, month, filteredEvents) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Grid Class
        grid.className = 'calendar-grid-large view-month';

        let html = '';
        // Adjust for German week start (Monday=1)
        let emptyCells = (firstDay + 6) % 7;

        for (let i = 0; i < emptyCells; i++) html += '<div class="calendar-cell-large empty"></div>';

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            // FIX: Manual date string here too
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = filteredEvents.filter(e => this.isEventOnDate(e, date));
            const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            // Compact event indicators for Grid View
            const indicators = dayEvents.slice(0, 3).map(e =>
                `<div class="event-dot ${e.category || 'work'}" title="${e.title}"></div>`
            ).join('');

            html += `
                <div class="calendar-cell-large ${isToday ? 'today-full' : ''}" onclick="app.openCreateAt('${dateStr}')">
                    <div class="cell-header">
                        <span class="day-num">${d}</span>
                        ${dayEvents.length > 0 ? `<div class="event-dots">${indicators}</div>` : ''}
                    </div>
                    <div class="day-events mobile-hidden">
                        ${dayEvents.map(e => this.renderEventActions(e)).join('')}
                    </div>
                </div>
            `;
        }
        grid.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    renderWeekView(grid, startOfWeek, filteredEvents) {
        let html = '<div class="agenda-view-container">';
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = filteredEvents.filter(e => this.isEventOnDate(e, date));
            const isToday = date.toDateString() === new Date().toDateString();

            html += this.renderDayListRow(date, dayEvents, isToday, dateStr);
        }
        html += '</div>';
        grid.innerHTML = html;
        grid.className = 'calendar-list-view';
        if (window.lucide) lucide.createIcons();
    },

    renderDayListRow(date, events, isToday, dateStr) {
        const dayName = date.toLocaleDateString('de-DE', { weekday: 'long' });
        const dayDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' });

        let eventsHtml = '';
        if (events.length === 0) {
            eventsHtml = `<div class="text-muted" style="padding:10px; font-size:0.9rem;">Keine Termine</div>`;
        } else {
            // Sort by time
            const sorted = [...events].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
            eventsHtml = sorted.map(e => {
                const colorStyle = e.color ? `border-left: 3px solid ${e.color};` : '';
                return `
                <div class="agenda-event-item" onclick="app.editEvent('${e.id}')" style="${colorStyle}">
                    <div class="agenda-time">${e.time || 'Ganztägig'}</div>
                    <div class="agenda-details">
                        <div class="agenda-title">${e.title}</div>
                        ${e.location ? `<div class="agenda-loc"><i data-lucide="map-pin" size="12"></i> ${e.location}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
        }

        return `
            <div class="agenda-day-card ${isToday ? 'today-highlight' : ''}">
                <div class="agenda-day-header" onclick="app.openCreateAt('${dateStr}')">
                    <span class="agenda-day-name">${dayName}</span>
                    <span class="agenda-day-date">${dayDate}</span>
                    <button class="btn-icon-small"><i data-lucide="plus"></i></button>
                </div>
                <div class="agenda-day-body">
                    ${eventsHtml}
                </div>
            </div>
        `;
    },

    renderDayView(grid, date, filteredEvents) {
        this.renderTimeGrid(grid, [date], filteredEvents, 'day');
    },

    renderTimeGrid(container, days, events, viewType) {
        container.innerHTML = '';
        container.className = `time-grid-container view-${viewType}`;

        const header = this.renderTimeGridHeader(days, viewType);
        const body = this.renderTimeGridBody(days, events, viewType);

        container.appendChild(header);
        container.appendChild(body);

        // Scroll to 8:00 AM automatically
        setTimeout(() => {
            const scrollArea = container.querySelector('.time-grid-scroll-area');
            if (scrollArea) {
                const hour8 = scrollArea.querySelector('.grid-row[data-hour="8"]');
                if (hour8) hour8.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        }, 100);

        if (window.lucide) lucide.createIcons();
    },

    renderTimeGridHeader(days, viewType) {
        const header = document.createElement('div');
        header.className = 'time-grid-header';

        // Time gutter spacer
        header.innerHTML += `<div class="time-gutter-header"></div>`;

        days.forEach(date => {
            const isToday = new Date().toDateString() === date.toDateString();
            const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
            const dayNum = date.getDate();
            const fullDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

            header.innerHTML += `
                <div class="header-day-col ${isToday ? 'today' : ''}">
                    <div class="header-day-name">${dayName}</div>
                    <div class="header-day-num mobile-hidden">${dayNum}</div>
                    <div class="header-day-full mobile-only">${fullDate}</div>
                </div>
            `;
        });

        return header;
    },

    renderTimeGridBody(days, events, viewType) {
        const body = document.createElement('div');
        body.className = 'time-grid-scroll-area';

        const content = document.createElement('div');
        content.className = 'time-grid-content';

        // 1. Grid Background (Rows for hours)
        let gridRows = '<div class="grid-background">';
        for (let h = 0; h < 24; h++) {
            gridRows += `
                <div class="grid-row" data-hour="${h}">
                    <div class="time-label"><span>${h}:00</span></div>
                    ${days.map(() => `<div class="grid-cell"></div>`).join('')}
                </div>
            `;
        }
        gridRows += '</div>';

        // 2. Events Layer
        let eventsLayer = '<div class="events-layer">';

        // Render events for each day column
        days.forEach((date, dayIndex) => {
            // Filter events for this day
            const dayEvents = events.filter(e => this.isEventOnDate(e, date));

            // Calculate positioning logic (simple collision detection could go here)
            dayEvents.forEach(e => {
                if (e.allDay || (e.category === 'holiday' || e.category === 'birthday')) {
                    // Render in header (TODO: Support all-day section), for now just top of list or skip
                    // For holidays, we might want to render them as a background overlay or top banner
                    return;
                }

                const style = this.getEventStyle(e, dayIndex, days.length);
                const isHoliday = e.category === 'holiday';

                if (isHoliday) return; // Skip holidays in time grid for now

                // Custom Color Logic
                let customStyle = '';
                if (e.color) {
                    customStyle = `background: ${e.color}E6; border-left-color: ${e.color};`; // E6 is ~90% hex opacity
                }

                eventsLayer += `
                    <div class="event-card-absolute ${e.category}" 
                         style="${style} ${customStyle}"
                         onclick="event.stopPropagation(); app.editEvent('${e.id}')">
                         <div class="event-time-range">${e.time || '00:00'} - ${this.addMinutes(e.time || '00:00', 60)}</div>
                         <div class="event-title">${e.title}</div>
                         ${e.location ? `<div class="event-location"><i data-lucide="map-pin" size="10"></i> ${e.location}</div>` : ''}
                    </div>
                `;
            });
        });

        // 3. Current Time Indicator
        const now = new Date();
        const todayIndex = days.findIndex(d => d.toDateString() === now.toDateString());
        if (todayIndex !== -1) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const topPercent = (currentMinutes / 1440) * 100;
            const leftPercent = (todayIndex / days.length) * 100 + (100 / days.length * 0.02); // slight offset
            // Adjust "Time Gutter" width (approx 60px) in calculation if using absolute from left
            // Simplified: The indicator line spans the specific day column

            // Actually, easier to render line inside the day column wrapper if we structurue that way.
            // But we used a monolithic grid. So we position absolutely relative to the content area.
            // We need to account for the left gutter (60px).

            const colWidth = `calc((100% - 60px) / ${days.length})`;
            const leftPos = `calc(60px + (100% - 60px) * ${todayIndex} / ${days.length})`;

            eventsLayer += `
                <div class="current-time-marker" style="top: ${topPercent}%; left: ${leftPos}; width: ${colWidth};">
                    <div class="current-time-dot"></div>
                    <div class="current-time-line"></div>
                </div>
             `;
        }

        eventsLayer += '</div>';

        // 4. Click targets for creating events
        let clickLayer = '<div class="click-layer">';
        for (let h = 0; h < 24; h++) {
            days.forEach((date, i) => {
                const dateStr = date.toISOString().split('T')[0];
                const hourStr = h.toString().padStart(2, '0') + ':00';
                clickLayer += `<div class="click-cell" 
                    style="top: ${(h / 24) * 100}%; left: calc(60px + (100% - 60px) * ${i}/${days.length}); height: ${100 / 24}%; width: calc((100% - 60px)/${days.length});"
                    onclick="app.openCreateAt('${dateStr}', '${hourStr}')"></div>`;
            });
        }
        clickLayer += '</div>';

        content.innerHTML = gridRows + eventsLayer + clickLayer;
        body.appendChild(content);
        return body;
    },

    getEventStyle(e, colIndex, totalCols) {
        if (!e.time) return 'display:none';

        const [h, m] = e.time.split(':').map(Number);
        const startMin = h * 60 + m;
        const duration = 60; // Default 1h
        const endMin = startMin + duration;

        const top = (startMin / 1440) * 100;
        const height = (duration / 1440) * 100;

        // CSS Grid Calculation
        // Left offset = Time Gutter (60px) + (Col Index * Col Width)
        // We use calc()

        return `
            top: ${top}%;
            height: ${height}%;
            left: calc(60px + (100% - 60px) * ${colIndex} / ${totalCols});
            width: calc((100% - 60px) / ${totalCols} - 4px);
        `;
    },

    addMinutes(time, mins) {
        if (!time) return '';
        const [h, m] = time.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m + mins);
        return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    },

    handleTimelineClick(event, date) {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const totalMinutes = Math.floor(y / 2.5); // Scaled
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor((totalMinutes % 60) / 15) * 15; // Snap to 15m
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        this.openCreateAt(date, timeStr);
    },

    openRoute(address) {
        if (!address) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
        window.open(url, '_blank');
    },

    openDayRoute(dateStr) {
        const dayEvents = this.state.events.filter(e => e.date === dateStr && e.location);
        if (dayEvents.length === 0) return;

        // Sort by time
        const sorted = [...dayEvents].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

        // Use the first location as destination (start is 'My Location')
        // And use the rest as waypoints
        const destination = sorted[sorted.length - 1].location;
        const waypoints = sorted.slice(0, -1).map(e => e.location).join('|');

        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}`;
        window.open(url, '_blank');
    },

    renderYearView(grid, year, filteredEvents) {
        let html = '';
        for (let m = 0; m < 12; m++) {
            const monthDate = new Date(year, m, 1);
            const monthName = monthDate.toLocaleString('de-DE', { month: 'long' });
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            const firstDay = new Date(year, m, 1).getDay();
            let emptyCells = firstDay === 0 ? 6 : firstDay - 1;

            html += `<div class="year-month-card">
                <h4>${monthName}</h4>
                <div class="year-mini-grid">`;

            for (let i = 0; i < emptyCells; i++) html += '<div class="year-mini-cell"></div>';
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const dailyEvents = filteredEvents.filter(e => e.date === dateStr);
                let classStr = 'year-mini-cell';
                if (dailyEvents.length > 2) classStr += ' has-event has-event-many';
                else if (dailyEvents.length > 0) classStr += ' has-event';

                html += `<div class="${classStr}" onclick="app.openCreateAt('${dateStr}')">${d}</div>`;
            }
            html += `</div></div>`;
        }
        grid.innerHTML = html;
    },

    openCreateAt(date, time = '') {
        document.getElementById('eventDate').value = date;
        if (time) {
            const formattedTime = time.includes(':') ? (time.split(':')[0].padStart(2, '0') + ':00') : time;
            document.getElementById('eventTime').value = formattedTime;
        }
        document.getElementById('modalOverlay').classList.remove('hidden');
    },

    // --- TODO MODULE ---
    todo: {
        add() {
            const input = document.getElementById('todoInput');
            const categoryInput = document.getElementById('todoCategory');
            const text = input.value.trim();
            if (!text) return;

            const newTodo = {
                id: Date.now().toString(),
                text: text,
                category: categoryInput.value,
                completed: false,
                createdAt: Date.now()
            };

            app.state.todos.unshift(newTodo);
            input.value = '';
            app.saveLocal();
            this.render();

            // Sync fallback (trigger cloud push)
            if (app.sync && app.sync.push) app.sync.push();
        },

        toggle(id) {
            const todo = app.state.todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                app.saveLocal();
                this.render();
                if (app.sync && app.sync.push) app.sync.push();
            }
        },

        delete(id) {
            app.state.todos = app.state.todos.filter(t => t.id !== id);
            app.saveLocal();
            this.render();
            if (app.sync && app.sync.push) app.sync.push();
        },

        setFilter(filter) {
            app.state.todoFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
            });
            this.render();
        },

        clearCompleted() {
            app.state.todos = app.state.todos.filter(t => !t.completed);
            app.saveLocal();
            this.render();
            if (app.sync && app.sync.push) app.sync.push();
        },

        addCategory() {
            const name = prompt("Name der neuen Bezeichnung/Liste (z.B. 🚀 Projekt X):");
            if (name && !app.state.todoCategories.includes(name)) {
                app.state.todoCategories.push(name);
                app.saveLocal();
                this.render();
                if (app.sync && app.sync.push) app.sync.push();
            }
        },

        deleteCategory(name) {
            if (confirm(`Möchtest du die Bezeichnung "${name}" wirklich löschen?`)) {
                app.state.todoCategories = app.state.todoCategories.filter(c => c !== name);
                app.saveLocal();
                this.render();
                if (app.sync && app.sync.push) app.sync.push();
            }
        },

        render() {
            const list = document.getElementById('todoList');
            const select = document.getElementById('todoCategory');

            // Render select options if on Todo page
            if (select) {
                select.innerHTML = app.state.todoCategories.map(c => `<option value="${c}">${c}</option>`).join('');
            }

            // Render Todo List if on Todo page
            if (list) {
                const filtered = app.state.todos.filter(t => {
                    if (app.state.todoFilter === 'active') return !t.completed;
                    if (app.state.todoFilter === 'completed') return t.completed;
                    return true;
                });

                list.innerHTML = filtered.map(t => `
                    <div class="todo-item ${t.completed ? 'completed' : ''}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; transition: var(--transition);">
                        <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="app.todo.toggle('${t.id}')" style="width: 20px; height: 20px; cursor: pointer; accent-color: var(--success);">
                        <div style="flex: 1; display: flex; flex-direction: column;">
                            <span style="${t.completed ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${t.text}</span>
                            <small style="font-size: 0.7rem; opacity: 0.6; margin-top: 2px;">${t.category || 'Generell'}</small>
                        </div>
                        <button onclick="app.todo.delete('${t.id}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;"><i data-lucide="trash-2" size="18"></i></button>
                    </div>
                `).join('');

                const activeCount = app.state.todos.filter(t => !t.completed).length;
                const countEl = document.getElementById('todoCount');
                if (countEl) countEl.textContent = `${activeCount} Aufgabe${activeCount === 1 ? '' : 'n'} übrig`;
            }

            // Category Management UI (Settings page)
            const catManager = document.getElementById('categoryManager');
            if (catManager) {
                catManager.innerHTML = app.state.todoCategories.map(c => `
                    <div class="category-tag" style="display:inline-flex; align-items:center; gap:5px; background:rgba(255,255,255,0.1); padding:4px 10px; border-radius:20px; font-size:0.8rem; margin:2px;">
                        ${c} <i data-lucide="x" size="12" style="cursor:pointer;" onclick="app.todo.deleteCategory('${c}')"></i>
                    </div>
                `).join('') + `<button class="btn-text" style="font-size:0.8rem; margin-left:10px;" onclick="app.todo.addCategory()">+ Neu</button>`;
            }

            if (window.lucide) lucide.createIcons();
        }
    },

    // --- CONTACTS MODULE ---
    contacts: {
        add(contactData) {
            if (app.state.editingContactId) {
                const index = app.state.contacts.findIndex(c => c.id === app.state.editingContactId);
                if (index !== -1) {
                    app.state.contacts[index] = {
                        ...app.state.contacts[index],
                        ...contactData,
                        updatedAt: Date.now()
                    };
                }
                app.state.editingContactId = null;
            } else {
                const newContact = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    ...contactData,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                app.state.contacts.unshift(newContact);
            }
            app.saveLocal();
            this.render();
            if (app.sync && app.sync.push) app.sync.push();
        },

        edit(id) {
            const contact = app.state.contacts.find(c => c.id === id);
            if (!contact) return;

            app.state.editingContactId = id;

            document.getElementById('contactModalTitle').textContent = "Kontakt bearbeiten";
            document.getElementById('contactName').value = contact.name || '';
            document.getElementById('contactPhone').value = contact.phone || '';
            document.getElementById('contactEmail').value = contact.email || '';
            document.getElementById('contactAddress').value = contact.address || '';
            document.getElementById('contactBirthday').value = contact.birthday || '';
            document.getElementById('contactNotes').value = contact.notes || '';
            document.getElementById('contactIsFavorite').checked = !!contact.isFavorite;

            document.getElementById('contactModalOverlay').classList.remove('hidden');
        },

        toggleFavorite(id) {
            const contact = app.state.contacts.find(c => c.id === id);
            if (contact) {
                contact.isFavorite = !contact.isFavorite;
                contact.updatedAt = Date.now();
                app.saveLocal();
                this.render();
                if (app.sync && app.sync.push) app.sync.push();
            }
        },

        delete(id) {
            if (confirm("Kontakt wirklich löschen?")) {
                app.state.contacts = app.state.contacts.filter(c => c.id !== id);
                app.saveLocal();
                this.render();
                if (app.sync && app.sync.push) app.sync.push();
            }
        },

        openModal() {
            app.state.editingContactId = null;
            document.getElementById('contactModalTitle').textContent = "Kontakt hinzufügen";
            document.getElementById('contactForm').reset();
            document.getElementById('contactModalOverlay').classList.remove('hidden');
        },

        closeModal() {
            document.getElementById('contactModalOverlay').classList.add('hidden');
        },

        import(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                if (file.name.toLowerCase().endsWith('.vcf')) {
                    this.parseVCF(text);
                } else if (file.name.toLowerCase().endsWith('.csv')) {
                    this.parseCSV(text);
                } else {
                    alert("Format nicht unterstützt. Bitte VCF oder CSV verwenden.");
                }
                input.value = ''; // Reset
            };
            reader.readAsText(file);
        },

        parseVCF(text) {
            const cards = text.split(/BEGIN:VCARD/i);
            let count = 0;

            cards.forEach(card => {
                if (!card.trim()) return;

                const fnMatch = card.match(/FN:(.*)/i);
                // Fallback to N if FN is missing: N:Last;First;...
                const nMatch = card.match(/N:(.*)/i);

                let name = fnMatch ? fnMatch[1].trim() : '';
                if (!name && nMatch) {
                    const parts = nMatch[1].split(';');
                    // Usually Last;First
                    const first = parts[1] || '';
                    const last = parts[0] || '';
                    name = (first + ' ' + last).trim();
                }

                // Simple Tel match - might catch multiple, just take first
                const telMatch = card.match(/TEL.*:(.*)/i);
                const emailMatch = card.match(/EMAIL.*:(.*)/i);

                const phone = telMatch ? telMatch[1].trim() : '';
                const email = emailMatch ? emailMatch[1].trim() : '';

                if (name) {
                    // Don't trigger sync/save for every single contact to avoid freeze
                    const newContact = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name, phone, email, address: '', notes: 'Importiert (VCF)',
                        createdAt: Date.now(), updatedAt: Date.now()
                    };
                    app.state.contacts.unshift(newContact);
                    count++;
                }
            });

            app.saveLocal();
            app.sync.push();
            this.render();
            alert(`${count} Kontakte importiert!`);
        },

        parseCSV(text) {
            const lines = text.split('\n');
            let count = 0;
            lines.forEach((line, i) => {
                if (i === 0) return; // Skip Header
                const [name, phone, email] = line.split(',');
                if (name && name.trim()) {
                    const newContact = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: name.trim(),
                        phone: phone?.trim().replace(/"/g, '') || '',
                        email: email?.trim().replace(/"/g, '') || '',
                        address: '',
                        notes: 'Importiert (CSV)',
                        createdAt: Date.now(), updatedAt: Date.now()
                    };
                    app.state.contacts.unshift(newContact);
                    count++;
                }
            });
            app.saveLocal();
            app.sync.push();
            this.render();
            alert(`${count} Kontakte importiert.`);
        },

        render() {
            const container = document.getElementById('contactMainContainer');
            if (!container) return;

            // Also render the favorites sub-section
            app.renderFavorites();

            const search = document.getElementById('contactSearch')?.value.toLowerCase() || '';
            const filtered = app.state.contacts.filter(c =>
                c.name.toLowerCase().includes(search) ||
                (c.notes && c.notes.toLowerCase().includes(search)) ||
                (c.address && c.address.toLowerCase().includes(search))
            ).sort((a, b) => a.name.localeCompare(b.name));

            if (filtered.length === 0) {
                container.innerHTML = '<div class="glass" style="text-align:center; padding: 40px; color: var(--text-muted);">Keine Kontakte gefunden.</div>';
                return;
            }

            if (app.state.contactView === 'table') {
                this.renderTable(container, filtered);
            } else {
                this.renderCards(container, filtered);
            }

            if (window.lucide) lucide.createIcons();
        },

        renderTable(container, filtered) {
            container.innerHTML = `
                <div class="glass" style="overflow-x: auto; padding: 0;">
                    <table class="contact-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;"></th>
                                <th>Name</th>
                                <th>Telefon</th>
                                <th>E-Mail</th>
                                <th>Adresse</th>
                                <th>Geburtstag</th>
                                <th style="width: 80px;">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(c => `
                                <tr class="contact-row">
                                    <td>
                                        <div class="avatar-small" style="background: linear-gradient(135deg, var(--primary), var(--secondary));">
                                            ${c.name.charAt(0).toUpperCase()}
                                        </div>
                                    </td>
                                    <td class="font-medium">${c.name}</td>
                                    <td>${c.phone ? `<a href="tel:${c.phone}" class="text-link">${c.phone}</a>` : '<span class="text-muted">-</span>'}</td>
                                    <td>${c.email ? `<a href="mailto:${c.email}" class="text-link">${c.email}</a>` : '<span class="text-muted">-</span>'}</td>
                                    <td>${c.address ? `<a href="https://maps.google.com/?q=${encodeURIComponent(c.address)}" target="_blank" class="text-link truncate" title="${c.address}">${c.address}</a>` : '<span class="text-muted">-</span>'}</td>
                                    <td>${c.birthday ? `<span class="text-link">${new Date(c.birthday).toLocaleDateString('de-DE')} 🎂</span>` : '<span class="text-muted">-</span>'}</td>
                                    <td>
                                        <div style="display:flex; gap:5px;">
                                            <button class="btn-icon ${c.isFavorite ? 'active-fav' : ''}" onclick="app.contacts.toggleFavorite('${c.id}')" title="Favorit toggeln">
                                                <i data-lucide="${c.isFavorite ? 'heart-off' : 'heart'}" size="18"></i>
                                            </button>
                                            <button class="btn-icon" onclick="app.contacts.edit('${c.id}')" title="Bearbeiten">
                                                <i data-lucide="edit-2" size="18"></i>
                                            </button>
                                            <button class="btn-icon-danger" onclick="app.contacts.delete('${c.id}')" title="Löschen">
                                                <i data-lucide="trash-2" size="18"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        renderCards(container, filtered) {
            container.innerHTML = `
                <div class="contact-cards-grid">
                    ${filtered.map(c => `
                        <div class="contact-card glass">
                            <div class="card-top">
                                <div class="avatar-large" style="background: linear-gradient(135deg, var(--primary), var(--secondary));">
                                    ${c.name.charAt(0).toUpperCase()}
                                </div>
                                <div class="card-actions">
                                    <button class="btn-icon ${c.isFavorite ? 'active-fav' : ''}" onclick="app.contacts.toggleFavorite('${c.id}')" title="Favorit toggeln">
                                        <i data-lucide="${c.isFavorite ? 'heart-off' : 'heart'}" size="16"></i>
                                    </button>
                                    <button class="btn-icon" onclick="app.contacts.edit('${c.id}')"><i data-lucide="edit-2" size="16"></i></button>
                                    <button class="btn-icon-danger" onclick="app.contacts.delete('${c.id}')"><i data-lucide="trash-2" size="16"></i></button>
                                </div>
                            </div>
                            <div class="card-info">
                                <h3>${c.name}</h3>
                                ${c.phone ? `<a href="tel:${c.phone}" class="info-line"><i data-lucide="phone" size="14"></i> ${c.phone}</a>` : ''}
                                ${c.email ? `<a href="mailto:${c.email}" class="info-line"><i data-lucide="mail" size="14"></i> ${c.email}</a>` : ''}
                                ${c.birthday ? `<div class="info-line"><i data-lucide="cake" size="14"></i> ${new Date(c.birthday).toLocaleDateString('de-DE')}</div>` : ''}
                                ${c.address ? `
                                    <div class="address-box">
                                        <i data-lucide="map-pin" size="14"></i>
                                        <div class="address-text">
                                            <p>${c.address}</p>
                                            <a href="https://maps.google.com/?q=${encodeURIComponent(c.address)}" target="_blank" class="map-link">Auf Karte zeigen →</a>
                                        </div>
                                    </div>
                                ` : ''}
                                ${c.notes ? `<p class="notes-preview">"${c.notes}"</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        },
    },

    // --- ALARM MODULE ---
    alarm: {
        weatherLoaded: false,
        init() {
            // Request Notification Permission
            if ("Notification" in window && Notification.permission !== "granted") {
                Notification.requestPermission();
            }

            setInterval(() => {
                this.updateClock();
                this.checkAlarm();
                this.checkReminders();
            }, 1000);
        },

        updateClock() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const clockEl = document.getElementById('nightModeClock');
            if (clockEl) clockEl.textContent = timeStr;

            // Fullscreen Clock
            const fsClock = document.getElementById('fullscreenClock');
            if (fsClock) fsClock.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

            const fsDate = document.getElementById('fullscreenDate');
            if (fsDate) fsDate.textContent = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

            // Auto-Night Mode Check
            this.checkAutoNightMode(now);

            // Update Dashboard clock if visible
            if (app.state.view === 'dashboard') {
                this.updateDashboardTime(now);
            }
        },

        updateDashboardTime(now) {
            const clockEl = document.getElementById('dashClock');
            const dateEl = document.getElementById('dashDate');
            const tempEl = document.getElementById('dashTemp');
            const locEl = document.getElementById('dashLocation');

            if (clockEl) {
                clockEl.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            }
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' });
            }

            // Fetch weather and location only once per session or periodically
            if (!this.weatherLoaded) {
                this.fetchWeatherData();
                this.weatherLoaded = true;
            }
        },

        async fetchWeatherData() {
            if (!navigator.geolocation) return;

            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Fetch real temperature from Open-Meteo
                    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                    const data = await response.json();

                    const tempEl = document.getElementById('dashTemp');
                    if (tempEl && data.current_weather) {
                        tempEl.textContent = `${Math.round(data.current_weather.temperature)}°C`;
                    }

                    // Fetch location name (Reverse Geocoding)
                    const locResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const locData = await locResponse.json();

                    const locEl = document.getElementById('dashLocation');
                    if (locEl) {
                        const city = locData.address.city || locData.address.town || locData.address.village || 'Standort';
                        locEl.textContent = city;
                    }
                } catch (error) {
                    console.error("Weather/Location fetch failed:", error);
                    const tempEl = document.getElementById('dashTemp');
                    if (tempEl) tempEl.textContent = 'N/A';
                    const locEl = document.getElementById('dashLocation');
                    if (locEl) locEl.textContent = 'Unbekannt';
                }
            }, (error) => {
                console.warn("Geolocation denied or failed:", error);
                const locEl = document.getElementById('dashLocation');
                if (locEl) locEl.textContent = 'Lokaler Modus';
            });
        },

        checkAutoNightMode(now) {
            const current = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            if (current === app.state.nightModeStart && !app.state.isNightClockFullscreen) {
                this.toggleFullscreen(true);
                // Also ensure wake lock is on
                const wakeCheck = document.getElementById('wakeLockCheck');
                if (wakeCheck && !wakeCheck.checked) {
                    wakeCheck.checked = true;
                    this.toggleWakeLock();
                }
            }
        },

        checkReminders() {
            const now = new Date();
            app.state.events.forEach(e => {
                // Skip passed events or already notified
                if (e.notified) return;

                const eventTime = new Date(`${e.date}T${e.time || '00:00'}`);
                const diffMs = eventTime - now;
                const diffMins = diffMs / 60000;

                // Alert if within 60 minutes and future
                if (diffMins > 0 && diffMins <= 60) {
                    this.sendNotification(e, Math.ceil(diffMins));
                    e.notified = true; // Mark as notified in memory (resets on reload, reasonable)
                }
            });
        },

        sendNotification(event, minsLeft) {
            const title = `Termin in ${minsLeft} Min: ${event.title}`;
            const options = {
                body: `${event.time} Uhr - ${event.location || 'Kein Ort'}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png' // Generic calendar icon
            };

            // Browser Notification
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, options);
            }

            // Subtle In-App Toast (always works)
            this.showToast(title, event.color);
        },

        showToast(text, color) {
            const toast = document.createElement('div');
            toast.className = 'glass animate-in';
            toast.style.cssText = `
                position: fixed; 
                top: 20px; 
                right: 20px; 
                background: ${color || 'var(--primary)'}; 
                color: white; 
                padding: 15px 20px; 
                border-radius: 12px; 
                z-index: 10000; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                display: flex; align-items: center; gap: 10px;
                min-width: 250px;
            `;
            toast.innerHTML = `<i data-lucide="bell" size="20"></i> <div style="font-weight:600;">${text}</div>`;
            document.body.appendChild(toast);

            if (window.lucide) lucide.createIcons();

            // Sound (Subtle "Pop")
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Audio autoplay blocked"));

            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 500);
            }, 5000);
        },

        toggleFullscreen(force = null) {
            app.state.isNightClockFullscreen = force !== null ? force : !app.state.isNightClockFullscreen;
            const overlay = document.getElementById('nightClockFullscreen');
            if (overlay) {
                overlay.classList.toggle('hidden', !app.state.isNightClockFullscreen);
            }
        },

        saveSettings() {
            const start = document.getElementById('nightModeStart').value;
            app.state.nightModeStart = start;
            localStorage.setItem('moltbot_night_mode_start', start);
        },

        updateDesign(type, value) {
            const clockEl = document.getElementById('fullscreenClock');
            const overlay = document.getElementById('nightClockFullscreen');

            if (type === 'brightness') {
                app.state.nightModeBrightness = value;
                localStorage.setItem('moltbot_night_brightness', value);

                // Only change content opacity, keep background black (opacity 1)
                if (clockEl) clockEl.style.opacity = value;
                const dateEl = document.getElementById('fullscreenDate');
                if (dateEl) dateEl.style.opacity = value;
                // Also dim controls or hint if preferred, but usually we want to see controls

                // Ensure overlay itself is fully opaque (black background)
                if (overlay) overlay.style.opacity = '1';

                // Sync Inputs
                const in1 = document.getElementById('nightBrightness');
                const in2 = document.getElementById('fsBrightness');
                if (in1 && in1.value !== value) in1.value = value;
                if (in2 && in2.value !== value) in2.value = value;
            } else if (type === 'color') {
                app.state.nightModeColor = value;
                localStorage.setItem('moltbot_night_color', value);
                if (clockEl) {
                    clockEl.style.color = value;
                    clockEl.style.textShadow = `0 0 30px ${value}4D`; // 30% opacity hex
                }

                // Sync Inputs
                const in1 = document.getElementById('nightColor');
                const in2 = document.getElementById('fsColor');
                if (in1 && in1.value !== value) in1.value = value;
                if (in2 && in2.value !== value) in2.value = value;
            }
        },

        add() {
            const timeInput = document.getElementById('newAlarmTime');
            const daySelector = document.querySelectorAll('.day-selector input:checked');

            if (!timeInput.value) return;

            const days = Array.from(daySelector).map(input => parseInt(input.value));

            const newAlarm = {
                id: Date.now().toString(),
                time: timeInput.value,
                days: days,
                active: true
            };

            app.state.alarms.push(newAlarm);
            this.save();
            this.render();
            timeInput.value = '';
        },

        toggle(id) {
            const alarm = app.state.alarms.find(a => a.id === id);
            if (alarm) {
                alarm.active = !alarm.active;
                this.save();
                this.render();
            }
        },

        delete(id) {
            app.state.alarms = app.state.alarms.filter(a => a.id !== id);
            this.save();
            this.render();
        },

        save() {
            localStorage.setItem('moltbot_alarms', JSON.stringify(app.state.alarms));
        },

        checkAlarm() {
            if (app.state.alarms.length === 0) return;


            const now = new Date();
            const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
            const currentTime = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

            app.state.alarms.forEach(alarm => {
                if (alarm.active && alarm.time === currentTime && alarm.days.includes(currentDay)) {
                    // Avoid double trigger in the same minute
                    if (alarm.lastTriggered === currentTime) return;

                    alarm.lastTriggered = currentTime;
                    this.trigger(alarm);
                }
            });
        },

        trigger(alarm) {
            // High-frequency alert
            const stop = window.confirm(`🔔 WECKER! Es ist ${alarm.time} Uhr.\nStoppen?`);
            if (stop) {
                // If it's a non-recurring (once) alarm, we could deactivate it, 
                // but since the user chose days, we keep it active for next week.
            }
        },

        async toggleWakeLock() {
            const check = document.getElementById('wakeLockCheck');
            if (!check) return;

            if (check.checked) {
                try {
                    if ('wakeLock' in navigator) {
                        app.state.wakeLock = await navigator.wakeLock.request('screen');
                        console.log("Wake Lock active");
                    } else {
                        alert("Dein Browser unterstützt das Wachbleiben leider nicht.");
                        check.checked = false;
                    }
                } catch (err) {
                    console.error(`${err.name}, ${err.message}`);
                    check.checked = false;
                }
            } else {
                if (app.state.wakeLock) {
                    app.state.wakeLock.release().then(() => {
                        app.state.wakeLock = null;
                        console.log("Wake Lock released");
                    });
                }
            }
        },

        render() {
            const list = document.getElementById('alarmList');
            if (!list) return;

            if (app.state.alarms.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Noch keine Wecker eingestellt.</div>';
                return;
            }

            const dayNames = { 0: 'So', 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa' };

            list.innerHTML = app.state.alarms.map(alarm => {
                const readableDays = alarm.days.length === 7 ? 'Täglich' :
                    alarm.days.length === 0 ? 'Nie' :
                        alarm.days.sort().map(d => dayNames[d]).join(', ');

                return `
                    <div class="alarm-card ${alarm.active ? '' : 'inactive'}" onclick="app.alarm.toggle('${alarm.id}')" style="cursor:pointer;">
                        <div class="alarm-info-main">
                            <span class="alarm-time-display">${alarm.time}</span>
                            <span class="alarm-days-display">${readableDays}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:15px;">
                            <div class="custom-switch" style="width: 40px; height: 20px; background: ${alarm.active ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; border-radius: 20px; position:relative; transition: 0.3s;">
                                <div style="width: 16px; height: 16px; background: white; border-radius: 50%; position:absolute; top: 2px; ${alarm.active ? 'right: 2px;' : 'left: 2px;'}; transition: 0.3s;"></div>
                            </div>
                            <button onclick="event.stopPropagation(); app.alarm.delete('${alarm.id}')" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;">
                                <i data-lucide="trash-2" size="20"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();

            // Populate settings
            const startInput = document.getElementById('nightModeStart');
            if (startInput) startInput.value = app.state.nightModeStart;

            const brightInput = document.getElementById('nightBrightness');
            if (brightInput) brightInput.value = app.state.nightModeBrightness;

            const colorInput = document.getElementById('nightColor');
            if (colorInput) colorInput.value = app.state.nightModeColor;

            // Populate Fullscreen inputs
            const fsBright = document.getElementById('fsBrightness');
            if (fsBright) fsBright.value = app.state.nightModeBrightness;
            const fsColor = document.getElementById('fsColor');
            if (fsColor) fsColor.value = app.state.nightModeColor;

            // Apply styles immediately
            this.updateDesign('brightness', app.state.nightModeBrightness);
            this.updateDesign('color', app.state.nightModeColor);
        }
    },

    // --- HOLIDAY MODULE ---
    holidays: {
        getForYear(year) {
            const holidays = [];

            // Fixed Holidays
            const fixed = [
                { d: 1, m: 0, t: 'Neujahr' },
                { d: 6, m: 0, t: 'Heilige Drei Könige', bw: true },
                { d: 1, m: 4, t: 'Tag der Arbeit' },
                { d: 3, m: 9, t: 'Tag der Deutschen Einheit' },
                { d: 1, m: 10, t: 'Allerheiligen', bw: true },
                { d: 24, m: 11, t: 'Heiligabend' },
                { d: 25, m: 11, t: '1. Weihnachtstag' },
                { d: 26, m: 11, t: '2. Weihnachtstag' },
                { d: 31, m: 11, t: 'Silvester' }
            ];

            fixed.forEach(h => {
                holidays.push({
                    id: `hol-${year}-${h.m}-${h.d}`,
                    title: h.t,
                    date: `${year}-${String(h.m + 1).padStart(2, '0')}-${String(h.d).padStart(2, '0')}`,
                    category: 'holiday',
                    isBW: h.bw || false,
                    allDay: true
                });
            });

            // Easter Calculation (Gauss)
            const a = year % 19;
            const b = Math.floor(year / 100);
            const c = year % 100;
            const d = Math.floor(b / 4);
            const e = b % 4;
            const f = Math.floor((b + 8) / 25);
            const g = Math.floor((b - f + 1) / 3);
            const h = (19 * a + b - d - g + 15) % 30;
            const i = Math.floor(c / 4);
            const k = c % 4;
            const l = (32 + 2 * e + 2 * i - h - k) % 7;
            const m = Math.floor((a + 11 * h + 22 * l) / 451);

            const easterMonth = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
            const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
            const easterDate = new Date(year, easterMonth, easterDay);

            const addDays = (date, days) => {
                const result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
            };

            const variableHolidays = [
                { t: 'Karfreitag', offset: -2 },
                { t: 'Ostermontag', offset: 1 },
                { t: 'Christi Himmelfahrt', offset: 39 },
                { t: 'Pfingstmontag', offset: 50 },
                { t: 'Fronleichnam', offset: 60, bw: true }
            ];

            variableHolidays.forEach(vh => {
                const date = addDays(easterDate, vh.offset);
                holidays.push({
                    id: `hol-var-${year}-${vh.t}`,
                    title: vh.t,
                    date: date.toISOString().split('T')[0],
                    category: 'holiday',
                    isBW: vh.bw || false,
                    allDay: true
                });
            });


            return holidays;
        }
    },

    // --- VOICE CONTROL MODULE ---
    voice: {
        recognition: null,
        isListening: false,

        init() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn("Speech Recognition not supported in this browser.");
                return;
            }

            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'de-DE';
            this.recognition.interimResults = true;
            this.recognition.continuous = false;

            this.recognition.onstart = () => {
                this.isListening = true;
                document.getElementById('voiceOverlay').classList.remove('hidden');
                document.getElementById('voiceTranscript').textContent = "Ich höre zu...";
            };

            this.recognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');

                const resultEl = document.getElementById('voiceTranscript');
                if (resultEl) resultEl.textContent = transcript;

                if (event.results[0].isFinal) {
                    this.process(transcript);
                    setTimeout(() => this.stop(), 1500);
                }
            };

            this.recognition.onerror = (e) => {
                console.error("Speech Recognition Error:", e);
                this.stop();
            };

            this.recognition.onend = () => {
                this.isListening = false;
            };
        },

        start() {
            if (!this.recognition) this.init();
            if (this.recognition && !this.isListening) {
                try {
                    this.recognition.start();
                } catch (e) { console.error(e); }
            }
        },

        stop() {
            if (this.recognition && this.isListening) {
                this.recognition.stop();
            }
            document.getElementById('voiceOverlay').classList.add('hidden');
        },

        process(text) {
            const input = text.toLowerCase();
            console.log("Processing Voice Command:", input);

            // 1. FINANCE DETECTION
            if (input.includes('euro') || input.includes('betrag') || input.includes('ausgabe') || input.includes('kosten') || input.includes('€')) {
                this.handleFinance(text);
                return;
            }

            // 2. APPOINTMENT DETECTION (TERMIN)
            if (input.includes('termin') || input.includes('treffen') || input.includes('meeting') || input.includes('uhr')) {
                this.handleEvent(text);
                return;
            }

            // 3. TODO DETECTION
            if (input.includes('aufgabe') || input.includes('todo') || input.includes('kaufen') || input.includes('besorgen') || input.includes('erinnerung')) {
                this.handleTodo(text);
                return;
            }

            // 4. DEFAULT: NOTE (NOTIZ)
            this.handleTodo(text, '👤 Privat'); // Save as private note by default
        },

        handleFinance(text) {
            const amountMatches = text.match(/(\d+([,.]\d+)?)/);
            if (!amountMatches) return alert("Habe keinen Betrag verstanden.");

            const amount = parseFloat(amountMatches[1].replace(',', '.'));
            // Remove the keywords to get the source/title
            let source = text.replace(/euro|betrag|ausgabe|kosten|€/gi, '')
                .replace(/(\d+([,.]\d+)?)/, '')
                .replace(/für|ein|eine/gi, '')
                .trim();

            if (!source) source = "Sprach-Eintrag";

            const entry = {
                id: Date.now().toString(),
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                source: source.charAt(0).toUpperCase() + source.slice(1),
                createdAt: Date.now()
            };

            app.state.finance.push(entry);
            app.saveLocal();
            if (app.state.view === 'finance') app.finance.render();
            this.showFeedback(`Betrag gespeichert: ${amount}€ für ${source}`);
        },

        handleTodo(text, forcedCategory = null) {
            let label = text.replace(/aufgabe|todo|kaufen|besorgen|erinnerung|notiere|notiz/gi, '')
                .replace(/bitte|mal/gi, '')
                .trim();

            if (!label) return;

            const category = forcedCategory || (text.includes('kaufen') ? '🛒 Einkauf' : '👤 Privat');

            const newTodo = {
                id: Date.now().toString(),
                text: label.charAt(0).toUpperCase() + label.slice(1),
                category: category,
                completed: false,
                createdAt: Date.now()
            };

            app.state.todos.unshift(newTodo);
            app.saveLocal();
            if (app.state.view === 'todo') app.todo.render();
            this.showFeedback(`Aufgabe hinzugefügt: ${label}`);
        },

        handleEvent(text) {
            let title = text.replace(/termin|treffen|meeting|um|uhr/gi, '').trim();
            let date = new Date().toISOString().split('T')[0];
            let time = "10:00";

            // Date Detection (Basic)
            if (text.includes('morgen')) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                date = tomorrow.toISOString().split('T')[0];
                title = title.replace('morgen', '').trim();
            }

            // Time Detection (Basic: "10 Uhr" or "10:30")
            const timeMatch = text.match(/(\d{1,2})([:.](\d{2}))?\s*(uhr)?/i);
            if (timeMatch) {
                const h = timeMatch[1].padStart(2, '0');
                const m = timeMatch[3] || '00';
                time = `${h}:${m}`;
                title = title.replace(timeMatch[0], '').trim();
            }

            const newEvent = {
                id: Date.now().toString(),
                title: title.charAt(0).toUpperCase() + title.slice(1) || "Neuer Termin",
                date: date,
                time: time,
                category: 'work',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            app.state.events.push(newEvent);
            app.saveLocal();
            if (app.sync && app.sync.push) app.sync.push();
            app.render();
            this.showFeedback(`Termin gespeichert: ${newEvent.title} am ${new Date(date).toLocaleDateString()} um ${time} Uhr`);
        },

        showFeedback(msg) {
            const resultEl = document.getElementById('voiceTranscript');
            if (resultEl) {
                resultEl.style.color = 'var(--success)';
                resultEl.textContent = "✔ " + msg;
            }
        }
    }
};

// Start the app when ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
