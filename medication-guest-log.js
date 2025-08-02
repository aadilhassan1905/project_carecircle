// Logs medication form interaction for guests (no account)
window.addEventListener('DOMContentLoaded', function () {
    const medicationForm = document.getElementById('medicationForm');
    if (!medicationForm) return;

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
                page: 'medication',
                note: 'Guest interacted with medication form (' + eventType + ')'
            })
        });
    }
    medicationForm.addEventListener('focusin', () => logGuestInteraction('focusin'));
    medicationForm.addEventListener('click', () => logGuestInteraction('click'));
    medicationForm.addEventListener('input', () => logGuestInteraction('input'));
});
