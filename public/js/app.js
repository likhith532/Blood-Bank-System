// ============================================
// BLOOD BANK MANAGEMENT SYSTEM - MAIN APP
// ============================================

class BloodBankApp {
    constructor() {
        this.currentUser = null;
        this.config = {
            apiBaseUrl: '/api',
            refreshInterval: 60000, // 1 minute
            debounceDelay: 300
        };
        this.state = {
            isOnline: navigator.onLine,
            isLoading: false,
            currentPage: 'home'
        };
        this.init();
    }

    // ========== INITIALIZATION ==========
    init() {
        console.log('%c🩸 Blood Bank System Starting...', 'color: #dc2626; font-weight: bold; font-size: 14px;');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    async onDOMReady() {
        console.log('📄 DOM Ready - Initializing application...');
        
        try {
            // Show loading indicator
            this.showLoadingScreen();
            
            // Initialize components in order
            await this.setupNavigation();
            await this.setupEventListeners();
            await this.loadPublicData();
            await this.checkAuthentication();
            
            // Initialize additional features
            this.setupIntersectionObserver();
            this.setupLazyLoading();
            this.setupServiceWorker();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('%c✅ Application initialized successfully!', 'color: #10b981; font-weight: bold;');
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.hideLoadingScreen();
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    // ========== NAVIGATION ==========
    setupNavigation() {
        console.log('🧭 Setting up navigation...');
        
        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle, #nav-toggle');
        const navMenu = document.querySelector('.nav-menu, #nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
                
                // Prevent body scroll when menu is open
                if (navMenu.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#' || href === '') return;
                
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                    const targetPosition = targetElement.offsetTop - navHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update URL without jumping
                    history.pushState(null, '', href);
                    
                    // Close mobile menu
                    if (navMenu) {
                        navMenu.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }
            });
        });

        // Setup scroll spy
        this.setupScrollSpy();
        
        // Setup navbar scroll effect
        this.setupNavbarScroll();
    }

    setupScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        
        if (sections.length === 0 || navLinks.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    setupNavbarScroll() {
        const navbar = document.querySelector('.navbar, nav');
        if (!navbar) return;

        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Add/remove scrolled class
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            // Hide/show navbar on scroll (optional)
            if (currentScroll > lastScroll && currentScroll > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });
    }

    // ========== DATA LOADING ==========
    async loadPublicData() {
        console.log('📊 Loading public data...');
        
        try {
            await Promise.allSettled([
                this.loadBloodInventory(),
                this.loadHeroStatistics(),
                this.loadTestimonials()
            ]);
        } catch (error) {
            console.error('❌ Error loading public data:', error);
        }
    }

    async loadBloodInventory() {
        try {
            const bloodGrid = document.querySelector('#bloodGrid, .blood-grid');
            if (!bloodGrid) return;
            
            // Show loading state
            bloodGrid.innerHTML = this.createLoadingSpinner();
            
            const response = await this.fetchWithTimeout('/api/inventory', { timeout: 5000 });
            
            if (!response.ok) {
                throw new Error('Failed to fetch inventory');
            }
            
            const data = await response.json();
            const inventory = data.success ? data.data.inventory : [];
            
            if (inventory.length === 0) {
                bloodGrid.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><p>No inventory data available</p></div>';
                return;
            }
            
            bloodGrid.innerHTML = inventory.map(item => `
                <div class="blood-card" data-blood-type="${item.bloodType}">
                    <div class="blood-type">${item.bloodType}</div>
                    <div class="blood-units">${item.availableUnits || 0}</div>
                    <p class="blood-label">Units Available</p>
                    <div class="blood-status ${this.getStockStatusClass(item.stockStatus || this.calculateStockStatus(item.availableUnits))}">
                        ${this.capitalize(item.stockStatus || this.calculateStockStatus(item.availableUnits))}
                    </div>
                    ${item.stockPercentage ? `
                        <div class="blood-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${item.stockPercentage}%"></div>
                            </div>
                            <span class="progress-text">${item.stockPercentage}%</span>
                        </div>
                    ` : ''}
                </div>
            `).join('');
            
            // Animate cards
            this.animateBloodCards();
            
        } catch (error) {
            console.error('❌ Error loading blood inventory:', error);
            const bloodGrid = document.querySelector('#bloodGrid, .blood-grid');
            if (bloodGrid) {
                bloodGrid.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Unable to load blood inventory. Please try again later.</p>
                        <button onclick="app.loadBloodInventory()" class="btn-primary">Retry</button>
                    </div>
                `;
            }
        }
    }

    calculateStockStatus(units) {
        if (units >= 100) return 'high';
        if (units >= 50) return 'normal';
        if (units >= 20) return 'low';
        return 'critical';
    }

    getStockStatusClass(status) {
        const statusMap = {
            'high': 'status-high',
            'normal': 'status-normal',
            'low': 'status-low',
            'critical': 'status-critical'
        };
        return statusMap[status.toLowerCase()] || 'status-normal';
    }

    animateBloodCards() {
        const cards = document.querySelectorAll('.blood-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    async loadHeroStatistics() {
        try {
            // Try to fetch from API first
            const response = await this.fetchWithTimeout('/api/statistics', { timeout: 3000 });
            
            let stats;
            if (response.ok) {
                const data = await response.json();
                stats = data.success ? data.data : this.getDefaultStats();
            } else {
                stats = this.getDefaultStats();
            }
            
            // Animate counters
            this.animateCounter('totalDonors', stats.totalDonors || 2500);
            this.animateCounter('totalDonations', stats.totalDonations || 8500);
            this.animateCounter('totalRequests', stats.totalRequests || 6500);
            this.animateCounter('totalUsers', stats.totalUsers || 3200);
            
        } catch (error) {
            console.warn('⚠️ Using default statistics:', error);
            const stats = this.getDefaultStats();
            this.animateCounter('totalDonors', stats.totalDonors);
            this.animateCounter('totalDonations', stats.totalDonations);
            this.animateCounter('totalRequests', stats.totalRequests);
        }
    }

    getDefaultStats() {
        return {
            totalDonors: 2500,
            totalDonations: 8500,
            totalRequests: 6500,
            totalUsers: 3200
        };
    }

    animateCounter(elementId, target, duration = 2000) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let current = 0;
        const increment = target / (duration / 16); // 60fps
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            current = target * easeOut;
            
            element.textContent = Math.floor(current).toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target.toLocaleString();
            }
        };

        // Start animation when element is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate();
                    observer.unobserve(entry.target);
                }
            });
        });

        observer.observe(element);
    }

    async loadTestimonials() {
        // Placeholder for testimonials loading
        console.log('📝 Testimonials loaded');
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Contact form
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
        }

        // Newsletter signup
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => this.handleNewsletterSignup(e));
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, this.config.debounceDelay));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window events
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Form validation
        this.setupFormValidation();

        // Modal handling
        this.setupModals();

        // Scroll animations
        this.setupScrollAnimations();
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Ctrl/Cmd + / for help
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.showHelp();
        }
    }

    async handleContactForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Validate
        if (!this.validateContactForm(data)) {
            return;
        }

        // Show loading
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
                form.reset();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('❌ Contact form error:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    validateContactForm(data) {
        if (!data.name || data.name.trim().length < 2) {
            this.showNotification('Please enter a valid name', 'error');
            return false;
        }

        if (!this.isValidEmail(data.email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (!data.message || data.message.trim().length < 10) {
            this.showNotification('Message must be at least 10 characters long', 'error');
            return false;
        }

        return true;
    }

    async handleNewsletterSignup(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                this.showNotification('✅ Successfully subscribed to newsletter!', 'success');
                form.reset();
            } else {
                throw new Error('Subscription failed');
            }
        } catch (error) {
            console.error('❌ Newsletter signup error:', error);
            this.showNotification('Failed to subscribe. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    handleSearch(query) {
        if (!query || query.length < 2) {
            this.clearSearchResults();
            return;
        }

        console.log('🔍 Searching for:', query);
        
        // Implement search functionality
        // In production, this would search through:
        // - Blood types
        // - Locations
        // - FAQs
        // - Help articles
        
        this.showSearchResults(query);
    }

    showSearchResults(query) {
        // Placeholder for search results
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-results">
                    <p>Searching for: <strong>${query}</strong></p>
                    <p class="text-secondary-text">Search functionality will be implemented here</p>
                </div>
            `;
        }
    }

    clearSearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
    }

    handleResize() {
        const navMenu = document.querySelector('.nav-menu, #nav-menu');
        
        // Close mobile menu on desktop
        if (window.innerWidth > 768 && navMenu) {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Update any responsive components
        this.updateResponsiveComponents();
    }

    updateResponsiveComponents() {
        // Update charts, tables, etc. based on viewport size
    }

    handleOnline() {
        console.log('🌐 Connection restored');
        this.state.isOnline = true;
        this.showNotification('🌐 Connection restored', 'success', 3000);
        
        // Reload data
        this.loadPublicData();
    }

    handleOffline() {
        console.log('📴 Connection lost');
        this.state.isOnline = false;
        this.showNotification('📴 You are currently offline', 'warning', 5000);
    }

    // ========== AUTHENTICATION ==========
    async checkAuthentication() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.updateUIForAuthenticatedUser();
                }
            } catch (error) {
                console.log('Not authenticated');
            }
        }
    }

    updateUIForAuthenticatedUser() {
        // Update navigation for authenticated users
        const authButtons = document.querySelector('.nav-auth');
        if (authButtons && this.currentUser) {
            authButtons.innerHTML = `
                <a href="/dashboard" class="btn-outline">Dashboard</a>
                <button onclick="app.logout()" class="btn-primary">Logout</button>
            `;
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            this.currentUser = null;
            window.location.href = '/';
        }
    }

    // ========== MODALS ==========
    setupModals() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Close buttons
        document.querySelectorAll('.close, .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // ========== FORM VALIDATION ==========
    setupFormValidation() {
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
        });
    }

    validateField(field) {
        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && !this.isValidEmail(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }

        if (!isValid) {
            field.classList.add('error');
            this.showFieldError(field, errorMessage);
        } else {
            field.classList.remove('error');
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('field-error')) {
            errorElement = document.createElement('span');
            errorElement.className = 'field-error';
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
        errorElement.textContent = message;
    }

    clearFieldError(field) {
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('field-error')) {
            errorElement.remove();
        }
    }

    // ========== INTERSECTION OBSERVER ==========
    setupIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in, .slide-in, .animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    setupScrollAnimations() {
        // Already handled by setupIntersectionObserver
    }

    // ========== LAZY LOADING ==========
    setupLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            // Browser supports native lazy loading
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        } else {
            // Fallback for browsers that don't support lazy loading
            const lazyImages = document.querySelectorAll('img[data-src]');
            
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }

    // ========== SERVICE WORKER ==========
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered');
            } catch (error) {
                console.log('⚠️ Service Worker registration failed:', error);
            }
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

    async fetchWithTimeout(url, options = {}) {
        const { timeout = 8000 } = options;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(id);
        return response;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    showLoadingScreen() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 300);
            }, 500);
        }
    }

    createLoadingSpinner() {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (window.advancedFeatures && window.advancedFeatures.showNotification) {
            window.advancedFeatures.showNotification(message, type, duration);
        } else {
            // Fallback notification
            alert(message);
        }
    }

    showError(message) {
        this.showNotification(message, 'error', 0);
    }

    showHelp() {
        this.showModal('helpModal');
    }

    // ========== DASHBOARD UTILITIES ==========
    createFormField(type, name, label, options = {}) {
        const required = options.required ? 'required' : '';
        const value = options.value || '';
        const placeholder = options.placeholder || '';
        let input = '';

        switch (type) {
            case 'select':
                input = `
                    <select id="${name}" name="${name}" ${required}>
                        <option value="">Select ${label}</option>
                        ${options.options ? options.options.map(opt => `
                            <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
                                ${opt.label}
                            </option>
                        `).join('') : ''}
                    </select>
                `;
                break;
            case 'textarea':
                input = `<textarea id="${name}" name="${name}" placeholder="${placeholder}" ${required}>${value}</textarea>`;
                break;
            default:
                input = `<input type="${type}" id="${name}" name="${name}" value="${value}" placeholder="${placeholder}" ${required}>`;
        }

        return `
            <div class="form-group">
                <label for="${name}">
                    ${label}
                    ${options.required ? '<span class="required">*</span>' : ''}
                </label>
                ${input}
                ${options.help ? `<small class="form-help">${options.help}</small>` : ''}
            </div>
        `;
    }

    createDataTable(data, columns, options = {}) {
        if (!data || data.length === 0) {
            return '<div class="no-data"><i class="fas fa-inbox"></i><p>No data available</p></div>';
        }

        const headers = columns.map(col => `<th>${col.label}</th>`).join('');
        const rows = data.map(item => {
            const cells = columns.map(col => {
                let value = item[col.key];
                if (col.format) {
                    value = col.format(value, item);
                }
                return `<td>${value || '-'}</td>`;
            }).join('');

            const clickHandler = options.onRowClick ? `onclick="${options.onRowClick}('${item.id || item._id}')"` : '';
            return `<tr ${clickHandler}>${cells}</tr>`;
        }).join('');

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    createPagination(currentPage, totalPages, onPageChange) {
        if (totalPages <= 1) return '';

        const prevDisabled = currentPage <= 1 ? 'disabled' : '';
        const nextDisabled = currentPage >= totalPages ? 'disabled' : '';
        let pages = '';

        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 
