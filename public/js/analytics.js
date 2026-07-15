// ============================================
// PREMIUM BLOOD BANK ANALYTICS SYSTEM
// ============================================

class BloodBankAnalyticsManager {
    constructor() {
        this.charts = {};
        this.data = {};
        this.updateInterval = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isInitialized = false;
        this.chartColors = {
            primary: '#dc2626',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#3b82f6',
            purple: '#8b5cf6',
            pink: '#ec4899',
            cyan: '#06b6d4'
        };
    }

    // ========== INITIALIZATION ==========
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Analytics Manager already initialized');
            return;
        }

        console.log('%c📊 Initializing Analytics Manager...', 'color: #3b82f6; font-weight: bold;');

        try {
            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.warn('⚠️ Chart.js not loaded. Loading from CDN...');
                await this.loadChartJS();
            }

            // Load data
            await this.loadAnalyticsData();
            
            // Setup updates
            this.setupRealTimeUpdates();
            
            // Create charts if containers exist
            this.createDashboardCharts();
            
            this.isInitialized = true;
            console.log('%c✅ Analytics Manager initialized successfully', 'color: #10b981; font-weight: bold;');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Analytics Manager:', error);
            this.showError('Failed to initialize analytics. Please refresh the page.');
            return false;
        }
    }

    // ========== LOAD CHART.JS ==========
    async loadChartJS() {
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

    // ========== DATA LOADING ==========
    async loadAnalyticsData() {
        console.log('📥 Loading analytics data...');
        
        try {
            const [inventoryData, donationData, requestData, userData] = await Promise.allSettled([
                this.fetchInventoryAnalytics(),
                this.fetchDonationAnalytics(),
                this.fetchRequestAnalytics(),
                this.fetchUserAnalytics()
            ]);

            this.data = {
                inventory: inventoryData.status === 'fulfilled' ? inventoryData.value : [],
                donations: donationData.status === 'fulfilled' ? donationData.value : {},
                requests: requestData.status === 'fulfilled' ? requestData.value : {},
                users: userData.status === 'fulfilled' ? userData.value : {}
            };

            // Cache the data
            this.cacheAnalyticsData(this.data);
            
            console.log('✅ Analytics data loaded successfully', this.data);
            this.retryCount = 0;
            
            return this.data;
        } catch (error) {
            console.error('❌ Failed to load analytics data:', error);
            
            // Try to load from cache
            const cachedData = this.getCachedAnalyticsData();
            if (cachedData) {
                console.log('📦 Using cached analytics data');
                this.data = cachedData;
                return cachedData;
            }
            
            // Use fallback data
            this.data = this.getFallbackData();
            return this.data;
        }
    }

    async fetchInventoryAnalytics() {
        try {
            if (typeof api !== 'undefined' && api.getInventory) {
                const response = await api.getInventory();
                return response.success ? response.data.inventory : [];
            }
            
            // Fallback to direct API call
            const response = await fetch('/api/inventory', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data.inventory : [];
            }
            
            return [];
        } catch (error) {
            console.error('Failed to fetch inventory analytics:', error);
            return this.getMockInventoryData();
        }
    }

    async fetchDonationAnalytics() {
        try {
            if (typeof api !== 'undefined' && api.getDonationAnalytics) {
                const response = await api.getDonationAnalytics();
                return response.success ? response.data : {};
            }
            
            const response = await fetch('/api/analytics/donations', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : {};
            }
            
            return {};
        } catch (error) {
            console.error('Failed to fetch donation analytics:', error);
            return this.getMockDonationData();
        }
    }

    async fetchRequestAnalytics() {
        try {
            if (typeof api !== 'undefined' && api.getRequestAnalytics) {
                const response = await api.getRequestAnalytics();
                return response.success ? response.data : {};
            }
            
            const response = await fetch('/api/analytics/requests', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : {};
            }
            
            return {};
        } catch (error) {
            console.error('Failed to fetch request analytics:', error);
            return this.getMockRequestData();
        }
    }

    async fetchUserAnalytics() {
        try {
            if (typeof api !== 'undefined' && api.getUserStatistics) {
                const response = await api.getUserStatistics();
                return response.success ? response.data : {};
            }
            
            const response = await fetch('/api/analytics/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : {};
            }
            
            return {};
        } catch (error) {
            console.error('Failed to fetch user analytics:', error);
            return this.getMockUserData();
        }
    }

    // ========== CACHING ==========
    cacheAnalyticsData(data) {
        try {
            localStorage.setItem('analytics_cache', JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Failed to cache analytics data:', error);
        }
    }

    getCachedAnalyticsData() {
        try {
            const cached = localStorage.getItem('analytics_cache');
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            
            // Cache valid for 10 minutes
            if (age < 10 * 60 * 1000) {
                return data;
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to get cached analytics data:', error);
            return null;
        }
    }

    // ========== REAL-TIME UPDATES ==========
    setupRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        console.log('🔄 Setting up real-time analytics updates (every 5 minutes)');
        
        // Update analytics every 5 minutes
        this.updateInterval = setInterval(async () => {
            console.log('🔄 Updating analytics data...');
            await this.loadAnalyticsData();
            this.updateCharts();
        }, 5 * 60 * 1000);
    }

    // ========== CHART CREATION ==========
    createDashboardCharts() {
        console.log('📈 Creating dashboard charts...');
        
        const chartMethods = [
            'createInventoryChart',
            'createDonationTrendChart',
            'createRequestStatusChart',
            'createUserActivityChart',
            'createBloodTypeDistributionChart',
            'createMonthlyComparisonChart',
            'createUrgencyChart'
        ];

        let chartsCreated = 0;
        
        chartMethods.forEach(method => {
            try {
                if (this[method]()) {
                    chartsCreated++;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to create chart with ${method}:`, error);
            }
        });

        console.log(`✅ Created ${chartsCreated} charts successfully`);
    }

    createInventoryChart() {
        const canvas = document.getElementById('inventoryChart');
        if (!canvas || typeof Chart === 'undefined') return false;

        // Destroy existing chart
        if (this.charts.inventory) {
            this.charts.inventory.destroy();
        }

        const ctx = canvas.getContext('2d');
        const inventoryData = this.data.inventory || [];
        
        const labels = inventoryData.map(item => item.bloodType);
        const availableData = inventoryData.map(item => item.availableUnits || 0);
        const thresholdData = inventoryData.map(item => item.minThreshold || 20);

        this.charts.inventory = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Available Units',
                        data: availableData,
                        backgroundColor: this.chartColors.success,
                        borderColor: '#059669',
                        borderWidth: 2,
                        borderRadius: 8
                    },
                    {
                        label: 'Minimum Threshold',
                        data: thresholdData,
                        backgroundColor: 'transparent',
                        borderColor: this.chartColors.danger,
                        borderWidth: 3,
                        borderDash: [5, 5],
                        type: 'line',
                        pointRadius: 4,
                        pointBackgroundColor: this.chartColors.danger
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🩸 Blood Inventory Status',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        return true;
    }

    createDonationTrendChart() {
        const canvas = document.getElementById('donationTrendChart');
        if (!canvas || typeof Chart === 'undefined') return false;

        if (this.charts.donationTrend) {
            this.charts.donationTrend.destroy();
        }

        const ctx = canvas.getContext('2d');
        const donationData = this.data.donations || {};
        const monthlyData = donationData.monthlyTrends || this.generateMockMonthlyData();
        
        const labels = monthlyData.map(item => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[item.month - 1]} ${item.year}`;
        });
        const data = monthlyData.map(item => item.count || 0);

        this.charts.donationTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Donations',
                    data: data,
                    borderColor: this.chartColors.info,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: this.chartColors.info,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📈 Donation Trends',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Donations',
                            font: {
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        return true;
    }

    createRequestStatusChart() {
        const canvas = document.getElementById('requestStatusChart');
        if (!canvas || typeof Chart === 'undefined') return false;

        if (this.charts.requestStatus) {
            this.charts.requestStatus.destroy();
        }

        const ctx = canvas.getContext('2d');
        const requestData = this.data.requests || {};
        const statusData = requestData.statusDistribution || {
            pending: 15,
            approved: 25,
            fulfilled: 45,
            rejected: 5
        };

        this.charts.requestStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Approved', 'Fulfilled', 'Rejected'],
                datasets: [{
                    data: [
                        statusData.pending || 0,
                        statusData.approved || 0,
                        statusData.fulfilled || 0,
                        statusData.rejected || 0
                    ],
                    backgroundColor: [
                        this.chartColors.warning,
                        this.chartColors.info,
                        this.chartColors.success,
                        this.chartColors.danger
                    ],
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📊 Request Status Distribution',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        return true;
    }

    createUserActivityChart() {
        const canvas = document.getElementById('userActivityChart');
        if (!canvas || typeof Chart === 'undefined') return false;

        if (this.charts.userActivity) {
            this.charts.userActivity.destroy();
        }

        const ctx = canvas.getContext('2d');
        const userData = this.data.users || {};
        const activityData = userData.activityTrends || this.generateMockActivityData();
        
        const labels = activityData.map(item => item.date);
        const data = activityData.map(item => item.activeUsers || 0);

        this.charts.userActivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Active Users',
                    data: data,
                    borderColor: this.chartColors.purple,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: this.chartColors.purple,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '👥 User Activity Trends',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Active Users',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });

        return true;
    }

    createBloodTypeDistributionChart() {
        const canvas = document.getElementById('bloodTypeDistributionChart');
        if (!canvas || typeof Chart === 'undefined') return false;

        if (this.charts.bloodTypeDistribution) {
            this.charts.bloodTypeDistribution.destroy();
        }

        const ctx = canvas.getContext('2d');
        const userData = this.data.users || {};
        const distribution = userData.bloodTypeDistribution || this.getMockBloodTypeDistribution();
        
        const labels = distribution.map(item => item.bloodType);
        const donorData = distribution.map(item => item.donors || 0);
        const recipientData = distribution.map(item => item.recipients || 0);

        this.charts.bloodTypeDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Donors',
                        data: donorData,
                        backgroundColor: this.chartColors.success,
                        borderRadius: 8
                    },
                    {
                        label: 'Recipients',
                        data: recipientData,
                        backgroundColor: this.chartColors.primary,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🩸 Blood Type Distribution',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Users',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });

        return true;
    }

    createMonthlyComparisonChart() {
        const canvas = document.getElementById('monthlyComparisonChart');
        if (!canvas || typeof Chart === 'undefined') return false;

        if (this.charts.monthlyComparison) {
            this.charts.monthlyComparison.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        this.charts.monthlyComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Donations',
                        data: [45, 52, 38, 65, 59, 70],
                        backgroundColor: this.chartColors.success
                    },
                    {
                        label: 'Requests',
                        data: [38, 45, 42, 58, 52, 62],
                        backgroundColor: this.chartColors.info
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📊 Monthly Donations vs Requests',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });

        return true;
    }

    createUrgencyChart() {
        const canvas = document.getElementById('urgencyChart');
        if (!canvas || typeof Chart === 'undefined') return false;

        if (this.charts.urgency) {
            this.charts.urgency.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        this.charts.urgency = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Low', 'Medium', 'High', 'Critical'],
                datasets: [{
                    data: [30, 35, 25, 10],
                    backgroundColor: [
                        this.chartColors.info,
                        this.chartColors.warning,
                        this.chartColors.danger,
                        '#991b1b'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '⚠️ Request Urgency Levels',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });

        return true;
    }

    // ========== CHART UPDATES ==========
    updateCharts() {
        console.log('🔄 Updating all charts...');
        
        Object.keys(this.charts).forEach(key => {
            const chart = this.charts[key];
            if (chart && typeof chart.update === 'function') {
                try {
                    chart.update('none'); // Update without animation
                } catch (error) {
                    console.warn(`⚠️ Failed to update chart ${key}:`, error);
                }
            }
        });
    }

    // ========== REPORT GENERATION ==========
    generateReport(type = 'comprehensive') {
        const report = {
            timestamp: new Date().toISOString(),
            type: type,
            summary: {
                totalInventory: this.calculateTotalInventory(),
                totalDonations: this.data.donations?.total || 0,
                totalRequests: this.data.requests?.total || 0,
                totalUsers: this.data.users?.total || 0,
                criticalStock: this.getCriticalStockCount()
            },
            details: this.data,
            insights: this.generateInsights()
        };

        return report;
    }

    calculateTotalInventory() {
        if (!this.data.inventory || !Array.isArray(this.data.inventory)) return 0;
        return this.data.inventory.reduce((sum, item) => sum + (item.availableUnits || 0), 0);
    }

    getCriticalStockCount() {
        if (!this.data.inventory || !Array.isArray(this.data.inventory)) return 0;
        return this.data.inventory.filter(item => 
            (item.availableUnits || 0) < (item.minThreshold || 20)
        ).length;
    }

    generateInsights() {
        return {
            lowStockTypes: this.getLowStockTypes(),
            topDonors: this.data.donations?.topDonors || [],
            urgentRequests: this.data.requests?.urgent || 0,
            growthRate: this.calculateGrowthRate()
        };
    }

    getLowStockTypes() {
        if (!this.data.inventory || !Array.isArray(this.data.inventory)) return [];
        return this.data.inventory
            .filter(item => (item.availableUnits || 0) < (item.minThreshold || 20))
            .map(item => item.bloodType);
    }

    calculateGrowthRate() {
        // Calculate month-over-month growth
        const donations = this.data.donations?.monthlyTrends || [];
        if (donations.length < 2) return 0;
        
        const current = donations[donations.length - 1]?.count || 0;
        const previous = donations[donations.length - 2]?.count || 1;
        
        return ((current - previous) / previous * 100).toFixed(2);
    }

    // ========== EXPORT FUNCTIONALITY ==========
    exportReport(format = 'json') {
        const report = this.generateReport();

        switch (format.toLowerCase()) {
            case 'json':
                return this.exportJSON(report);
            case 'csv':
                return this.exportCSV(report);
            case 'pdf':
                return this.exportPDF(report);
            case 'excel':
                return this.exportExcel(report);
            default:
                return this.exportJSON(report);
        }
    }

    exportJSON(report) {
        const json = JSON.stringify(report, null, 2);
        this.downloadFile('blood-bank-report.json', json, 'application/json');
        return json;
    }

    exportCSV(report) {
        const rows = [
            ['Metric', 'Value'],
            ['Report Generated', report.timestamp],
            ['Total Inventory Units', report.summary.totalInventory],
            ['Total Donations', report.summary.totalDonations],
            ['Total Requests', report.summary.totalRequests],
            ['Total Users', report.summary.totalUsers],
            ['Critical Stock Items', report.summary.criticalStock],
            ['Growth Rate', `${report.insights.growthRate}%`]
        ];

        const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        this.downloadFile('blood-bank-report.csv', csv, 'text/csv');
        return csv;
    }

    exportPDF(report) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Blood Bank Analytics Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #dc2626; }
        h2 { color: #374151; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .metric { display: inline-block; padding: 10px 20px; margin: 10px; background: #f9fafb; border-radius: 8px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #dc2626; }
        .metric-label { font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <h1>🩸 Blood Bank Analytics Report</h1>
    <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
    
    <h2>Summary</h2>
    <div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalInventory}</div>
            <div class="metric-label">Total Inventory Units</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalDonations}</div>
            <div class="metric-label">Total Donations</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalRequests}</div>
            <div class="metric-label">Total Requests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalUsers}</div>
            <div class="metric-label">Total Users</div>
        </div>
    </div>
    
    <h2>Insights</h2>
    <table>
        <tr>
            <th>Insight</th>
            <th>Value</th>
        </tr>
        <tr>
            <td>Growth Rate</td>
            <td>${report.insights.growthRate}%</td>
        </tr>
        <tr>
            <td>Critical Stock Items</td>
            <td>${report.summary.criticalStock}</td>
        </tr>
        <tr>
            <td>Urgent Requests</td>
            <td>${report.insights.urgentRequests}</td>
        </tr>
    </table>
</body>
</html>`;

        this.downloadFile('blood-bank-report.html', html, 'text/html');
        return html;
    }

    exportEx
