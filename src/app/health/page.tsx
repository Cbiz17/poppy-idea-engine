'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
  details?: any;
}

interface SystemHealth {
  overall: HealthStatus;
  services: {
    database: HealthStatus;
    auth: HealthStatus;
    ai: HealthStatus;
    embeddings: HealthStatus;
    storage: HealthStatus;
    sentry: HealthStatus;
  };
  metrics: {
    activeUsers: number;
    conversationsToday: number;
    ideasSaved: number;
    feedbackCollected: number;
    averageResponseTime: number;
  };
}

export default function HealthDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const checkHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check overall health
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error('Health check failed');
      
      const healthData = await response.json();
      setHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set degraded state
      setHealth({
        overall: {
          status: 'unhealthy',
          message: 'System health check failed',
          timestamp: new Date().toISOString()
        },
        services: {
          database: { status: 'unhealthy', message: 'Unknown', timestamp: new Date().toISOString() },
          auth: { status: 'unhealthy', message: 'Unknown', timestamp: new Date().toISOString() },
          ai: { status: 'unhealthy', message: 'Unknown', timestamp: new Date().toISOString() },
          embeddings: { status: 'unhealthy', message: 'Unknown', timestamp: new Date().toISOString() },
          storage: { status: 'unhealthy', message: 'Unknown', timestamp: new Date().toISOString() },
          sentry: { status: 'unhealthy', message: 'Unknown', timestamp: new Date().toISOString() }
        },
        metrics: {
          activeUsers: 0,
          conversationsToday: 0,
          ideasSaved: 0,
          feedbackCollected: 0,
          averageResponseTime: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && !health) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-gray-600">Checking system health...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Health Dashboard</h1>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>Error: {error}</span>
            </div>
          </div>
        )}

        {health && (
          <>
            {/* Overall Status */}
            <div className={`mb-8 p-6 rounded-lg border ${getStatusColor(health.overall.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(health.overall.status)}
                  <div>
                    <h2 className="text-xl font-semibold">Overall System Status</h2>
                    <p className="text-sm opacity-90">{health.overall.message}</p>
                  </div>
                </div>
                <span className="text-sm opacity-75">
                  Last checked: {new Date(health.overall.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {Object.entries(health.services).map(([service, status]) => (
                <div key={service} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold capitalize">{service}</h3>
                    {getStatusIcon(status.status)}
                  </div>
                  <p className="text-sm text-gray-600">{status.message}</p>
                  {status.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                      <pre className="text-xs mt-1 p-2 bg-gray-50 rounded overflow-auto">
                        {JSON.stringify(status.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {/* Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">System Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-purple-600">{health.metrics.activeUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Conversations Today</p>
                  <p className="text-2xl font-bold text-blue-600">{health.metrics.conversationsToday}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ideas Saved</p>
                  <p className="text-2xl font-bold text-green-600">{health.metrics.ideasSaved}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Feedback Collected</p>
                  <p className="text-2xl font-bold text-orange-600">{health.metrics.feedbackCollected}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-600">{health.metrics.averageResponseTime}ms</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
