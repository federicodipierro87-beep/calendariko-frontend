import React, { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUser: (userData: any) => void;
  user: any;
  groups: any[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSaveUser,
  user,
  groups
}) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'ARTIST' as 'ADMIN' | 'ARTIST',
    selectedGroups: [] as string[],
    newPassword: '' // Campo opzionale per cambiare password
  });

  // Use body scroll lock when modal is open
  useBodyScrollLock(isOpen);

  // Popola il form quando l'utente cambia
  useEffect(() => {
    if (user) {
      console.log('🔄 EditUserModal - Caricamento dati utente:', user);
      setFormData({
        email: user.email || '',
        // Mappa dai campi backend (firstName/lastName) ai campi frontend (first_name/last_name)
        first_name: user.firstName || user.first_name || '',
        last_name: user.lastName || user.last_name || '',
        role: user.role || 'ARTIST',
        selectedGroups: user.group_ids || [],
        newPassword: '' // Reset sempre il campo password
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 EditUserModal - Dati form da inviare:', formData);
    console.log('📝 EditUserModal - Validazione campi:', {
      email: !!formData.email,
      first_name: !!formData.first_name,
      last_name: !!formData.last_name
    });
    
    if (formData.email && formData.first_name && formData.last_name) {
      console.log('✅ EditUserModal - Validazione passata, chiamando onSaveUser');
      
      // Prepara i dati, includendo la password solo se è stata fornita
      const dataToSave = { ...formData };
      if (!formData.newPassword || formData.newPassword.trim() === '') {
        // Rimuovi il campo password se vuoto
        delete dataToSave.newPassword;
      }
      
      onSaveUser(dataToSave);
    } else {
      console.error('❌ EditUserModal - Validazione fallita, campi mancanti');
      alert('Per favore compila tutti i campi obbligatori');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              ✏️ Modifica Utente
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Chiudi</span>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Cognome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cognome *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Nuova Password (opzionale) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nuova Password (opzionale)
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Lascia vuoto per non modificare la password"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Compila solo se vuoi cambiare la password dell'utente
              </p>
            </div>


            {/* Ruolo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruolo *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ARTIST">Artista</option>
                <option value="ADMIN">Amministratore</option>
              </select>
            </div>

            {/* Gruppi (solo per artisti) */}
            {formData.role === 'ARTIST' && groups.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gruppi associati
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {groups.map((group) => (
                    <label key={group.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.selectedGroups.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{group.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Pulsanti */}
            <div className="flex space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                💾 Salva Modifiche
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;