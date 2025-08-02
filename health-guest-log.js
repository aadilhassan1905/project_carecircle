// Logs health check form interaction for guests (no account)
window.addEventListener('DOMContentLoaded', function () {
    const healthForm = document.getElementById('healthForm');
    if (!healthForm) return;

    // Track form interaction by click or input
    let interactionLogged = false;
    function logGuestInteraction(eventType) {
        if (interactionLogged) return; // Only log first interaction per page load
        interactionLogged = true;
        fetch('/api/clock-interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                time: new Date().toISOString(),
                page: 'health-check',
                note: 'Guest interacted with health check form (' + eventType + ')'
            })
        });
    }
    healthForm.addEventListener('focusin', () => logGuestInteraction('focusin'));
    healthForm.addEventListener('click', () => logGuestInteraction('click'));
    healthForm.addEventListener('input', () => logGuestInteraction('input'));
});
