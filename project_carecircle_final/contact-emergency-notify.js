// contact-emergency-notify.js
// Use this script on contact.html and emergency.html to show notifications for all key actions
window.addEventListener('DOMContentLoaded', function () {
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(contactForm).entries());
            fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(resp => {
                if (resp.success) {
                    window.showNotification('Contact message sent!', 'success');
                    contactForm.reset();
                } else {
                    window.showNotification(resp.message || 'Error sending message.', 'error');
                }
            })
            .catch(() => window.showNotification('Server error. Try again later.', 'error'));
        });
    }
    // Emergency form (if present)
    const emergencyForm = document.getElementById('emergencyForm');
    if (emergencyForm) {
        emergencyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(emergencyForm).entries());
            fetch('/api/emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(resp => {
                if (resp.success) {
                    window.showNotification('Emergency contact uploaded!', 'success');
                    emergencyForm.reset();
                } else {
                    window.showNotification(resp.message || 'Error uploading emergency contact.', 'error');
                }
            })
            .catch(() => window.showNotification('Server error. Try again later.', 'error'));
        });
    }
    // Dialing (simulate notification)
    const dialBtns = document.querySelectorAll('.dial-btn');
    dialBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            window.showNotification('Dialing ' + (btn.dataset.phone || 'number') + '...', 'info');
        });
    });
});
