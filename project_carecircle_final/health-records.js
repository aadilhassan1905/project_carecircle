// Fetch and display all health/clock/guest records in health-record.html
window.addEventListener('DOMContentLoaded', function () {
    const recordList = document.getElementById('healthRecordList');
    if (!recordList) return;

    // Show notification if health check was just recorded
    if (window.location.search.includes('health_check=1')) {
        window.showNotification('Health check recorded successfully!');
    }

    // If offline, show pending records
    if (!navigator.onLine) {
        showOfflinePending();
    }

    fetch('/api/health-records')
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                recordList.innerHTML = '<div class="record-item">Error loading records.</div>';
                return;
            }
            if (!data.records.length) {
                recordList.innerHTML = '<div class="record-item">No health or guest interaction records found.</div>';
                return;
            }
            recordList.innerHTML = '';
            data.records.forEach(rec => {
                // Distinguish guest/clock logs
                let type = 'Health Check';
                if (rec.name === 'Guest' && rec.note && rec.note.includes('Guest interacted')) {
                    type = 'Guest Form Interaction';
                } else if (rec.name === 'Guest' && rec.note && rec.note.includes('Clock interaction')) {
                    type = 'Clock/Timer Log';
                }
                let details = '';
                if (type === 'Health Check') {
                    details = `<strong>Name:</strong> ${rec.name} <br> <strong>Age:</strong> ${rec.age} <br>` +
                        `<strong>BP:</strong> ${rec.blood_pressure || '-'} <strong>HR:</strong> ${rec.heart_rate || '-'} <br>` +
                        `<strong>Temp:</strong> ${rec.temperature || '-'} <strong>Weight:</strong> ${rec.weight || '-'} <br>` +
                        `<strong>Symptoms:</strong> ${rec.symptoms || '-'} <br>` +
                        `<strong>Medications:</strong> ${rec.medications || '-'} <br>`;
                } else {
                    details = `<strong>Note:</strong> ${rec.note || '-'}<br>`;
                }
                recordList.innerHTML += `
                    <div class="record-item">
                        <div style="font-weight:600; color:#b85c8e; margin-bottom:0.3em;">${type}</div>
                        <div>${details}</div>
                        <div style="font-size:0.95em; color:#777; margin-top:0.3em;">${rec.check_date ? new Date(rec.check_date).toLocaleString() : ''}</div>
                    </div>
                `;
            });
        })
        .catch(() => {
            recordList.innerHTML = '<div class="record-item">Error loading records.</div>';
        });
});
