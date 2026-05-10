/**
 * BonziWORLD Notification System
 * Handles desktop and PS4-style in-app notifications
 */

const NotificationSystem = (function() {
    let isSupported = {
        desktopNotifications: 'Notification' in window,
        audioContext: !!(window.AudioContext || window.webkitAudioContext)
    };
    
    // Request desktop notification permission
    function requestPermission() {
        if (isSupported.desktopNotifications && Notification.permission === 'default') {
            Notification.requestPermission().catch(err => {
                console.warn('Notification permission request failed:', err);
            });
        }
    }
    
    // Show desktop notification
    function showDesktopNotification(title, options = {}) {
        if (!isSupported.desktopNotifications) return;
        
        if (Notification.permission === 'granted') {
            try {
                return new Notification(title, {
                    icon: './favicons/favicon-32x32.png',
                    badge: './favicons/favicon-32x32.png',
                    ...options,
                    requireInteraction: false
                });
            } catch (e) {
                console.error('Failed to show desktop notification:', e);
            }
        }
    }
    
    // Show PS4-style in-app notification
    function showPS4Notification(message, type = 'info') {
        const notificationElement = document.createElement('div');
        notificationElement.className = `ps4-notification ps4-notification-${type}`;
        notificationElement.innerHTML = `
            <div class="ps4-notification-inner">
                <div class="ps4-notification-icon"></div>
                <div class="ps4-notification-content">
                    <p class="ps4-notification-message">${escapeHtml(message)}</p>
                </div>
                <div class="ps4-notification-close">×</div>
            </div>
        `;
        
        // Style the notification
        Object.assign(notificationElement.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: getNotificationColor(type),
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '10000',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '400px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        });
        
        // Add close button functionality
        const closeBtn = notificationElement.querySelector('.ps4-notification-close');
        if (closeBtn) {
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.fontSize = '18px';
            closeBtn.style.marginLeft = '10px';
            closeBtn.addEventListener('click', function() {
                notificationElement.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notificationElement.remove(), 300);
            });
        }
        
        document.body.appendChild(notificationElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notificationElement.parentNode) {
                        notificationElement.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        return notificationElement;
    }
    
    function getNotificationColor(type) {
        const colors = {
            'info': '#3498db',
            'success': '#2ecc71',
            'warning': '#f39c12',
            'error': '#e74c3c',
            'primary': '#9b59b6'
        };
        return colors[type] || colors['info'];
    }
    
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    // Play notification sound
    function playNotificationSound(soundType = 'ping') {
        const soundMap = {
            'ping': './sfx/ping.wav',
            'alert': './sfx/alert.wav',
            'success': './sfx/success.wav'
        };
        
        const soundPath = soundMap[soundType] || soundMap['ping'];
        try {
            const audio = new Audio(soundPath);
            audio.volume = 0.5;
            audio.play().catch(e => {
                console.debug('Could not play notification sound:', e);
            });
        } catch (e) {
            console.debug('Notification sound not available:', e);
        }
    }
    
    // Add CSS animations to document
    function addAnimationStyles() {
        if (!document.getElementById('ps4-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'ps4-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                
                .ps4-notification {
                    transition: all 0.3s ease;
                }
                
                .ps4-notification-inner {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .ps4-notification-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    flex-shrink: 0;
                }
                
                .ps4-notification-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .ps4-notification-message {
                    margin: 0;
                    word-wrap: break-word;
                    word-break: break-word;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Initialize system
    function init() {
        requestPermission();
        addAnimationStyles();
        console.log('NotificationSystem initialized:', isSupported);
    }
    
    // Public API
    return {
        init: init,
        showDesktopNotification: showDesktopNotification,
        showPS4Notification: showPS4Notification,
        playSound: playNotificationSound,
        requestPermission: requestPermission,
        isSupported: isSupported
    };
})();

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationSystem.init());
} else {
    NotificationSystem.init();
}
