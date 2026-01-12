import React from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  type: 'rehearsal' | 'availability' | 'availability-busy';
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  venue?: string;
  notes?: string;
  fee?: number;
  contact_responsible?: string;
  group?: {
    id: string;
    name: string;
    color?: string | null;
  };
  group_id?: string;
  user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  availability_id?: string;
}

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string, eventTitle?: string) => void;
  currentUser?: any;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose, onEdit, onDelete, currentUser }) => {
  if (!isOpen || !event) return null;

  // Debug: controlliamo il tipo di evento
  console.log('EventDetailsModal - Event type:', event.type);
  console.log('EventDetailsModal - Current user role:', currentUser?.role);
  console.log('EventDetailsModal - Event:', event);

  // Admin può modificare solo eventi normali (non indisponibilità)
  const canEditEvent = currentUser?.role === 'ADMIN' && event.type !== 'availability-busy';
  
  // Admin può cancellare indisponibilità, utenti normali possono cancellare le proprie
  const canDeleteEvent = (currentUser?.role === 'ADMIN') || 
    (event.type === 'availability-busy' && event.user?.id === currentUser?.id);

  console.log('EventDetailsModal - canEditEvent:', canEditEvent);
  console.log('EventDetailsModal - canDeleteEvent:', canDeleteEvent);

  const handleEditClick = () => {
    if (onEdit && event) {
      onEdit(event);
      onClose();
    }
  };

  const handleDeleteClick = () => {
    if (onDelete && event) {
      const title = event.type === 'availability-busy' ? 'Indisponibile' : event.title;
      onDelete(event.id, title);
      onClose();
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    // Se è un timestamp ISO, estrai solo l'orario
    if (timeString.includes('T')) {
      try {
        const date = new Date(timeString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      } catch (e) {
        return timeString;
      }
    }
    
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'availability-busy':
        return 'Indisponibilità';
      case 'availability':
        return 'Disponibilità';
      case 'rehearsal':
        return 'Prova';
      default:
        return 'Evento';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'availability-busy':
        return 'bg-red-500';
      case 'availability':
        return 'bg-green-500';
      case 'rehearsal':
        return 'bg-blue-500';
      default:
        return 'bg-purple-500';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confermato';
      case 'PENDING':
        return 'Opzionato';
      case 'CANCELLED':
        return 'Cancellato';
      default:
        return 'Opzionato';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'CANCELLED':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Dettagli Evento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Badge - per eventi normali (non indisponibilità) */}
          {event.type !== 'availability-busy' && (
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(event.status)}`}>
                {getStatusLabel(event.status)}
              </span>
            </div>
          )}

          {/* Badge indisponibilità */}
          {event.type === 'availability-busy' && (
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white bg-red-500`}>
                Indisponibilità
              </span>
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {event.type === 'availability-busy' ? 'Indisponibile' : event.title}
            </h3>
          </div>

          {/* Group (if present) */}
          {event.group && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Gruppo</p>
                <p className="text-sm text-gray-600">{event.group.name}</p>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Data</p>
              <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
            </div>
          </div>

          {/* Time - Nascondi per le indisponibilità */}
          {event.type !== 'availability-busy' && event.time && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Orario</p>
                <p className="text-sm text-gray-600">
                  {formatTime(event.time)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </p>
              </div>
            </div>
          )}

          {/* Venue (if present) */}
          {event.venue && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Luogo</p>
                <p className="text-sm text-gray-600">{event.venue}</p>
              </div>
            </div>
          )}

          {/* Fee (if present) */}
          {event.fee !== undefined && event.fee > 0 && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Compenso</p>
                <p className="text-sm text-gray-600">€ {event.fee}</p>
              </div>
            </div>
          )}

          {/* Contact Responsible (if present) */}
          {event.contact_responsible && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Contatto Responsabile</p>
                <p className="text-sm text-gray-600">{event.contact_responsible}</p>
              </div>
            </div>
          )}

          {/* Notes (if present) */}
          {event.notes && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Note</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.notes}</p>
              </div>
            </div>
          )}

          {/* Event ID - only for admin */}
          {currentUser?.role === 'ADMIN' && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">ID: {event.id}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="flex gap-3">
            {/* Pulsante Modifica - solo per eventi normali se admin */}
            {canEditEvent && onEdit && (
              <button
                onClick={handleEditClick}
                className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifica
              </button>
            )}
            
            {/* Pulsante Elimina - per admin o proprietari di indisponibilità */}
            {canDeleteEvent && onDelete && (
              <button
                onClick={handleDeleteClick}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Elimina
              </button>
            )}
            
            <button
              onClick={onClose}
              className={`${(canEditEvent && onEdit) || (canDeleteEvent && onDelete) ? 'flex-1' : 'w-full'} bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium`}
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;