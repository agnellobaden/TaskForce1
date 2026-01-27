// TEAM SYNC & REAL-TIME NOTIFICATIONS MODULE
// Add this to app.js after the cloud module

app.cloud = {
    db: null,
    activeMembers: [],
    lastSync: 0,
    syncInterval: null,
    changeListener: null,

    init() {
        // Check if Firebase config exists
        if (!app.state.cloud || !app.state.cloud.firebaseConfig) {
            console.log('No Firebase config found. Team sync disabled.');
            return;
        }

        try {
            const config = JSON.parse(app.state.cloud.firebaseConfig);
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
            }
            this.db = firebase.firestore();

            // Start presence tracking
            this.trackPresence();

            // Start real-time listener
            this.startRealtimeSync();

            // Periodic sync every 30 seconds
            this.syncInterval = setInterval(() => this.sync(), 30000);

            console.log('✅ Team Sync aktiviert');
            // Inject Helper into app.team if possible
            if (app.team) {
                app.team.renderReadStatus = this.renderReadStatus.bind(this);
            }
        } catch (e) {
            console.error('Firebase Init Error:', e);
        }
    },

    async sync(force = false) {
        if (!this.db || !app.state.user.teamName) return;

        const now = Date.now();
        if (!force && now - this.lastSync < 10000) return; // Debounce 10s

        // SMART SYNC: Only sync if local changes occurred since last sync
        const lastLocalChange = app.state.lastLocalChange || 0;
        if (!force && lastLocalChange <= this.lastSync) {
            // No local changes -> Skip sync to avoid overwriting remote state (like readBy)
            return;
        }

        try {
            const teamDoc = this.db.collection('teams').doc(app.state.user.teamName);

            // Upload local state
            await teamDoc.set({
                tasks: app.state.tasks || [],
                events: app.state.events || [],
                expenses: app.state.expenses || [],
                contacts: app.state.contacts || [],
                habits: app.state.habits || [],
                projects: app.state.projects || [],
                meetings: app.state.meetings || [],
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: app.state.user.name || 'Unbekannt',
                readBy: [app.state.user.name || 'Unbekannt'] // Reset read status on new changes
            }, { merge: true });

            this.lastSync = now;
            this.updateSyncStatus('synced');

            console.log('âœ… Cloud Sync erfolgreich');
        } catch (e) {
            console.error('Sync Error:', e);
            this.updateSyncStatus('error');
        }
    },

    // Inject Render Function
    renderReadStatus(readBy = []) {
        // Target BOTH the team view list AND the dashboard card list
        const containers = [
            document.getElementById('teamReadReceipts'),
            document.getElementById('dashboardReadReceiptsList')
        ];

        containers.forEach(container => {
            if (!container) return;

            if (!readBy || readBy.length === 0) {
                container.innerHTML = '<div class="text-muted text-sm" style="font-style:italic;">Noch nicht gelesen.</div>';
                return;
            }

            container.innerHTML = readBy.map(name => `
                <div style="display:flex; align-items:center; gap:6px; background:rgba(34,197,94,0.1); padding:4px 8px; border-radius:12px; border:1px solid rgba(34,197,94,0.3);">
                     <div style="width:16px; height:16px; background:#22c55e; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px;">✓</div>
                     <span style="font-size:0.85rem; font-weight:600; color:var(--text-main);">${name}</span>
                </div>
            `).join('');
        });
    },

    startRealtimeSync() {
        if (!this.db || !app.state.user.teamName) return;

        const teamDoc = this.db.collection('teams').doc(app.state.user.teamName);

        // Listen for changes
        this.changeListener = teamDoc.onSnapshot((doc) => {
            if (!doc.exists) return;

            const data = doc.data();
            const updatedBy = data.updatedBy || 'Team-Mitglied';
            const updateTimestamp = data.lastUpdate ? data.lastUpdate.toMillis() : Date.now();
            const readBy = data.readBy || [];

            console.log('ðŸ“¡ Team-Sync Update empfangen von:', updatedBy, 'Timestamp:', updateTimestamp, 'Gelesen von:', readBy);

            // Update Read Receipts UI
            if (this.renderReadStatus) this.renderReadStatus(readBy);
            // Also try app.team if available
            if (app.team && app.team.renderReadStatus) app.team.renderReadStatus(readBy);

            // NEU: Lesebestätigung für den ABSENDER anzeigen
            if (updatedBy === app.state.user.name) {
                // Ich bin der Absender. Prüfe, ob neue Leute gelesen haben
                if (this.lastReadCount !== undefined && readBy.length > this.lastReadCount) {
                    const newReaders = readBy.filter(name => name !== app.state.user.name);
                    const latestReader = newReaders[newReaders.length - 1];

                    if (latestReader) {
                        console.log(`👁️ Lesebestätigung: ${latestReader} hat deine Änderungen gesehen`);
                        if (window.showToast) {
                            showToast(`👁️ ${latestReader} hat deine Änderungen gelesen`, 'success');
                        }
                    }
                }
                this.lastReadCount = readBy.length;

                // Wir haben unser eigenes Update empfangen - wir müssen das Modal trotzdem zeigen (benutzerwunsch)
                // Aber wir müssen nicht mergen, da wir die Daten ja gerade gesendet haben.
            }

            // Check if this user has already acknowledged this update
            const notificationId = `team_update_${updateTimestamp}`;
            const acknowledgedNotifications = app.state.acknowledgedNotifications || [];

            console.log('🔍 Notification ID:', notificationId);
            console.log('📋 Bereits bestätigt:', acknowledgedNotifications.includes(notificationId));

            // Skip if already acknowledged by this user
            if (acknowledgedNotifications.includes(notificationId)) {
                console.log('✅ Update bereits bestätigt, überspringe Benachrichtigung');
                // Just update data silently
                this.mergeRemoteData(data);
                app.renderDashboard();
                if (app.tasks) app.tasks.render();
                if (app.calendar) app.calendar.render();
                if (app.finance) app.finance.render();
                return;
            }

            // Check what changed
            const changes = this.detectChanges(data);
            console.log('🔄 Erkannte Änderungen:', changes.length, changes);

            if (changes.length > 0) {
                console.log('🔔 Zeige Benachrichtigung für:', changes);
                // Show notification - MUST be acknowledged by THIS user
                this.notifyChanges(updatedBy, changes, notificationId);

                // Update local state
                this.mergeRemoteData(data);

                // Re-render UI
                if (app.calendar) app.calendar.render();
                if (app.finance) app.finance.render();
            } else {
                // Fallback & Self-Test: Auch bei keinen erkannten Änderungen oder eigener Änderung benachrichtigen (für Tests)
                // Dies stellt sicher, dass das Popup IMMER kommt, solange es nicht bestätigt wurde.
                console.log('🔔 Zeige Benachrichtigung (Fallback/Test)');

                let msg = 'Allgemeine Aktualisierung';
                if (updatedBy === app.state.user.name) {
                    msg = 'Deine Änderung (Anderer Tab/Gerät)';
                }

                this.notifyChanges(updatedBy, [{ type: 'info', icon: '📝', text: msg }], notificationId);
                this.mergeRemoteData(data);
                app.renderDashboard();
            }
        }, (error) => {
            console.error('Realtime Sync Error:', error);
        });
    },

    detectChanges(remoteData) {
        const changes = [];

        // Check tasks (Hinzufügen UND Löschen)
        const remoteTasks = remoteData.tasks || [];
        const localTasks = app.state.tasks || [];
        if (remoteTasks.length > localTasks.length) {
            const newCount = remoteTasks.length - localTasks.length;
            changes.push({ type: 'add', icon: '➕', text: `${newCount} neue Aufgabe${newCount > 1 ? 'n' : ''}` });
        } else if (remoteTasks.length < localTasks.length) {
            const deletedCount = localTasks.length - remoteTasks.length;
            changes.push({ type: 'delete', icon: '🗑️', text: `${deletedCount} Aufgabe${deletedCount > 1 ? 'n' : ''} gelöscht` });
        }

        // Check events (Hinzufügen UND Löschen)
        const remoteEvents = remoteData.events || [];
        const localEvents = app.state.events || [];
        if (remoteEvents.length > localEvents.length) {
            const newCount = remoteEvents.length - localEvents.length;
            changes.push({ type: 'add', icon: '➕', text: `${newCount} neuer Termin${newCount > 1 ? 'e' : ''}` });
        } else if (remoteEvents.length < localEvents.length) {
            const deletedCount = localEvents.length - remoteEvents.length;
            changes.push({ type: 'delete', icon: '🗑️', text: `${deletedCount} Termin${deletedCount > 1 ? 'e' : ''} gelöscht` });
        }

        // Check expenses (Hinzufügen UND Löschen)
        const remoteExpenses = remoteData.expenses || [];
        const localExpenses = app.state.expenses || [];
        if (remoteExpenses.length > localExpenses.length) {
            const newCount = remoteExpenses.length - localExpenses.length;
            changes.push({ type: 'add', icon: '➕', text: `${newCount} neue Ausgabe${newCount > 1 ? 'n' : ''}` });
        } else if (remoteExpenses.length < localExpenses.length) {
            const deletedCount = localExpenses.length - remoteExpenses.length;
            changes.push({ type: 'delete', icon: '🗑️', text: `${deletedCount} Ausgabe${deletedCount > 1 ? 'n' : ''} gelöscht` });
        }

        // Check contacts (Hinzufügen UND Löschen)
        const remoteContacts = remoteData.contacts || [];
        const localContacts = app.state.contacts || [];
        if (remoteContacts.length > localContacts.length) {
            const newCount = remoteContacts.length - localContacts.length;
            changes.push({ type: 'add', icon: '➕', text: `${newCount} neuer Kontakt${newCount > 1 ? 'e' : ''}` });
        } else if (remoteContacts.length < localContacts.length) {
            const deletedCount = localContacts.length - remoteContacts.length;
            changes.push({ type: 'delete', icon: '🗑️', text: `${deletedCount} Kontakt${deletedCount > 1 ? 'e' : ''} gelöscht` });
        }

        return changes;
    },

    notifyChanges(updatedBy, changes, notificationId) {
        // Show MODAL notification (requires OK button click to dismiss)
        // WICHTIG: Jedes Team-Mitglied muss INDIVIDUELL bestätigen!
        if (window.showModalNotification) {
            const currentUser = app.state.user.name || 'Unbekannt';
            const title = `🔔 Team-Update von ${updatedBy}`;
            const mainMessage = `${updatedBy} hat folgende Änderungen vorgenommen:`;
            const details = `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${changes.map(change => {
                // Farbe basierend auf Typ (Hinzufügen = Blau, Löschen = Rot)
                const bgColor = change.type === 'delete' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                const borderColor = change.type === 'delete' ? '#ef4444' : '#3b82f6';

                return `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            padding: 8px 12px;
                            background: ${bgColor};
                            border-left: 3px solid ${borderColor};
                            border-radius: 6px;
                        ">
                            <span style="font-size: 1.2rem;">${change.icon}</span>
                            <span style="font-weight: 600;">${change.text}</span>
                        </div>
                        `;
            }).join('')}
                </div>
                <div style="
                    margin-top: 16px;
                    padding: 12px;
                    background: rgba(16, 185, 129, 0.1);
                    border-radius: 8px;
                    text-align: center;
                    color: #10b981;
                    font-weight: 600;
                ">
                    ✓ Daten wurden automatisch synchronisiert
                </div>
                <div style="
                    margin-top: 12px;
                    padding: 8px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 6px;
                    text-align: center;
                    color: #3b82f6;
                    font-size: 0.85rem;
                ">
                    👤 ${currentUser}, bitte bestätige, dass du diese Änderungen gesehen hast
                </div>
            `;

            // Show notification with onConfirm callback
            showModalNotification(title, mainMessage, 'info', details, () => {
                // This callback is called ONLY when user clicks OK
                const userName = app.state.user.name || 'Unbekannt';

                // 1. Lokale Bestätigung speichern
                if (!app.state.acknowledgedNotifications) {
                    app.state.acknowledgedNotifications = [];
                }
                if (!app.state.acknowledgedNotifications.includes(notificationId)) {
                    app.state.acknowledgedNotifications.push(notificationId);

                    // Keep only last 50 notifications to avoid memory bloat
                    if (app.state.acknowledgedNotifications.length > 50) {
                        app.state.acknowledgedNotifications = app.state.acknowledgedNotifications.slice(-50);
                    }

                    app.saveState();
                    console.log(`✅ ${userName} hat Team-Update bestätigt: ${notificationId}`);
                }

                // 2. Cloud Lesebestätigung senden (Firestore arrayUnion)
                if (this.db && app.state.user.teamName) {
                    this.db.collection('teams').doc(app.state.user.teamName).update({
                        readBy: firebase.firestore.FieldValue.arrayUnion(userName)
                    }).then(() => {
                        console.log(`📡 Lesebestätigung für ${userName} in Cloud gespeichert`);
                    }).catch(e => console.error('Error saving read receipt:', e));
                }
            });
        }

        // Play subtle sound
        this.playNotificationSound();

        // Blink sync indicator
        this.blinkSyncIndicator();
    },

    mergeRemoteData(remoteData) {
        // INTELLIGENTES MERGE: Kombiniere lokale und Remote-Daten
        // Verhindert Datenverlust wenn lokale Änderungen noch nicht synchronisiert sind

        // Merge tasks (kombiniere statt überschreiben)
        if (remoteData.tasks) {
            const localTasks = app.state.tasks || [];
            const remoteTasks = remoteData.tasks || [];

            // Erstelle Map von Remote-Tasks nach ID
            const remoteMap = new Map(remoteTasks.map(t => [t.id, t]));

            // Behalte lokale Tasks die nicht in Remote sind (neu hinzugefügt)
            const localOnly = localTasks.filter(t => !remoteMap.has(t.id));

            // Kombiniere: Remote + Lokale neue Tasks
            app.state.tasks = [...remoteTasks, ...localOnly];
        }

        // Merge events
        if (remoteData.events) {
            const localEvents = app.state.events || [];
            const remoteEvents = remoteData.events || [];
            const remoteMap = new Map(remoteEvents.map(e => [e.id, e]));
            const localOnly = localEvents.filter(e => !remoteMap.has(e.id));
            app.state.events = [...remoteEvents, ...localOnly];
        }

        // Merge expenses
        if (remoteData.expenses) {
            const localExpenses = app.state.expenses || [];
            const remoteExpenses = remoteData.expenses || [];
            const remoteMap = new Map(remoteExpenses.map(e => [e.id, e]));
            const localOnly = localExpenses.filter(e => !remoteMap.has(e.id));
            app.state.expenses = [...remoteExpenses, ...localOnly];
        }

        // Merge contacts
        if (remoteData.contacts) {
            const localContacts = app.state.contacts || [];
            const remoteContacts = remoteData.contacts || [];
            const remoteMap = new Map(remoteContacts.map(c => [c.id, c]));
            const localOnly = localContacts.filter(c => !remoteMap.has(c.id));
            app.state.contacts = [...remoteContacts, ...localOnly];
        }

        // Merge habits
        if (remoteData.habits) {
            const localHabits = app.state.habits || [];
            const remoteHabits = remoteData.habits || [];
            const remoteMap = new Map(remoteHabits.map(h => [h.id, h]));
            const localOnly = localHabits.filter(h => !remoteMap.has(h.id));
            app.state.habits = [...remoteHabits, ...localOnly];
        }

        // Merge projects
        if (remoteData.projects) {
            const localProjects = app.state.projects || [];
            const remoteProjects = remoteData.projects || [];
            const remoteMap = new Map(remoteProjects.map(p => [p.id, p]));
            const localOnly = localProjects.filter(p => !remoteMap.has(p.id));
            app.state.projects = [...remoteProjects, ...localOnly];
        }

        // Merge meetings
        if (remoteData.meetings) {
            const localMeetings = app.state.meetings || [];
            const remoteMeetings = remoteData.meetings || [];
            const remoteMap = new Map(remoteMeetings.map(m => [m.id, m]));
            const localOnly = localMeetings.filter(m => !remoteMap.has(m.id));
            app.state.meetings = [...remoteMeetings, ...localOnly];
        }

        // Save to localStorage
        localStorage.setItem('taskforce_state', JSON.stringify(app.state));
    },

    trackPresence() {
        if (!this.db || !app.state.user.teamName) return;

        const presenceRef = this.db.collection('presence')
            .doc(app.state.user.teamName)
            .collection('members')
            .doc(app.state.user.name || 'Anonym');

        // Set online status
        presenceRef.set({
            name: app.state.user.name || 'Anonym',
            online: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update every 30 seconds
        setInterval(() => {
            presenceRef.update({
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }, 30000);

        // Set offline on disconnect
        window.addEventListener('beforeunload', () => {
            presenceRef.update({ online: false });
        });

        // Listen for other team members
        this.db.collection('presence')
            .doc(app.state.user.teamName)
            .collection('members')
            .where('online', '==', true)
            .onSnapshot((snapshot) => {
                this.activeMembers = snapshot.docs
                    .map(doc => doc.data().name)
                    .filter(name => name !== app.state.user.name);

                // Update UI
                this.updatePresenceDisplay();
            });
    },

    updatePresenceDisplay() {
        const container = document.getElementById('settingsPresenceList');
        if (!container) return;

        if (this.activeMembers.length === 0) {
            container.innerHTML = '<span class="text-muted text-xs">Keine anderen Mitglieder online.</span>';
        } else {
            container.innerHTML = this.activeMembers
                .map(name => `<span style="background:rgba(34,197,94,0.15); color:var(--success); padding:2px 8px; border-radius:10px; font-size:0.8rem; border:1px solid var(--success);">🟢 ${name}</span>`)
                .join(' ');
        }
    },

    updateSyncStatus(status) {
        const indicator = document.getElementById('headerSyncIndicator');
        const statusText = document.getElementById('syncStatusHeader');

        if (!indicator || !statusText) return;

        if (status === 'synced') {
            indicator.style.opacity = '1';
            statusText.textContent = 'Synchronisiert';
            statusText.style.color = 'var(--success)';
        } else if (status === 'syncing') {
            indicator.style.opacity = '0.7';
            statusText.textContent = 'Synchronisiere...';
            statusText.style.color = 'var(--primary)';
        } else if (status === 'error') {
            indicator.style.opacity = '0.5';
            statusText.textContent = 'Offline';
            statusText.style.color = 'var(--danger)';
        }
    },

    playNotificationSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {
            console.warn('Audio error', e);
        }
    },

    blinkSyncIndicator() {
        const indicator = document.getElementById('headerSyncIndicator');
        if (!indicator) return;

        indicator.style.animation = 'pulse 0.5s ease-in-out 3';
        setTimeout(() => {
            indicator.style.animation = '';
        }, 1500);
    },

    disconnect() {
        if (this.changeListener) {
            this.changeListener();
            this.changeListener = null;
        }
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    },

    // Alias for app.js auto-sync compatible
    push() {
        return this.sync(true);
    }
};
