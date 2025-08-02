// medication-offline.js
// Add notification and offline support for medication reminders
window.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('medicationForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        if (!navigator.onLine) {
            saveReminderOffline(data);
            showNotification('No internet. Reminder saved locally and will sync when online.');
            form.reset();
            return;
        }
        fetch('/api/medication', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(resp => {
            if (resp.success) {
                window.location.href = 'medication-record.html?reminder_set=1';
            } else {
                showNotification(resp.message || 'Error setting reminder.', true);
            }
        })
        .catch(() => showNotification('Server error. Try again later.', true));
    });

    // Store pending reminders if offline
    function saveReminderOffline(data) {
        let pending = JSON.parse(localStorage.getItem('pending_reminders')||'[]');
        pending.push({...data, _ts: Date.now()});
        localStorage.setItem('pending_reminders', JSON.stringify(pending));
    }

    // Sync pending reminders when back online
    window.addEventListener('online', function() {
        let pending = JSON.parse(localStorage.getItem('pending_reminders')||'[]');
        if (!pending.length) return;
        pending.forEach(async (rec, idx) => {
            try {
                await fetch('/api/medication', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(rec)
                });
                pending[idx]._synced = true;
            } catch(e) {}
        });
        pending = pending.filter(r=>!r._synced);
        localStorage.setItem('pending_reminders', JSON.stringify(pending));
        showNotification('Pending reminders synced!');
        setTimeout(()=>window.location.href = 'medication-record.html?reminder_set=1', 1200);
    });

    // Notification function
    // Use global showNotification from notify.js
    function showNotification(msg, error) {
        const notif = document.createElement('div');
        notif.className = 'message ' + (error ? 'error' : 'success');
        notif.style.position = 'fixed';
        notif.style.top = '2.5rem';
        notif.style.left = '50%';
        notif.style.transform = 'translateX(-50%)';
        notif.style.zIndex = 1000;
        notif.textContent = msg;
        document.body.appendChild(notif);
        setTimeout(()=>notif.remove(), 3500);
    }
});
