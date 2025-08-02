// Dark Mode Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create dark mode toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'theme-toggle';
    toggleButton.innerHTML = '🌙';
    toggleButton.setAttribute('aria-label', 'Toggle dark mode');
    document.body.appendChild(toggleButton);

    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update button icon based on current theme
    updateToggleIcon(currentTheme);

    // Toggle theme when button is clicked
    toggleButton.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleIcon(newTheme);
    });

    function updateToggleIcon(theme) {
        toggleButton.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
});

// Contact Form Basic Functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Determine which form is being submitted
            const formId = contactForm.id;
            let apiEndpoint = '/api/contact';
            
            if (formId === 'medicationForm') {
                apiEndpoint = '/api/medication';
            } else if (formId === 'emergencyForm') {
                apiEndpoint = '/api/emergency';
            } else if (formId === 'healthForm') {
                apiEndpoint = '/api/health-check';
            }
            
            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Sending...';
            submitBtn.disabled = true;
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = {};
            
            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            // Submit to API
            fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                // Remove any existing messages
                const existingMessage = document.querySelector('.message');
                if (existingMessage) {
                    existingMessage.remove();
                }
                
                // Create message element
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${result.success ? 'success' : 'error'}`;
                messageDiv.textContent = result.message;
                
                // Insert message before form
                contactForm.parentNode.insertBefore(messageDiv, contactForm);
                
                if (result.success) {
                    contactForm.reset();
                    // Auto-remove success message after 5 seconds
                    setTimeout(() => {
                        if (messageDiv.parentNode) {
                            messageDiv.remove();
                        }
                    }, 5000);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Remove any existing messages
                const existingMessage = document.querySelector('.message');
                if (existingMessage) {
                    existingMessage.remove();
                }
                
                // Show error message
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message error';
                messageDiv.textContent = 'Network error. Please try again later.';
                contactForm.parentNode.insertBefore(messageDiv, contactForm);
            })
            .finally(() => {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }
});

// Add medication reminder notifications (simulated)
document.addEventListener('DOMContentLoaded', function() {
    // Simulate medication reminders
    if (window.location.pathname.includes('medication')) {
        // Show a sample reminder notification after 5 seconds
        setTimeout(() => {
            showNotification('💊 Reminder: Time to take your morning medication!', 'info');
        }, 5000);
    }
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const notificationStyles = document.createElement('style');
        notificationStyles.id = 'notification-styles';
        notificationStyles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-white);
                color: var(--text-dark);
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-hover);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 1rem;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification.info {
                border-left: 4px solid var(--accent-color);
            }
            
            .notification.success {
                border-left: 4px solid var(--secondary-color);
            }
            
            .notification button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: var(--text-light);
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(notificationStyles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Health metrics validation
document.addEventListener('DOMContentLoaded', function() {
    const healthForm = document.getElementById('healthForm');
    if (healthForm) {
        const bloodPressureInput = document.getElementById('bloodPressure');
        const heartRateInput = document.getElementById('heartRate');
        const temperatureInput = document.getElementById('temperature');
        
        // Add real-time validation for health metrics
        if (bloodPressureInput) {
            bloodPressureInput.addEventListener('blur', function() {
                const value = this.value;
                const bpPattern = /^\d{2,3}\/\d{2,3}$/;
                
                if (value && !bpPattern.test(value)) {
                    showValidationMessage(this, 'Please enter blood pressure in format: 120/80');
                } else {
                    clearValidationMessage(this);
                }
            });
        }
        
        if (heartRateInput) {
            heartRateInput.addEventListener('blur', function() {
                const value = parseInt(this.value);
                
                if (value && (value < 40 || value > 200)) {
                    showValidationMessage(this, 'Heart rate should be between 40-200 BPM');
                } else {
                    clearValidationMessage(this);
                }
            });
        }
        
        if (temperatureInput) {
            temperatureInput.addEventListener('blur', function() {
                const value = parseFloat(this.value);
                
                if (value && (value < 95 || value > 110)) {
                    showValidationMessage(this, 'Temperature seems unusual. Please double-check.');
                } else {
                    clearValidationMessage(this);
                }
            });
        }
    }
});

function showValidationMessage(input, message) {
    clearValidationMessage(input);
    
    const validationMsg = document.createElement('div');
    validationMsg.className = 'validation-message';
    validationMsg.textContent = message;
    validationMsg.style.cssText = `
        color: #e74c3c;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: #fdf2f2;
        border-radius: 4px;
        border: 1px solid #fecaca;
    `;
    
    input.parentNode.appendChild(validationMsg);
    input.style.borderColor = '#e74c3c';
}

function clearValidationMessage(input) {
    const existingMsg = input.parentNode.querySelector('.validation-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    input.style.borderColor = '';
}

// Add some fun hover effects
document.addEventListener('DOMContentLoaded', function() {
    // Add bounce effect to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add wiggle effect to service icons
    const serviceIcons = document.querySelectorAll('.service-icon');
    serviceIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.animation = 'wiggle 0.5s ease-in-out';
        });
        
        icon.addEventListener('animationend', function() {
            this.style.animation = '';
        });
    });
});

// Add wiggle animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes wiggle {
        0%, 7% { transform: rotateZ(0); }
        15% { transform: rotateZ(-15deg); }
        20% { transform: rotateZ(10deg); }
        25% { transform: rotateZ(-10deg); }
        30% { transform: rotateZ(6deg); }
        35% { transform: rotateZ(-4deg); }
        40%, 100% { transform: rotateZ(0); }
    }
`;
document.head.appendChild(style);