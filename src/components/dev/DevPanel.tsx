'use client';

import { useState, useEffect } from 'react';
import { devLogger } from '@/lib/dev-logger';
import { createClient } from '@/lib/supabase';

interface DevPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevPanel({ isOpen, onClose }: DevPanelProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'database'>('console');
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      // Load local logs
      setLogs(devLogger.getLogs());
      
      // Load database logs
      loadDbLogs();
    }
  }, [isOpen, selectedLevel]);

  // Auto-refresh database logs
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(loadDbLogs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedLevel]);

  const loadDbLogs = async () => {
    try {
      const response = await fetch(`/api/dev-logs?limit=100${selectedLevel !== 'all' ? `&level=${selectedLevel}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const { logs } = await response.json();
      setDbLogs(logs || []);
    } catch (error) {
      console.error('Failed to load database logs:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.component.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    
    return matchesSearch && matchesLevel;
  });

  const exportLogs = () => {
    devLogger.exportLogs();
  };

  const clearLogs = () => {
    devLogger.clear();
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-5/6 h-5/6 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">🐛 Development Panel</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Controls */}
        <div className="border-b p-4 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded-md flex-1"
          />
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Export
          </button>
          
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Clear
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b flex">
          <button 
            onClick={() => setActiveTab('console')}
            className={`px-4 py-2 ${activeTab === 'console' ? 'border-b-2 border-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Console Logs ({filteredLogs.length})
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 ${activeTab === 'database' ? 'border-b-2 border-blue-500 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Database Logs ({dbLogs.length})
          </button>
        </div>
        
        {/* Logs Display */}
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
          {activeTab === 'console' ? (
            // Console Logs
            filteredLogs.map((log, index) => (
              <div key={index} className="border-b pb-2 mb-2 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    log.level === 'error' ? 'bg-red-100 text-red-800' :
                    log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                    log.level === 'debug' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {log.component}
                  </span>
                </div>
                <div className="text-gray-800 mb-1">{log.message}</div>
                {log.data && (
                  <details className="text-gray-600 text-xs">
                    <summary className="cursor-pointer hover:text-gray-800">
                      Show data
                    </summary>
                    <pre className="mt-1 p-2 bg-gray-50 rounded overflow-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          ) : (
            // Database Logs
            dbLogs
              .filter(log => {
                const matchesSearch = searchQuery === '' || 
                  log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  log.component.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesSearch;
              })
              .map((log, index) => (
                <div key={index} className="border-b pb-2 mb-2 last:border-b-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      log.level === 'debug' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-600 text-xs">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {log.component}
                    </span>
                  </div>
                  <div className="text-gray-800 mb-1">{log.message}</div>
                  {log.data && (
                    <details className="text-gray-600 text-xs">
                      <summary className="cursor-pointer hover:text-gray-800">
                        Show data
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-50 rounded overflow-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
          )}
          
          {((activeTab === 'console' && filteredLogs.length === 0) || 
            (activeTab === 'database' && dbLogs.length === 0)) && (
            <div className="text-gray-500 text-center py-8">
              No logs found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Floating dev button
export function DevButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-500 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 z-40"
        title="Open Development Panel"
      >
        🐛
      </button>
      
      <DevPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
