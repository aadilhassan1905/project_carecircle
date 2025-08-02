// notify.js - simple bottom-center animated notification system
(function(){
    window.showNotification = function(msg, type='success', duration=3500) {
        let notif = document.createElement('div');
        notif.className = 'notify-message ' + type;
        notif.innerHTML = msg;
        document.body.appendChild(notif);
        setTimeout(()=>notif.classList.add('show'), 10);
        setTimeout(()=>notif.classList.remove('show'), duration);
        setTimeout(()=>notif.remove(), duration+500);
    };
})();
