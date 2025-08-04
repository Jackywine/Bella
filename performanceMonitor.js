// performanceMonitor.js - Bella's Performance Monitoring and Optimization System
// This module provides comprehensive performance tracking and optimization for the thinking engine

class PerformanceMonitor {
    constructor(options = {}) {
        this.maxMetricsHistory = options.maxMetricsHistory || 1000;
        this.performanceThresholds = {
            responseTime: options.responseTimeThreshold || 5000, // 5 seconds
            successRate: options.successRateThreshold || 90, // 90%
            memoryUsage: options.memoryUsageThreshold || 100 * 1024 * 1024, // 100MB
            errorRate: options.errorRateThreshold || 10 // 10%
        };
        
        this.metrics = [];
        this.systemMetrics = [];
        this.alerts = [];
        this.isMonitoring = false;
        this.monitoringInterval = null;
        
        // Performance optimization settings
        this.optimizationSettings = {
            adaptiveTimeout: true,
            dynamicProviderSelection: true,
            responseCache: new Map(),
            maxCacheSize: 100
        };
        
        this.startSystemMonitoring();
    }

    // Start system-level monitoring
    startSystemMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, 10000); // Every 10 seconds
        
        console.log('Performance monitoring started');
    }

    // Stop system monitoring
    stopSystemMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('Performance monitoring stopped');
    }

    // Collect system metrics
    collectSystemMetrics() {
        const systemMetric = {
            timestamp: Date.now(),
            memory: this.getMemoryUsage(),
            responseCache: {
                size: this.optimizationSettings.responseCache.size,
                hitRate: this.calculateCacheHitRate()
            },
            activeConnections: this.getActiveConnections(),
            uptime: Date.now() - (this.startTime || Date.now())
        };

        this.systemMetrics.push(systemMetric);
        
        // Keep only recent system metrics
        if (this.systemMetrics.length > 100) {
            this.systemMetrics = this.systemMetrics.slice(-100);
        }

        // Check for performance issues
        this.checkPerformanceThresholds(systemMetric);
    }

    // Get memory usage (browser-compatible)
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return { used: 0, total: 0, limit: 0 };
    }

    // Calculate cache hit rate
    calculateCacheHitRate() {
        const recentMetrics = this.metrics.slice(-50);
        if (recentMetrics.length === 0) return 0;
        
        const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
        return Math.round((cacheHits / recentMetrics.length) * 100);
    }

    // Get active connections count
    getActiveConnections() {
        // This would be more meaningful in a server environment
        // For browser, we'll track active thinking operations
        return this.metrics.filter(m => 
            Date.now() - m.timestamp < 30000 && m.status === 'processing'
        ).length;
    }

    // Record thinking operation metrics
    recordThinkingMetrics(operation) {
        const metric = {
            id: this.generateMetricId(),
            timestamp: Date.now(),
            operation: 'thinking',
            provider: operation.provider,
            mode: operation.mode,
            processingTime: operation.processingTime,
            success: operation.success,
            errorType: operation.errorType || null,
            inputLength: operation.inputLength || 0,
            outputLength: operation.outputLength || 0,
            cacheHit: operation.cacheHit || false,
            retryCount: operation.retryCount || 0,
            status: operation.success ? 'completed' : 'failed'
        };

        this.metrics.push(metric);
        
        // Maintain metrics history limit
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics = this.metrics.slice(-this.maxMetricsHistory);
        }

        // Update optimization settings based on performance
        this.updateOptimizationSettings(metric);
        
        return metric.id;
    }

    // Generate unique metric ID
    generateMetricId() {
        return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // Update optimization settings based on performance data
    updateOptimizationSettings(metric) {
        const recentMetrics = this.metrics.slice(-20);
        
        // Adaptive timeout adjustment
        if (this.optimizationSettings.adaptiveTimeout) {
            const avgResponseTime = this.calculateAverageResponseTime(recentMetrics);
            if (avgResponseTime > this.performanceThresholds.responseTime * 0.8) {
                // Increase timeout if we're approaching the limit
                this.performanceThresholds.responseTime = Math.min(
                    this.performanceThresholds.responseTime * 1.2,
                    10000 // Max 10 seconds
                );
            }
        }

        // Dynamic provider selection
        if (this.optimizationSettings.dynamicProviderSelection) {
            this.updateProviderPreferences(recentMetrics);
        }
    }

    // Calculate average response time
    calculateAverageResponseTime(metrics) {
        if (metrics.length === 0) return 0;
        
        const successfulMetrics = metrics.filter(m => m.success);
        if (successfulMetrics.length === 0) return 0;
        
        const totalTime = successfulMetrics.reduce((sum, m) => sum + m.processingTime, 0);
        return totalTime / successfulMetrics.length;
    }

    // Update provider preferences based on performance
    updateProviderPreferences(metrics) {
        const providerStats = {};
        
        metrics.forEach(metric => {
            if (!providerStats[metric.provider]) {
                providerStats[metric.provider] = {
                    total: 0,
                    successful: 0,
                    totalTime: 0,
                    avgTime: 0,
                    successRate: 0
                };
            }
            
            const stats = providerStats[metric.provider];
            stats.total++;
            stats.totalTime += metric.processingTime;
            
            if (metric.success) {
                stats.successful++;
            }
        });

        // Calculate final stats
        Object.keys(providerStats).forEach(provider => {
            const stats = providerStats[provider];
            stats.avgTime = stats.totalTime / stats.total;
            stats.successRate = (stats.successful / stats.total) * 100;
        });

        this.providerPreferences = providerStats;
    }

    // Check performance thresholds and generate alerts
    checkPerformanceThresholds(systemMetric) {
        const recentMetrics = this.metrics.slice(-20);
        
        // Check response time
        const avgResponseTime = this.calculateAverageResponseTime(recentMetrics);
        if (avgResponseTime > this.performanceThresholds.responseTime) {
            this.generateAlert('high_response_time', {
                current: avgResponseTime,
                threshold: this.performanceThresholds.responseTime
            });
        }

        // Check success rate
        const successRate = this.calculateSuccessRate(recentMetrics);
        if (successRate < this.performanceThresholds.successRate) {
            this.generateAlert('low_success_rate', {
                current: successRate,
                threshold: this.performanceThresholds.successRate
            });
        }

        // Check memory usage
        if (systemMetric.memory.used > this.performanceThresholds.memoryUsage) {
            this.generateAlert('high_memory_usage', {
                current: systemMetric.memory.used,
                threshold: this.performanceThresholds.memoryUsage
            });
        }
    }

    // Calculate success rate
    calculateSuccessRate(metrics) {
        if (metrics.length === 0) return 100;
        
        const successful = metrics.filter(m => m.success).length;
        return (successful / metrics.length) * 100;
    }

    // Generate performance alert
    generateAlert(type, data) {
        const alert = {
            id: this.generateMetricId(),
            type,
            timestamp: Date.now(),
            data,
            severity: this.getAlertSeverity(type, data),
            resolved: false
        };

        this.alerts.push(alert);
        
        // Keep only recent alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }

        console.warn(`Performance Alert [${type}]:`, data);
        return alert.id;
    }

    // Get alert severity level
    getAlertSeverity(type, data) {
        const severityMap = {
            high_response_time: data.current > data.threshold * 1.5 ? 'critical' : 'warning',
            low_success_rate: data.current < data.threshold * 0.5 ? 'critical' : 'warning',
            high_memory_usage: data.current > data.threshold * 1.5 ? 'critical' : 'warning'
        };
        
        return severityMap[type] || 'info';
    }

    // Get comprehensive performance report
    getPerformanceReport() {
        const recentMetrics = this.metrics.slice(-100);
        const recentSystemMetrics = this.systemMetrics.slice(-10);
        
        return {
            summary: {
                totalOperations: this.metrics.length,
                recentOperations: recentMetrics.length,
                averageResponseTime: this.calculateAverageResponseTime(recentMetrics),
                successRate: this.calculateSuccessRate(recentMetrics),
                cacheHitRate: this.calculateCacheHitRate(),
                activeAlerts: this.alerts.filter(a => !a.resolved).length
            },
            providers: this.providerPreferences || {},
            systemHealth: {
                memory: recentSystemMetrics.length > 0 ? recentSystemMetrics[recentSystemMetrics.length - 1].memory : null,
                uptime: Date.now() - (this.startTime || Date.now()),
                cacheSize: this.optimizationSettings.responseCache.size
            },
            optimization: {
                adaptiveTimeout: this.optimizationSettings.adaptiveTimeout,
                currentTimeout: this.performanceThresholds.responseTime,
                dynamicProviderSelection: this.optimizationSettings.dynamicProviderSelection,
                cacheEnabled: this.optimizationSettings.responseCache.size > 0
            },
            alerts: this.alerts.slice(-10),
            trends: this.calculatePerformanceTrends(recentMetrics)
        };
    }

    // Calculate performance trends
    calculatePerformanceTrends(metrics) {
        if (metrics.length < 10) return null;
        
        const half = Math.floor(metrics.length / 2);
        const firstHalf = metrics.slice(0, half);
        const secondHalf = metrics.slice(half);
        
        const firstHalfAvg = this.calculateAverageResponseTime(firstHalf);
        const secondHalfAvg = this.calculateAverageResponseTime(secondHalf);
        
        const firstHalfSuccess = this.calculateSuccessRate(firstHalf);
        const secondHalfSuccess = this.calculateSuccessRate(secondHalf);
        
        return {
            responseTime: {
                trend: secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing',
                change: Math.abs(secondHalfAvg - firstHalfAvg),
                changePercent: firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0
            },
            successRate: {
                trend: secondHalfSuccess > firstHalfSuccess ? 'increasing' : 'decreasing',
                change: Math.abs(secondHalfSuccess - firstHalfSuccess),
                changePercent: firstHalfSuccess > 0 ? ((secondHalfSuccess - firstHalfSuccess) / firstHalfSuccess) * 100 : 0
            }
        };
    }

    // Clear all metrics and reset
    reset() {
        this.metrics = [];
        this.systemMetrics = [];
        this.alerts = [];
        this.optimizationSettings.responseCache.clear();
        this.providerPreferences = {};
        console.log('Performance monitor reset');
    }

    // Get optimization recommendations
    getOptimizationRecommendations() {
        const report = this.getPerformanceReport();
        const recommendations = [];
        
        if (report.summary.averageResponseTime > this.performanceThresholds.responseTime * 0.8) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'Consider enabling response caching or switching to a faster provider',
                action: 'optimize_response_time'
            });
        }
        
        if (report.summary.successRate < this.performanceThresholds.successRate) {
            recommendations.push({
                type: 'reliability',
                priority: 'critical',
                message: 'Success rate is below threshold. Check provider configurations and error handling',
                action: 'improve_reliability'
            });
        }
        
        if (report.summary.cacheHitRate < 20) {
            recommendations.push({
                type: 'optimization',
                priority: 'medium',
                message: 'Low cache hit rate. Consider adjusting cache strategy',
                action: 'optimize_caching'
            });
        }
        
        return recommendations;
    }
}

// ES6 module export
export { PerformanceMonitor };