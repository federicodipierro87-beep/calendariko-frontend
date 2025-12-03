import React, { useState, useEffect } from 'react';
import { backupApi } from '../utils/api';

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  type: 'auto' | 'manual';
  status: 'success' | 'failed';
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  totalSizeFormatted: string;
  avgSizeFormatted: string;
  oldestBackup?: string;
  newestBackup?: string;
  scheduling: {
    enabled: boolean;
    schedule?: string;
    nextRun?: string;
    timezone: string;
  };
}

interface BackupConfig {
  enabled: boolean;
  schedule?: string;
  retentionDays: number;
  maxBackups: number;
  notificationsEnabled: boolean;
  notificationEmail?: string;
  timezone: string;
}

const BackupManagement: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [operationInProgress, setOperationInProgress] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<{
    show: boolean;
    action: string;
    backupId?: string;
    backupName?: string;
  }>({ show: false, action: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [backupsResult, statsResult, configResult] = await Promise.all([
        backupApi.getBackups(),
        backupApi.getStats(),
        backupApi.getConfig(),
      ]);
      
      setBackups(backupsResult.data || []);
      setStats(statsResult.data);
      setConfig(configResult.data);
      setError('');
    } catch (error: any) {
      console.error('Error loading backup data:', error);
      setError('Errore nel caricamento dei dati backup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setOperationInProgress('Creazione backup...');
      await backupApi.createBackup();
      await loadData(); // Ricarica i dati
      setOperationInProgress('');
    } catch (error: any) {
      setError(`Errore creazione backup: ${error.message}`);
      setOperationInProgress('');
    }
  };

  const handleTestBackup = async () => {
    try {
      setOperationInProgress('Test sistema backup...');
      await backupApi.testBackup();
      setOperationInProgress('');
      alert('Test backup completato con successo!');
    } catch (error: any) {
      setError(`Errore test backup: ${error.message}`);
      setOperationInProgress('');
    }
  };

  const handleCleanup = async () => {
    try {
      setOperationInProgress('Pulizia backup vecchi...');
      const result = await backupApi.cleanupBackups();
      await loadData(); // Ricarica i dati
      setOperationInProgress('');
      alert(`Cleanup completato: ${result.data.removed} backup rimossi, ${result.data.kept} mantenuti`);
    } catch (error: any) {
      setError(`Errore cleanup: ${error.message}`);
      setOperationInProgress('');
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      setOperationInProgress('Eliminazione backup...');
      await backupApi.deleteBackup(backupId);
      await loadData(); // Ricarica i dati
      setOperationInProgress('');
      setShowConfirmModal({ show: false, action: '' });
    } catch (error: any) {
      setError(`Errore eliminazione: ${error.message}`);
      setOperationInProgress('');
      setShowConfirmModal({ show: false, action: '' });
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      setOperationInProgress('Ripristino database...');
      await backupApi.restoreBackup(backupId, true);
      setOperationInProgress('');
      setShowConfirmModal({ show: false, action: '' });
      alert('Database ripristinato con successo! ATTENZIONE: Tutti i dati sono stati sovrascritti con il backup selezionato.');
    } catch (error: any) {
      setError(`Errore ripristino: ${error.message}`);
      setOperationInProgress('');
      setShowConfirmModal({ show: false, action: '' });
    }
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

  if (loading && backups.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento backup...</p>
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
            💾 Gestione Backup Database
          </h3>
          <p className="text-sm text-gray-500">
            Backup automatici e manuali del database per la sicurezza dei dati
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateBackup}
            disabled={!!operationInProgress}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {operationInProgress === 'Creazione backup...' ? '🔄 Creando...' : '➕ Crea Backup'}
          </button>
        </div>
      </div>

      {/* Statistiche e Configurazione */}
      {stats && config && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistiche */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-green-800 font-medium text-lg mb-4">📊 Statistiche Backup</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-2xl font-bold text-blue-600">{stats.totalBackups}</div>
                <div className="text-sm text-gray-600">Backup Totali</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-2xl font-bold text-purple-600">{stats.totalSizeFormatted}</div>
                <div className="text-sm text-gray-600">Spazio Utilizzato</div>
              </div>
            </div>

            {stats.newestBackup && (
              <div className="text-sm text-gray-600">
                <div>📅 Ultimo backup: {formatDate(stats.newestBackup)}</div>
                {stats.oldestBackup && (
                  <div>📅 Primo backup: {formatDate(stats.oldestBackup)}</div>
                )}
              </div>
            )}
          </div>

          {/* Configurazione Scheduling */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
            <h4 className="text-amber-800 font-medium text-lg mb-4">⚙️ Configurazione Automatici</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stato:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stats.scheduling.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {stats.scheduling.enabled ? '🟢 Attivi' : '🔴 Disattivi'}
                </span>
              </div>
              
              {stats.scheduling.enabled && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Programma:</span>
                    <span className="text-sm font-medium">{stats.scheduling.schedule}</span>
                  </div>
                  {stats.scheduling.nextRun && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Prossimo:</span>
                      <span className="text-sm font-medium">{formatDate(stats.scheduling.nextRun)}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Retention:</span>
                <span className="text-sm font-medium">{config.retentionDays} giorni</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Max backup:</span>
                <span className="text-sm font-medium">{config.maxBackups}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operazioni */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-4">🔧 Operazioni</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestBackup}
            disabled={!!operationInProgress}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm disabled:opacity-50"
          >
            {operationInProgress === 'Test sistema backup...' ? '🔄 Testando...' : '🧪 Test Sistema'}
          </button>
          
          <button
            onClick={handleCleanup}
            disabled={!!operationInProgress}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
          >
            {operationInProgress === 'Pulizia backup vecchi...' ? '🔄 Pulendo...' : '🧹 Pulizia Vecchi'}
          </button>
          
          <button
            onClick={loadData}
            disabled={!!operationInProgress}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
          >
            🔄 Aggiorna
          </button>
        </div>
      </div>

      {/* Progress */}
      {operationInProgress && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
          {operationInProgress}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Lista Backup */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">📋 Lista Backup ({backups.length})</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Caricamento...' : 'Nessun backup disponibile'}
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">💾</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {backup.filename}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {backup.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.sizeFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(backup.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        backup.type === 'manual' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {backup.type === 'manual' ? '👤 Manuale' : '🤖 Automatico'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setShowConfirmModal({ 
                          show: true, 
                          action: 'restore', 
                          backupId: backup.id, 
                          backupName: backup.filename 
                        })}
                        disabled={!!operationInProgress}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        title="Ripristina database da questo backup"
                      >
                        🔄 Ripristina
                      </button>
                      <button
                        onClick={() => setShowConfirmModal({ 
                          show: true, 
                          action: 'delete', 
                          backupId: backup.id, 
                          backupName: backup.filename 
                        })}
                        disabled={!!operationInProgress}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Elimina questo backup"
                      >
                        🗑️ Elimina
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal di Conferma */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {showConfirmModal.action === 'delete' ? '⚠️ Conferma Eliminazione' : '⚠️ Conferma Ripristino'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-6">
              {showConfirmModal.action === 'delete' 
                ? `Sei sicuro di voler eliminare il backup "${showConfirmModal.backupName}"? Questa azione non può essere annullata.`
                : `Sei sicuro di voler ripristinare il database dal backup "${showConfirmModal.backupName}"? TUTTI I DATI ATTUALI VERRANNO SOVRASCRITTI e le modifiche successive al backup andranno perse.`
              }
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal({ show: false, action: '' })}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (showConfirmModal.action === 'delete' && showConfirmModal.backupId) {
                    handleDeleteBackup(showConfirmModal.backupId);
                  } else if (showConfirmModal.action === 'restore' && showConfirmModal.backupId) {
                    handleRestoreBackup(showConfirmModal.backupId);
                  }
                }}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white ${
                  showConfirmModal.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {showConfirmModal.action === 'delete' ? '🗑️ Elimina' : '🔄 Ripristina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManagement;