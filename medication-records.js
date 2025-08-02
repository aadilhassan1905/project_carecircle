// medication-records.js
// Dynamically loads medication reminders and displays them under the Reminders Set tab
window.addEventListener('DOMContentLoaded', function () {
    const reminderTab = document.getElementById('remindersTab');
    const recordList = document.getElementById('medicationRecordList');
    if (!reminderTab || !recordList) return;

    reminderTab.addEventListener('click', function () {
        // Remove active from all tabs
        document.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
        reminderTab.classList.add('active');
        loadReminders();
    });

    function loadReminders() {
        recordList.innerHTML = '<div class="record-item">Loading reminders...</div>';
        fetch('/api/medications')
            .then(res => {
                if (!res.ok) throw new Error('Network error');
                return res.json();
            })
            .then(data => {
                if (!data.success) {
                    recordList.innerHTML = '<div class="record-item">Error loading reminders.</div>';
                    return;
                }
                if (!data.medications.length) {
                    recordList.innerHTML = '<div class="record-item">No medication reminders set.</div>';
                    return;
                }
                recordList.innerHTML = '';
                data.medications.forEach(med => {
                    // Calculate countdown
                    const now = new Date("2025-08-02T18:49:12+05:30");
                    let medTime = med.time;
                    if (medTime.length === 5) medTime += ':00'; // Ensure HH:mm:ss
                    const medDateTime = new Date(now.toISOString().slice(0,10) + 'T' + medTime + now.toISOString().slice(19));
                    // If reminder time already passed today, show 0
                    let diff = Math.max(0, medDateTime - now);
                    let countdown = diff > 0 ? formatCountdown(diff) : '00:00:00';

                    recordList.innerHTML += `
                        <div class="record-item">
                            <div style="font-weight:600; color:#4a8b6f; margin-bottom:0.3em;">${med.medication_name} (${med.dosage})</div>
                            <div><strong>Time:</strong> ${med.time} | <strong>Frequency:</strong> ${med.frequency}</div>
                            <div><strong>Notes:</strong> ${med.notes || 'None'}</div>
                            <div style="font-size:0.95em; color:#777; margin-top:0.3em;">Set by: ${med.name} (${med.email})</div>
                            <div class="countdown" style="margin-top:0.5em;color:#b85c8e;font-weight:500;">⏳ Time left: <span data-time="${med.time}">${countdown}</span></div>
                        </div>
                    `;
                });
                // Start countdown timers
                startCountdowns();
            })
            .catch(() => {
                recordList.innerHTML = '<div class="record-item">Error loading reminders. Please check your connection or try again later.</div>';
            });
    }

    // Format ms to HH:mm:ss
    function formatCountdown(ms) {
        let total = Math.floor(ms/1000);
        let h = Math.floor(total/3600).toString().padStart(2,'0');
        let m = Math.floor((total%3600)/60).toString().padStart(2,'0');
        let s = (total%60).toString().padStart(2,'0');
        return `${h}:${m}:${s}`;
    }

    // Live update countdown timers
    function startCountdowns() {
        const countdownEls = document.querySelectorAll('.countdown span[data-time]');
        if (!countdownEls.length) return;
        setInterval(() => {
            const now = new Date("2025-08-02T18:49:12+05:30");
            countdownEls.forEach(el => {
                let medTime = el.getAttribute('data-time');
                if (medTime.length === 5) medTime += ':00';
                const medDateTime = new Date(now.toISOString().slice(0,10) + 'T' + medTime + now.toISOString().slice(19));
                let diff = Math.max(0, medDateTime - now);
                el.textContent = diff > 0 ? formatCountdown(diff) : '00:00:00';
            });
        }, 1000);
    }

    // Notification when reminder is set (if redirected from medication.html)
    if (window.location.search.includes('reminder_set=1')) {
        window.showNotification('Medication reminder set successfully!');
    }
    // Use global showNotification from notify.js
        const notif = document.createElement('div');
        notif.className = 'message success';
        notif.style.position = 'fixed';
        notif.style.top = '2.5rem';
        notif.style.left = '50%';
        notif.style.transform = 'translateX(-50%)';
        notif.style.zIndex = 1000;
        notif.textContent = msg;
        document.body.appendChild(notif);
        setTimeout(()=>notif.remove(), 3500);
    }

    // Default: load reminders on page load
    loadReminders();
});
