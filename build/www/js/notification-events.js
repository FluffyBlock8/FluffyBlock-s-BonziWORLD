/**
 * BonziWORLD Notification Event Handlers
 * Connects socket.io events to the notification system
 */

(function() {
    // Wait for socket to be initialized
    let checkSocketInterval = setInterval(function() {
        if (typeof socket !== 'undefined') {
            clearInterval(checkSocketInterval);
            initializeNotificationHandlers();
        }
    }, 100);
    
    function initializeNotificationHandlers() {
        console.log('Initializing notification event handlers');
        
        // Handle notifications
        socket.on('notify', function(data) {
            try {
                const message = `${data.name}: ${data.msg}`;
                NotificationSystem.showPS4Notification(message, 'info');
                NotificationSystem.playSound('ping');
            } catch (e) {
                console.error('Error handling notify event:', e);
            }
        });
        
        // Handle PS4-style notifications
        socket.on('ps4notify', function(data) {
            try {
                const message = `${data.name}: ${data.msg}`;
                NotificationSystem.showPS4Notification(message, data.type || 'primary');
                NotificationSystem.playSound('alert');
                
                // Also show desktop notification if available
                if (NotificationSystem.isSupported.desktopNotifications && Notification.permission === 'granted') {
                    NotificationSystem.showDesktopNotification('BonziWORLD', {
                        body: message,
                        tag: 'bonzi-notification'
                    });
                }
            } catch (e) {
                console.error('Error handling ps4notify event:', e);
            }
        });
        
        // Handle user join notifications
        socket.on('updateAll', function(data) {
            try {
                // Show notification when joining a room with other users
                const userCount = Object.keys(data.usersPublic || {}).length;
                if (userCount > 0) {
                    NotificationSystem.showPS4Notification(`${userCount} user${userCount !== 1 ? 's' : ''} in room`, 'info');
                }
            } catch (e) {
                console.error('Error handling updateAll event:', e);
            }
        });
        
        // Handle user join
        socket.on('update', function(data) {
            try {
                if (data.userPublic && data.userPublic.name) {
                    NotificationSystem.showPS4Notification(`${data.userPublic.name} joined`, 'success');
                    NotificationSystem.playSound('ping');
                }
            } catch (e) {
                console.error('Error handling update event:', e);
            }
        });
        
        // Handle user leave
        socket.on('leave', function(data) {
            try {
                NotificationSystem.showPS4Notification('A user left', 'info');
            } catch (e) {
                console.error('Error handling leave event:', e);
            }
        });
        
        // Handle room-related notifications
        socket.on('announcement', function(data) {
            try {
                if (data.from && data.msg) {
                    NotificationSystem.showPS4Notification(`[ANNOUNCEMENT] ${data.from}: ${data.msg}`, 'primary');
                    NotificationSystem.playSound('alert');
                }
            } catch (e) {
                console.error('Error handling announcement event:', e);
            }
        });
        
        // Handle alerts
        socket.on('alert', function(data) {
            try {
                NotificationSystem.showPS4Notification(data, 'warning');
                NotificationSystem.playSound('alert');
            } catch (e) {
                console.error('Error handling alert event:', e);
            }
        });
        
        // Handle login failures
        socket.on('loginFail', function(data) {
            try {
                const reasons = {
                    'nameMal': 'Invalid characters in name',
                    'nameLength': 'Name too long',
                    'full': 'Room is full',
                    'unknown': 'Unknown error'
                };
                const msg = reasons[data.reason] || reasons['unknown'];
                NotificationSystem.showPS4Notification(msg, 'error');
                NotificationSystem.playSound('alert');
            } catch (e) {
                console.error('Error handling loginFail event:', e);
            }
        });
        
        // Handle bans/kicks
        socket.on('ban', function(data) {
            try {
                NotificationSystem.showPS4Notification(`[BANNED] ${data.reason || 'No reason given'}`, 'error');
                NotificationSystem.playSound('alert');
            } catch (e) {
                console.error('Error handling ban event:', e);
            }
        });
        
        socket.on('kick', function(data) {
            try {
                NotificationSystem.showPS4Notification(`[KICKED] ${data.reason || 'No reason given'}`, 'error');
                NotificationSystem.playSound('alert');
            } catch (e) {
                console.error('Error handling kick event:', e);
            }
        });
        
        console.log('Notification event handlers initialized successfully');
    }
})();
