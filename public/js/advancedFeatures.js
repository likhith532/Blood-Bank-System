// ============================================
// PREMIUM BLOOD BANK ADVANCED FEATURES
// ============================================

class BloodBankAdvancedFeatures {
    constructor() {
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;
        this.updateInterval = null;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.performanceMetrics = [];
        
        this.init();
    }

    // ========== INITIALIZATION ==========
    init() {
        console.log('%c🩸 Blood Bank System Initializing...', 'color: #dc2626; font-weight: bold; font-size: 14px;');
        
        this.setupEventListeners();
        this.initializeServiceWorker();
        this.setupKeyboardShortcuts();
        this.enhanceAccessibility();
        this.initializeOfflineQueue();
        this.startRealTimeUpdates();
        this.setupFormAutoSave();
        this.initializePerformanceMonitoring();
        this.setupVisibilityTracking();
        this.initializeNotificationSystem();
        
        console.log('%c✅ All Systems Ready!', 'color: #10b981; font-weight: bold; font-size: 14px;');
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Online/Offline Detection
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Page Visibility API
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Before Unload - Warn if unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Handle connection quality changes
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }
    }

    // ========== SERVICE WORKER ==========
    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered successfully');
                
                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showNotification(
                                'New version available! Refresh to update.',
                                'info',
                                0,
                                true
                            );
                        }
                    });
                });
            } catch (error) {
                console.warn('❌ Service Worker registration failed:', error);
            }
        }
    }

    // ========== ONLINE/OFFLINE HANDLING ==========
    handleOnline() {
        console.log('🌐 Connection restored');
        this.isOnline = true;
        this.retryAttempts = 0;
        
        // Remove offline indicator
        const offlineIndicator = document.querySelector('.offline-indicator');
        if (offlineIndicator) {
            offlineIndicator.classList.remove('show');
        }
        
        // Process queued requests
        this.processOfflineQueue();
        
        // Resume real-time updates
        this.startRealTimeUpdates();
        
        this.showNotification('🌐 Connection restored! Syncing data...', 'success', 3000);
    }

    handleOffline() {
        console.log('📴 Connection lost');
        this.isOnline = false;
        
        // Show offline indicator
        let offlineIndicator = document.querySelector('.offline-indicator');
        if (!offlineIndicator) {
            offlineIndicator = document.createElement('div');
            offlineIndicator.className = 'offline-indicator';
            offlineIndicator.innerHTML = `
                <i class="fas fa-wifi-slash"></i>
                <span>You're offline. Changes will sync when connection is restored.</span>
            `;
            document.body.appendChild(offlineIndicator);
        }
        offlineIndicator.classList.add('show');
        
        // Stop real-time updates
        this.stopRealTimeUpdates();
        
        this.showNotification('📴 You\'re offline. Changes will be saved locally.', 'warning', 5000);
    }

    handleConnectionChange() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;
            
            console.log(`📶 Connection type: ${effectiveType}`);
            
            if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                this.showNotification('⚠️ Slow connection detected. Some features may be delayed.', 'warning', 5000);
                this.stopRealTimeUpdates(); // Save bandwidth
            } else {
                if (!this.updateInterval) {
                    this.startRealTimeUpdates();
                }
            }
        }
    }

    // ========== OFFLINE QUEUE MANAGEMENT ==========
    initializeOfflineQueue() {
        const savedQueue = localStorage.getItem('offlineQueue');
        if (savedQueue) {
            try {
                this.offlineQueue = JSON.parse(savedQueue);
                console.log(`📦 Loaded ${this.offlineQueue.length} queued requests from storage`);
            } catch (error) {
                console.error('Failed to parse offline queue:', error);
                this.offlineQueue = [];
            }
        }
    }

    queueRequest(url, method, data) {
        const request = {
            id: Date.now() + Math.random(),
            url,
            method,
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            timestamp: Date.now()
        };
        
        this.offlineQueue.push(request);
        localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
        
        console.log('📦 Request queued for offline processing');
        this.showNotification('💾 Changes saved locally. Will sync when online.', 'info', 3000);
    }

    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;
        
        console.log(`🔄 Processing ${this.offlineQueue.length} queued requests`);
        const failedRequests = [];
        
        for (const request of this.offlineQueue) {
            try {
                await this.executeQueuedRequest(request);
                console.log('✅ Queued request processed successfully');
            } catch (error) {
                console.error('❌ Failed to process queued request:', error);
                failedRequests.push(request);
            }
        }
        
        if (failedRequests.length === 0) {
            this.offlineQueue = [];
            localStorage.removeItem('offlineQueue');
            this.showNotification('✅ All offline changes synchronized!', 'success', 4000);
        } else {
            this.offlineQueue = failedRequests;
            localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
            this.showNotification(`⚠️ ${failedRequests.length} changes failed to sync. Will retry.`, 'warning', 5000);
        }
    }

    async executeQueuedRequest(request) {
        const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body
        });
        
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        
        return response.json();
    }

    // ========== REAL-TIME UPDATES ==========
    startRealTimeUpdates() {
        if (this.updateInterval || !this.isOnline) return;
        
        console.log('🔄 Starting real-time updates');
        
        // Initial update
        this.checkForUpdates();
        
        // Update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.checkForUpdates();
        }, 30000);
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            console.log('⏸️ Stopping real-time updates');
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async checkForUpdates() {
        if (!this.isOnline) return;
        
        try {
            const response = await fetch('/api/inventory', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateInventoryDisplay(data.data.inventory);
                    this.cacheData('inventory', data.data.inventory);
                }
            }
        } catch (error) {
            console.log('⚠️ Real-time update failed:', error);
            // Fallback to cached data
            const cached = this.getCachedData('inventory');
            if (cached) {
                this.updateInventoryDisplay(cached);
            }
        }
    }

    updateInventoryDisplay(inventory) {
        const inventoryGrid = document.querySelector('.blood-grid, .inventory-grid');
        if (!inventoryGrid) return;
        
        inventory.forEach(item => {
            const itemElement = inventoryGrid.querySelector(`[data-blood-type="${item.bloodType}"]`);
            if (itemElement) {
                const unitsElement = itemElement.querySelector('.blood-units, .units');
                if (unitsElement) {
                    const oldValue = parseInt(unitsElement.textContent);
                    const newValue = item.availableUnits;
                    
                    if (oldValue !== newValue) {
                        // Animate the change
                        unitsElement.style.transition = 'all 0.3s ease';
                        unitsElement.style.transform = 'scale(1.2)';
                        unitsElement.style.color = 'var(--primary-color)';
                        
                        unitsElement.textContent = newValue;
                        
                        setTimeout(() => {
                            unitsElement.style.transform = 'scale(1)';
                            unitsElement.style.color = '';
                        }, 300);
                    }
                }
                
                // Update status badge
                const statusElement = itemElement.querySelector('.blood-status, .status');
                if (statusElement) {
                    statusElement.className = `blood-status status-${this.getStockStatus(item.availableUnits)}`;
                    statusElement.textContent = this.getStockStatus(item.availableUnits);
                }
            }
        });
    }

    getStockStatus(units) {
        if (units >= 100) return 'high';
        if (units >= 50) return 'normal';
        if (units >= 20) return 'low';
        return 'critical';
    }

    // ========== PAGE VISIBILITY ==========
    handlePageHidden() {
        console.log('📱 Page hidden - pausing operations');
        this.stopRealTimeUpdates();
    }

    handlePageVisible() {
        console.log('📱 Page visible - resuming operations');
        
        if (this.isOnline) {
            this.checkForUpdates();
            this.startRealTimeUpdates();
        }
    }

    // ========== DATA CACHING ==========
    cacheData(key, data, ttl = 300000) { // 5 minutes default
        try {
            const cacheEntry = {
                data,
                timestamp: Date.now(),
                ttl
            };
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
        } catch (error) {
            console.warn('Failed to cache data:', error);
        }
    }

    getCachedData(key) {
        try {
            const cached = localStorage.getItem(`cache_${key}`);
            if (!cached) return null;
            
            const cacheEntry = JSON.parse(cached);
            const now = Date.now();
            
            if (now - cacheEntry.timestamp > cacheEntry.ttl) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            
            return cacheEntry.data;
        } catch (error) {
            console.warn('Failed to get cached data:', error);
            return null;
        }
    }

    clearCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('🗑️ Cache cleared');
    }

    // ========== FORM AUTO-SAVE ==========
    setupFormAutoSave() {
        const forms = document.querySelectorAll('form[data-autosave="true"], #newDonationForm, #newRequestForm');
        
        forms.forEach(form => {
            if (!form.id) {
                console.warn('Form requires an ID for auto-save:', form);
                return;
            }
            
            let autoSaveTimer;
            
            form.addEventListener('input', (e) => {
                clearTimeout(autoSaveTimer);
                
                // Show saving indicator
                this.showAutoSaveIndicator(form, 'saving');
                
                autoSaveTimer = setTimeout(() => {
                    this.autoSaveForm(form);
                }, 2000); // Save after 2 seconds of inactivity
            });
            
            // Restore saved data on load
            this.restoreFormData(form);
        });
    }

    autoSaveForm(form) {
        const formData = this.getFormData(form);
        const formId = form.id;
        
        try {
            localStorage.setItem(`autosave_${formId}`, JSON.stringify({
                data: formData,
                timestamp: Date.now()
            }));
            
            console.log(`💾 Auto-saved form: ${formId}`);
            this.showAutoSaveIndicator(form, 'saved');
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.showAutoSaveIndicator(form, 'error');
        }
    }

    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    restoreFormData(form) {
        const formId = form.id;
        const saved = localStorage.getItem(`autosave_${formId}`);
        
        if (saved) {
            try {
                const { data, timestamp } = JSON.parse(saved);
                const now = Date.now();
                
                // Only restore if saved within last hour
                if (now - timestamp < 3600000) {
                    Object.keys(data).forEach(key => {
                        const element = form.querySelector(`[name="${key}"]`);
                        if (element && element.value === '') {
                            element.value = data[key];
                        }
                    });
                    
                    console.log(`📋 Restored form data: ${formId}`);
                    this.showNotification('📋 Previous form data restored', 'info', 3000);
                } else {
                    localStorage.removeItem(`autosave_${formId}`);
                }
            } catch (error) {
                console.error('Failed to restore form data:', error);
            }
        }
    }

    showAutoSaveIndicator(form, status) {
        let indicator = form.querySelector('.form-auto-save-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'form-auto-save-indicator';
            form.style.position = 'relative';
            form.appendChild(indicator);
        }
        
        indicator.classList.remove('show');
        
        const messages = {
            saving: '💾 Saving...',
            saved: '✅ Saved',
            error: '❌ Save failed'
        };
        
        indicator.textContent = messages[status] || '';
        indicator.classList.add('show');
        
        if (status !== 'saving') {
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }
    }

    hasUnsavedChanges() {
        const forms = document.querySelectorAll('form');
        return Array.from(forms).some(form => {
            const saved = localStorage.getItem(`autosave_${form.id}`);
            if (!saved) return false;
            
            const currentData = this.getFormData(form);
            const savedData = JSON.parse(saved).data;
            
            return JSON.stringify(currentData) !== JSON.stringify(savedData);
        });
    }

    clearFormAutoSave(formId) {
        localStorage.removeItem(`autosave_${formId}`);
        console.log(`🗑️ Cleared auto-save for form: ${formId}`);
    }

    // ========== KEYBOARD SHORTCUTS ==========
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save current form
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentForm();
            }
            
            // Ctrl/Cmd + N: New donation/request
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNewItem();
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl/Cmd + K: Quick search (if search feature exists)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openQuickSearch();
            }
            
            // Ctrl/Cmd + /: Show keyboard shortcuts help
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
        });
        
        console.log('⌨️ Keyboard shortcuts enabled');
    }

    saveCurrentForm() {
        const activeForm = document.querySelector('form:focus-within');
        if (activeForm) {
            const submitButton = activeForm.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.click();
            }
        }
    }

    createNewItem() {
        const user = window.auth?.getCurrentUser();
        if (user?.role === 'donor') {
            window.dashboard?.switchTab('new-donation');
        } else if (user?.role === 'recipient') {
            window.dashboard?.switchTab('new-request');
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    openQuickSearch() {
        // Implement quick search functionality
        console.log('🔍 Quick search opened');
    }

    showKeyboardShortcuts() {
        const shortcuts = `
            <h4>⌨️ Keyboard Shortcuts</h4>
            <ul>
                <li><kbd>Ctrl/Cmd</kbd> + <kbd>S</kbd> - Save current form</li>
                <li><kbd>Ctrl/Cmd</kbd> + <kbd>N</kbd> - New donation/request</li>
                <li><kbd>Esc</kbd> - Close modals</li>
                <li><kbd>Ctrl/Cmd</kbd> + <kbd>K</kbd> - Quick search</li>
                <li><kbd>Ctrl/Cmd</kbd> + <kbd>/</kbd> - Show shortcuts</li>
            </ul>
        `;
        
        this.showNotification(shortcuts, 'info', 0, true);
    }

    // ========== ACCESSIBILITY ENHANCEMENTS ==========
    enhanceAccessibility() {
        // Add ARIA labels to buttons without text
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
                button.setAttribute('aria-label', button.title || 'Button');
            }
        });
        
        // Add keyboard navigation
        const focusableElements = document.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach((element, index) => {
            element.addEventListener('keydown', (e) => {
                // Tab navigation enhancement
                if (e.key === 'Tab') {
                    // Custom tab logic if needed
                }
            });
        });
        
        // Add skip link for screen readers
        this.addSkipLink();
        
        console.log('♿ Accessibility enhancements applied');
    }

    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            z-index: 100;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '0';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // ========== PERFORMANCE MONITORING ==========
    initializePerformanceMonitoring() {
        if ('performance' in window) {
            // Monitor page load
            window.addEventListener('load', () => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log(`⏱️ Page load time: ${perfData.loadEventEnd - perfData.fetchStart}ms`);
            });
        }
    }

    measurePerformance(label, callback) {
        const start = performance.now();
        const result = callback();
        const duration = performance.now() - start;
        
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        
        // Track metrics
        this.performanceMetrics.push({
            label,
            duration,
            timestamp: Date.now()
        });
        
        // Warn about slow operations
        if (duration > 1000) {
            console.warn(`🐌 Slow operation: ${label} (${duration.toFixed(2)}ms)`);
        }
        
        return result;
    }

    getPerformanceReport() {
        return this.performanceMetrics;
    }

    // ========== VISIBILITY TRACKING ==========
    setupVisibilityTracking() {
        let startTime = Date.now();
        let totalTimeActive = 0;
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                totalTimeActive += Date.now() - startTime;
            } else {
                startTime = Date.now();
            }
        });
        
        // Log engagement metrics before unload
        window.addEventListener('beforeunload', () => {
            if (!document.hidden) {
                totalTimeActive += Date.now() - startTime;
            }
            console.log(`📊 Total active time: ${Math.round(totalTimeActive / 1000)}s`);
        });
    }

    // ========== NOTIFICATION SYSTEM ==========
    initializeNotificationSystem() {
        // Create notification container
        if (!document.querySelector('.notification-container')) {
            const container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 5000, dismissible = false) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icons[type] || icons.info}"></i>
                <span class="notification-message">${message}</span>
                ${dismissible || duration === 0 ? '<button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>' : ''}
            </div>
        `;
        
        const container = document.querySelector('.notification-container');
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }

    // ========== UTILITY METHODS ==========
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ========== CLEANUP ==========
    destroy() {
        console.log('🛑 Cleaning up advanced features...');
        this.stopRealTimeUpdates();
        // Additional cleanup
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.advancedFeatures = new BloodBankAdvancedFeatures();
        console.log('%c🩸 Blood Bank System Ready!', 'color: #10b981; font-weight: bold; font-size: 16px; background: #d1fae5; padding: 8px 16px; border-radius: 4px;');
    } catch (error) {
        console.error('Failed to initialize advanced features:', error);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BloodBankAdvancedFeatures;
}
window.BloodBankAdvancedFeatures = BloodBankAdvancedFeatures;
