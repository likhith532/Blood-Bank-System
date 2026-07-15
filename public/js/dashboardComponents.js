// ============================================
// PREMIUM BLOOD BANK DASHBOARD COMPONENTS
// ============================================

class BloodBankDashboardComponents {
    constructor() {
        this.charts = {};
        this.updateIntervals = {};
        this.isInitialized = false;
        this.chartColors = {
            primary: '#dc2626',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#3b82f6',
            purple: '#8b5cf6',
            pink: '#ec4899',
            cyan: '#06b6d4',
            gradient: {
                red: ['#dc2626', '#991b1b'],
                green: ['#10b981', '#059669'],
                blue: ['#3b82f6', '#1e40af'],
                orange: ['#f59e0b', '#d97706']
            }
        };
        
        this.init();
    }

    // ========== INITIALIZATION ==========
    async init() {
        console.log('%c📊 Dashboard Components Initializing...', 'color: #3b82f6; font-weight: bold;');
        
        try {
            await this.loadChartJS();
            this.isInitialized = true;
            console.log('%c✅ Dashboard Components Ready!', 'color: #10b981; font-weight: bold;');
        } catch (error) {
            console.error('❌ Failed to initialize dashboard components:', error);
        }
    }

    async loadChartJS() {
        if (window.Chart) {
            console.log('✅ Chart.js already loaded');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
            script.onload = () => {
                console.log('✅ Chart.js loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Failed to load Chart.js');
                reject(new Error('Failed to load Chart.js'));
            };
            document.head.appendChild(script);
        });
    }

    // ========== DONOR DASHBOARD ==========
    getDonorDashboard(userData) {
        return `
            <div class="dashboard-wrapper">
                <!-- Welcome Banner -->
                ${this.createWelcomeBanner(userData, 'donor')}
                
                <!-- Overview Section -->
                ${this.getDonorOverview(userData)}
                
                <!-- Impact Section -->
                ${this.getDonorImpact(userData)}
                
                <!-- Quick Actions -->
                ${this.getDonorActions()}
                
                <!-- Recent Activity -->
                ${this.getRecentActivity(userData.recentDonations)}
                
                <!-- Upcoming Appointments -->
                ${this.getUpcomingAppointments(userData.appointments)}
            </div>
        `;
    }

    createWelcomeBanner(userData, role) {
        const greetings = this.getGreeting();
        const roleIcon = {
            donor: '🩸',
            recipient: '🏥',
            admin: '⚡'
        };

        return `
            <div class="welcome-banner glass-card">
                <div class="welcome-content">
                    <h1>${greetings}, ${userData.name || 'User'}! ${roleIcon[role]}</h1>
                    <p class="welcome-subtitle">
                        ${role === 'donor' ? 'Thank you for being a life-saver!' : 
                          role === 'recipient' ? 'We\'re here to help you' : 
                          'System Dashboard Overview'}
                    </p>
                </div>
                <div class="welcome-stats-mini">
                    <div class="mini-stat">
                        <i class="fas fa-calendar-check"></i>
                        <span>Last login: ${this.formatRelativeTime(userData.lastLogin)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getDonorOverview(userData) {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-chart-line"></i> Donation Overview</h2>
                    <button class="btn-icon" onclick="dashboardComponents.refreshDonorStats()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                
                <div class="stats-grid">
                    ${this.createStatCard({
                        icon: '🩸',
                        title: 'Total Donations',
                        value: userData.totalDonations || 0,
                        trend: '+2 this month',
                        color: 'primary',
                        gradient: true
                    })}
                    
                    ${this.createStatCard({
                        icon: '📅',
                        title: 'Last Donation',
                        value: this.formatDate(userData.lastDonation),
                        subtitle: this.formatRelativeTime(userData.lastDonation),
                        color: 'success'
                    })}
                    
                    ${this.createStatCard({
                        icon: '⏰',
                        title: 'Next Eligible',
                        value: this.formatDate(userData.nextEligible),
                        subtitle: this.calculateDaysUntil(userData.nextEligible) + ' days',
                        color: 'warning'
                    })}
                    
                    ${this.createStatCard({
                        icon: userData.bloodType || 'O+',
                        title: 'Blood Type',
                        value: userData.bloodType || 'Not Set',
                        subtitle: this.getRarity(userData.bloodType),
                        color: 'info'
                    })}
                </div>
            </div>
        `;
    }

    getDonorImpact(userData) {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-heart"></i> Your Impact</h2>
                    <span class="badge badge-success">Making a Difference</span>
                </div>
                
                <div class="impact-container glass-card">
                    <div class="impact-visual">
                        <canvas id="donorImpactChart" width="300" height="250"></canvas>
                    </div>
                    
                    <div class="impact-stats-grid">
                        <div class="impact-stat">
                            <div class="impact-icon">💖</div>
                            <div class="impact-content">
                                <span class="impact-number" data-target="${(userData.totalDonations || 0) * 3}">0</span>
                                <span class="impact-label">Lives Potentially Saved</span>
                            </div>
                        </div>
                        
                        <div class="impact-stat">
                            <div class="impact-icon">💉</div>
                            <div class="impact-content">
                                <span class="impact-number" data-target="${(userData.totalDonations || 0) * 450}">0</span>
                                <span class="impact-unit">ml</span>
                                <span class="impact-label">Total Blood Donated</span>
                            </div>
                        </div>
                        
                        <div class="impact-stat">
                            <div class="impact-icon">🔥</div>
                            <div class="impact-content">
                                <span class="impact-number" data-target="${userData.donationStreak || 0}">0</span>
                                <span class="impact-label">Donation Streak</span>
                            </div>
                        </div>
                        
                        <div class="impact-stat">
                            <div class="impact-icon">🏆</div>
                            <div class="impact-content">
                                <span class="impact-number">${this.getBadgeLevel(userData.totalDonations)}</span>
                                <span class="impact-label">Donor Level</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="achievement-progress">
                        <div class="progress-header">
                            <span>Next Achievement: ${this.getNextAchievement(userData.totalDonations)}</span>
                            <span>${userData.totalDonations} / ${this.getNextMilestone(userData.totalDonations)}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${this.calculateAchievementProgress(userData.totalDonations)}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getDonorActions() {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-bolt"></i> Quick Actions</h2>
                </div>
                
                <div class="action-grid">
                    ${this.createActionCard({
                        icon: '🗓️',
                        title: 'Schedule Donation',
                        description: 'Book your next donation appointment',
                        action: 'scheduleNewDonation',
                        color: 'primary'
                    })}
                    
                    ${this.createActionCard({
                        icon: '✅',
                        title: 'Check Eligibility',
                        description: 'Verify if you can donate today',
                        action: 'checkEligibility',
                        color: 'success'
                    })}
                    
                    ${this.createActionCard({
                        icon: '🏆',
                        title: 'View Certificates',
                        description: 'Download donation certificates',
                        action: 'viewCertificates',
                        color: 'warning'
                    })}
                    
                    ${this.createActionCard({
                        icon: '📍',
                        title: 'Find Blood Drives',
                        description: 'Locate nearby donation events',
                        action: 'findBloodDrives',
                        color: 'info'
                    })}
                </div>
            </div>
        `;
    }

    // ========== RECIPIENT DASHBOARD ==========
    getRecipientDashboard(userData) {
        return `
            <div class="dashboard-wrapper">
                ${this.createWelcomeBanner(userData, 'recipient')}
                ${this.getRecipientOverview(userData)}
                ${this.getBloodAvailability(userData)}
                ${this.getRecipientActions()}
                ${this.getActiveRequests(userData.requests)}
            </div>
        `;
    }

    getRecipientOverview(userData) {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-chart-bar"></i> Request Overview</h2>
                </div>
                
                <div class="stats-grid">
                    ${this.createStatCard({
                        icon: '📋',
                        title: 'Active Requests',
                        value: userData.activeRequests || 0,
                        color: 'primary'
                    })}
                    
                    ${this.createStatCard({
                        icon: '✅',
                        title: 'Fulfilled Requests',
                        value: userData.fulfilledRequests || 0,
                        color: 'success'
                    })}
                    
                    ${this.createStatCard({
                        icon: '⏳',
                        title: 'Pending Approval',
                        value: userData.pendingRequests || 0,
                        color: 'warning'
                    })}
                    
                    ${this.createStatCard({
                        icon: userData.bloodType || 'O+',
                        title: 'Blood Type',
                        value: userData.bloodType || 'Not Set',
                        color: 'info'
                    })}
                </div>
            </div>
        `;
    }

    getBloodAvailability(userData) {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-warehouse"></i> Blood Availability</h2>
                    <span class="badge badge-info">Real-time</span>
                </div>
                
                <div class="availability-container glass-card">
                    <div class="chart-wrapper">
                        <canvas id="bloodAvailabilityChart" width="400" height="250"></canvas>
                    </div>
                    
                    <div class="compatibility-panel">
                        <h3>💉 Compatible Blood Types</h3>
                        <p class="text-secondary">For blood type: <strong>${userData.bloodType || 'Not Set'}</strong></p>
                        <div id="compatible-blood-types" class="blood-type-compatibility">
                            ${this.getCompatibleBloodTypes(userData.bloodType)}
                        </div>
                        
                        <div class="compatibility-info-box">
                            <i class="fas fa-info-circle"></i>
                            <p>Blood types marked in <span class="highlight-success">green</span> are compatible for transfusion.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getRecipientActions() {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-plus-circle"></i> Request Management</h2>
                </div>
                
                <div class="action-grid">
                    ${this.createActionCard({
                        icon: '🚨',
                        title: 'Urgent Request',
                        description: 'Submit critical blood request',
                        action: 'createUrgentRequest',
                        color: 'danger',
                        urgent: true
                    })}
                    
                    ${this.createActionCard({
                        icon: '📝',
                        title: 'New Request',
                        description: 'Submit standard blood request',
                        action: 'createNormalRequest',
                        color: 'primary'
                    })}
                    
                    ${this.createActionCard({
                        icon: '📊',
                        title: 'Track Requests',
                        description: 'Monitor request status',
                        action: 'trackRequests',
                        color: 'info'
                    })}
                    
                    ${this.createActionCard({
                        icon: '🗺️',
                        title: 'Find Blood Banks',
                        description: 'Locate nearby blood banks',
                        action: 'findNearbyBanks',
                        color: 'success'
                    })}
                </div>
            </div>
        `;
    }

    // ========== ADMIN DASHBOARD ==========
    getAdminDashboard(systemData) {
        return `
            <div class="dashboard-wrapper">
                ${this.createWelcomeBanner(systemData, 'admin')}
                ${this.getAdminOverview(systemData)}
                ${this.getAdminAnalytics(systemData)}
                ${this.getAdminActions()}
                ${this.getSystemAlerts(systemData.alerts)}
            </div>
        `;
    }

    getAdminOverview(systemData) {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-tachometer-alt"></i> System Overview</h2>
                    <div class="header-actions">
                        <button class="btn-icon" onclick="dashboardComponents.refreshAdminStats()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="btn-icon" onclick="dashboardComponents.exportReport()">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                
                <div class="stats-grid stats-grid-4">
                    ${this.createStatCard({
                        icon: '👥',
                        title: 'Total Users',
                        value: systemData.totalUsers || 0,
                        trend: '+12 this week',
                        color: 'primary',
                        gradient: true
                    })}
                    
                    ${this.createStatCard({
                        icon: '🩸',
                        title: 'Total Donations',
                        value: systemData.totalDonations || 0,
                        trend: '+45 this month',
                        color: 'success',
                        gradient: true
                    })}
                    
                    ${this.createStatCard({
                        icon: '📋',
                        title: 'Pending Requests',
                        value: systemData.pendingRequests || 0,
                        subtitle: 'Requires attention',
                        color: 'warning',
                        gradient: true
                    })}
                    
                    ${this.createStatCard({
                        icon: '⚠️',
                        title: 'Low Stock Alerts',
                        value: systemData.lowStockCount || 0,
                        subtitle: 'Critical items',
                        color: 'danger',
                        gradient: true,
                        pulse: true
                    })}
                </div>
            </div>
        `;
    }

    getAdminAnalytics(systemData) {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-chart-pie"></i> Analytics Dashboard</h2>
                    <select class="period-selector" onchange="dashboardComponents.updatePeriod(this.value)">
                        <option value="7">Last 7 days</option>
                        <option value="30" selected>Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
                
                <div class="charts-grid">
                    <div class="chart-card glass-card">
                        <div class="chart-header">
                            <h3>Blood Type Distribution</h3>
                            <button class="btn-icon-sm" onclick="dashboardComponents.expandChart('bloodType')">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                        <div class="chart-container">
                            <canvas id="bloodTypeChart" width="300" height="250"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-card glass-card">
                        <div class="chart-header">
                            <h3>Monthly Donations Trend</h3>
                            <button class="btn-icon-sm" onclick="dashboardComponents.expandChart('donationTrend')">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                        <div class="chart-container">
                            <canvas id="donationTrendChart" width="300" height="250"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-card glass-card">
                        <div class="chart-header">
                            <h3>Request Status Distribution</h3>
                            <button class="btn-icon-sm" onclick="dashboardComponents.expandChart('requestStatus')">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                        <div class="chart-container">
                            <canvas id="requestStatusChart" width="300" height="250"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-card glass-card">
                        <div class="chart-header">
                            <h3>Inventory Levels</h3>
                            <button class="btn-icon-sm" onclick="dashboardComponents.expandChart('inventory')">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                        <div class="chart-container">
                            <canvas id="inventoryChart" width="300" height="250"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAdminActions() {
        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-cogs"></i> Administrative Actions</h2>
                </div>
                
                <div class="action-grid action-grid-3">
                    ${this.createActionCard({
                        icon: '👥',
                        title: 'Manage Users',
                        description: 'View and manage user accounts',
                        action: 'manageUsers',
                        color: 'primary'
                    })}
                    
                    ${this.createActionCard({
                        icon: '✅',
                        title: 'Approve Donations',
                        description: 'Review pending donations',
                        action: 'approveDonations',
                        color: 'success',
                        badge: '5 pending'
                    })}
                    
                    ${this.createActionCard({
                        icon: '📋',
                        title: 'Manage Requests',
                        description: 'Process blood requests',
                        action: 'manageRequests',
                        color: 'info',
                        badge: '3 urgent'
                    })}
                    
                    ${this.createActionCard({
                        icon: '📦',
                        title: 'Inventory Control',
                        description: 'Manage blood inventory',
                        action: 'inventoryManagement',
                        color: 'warning'
                    })}
                    
                    ${this.createActionCard({
                        icon: '📊',
                        title: 'Generate Reports',
                        description: 'Create system reports',
                        action: 'generateReports',
                        color: 'purple'
                    })}
                    
                    ${this.createActionCard({
                        icon: '⚙️',
                        title: 'System Settings',
                        description: 'Configure system parameters',
                        action: 'systemSettings',
                        color: 'secondary'
                    })}
                </div>
            </div>
        `;
    }

    // ========== COMPONENT BUILDERS ==========
    createStatCard(options) {
        const {
            icon,
            title,
            value,
            subtitle,
            trend,
            color = 'primary',
            gradient = false,
            pulse = false
        } = options;

        return `
            <div class="stat-card stat-card-${color} ${gradient ? 'gradient' : ''} ${pulse ? 'pulse' : ''}">
                <div class="stat-icon">${icon}</div>
                <div class="stat-content">
                    <h4 class="stat-title">${title}</h4>
                    <p class="stat-value">${value}</p>
                    ${subtitle ? `<p class="stat-subtitle">${subtitle}</p>` : ''}
                    ${trend ? `<span class="stat-trend"><i class="fas fa-arrow-up"></i> ${trend}</span>` : ''}
                </div>
            </div>
        `;
    }

    createActionCard(options) {
        const {
            icon,
            title,
            description,
            action,
            color = 'primary',
            badge = null,
            urgent = false
        } = options;

        return `
            <div class="action-card ${urgent ? 'urgent-card' : ''}" onclick="dashboardComponents.${action}()">
                <div class="action-icon action-icon-${color}">${icon}</div>
                <div class="action-content">
                    <h4>${title}
                        ${badge ? `<span class="action-badge">${badge}</span>` : ''}
                    </h4>
                    <p>${description}</p>
                </div>
                <div class="action-arrow">
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `;
    }

    getRecentActivity(donations) {
        if (!donations || donations.length === 0) {
            return `
                <div class="dashboard-section fade-in">
                    <h2><i class="fas fa-clock"></i> Recent Activity</h2>
                    <div class="no-data glass-card">
                        <i class="fas fa-inbox"></i>
                        <p>No recent activity</p>
                    </div>
                </div>
            `;
        }

        const activityItems = donations.slice(0, 5).map(donation => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-tint"></i>
                </div>
                <div class="activity-content">
                    <h4>Blood Donation - ${donation.bloodType}</h4>
                    <p>${donation.location || 'Blood Bank Center'}</p>
                    <span class="activity-time">${this.formatRelativeTime(donation.date)}</span>
                </div>
                <div class="activity-status status-${donation.status}">
                    ${donation.status}
                </div>
            </div>
        `).join('');

        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-clock"></i> Recent Activity</h2>
                    <a href="#" class="view-all-link">View All <i class="fas fa-arrow-right"></i></a>
                </div>
                <div class="activity-timeline glass-card">
                    ${activityItems}
                </div>
            </div>
        `;
    }

    getUpcomingAppointments(appointments) {
        if (!appointments || appointments.length === 0) return '';

        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-calendar-alt"></i> Upcoming Appointments</h2>
                </div>
                <div class="appointments-grid">
                    ${appointments.map(apt => `
                        <div class="appointment-card glass-card">
                            <div class="appointment-date">
                                <span class="day">${new Date(apt.date).getDate()}</span>
                                <span class="month">${this.getMonthShort(apt.date)}</span>
                            </div>
                            <div class="appointment-details">
                                <h4>${apt.type || 'Blood Donation'}</h4>
                                <p><i class="fas fa-map-marker-alt"></i> ${apt.location}</p>
                                <p><i class="fas fa-clock"></i> ${apt.time}</p>
                            </div>
                            <button class="btn-sm btn-outline" onclick="dashboardComponents.manageAppointment('${apt.id}')">
                                Manage
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getActiveRequests(requests) {
        if (!requests || requests.length === 0) {
            return `
                <div class="dashboard-section fade-in">
                    <h2><i class="fas fa-list"></i> Active Requests</h2>
                    <div class="no-data glass-card">
                        <i class="fas fa-inbox"></i>
                        <p>No active requests</p>
                        <button class="btn-primary" onclick="dashboardComponents.createNormalRequest()">
                            Create New Request
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-list"></i> Active Requests</h2>
                </div>
                <div class="requests-list">
                    ${requests.map(req => this.createRequestCard(req)).join('')}
                </div>
            </div>
        `;
    }

    createRequestCard(request) {
        return `
            <div class="request-card glass-card">
                <div class="request-header">
                    <div class="request-info">
                        <h4>Blood Request - ${request.bloodType}</h4>
                        <span class="urgency urgency-${request.urgency}">${request.urgency}</span>
                    </div>
                    <span class="status-badge status-${request.status}">${request.status}</span>
                </div>
                <div class="request-details">
                    <p><i class="fas fa-tint"></i> ${request.units} units required</p>
                    <p><i class="fas fa-hospital"></i> ${request.hospital}</p>
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(request.requiredBy)}</p>
                </div>
                <div class="request-actions">
                    <button class="btn-sm btn-outline" onclick="dashboardComponents.viewRequestDetails('${request.id}')">
                        View Details
                    </button>
                    ${request.status === 'pending' ? `
                        <button class="btn-sm btn-danger" onclick="dashboardComponents.cancelRequest('${request.id}')">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getSystemAlerts(alerts) {
        if (!alerts || alerts.length === 0) return '';

        return `
            <div class="dashboard-section fade-in">
                <div class="section-header">
                    <h2><i class="fas fa-bell"></i> System Alerts</h2>
                    <button class="btn-sm btn-outline" onclick="dashboardComponents.clearAlerts()">
                        Clear All
                    </button>
                </div>
                <div class="alerts-container">
                    ${alerts.map(alert => `
                        <div class="alert alert-${alert.type}">
                            <div class="alert-icon">
                                <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                            </div>
                            <div class="alert-content">
                                <h4>${alert.title}</h4>
                                <p>${alert.message}</p>
                                <span class="alert-time">${this.formatRelativeTime(alert.timestamp)}</span>
                            </div>
                            <button class="alert-close" onclick="dashboardComponents.dismissAlert('${alert.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getCompatibleBloodTypes(bloodType) {
        const compatibility = {
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'A-': ['A-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+',
