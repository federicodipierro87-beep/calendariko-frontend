import React, { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGroup: (groupData: any) => void;
  group: any;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  onSaveGroup,
  group
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'BAND' as 'BAND' | 'DJ' | 'SOLO' | '',
    description: '',
    genre: '',
    color: '',
    contact_email: '',
    contact_phone: ''
  });

  // Use body scroll lock when modal is open
  useBodyScrollLock(isOpen);

  // Popola il form quando il gruppo cambia
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        type: group.type || '',
        description: group.description || '',
        genre: group.genre || '',
        color: group.color || '',
        contact_email: group.contact_email || '',
        contact_phone: group.contact_phone || ''
      });
    }
  }, [group]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      onSaveGroup(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24 sm:pb-4" style={{touchAction: 'none', overscrollBehavior: 'none'}}>
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[75vh] sm:max-h-[90vh] overflow-y-auto shadow-xl" style={{touchAction: 'pan-y', overflowX: 'hidden', position: 'relative', maxWidth: '100%'}}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            ✏️ Modifica Gruppo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome Gruppo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Gruppo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              placeholder="es. The Beatles, DJ Marco, Solo Artist..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleziona tipo</option>
              <option value="BAND">Band</option>
              <option value="DJ">DJ</option>
              <option value="SOLO">Solista</option>
            </select>
          </div>

          {/* Descrizione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Breve descrizione del gruppo..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Genere */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genere Musicale
            </label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => handleInputChange('genre', e.target.value)}
              placeholder="es. Rock, Pop, Elettronica, Jazz..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Colore */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colore Gruppo
            </label>
            <input
              type="color"
              value={formData.color || '#3B82F6'}
              onChange={(e) => handleInputChange('color', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Email Contatto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email di Contatto
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="gruppo@email.com"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefono di Contatto
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              placeholder="+39 xxx xxx xxxx"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Pulsanti */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              💾 Salva Modifiche
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal;