import React, { useState, useEffect } from 'react';
import { auditApi } from '../utils/api';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  details: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

interface AuditStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByEntity: Record<string, number>;
  actionsByAdmin: Record<string, number>;
  actionsPerDay: Record<string, number>;
  successRate: number;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStats, setShowStats] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
    adminId: '',
  });

  const logsPerPage = 20;

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await auditApi.getLogs({
        ...filters,
        page: currentPage,
        limit: logsPerPage,
      });
      
      setLogs(result.data.logs || []);
      setTotalPages(result.data.pages || 1);
      setError('');
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
      setError('Errore nel caricamento dei log audit');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await auditApi.getStats(30); // Ultimi 30 giorni
      setStats(result.data);
    } catch (error: any) {
      console.error('Error loading audit stats:', error);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage, filters]);

  useEffect(() => {
    if (showStats) {
      loadStats();
    }
  }, [showStats]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset alla prima pagina quando si filtrano
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entity: '',
      startDate: '',
      endDate: '',
      adminId: '',
    });
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return '➕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('LOGIN')) return '🔐';
    return '⚙️';
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'USER': return '👤';
      case 'GROUP': return '👥';
      case 'EVENT': return '🎤';
      case 'SYSTEM': return '🔧';
      default: return '📄';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento log audit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            🔍 Log Audit Sistema
          </h3>
          <p className="text-sm text-gray-500">
            Tracciamento completo di tutte le azioni amministrative
          </p>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
        >
          {showStats ? '📊 Nascondi Statistiche' : '📊 Mostra Statistiche'}
        </button>
      </div>

      {/* Statistiche */}
      {showStats && stats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-blue-800 font-medium text-lg mb-4">📈 Statistiche Ultimi 30 Giorni</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-blue-600">{stats.totalActions}</div>
              <div className="text-sm text-gray-600">Azioni Totali</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Tasso Successo</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.actionsByAdmin).length}</div>
              <div className="text-sm text-gray-600">Admin Attivi</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border">
              <div className="text-2xl font-bold text-orange-600">{Object.keys(stats.actionsByType).length}</div>
              <div className="text-sm text-gray-600">Tipi Azioni</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Actions */}
            <div className="bg-white rounded-lg p-4 border">
              <h5 className="font-medium text-gray-800 mb-3">🎯 Azioni Più Frequenti</h5>
              <div className="space-y-2">
                {Object.entries(stats.actionsByType)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([action, count]) => (
                    <div key={action} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{getActionIcon(action)} {action}</span>
                      <span className="font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Entities */}
            <div className="bg-white rounded-lg p-4 border">
              <h5 className="font-medium text-gray-800 mb-3">📊 Entità Più Modificate</h5>
              <div className="space-y-2">
                {Object.entries(stats.actionsByEntity)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([entity, count]) => (
                    <div key={entity} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{getEntityIcon(entity)} {entity}</span>
                      <span className="font-medium text-gray-800">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtri */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-4">🔍 Filtri</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Azione</label>
            <input
              type="text"
              placeholder="es: CREATE_USER"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Entità</label>
            <select
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutte</option>
              <option value="USER">👤 Utenti</option>
              <option value="GROUP">👥 Gruppi</option>
              <option value="EVENT">🎤 Eventi</option>
              <option value="SYSTEM">🔧 Sistema</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data Inizio</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data Fine</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-200 text-gray-700 px-3 py-2 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Lista Log */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Ora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Caricamento...' : 'Nessun log trovato con questi filtri'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{getActionIcon(log.action)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.action.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getEntityIcon(log.entity)} {log.entity}
                            {log.entityId && (
                              <span className="ml-1 text-gray-400">#{log.entityId.slice(-8)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.admin.firstName} {log.admin.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{log.admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.success ? '✅ Successo' : '❌ Errore'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginazione */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Pagina {currentPage} di {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Precedente
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Successiva →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;