// Clock/timer logic and interaction logging for homepage

// Insert clock below Care Circle
window.addEventListener('DOMContentLoaded', function () {
    // Find Care Circle heading
    const logoDiv = document.querySelector('.logo h2');
    if (!logoDiv) return;

    // Create clock container
    const clockDiv = document.createElement('div');
    clockDiv.id = 'homepageClock';
    clockDiv.style.fontSize = '1.3rem';
    clockDiv.style.color = '#5d8bf4';
    clockDiv.style.margin = '0.5rem 0 1.5rem 0';
    clockDiv.style.fontWeight = 'bold';
    clockDiv.style.letterSpacing = '1px';
    clockDiv.style.textAlign = 'center';

    // Insert clock after Care Circle heading
    logoDiv.parentNode.insertBefore(clockDiv, logoDiv.nextSibling);

    // Clock update logic
    function updateClock() {
        const now = new Date();
        clockDiv.textContent = now.toLocaleTimeString();
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Log interaction when clock is clicked
    clockDiv.style.cursor = 'pointer';
    clockDiv.title = 'Click to log this time to health records';
    clockDiv.addEventListener('click', function () {
        // Send interaction to backend
        fetch('/api/clock-interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                time: new Date().toISOString(),
                page: 'homepage',
                note: 'User (guest or logged in) clicked the homepage clock.'
            })
        })
        .then(res => res.json())
        .then(data => {
            // Optionally show feedback
            clockDiv.textContent = '⏱️ Logged! (' + new Date().toLocaleTimeString() + ')';
            setTimeout(updateClock, 2000);
        })
        .catch(() => {
            clockDiv.textContent = '⚠️ Could not log.';
            setTimeout(updateClock, 2000);
        });
    });
});
