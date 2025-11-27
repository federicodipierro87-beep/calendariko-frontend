import React, { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  location?: string;
  groupId?: string;
  // Campi legacy per compatibilità
  event_type?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  group_id?: string;
  fee?: number;
  status?: string;
  notes?: string;
  contact_responsible?: string;
}

interface Group {
  id: string;
  name: string;
  type: 'BAND' | 'DJ' | 'SOLO';
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<Event>) => void;
  event: Event;
  groups: Group[];
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  groups
}) => {
  // Use body scroll lock when modal is open
  useBodyScrollLock(isOpen);

  // Funzione helper per estrarre data
  const getDatePart = (dateStr: string | Date) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateStr);
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return '';
    }
  };

  // Funzione helper per estrarre tempo  
  const getTimePart = (dateStr: string | Date | undefined | null) => {
    if (!dateStr) return '';
    
    // Se è già una stringa in formato HH:MM, usala direttamente
    if (typeof dateStr === 'string' && /^\d{2}:\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for time extraction:', dateStr);
        return '';
      }
      // Usa toLocaleTimeString per formattazione più sicura
      return date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch (error) {
      console.error('Error parsing time from date:', dateStr, error);
      return '';
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    type: 'rehearsal',
    time: '',
    endTime: '',
    venue: '',
    group_id: '',
    fee: '',
    notes: '',
    contact_responsible: ''
  });

  // Aggiorna il form quando cambia l'evento
  useEffect(() => {
    if (event && isOpen) {
      console.log('EditEventModal - Event data received:', event);
      console.log('EditEventModal - Available fields:', Object.keys(event));
      
      // Cast per bypassare TypeScript e accedere ai campi dinamicamente
      const eventData = event as any;
      
      const newFormData = {
        title: eventData.title || '',
        type: eventData.description || eventData.type || eventData.event_type || 'rehearsal',
        time: getTimePart(eventData.startTime || eventData.start_time || eventData.time),
        endTime: getTimePart(eventData.endTime || eventData.end_time || eventData.endTime),
        venue: eventData.location || eventData.venue || eventData.venue_name || '',
        group_id: eventData.groupId || eventData.group_id || '',
        fee: eventData.fee?.toString() || '',
        notes: eventData.notes || eventData.description || '',
        contact_responsible: eventData.contact_responsible || ''
      };
      
      console.log('EditEventModal - Form data set to:', newFormData);
      setFormData(newFormData);
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ottieni la data dall'evento esistente o usa oggi se non disponibile
    const eventDate = getDatePart(event.startTime || event.date || new Date());
    
    // Costruisci DateTime completi per i nuovi campi API
    const startDateTime = eventDate && formData.time ? `${eventDate}T${formData.time}:00` : undefined;
    const endDateTime = eventDate && formData.endTime ? `${eventDate}T${formData.endTime}:00` : undefined;
    
    // Costruisci l'oggetto con le modifiche per la nuova API Prisma
    const eventUpdates = {
      id: event.id,
      title: formData.title,
      description: formData.notes || formData.type,
      startTime: startDateTime,
      endTime: endDateTime, 
      location: formData.venue,
      groupId: formData.group_id || undefined,
      // Mantieni i campi legacy per compatibilità
      event_type: formData.type,
      date: eventDate,
      start_time: formData.time,
      end_time: formData.endTime,
      venue_name: formData.venue,
      group_id: formData.group_id,
      fee: formData.fee ? parseInt(formData.fee, 10) : undefined,
      notes: formData.notes,
      contact_responsible: formData.contact_responsible
    };

    onSave(eventUpdates);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pb-24 sm:pb-4" style={{touchAction: 'none', overscrollBehavior: 'none'}}>
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[75vh] sm:max-h-[90vh] overflow-y-auto shadow-xl" style={{touchAction: 'pan-y', overflowX: 'hidden', position: 'relative', maxWidth: '100%'}}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            ✏️ Modifica Evento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* IDENTICO AL MODAL DI CREAZIONE */}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titolo Evento *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Es: Concerto Jazz Club"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orario Inizio *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orario Fine *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="availability">Confermata</option>
                <option value="rehearsal">Opzionata</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gruppo/Artista *
            </label>
            <select
              value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleziona gruppo/artista</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.type === 'BAND' ? 'Band' : group.type === 'DJ' ? 'DJ' : 'Solista'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locale
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Es: Jazz Club Milano"
            />
          </div>

          {/* Campo Cachet - solo per Admin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💰 Cachet (€)
            </label>
            <input
              type="number"
              min="0"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Es: 500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👤 Contatto responsabile
            </label>
            <input
              type="text"
              value={formData.contact_responsible}
              onChange={(e) => setFormData({ ...formData, contact_responsible: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Es: Mario Rossi, 329-1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Note aggiuntive..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              ✅ Salva Modifiche
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              ❌ Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;