import React, { useState } from 'react';
import SimpleCalendar from '../components/SimpleCalendar';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionTimeoutModal from '../components/SessionTimeoutModal';
import DayEventsModal from '../components/DayEventsModal';
import CreateGroupModal from '../components/CreateGroupModal';
import CreateUserModal from '../components/CreateUserModal';
import GroupDetailModal from '../components/GroupDetailModal';
import AvailabilityModal from '../components/AvailabilityModal';
import EditEventModal from '../components/EditEventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import EditUserModal from '../components/EditUserModal';
import EditGroupModal from '../components/EditGroupModal';
import Notifications from './Notifications';
import AuditLogs from '../components/AuditLogs';
import BackupManagement from '../components/BackupManagement';
import { groupsApi, eventsApi, usersApi, availabilityApi, notificationsApi, adminApi, setUserActivityCallback } from '../utils/api';

interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeSection, setActiveSection] = useState('home');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEventsList, setShowEventsList] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showGroupDetailModal, setShowGroupDetailModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);
  const [groupsSearchTerm, setGroupsSearchTerm] = useState('');
  const [usersSearchTerm, setUsersSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [usersWithoutGroup, setUsersWithoutGroup] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<any>(null);
  const [eventsFilter, setEventsFilter] = useState<'all' | 'upcoming' | 'completed' | 'pending'>('all');
  
  // Export functionality
  const [exportOptions, setExportOptions] = useState({
    users: false,
    groups: false,
    events: false
  });
  const [userProfile, setUserProfile] = useState({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    birthDate: '',
    businessName: '',
    vatNumber: '',
    address: '',
    zipCode: '',
    city: '',
    province: ''
  });

  // Stato separato per il cambio password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Stato per session timeout
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300); // 5 minuti in secondi

  // Helper per ricaricare i gruppi in modo consistente
  const reloadGroups = async () => {
    try {
      if (user.role === 'ADMIN') {
        // Admin: carica tutti i gruppi
        const groupsData = await groupsApi.getAll();
        setGroups(groupsData);
      } else {
        // Utenti normali: usa endpoint dedicato
        const userGroupsData = await groupsApi.getUserGroups();
        setGroups(userGroupsData);
        setUserGroups(userGroupsData);
      }
    } catch (error) {
      console.error('Errore nel ricaricamento dei gruppi:', error);
      setGroups([]);
      setUserGroups([]);
    }
  };

  // Carica dati iniziali
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Carica eventi
        const eventsData = await eventsApi.getAll();
        // Trasforma il formato degli eventi per il calendario
        const transformedEvents = eventsData.map((event: any) => ({
          id: event.id,
          title: event.title,
          date: event.startTime ? event.startTime.split('T')[0] : '', // Estrae data da startTime
          time: event.startTime ? event.startTime.split('T')[1].substring(0, 5) : '', // Estrae orario da startTime
          endTime: event.endTime ? event.endTime.split('T')[1].substring(0, 5) : '', // Estrae orario da endTime
          type: event.description || 'event',
          status: event.status, // Aggiungi il campo status
          venue: event.location || '',
          notes: event.description || '',
          contact_responsible: event.contact_responsible || '',
          group_id: event.groupId,
          group: event.group,
          fee: event.fee || 0
        }));
        
        if (import.meta.env.DEV) {
          console.log('📥 Eventi ricevuti dal backend:', eventsData.length, eventsData);
          console.log('✅ Eventi trasformati per il calendario:', transformedEvents.length, transformedEvents);
        }
        setEvents(transformedEvents);
        
        // Carica gruppi in base al ruolo utente
        if (user.role === 'ADMIN') {
          // Admin: carica tutti i gruppi
          const groupsData = await groupsApi.getAll();
          console.log('🔍 FRONTEND - Admin groups loaded:', groupsData.length);
          setGroups(groupsData);
        } else {
          // Utenti normali: usa il nuovo endpoint /users/me/groups
          try {
            console.log('🔍 FRONTEND - Loading user groups from new endpoint...');
            const userGroupsData = await groupsApi.getUserGroups();
            console.log('✅ FRONTEND - User groups loaded successfully:', userGroupsData.length);
            console.log('🔍 FRONTEND - User groups data:', userGroupsData);
            setGroups(userGroupsData);
            setUserGroups(userGroupsData);
          } catch (error) {
            console.error('❌ FRONTEND - Failed to load user groups from endpoint:', error);
            setGroups([]);
            setUserGroups([]);
          }
        }
        
        // Carica utenti se admin
        if (user.role === 'ADMIN') {
          const usersData = await usersApi.getAll();
          if (import.meta.env.DEV) {
            console.log('🔍 FRONTEND - Users received:', usersData.length);
          }
          setUsers(usersData);
        }

        // Carica disponibilità
        const availabilityParams = user.role === 'ADMIN' ? {} : { userId: user.id };
        const availabilityData = await availabilityApi.getAvailability(availabilityParams);
        // Trasforma le disponibilità in eventi per il calendario
        const transformedAvailability = availabilityData
          .filter((avail: any) => avail.type === 'BUSY') // Solo le indisponibilità
          .map((avail: any) => ({
            id: `avail-${avail.id}`,
            title: `❌ ${avail.group?.name || 'Gruppo'}`,
            date: avail.date ? avail.date.split('T')[0] : '',
            time: '',  // Nessun orario per le indisponibilità
            type: 'availability-busy',
            notes: avail.notes || 'Indisponibile',
            group_id: avail.group_id,
            group: avail.group,
            user: avail.user,
            availability_id: avail.id
          }))
          .filter((avail: any) => avail.date); // Filtra eventi senza data valida

        console.log('🔄 Initial transformed availability:', transformedAvailability);
        
        // Combina eventi e disponibilità, filtrando quelli senza data
        const allEvents = [
          ...transformedEvents.filter((event: any) => event.date), 
          ...transformedAvailability
        ];
        console.log('📅 Initial events for calendar:', allEvents);
        setEvents(allEvents);

        // Se l'utente è admin, carica le notifiche e utenti senza gruppo
        if (user.role === 'ADMIN') {
          try {
            const notificationsCount = await notificationsApi.getUnreadCount();
            setUnreadNotificationsCount(notificationsCount.count || 0);
          } catch (error) {
            console.error('Errore nel caricamento notifiche (probabilmente tabella non esiste):', error);
            setUnreadNotificationsCount(0);
          }

          try {
            const usersWithoutGroupData = await usersApi.getUsersWithoutGroup();
            setUsersWithoutGroup(usersWithoutGroupData);
          } catch (error) {
            console.error('Errore nel caricamento utenti senza gruppo:', error);
          }
        }
        
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        // Se l'errore è di autenticazione, l'utility API gestirà il logout automatico
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Funzione per ricaricare i dati (da chiamare dopo modifiche)
  const reloadData = async () => {
    try {
      // Carica eventi
      const eventsData = await eventsApi.getAll();
      const transformedEvents = eventsData.map((event: any) => ({
        id: event.id,
        title: event.title,
        // Supporta sia il formato nuovo (startTime/endTime) che quello vecchio (date/start_time)
        date: event.date ? event.date.split('T')[0] : (event.startTime ? event.startTime.split('T')[0] : ''),
        time: event.start_time || (event.startTime ? new Date(event.startTime).toTimeString().substring(0, 5) : ''),
        endTime: event.end_time || (event.endTime ? new Date(event.endTime).toTimeString().substring(0, 5) : ''),
        type: event.event_type || event.description || 'event',
        status: event.status, // Aggiungi il campo status
        venue: event.venue_name || event.location || '',
        notes: event.notes || event.description || '',
        contact_responsible: event.contact_responsible || '',
        group_id: event.group_id || event.groupId,
        group: event.group,
        fee: event.fee || 0
      }));

      // Carica disponibilità
      const availabilityParams = user.role === 'ADMIN' ? {} : { userId: user.id };
      const availabilityData = await availabilityApi.getAvailability(availabilityParams);
      console.log('📊 Raw availability data:', availabilityData);
      const transformedAvailability = availabilityData
        .filter((avail: any) => avail.type === 'BUSY')
        .map((avail: any) => ({
          id: `avail-${avail.id}`,
          title: `❌ ${avail.group?.name || 'Gruppo'}`,
          date: avail.date ? avail.date.split('T')[0] : '',
          time: '',  // Nessun orario per le indisponibilità
          type: 'availability-busy',
          notes: avail.notes || 'Indisponibile',
          group_id: avail.group_id,
          group: avail.group,
          user: avail.user,
          availability_id: avail.id
        }))
        .filter((avail: any) => avail.date); // Filtra gli eventi senza data valida

      console.log('🔄 Reload transformed availability:', transformedAvailability);
      
      // Combina eventi e disponibilità
      const allEvents = [...transformedEvents.filter((event: any) => event.date), ...transformedAvailability];
      console.log('📅 Reload events for calendar:', allEvents);
      setEvents(allEvents);
    } catch (error) {
      console.error('Errore nel ricaricamento dei dati:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    window.location.reload();
  };


  const handleSectionClick = (section: string) => {
    setActiveSection(section);
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEventForDetails(event);
    setShowEventDetailsModal(true);
  };

  const handleCreateEvent = async (newEvent: any) => {
    try {
      const eventData = {
        title: newEvent.title,
        event_type: newEvent.type,
        date: newEvent.date,
        start_time: newEvent.time,
        end_time: newEvent.endTime,
        venue_name: newEvent.venue || 'Da definire',
        venue_city: 'Milano', // Default, potrebbe essere configurabile
        group_id: newEvent.group_id,
        notes: newEvent.notes,
        contact_responsible: newEvent.contact_responsible,
        fee: newEvent.fee ? parseFloat(newEvent.fee) : undefined
      };

      console.log('📤 Creazione evento in corso...', eventData);
      const createdEvent = await eventsApi.create(eventData);
      console.log('📥 Evento ricevuto dal backend:', createdEvent);
      
      // Trasforma l'evento per il calendario con controlli null
      const transformedEvent = {
        id: createdEvent.id,
        title: createdEvent.title || newEvent.title,
        date: createdEvent.date ? createdEvent.date.split('T')[0] : newEvent.date,
        time: createdEvent.start_time || newEvent.time,
        endTime: createdEvent.end_time || newEvent.endTime,    // AGGIUNTO: mappa end_time a endTime
        type: createdEvent.event_type || newEvent.type || 'event',
        status: createdEvent.status, // Aggiungi il campo status
        venue: createdEvent.venue_name || newEvent.venue || '',
        notes: createdEvent.notes || newEvent.notes || '',
        contact_responsible: createdEvent.contact_responsible || newEvent.contact_responsible || '',  // AGGIUNTO: mappa contact_responsible
        group_id: createdEvent.group_id || newEvent.group_id,
        group: createdEvent.group,
        fee: createdEvent.fee || (newEvent.fee ? parseFloat(newEvent.fee) : 0)
      };
      
      console.log('✅ Evento trasformato per il calendario:', transformedEvent);
      setEvents(prevEvents => [...prevEvents, transformedEvent]);
      
      // Ricarica i dati per sicurezza
      setTimeout(() => reloadData(), 500);
      
      // Ricarica il contatore delle notifiche dato che potrebbero essere state create nuove notifiche
      setTimeout(() => reloadNotificationsCount(), 1000);
      
      alert('✅ Evento creato con successo! Le notifiche email sono state inviate ai membri del gruppo.');
    } catch (error: any) {
      console.error('❌ Errore nella creazione dell\'evento:', error);
      const errorMessage = error?.message || 'Errore sconosciuto';
      alert(`❌ Errore nella creazione dell'evento: ${errorMessage}`);
    }
  };

  const handleEditEvent = (event: any) => {
    if (user.role !== 'ADMIN') {
      alert('⚠️ Solo gli admin possono modificare gli eventi');
      return;
    }
    
    setSelectedEvent(event);
    setShowEditEventModal(true);
  };


  const handleSaveEventChanges = async (eventData: any) => {
    try {
      // Aggiorna l'evento tramite API
      const updatedEvent = await eventsApi.update(eventData.id, eventData);
      
      // Aggiorna solo l'evento modificato nello stato locale invece di ricaricare tutto
      const transformedEvent = {
        id: updatedEvent.id,
        title: updatedEvent.title,
        date: updatedEvent.date ? updatedEvent.date.split('T')[0] : (updatedEvent.startTime ? updatedEvent.startTime.split('T')[0] : ''),
        time: updatedEvent.start_time || (updatedEvent.startTime ? new Date(updatedEvent.startTime).toTimeString().substring(0, 5) : ''),
        endTime: updatedEvent.end_time || (updatedEvent.endTime ? new Date(updatedEvent.endTime).toTimeString().substring(0, 5) : ''),
        type: updatedEvent.event_type || updatedEvent.description || 'event',
        status: updatedEvent.status, // Aggiungi il campo status
        venue: updatedEvent.venue_name || updatedEvent.location || '',
        notes: updatedEvent.notes || updatedEvent.description || '',
        contact_responsible: updatedEvent.contact_responsible || '',
        group_id: updatedEvent.group_id || updatedEvent.groupId,
        group: updatedEvent.group,
        fee: updatedEvent.fee || 0
      };
      
      // Aggiorna lo stato degli eventi sostituendo solo quello modificato
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === updatedEvent.id ? transformedEvent : event
        )
      );
      
      // Chiudi il modal
      setShowEditEventModal(false);
      setSelectedEvent(null);
      
      // Ricarica il contatore delle notifiche dato che potrebbero essere state create nuove notifiche
      setTimeout(() => reloadNotificationsCount(), 1000);
      
      alert('✅ Evento modificato con successo!');
    } catch (error: any) {
      console.error('Errore nella modifica dell\'evento:', error);
      alert(`❌ Errore nella modifica dell'evento: ${error.message}`);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle?: string) => {
    // Previeni chiamate multiple
    if (isDeleting) {
      return;
    }
    
    const eventToDeleteData = events.find(event => event.id === eventId);
    const title = eventTitle || eventToDeleteData?.title || 'questo evento';
    const isAvailability = eventToDeleteData?.type === 'availability-busy';
    
    setIsDeleting(true);
    
    if (!window.confirm(`Sei sicuro di voler eliminare ${isAvailability ? 'l\'indisponibilità' : 'l\'evento'} "${title}"? Questa azione non può essere annullata.`)) {
      setIsDeleting(false);
      return;
    }
    
    try {
      if (isAvailability) {
        // Per le indisponibilità, usa l'API specifica
        const availabilityId = eventToDeleteData?.availability_id;
        if (availabilityId) {
          await availabilityApi.deleteAvailability(availabilityId);
          
          // Se un admin cancella l'indisponibilità di qualcun altro, l'email viene inviata dal backend
          if (user.role === 'ADMIN' && eventToDeleteData?.user?.id !== user.id) {
            alert(`✅ Indisponibilità "${title}" eliminata con successo! È stata inviata una notifica email alla band.`);
          } else {
            alert(`✅ Indisponibilità "${title}" eliminata con successo!`);
          }
        }
      } else {
        // Per gli eventi normali
        await eventsApi.delete(eventId);
        alert(`✅ Evento "${title}" eliminato con successo! Le notifiche email sono state inviate a tutti i membri del gruppo.`);
      }
      
      // Rimuovi l'evento dalla lista locale solo dopo il successo
      setEvents(events.filter(event => event.id !== eventId));
      
      // Ricarica il contatore delle notifiche dato che potrebbero essere state create nuove notifiche
      setTimeout(() => reloadNotificationsCount(), 1000);
      
    } catch (error: any) {
      console.error(`Errore nell'eliminazione del${isAvailability ? 'l\'indisponibilità' : 'l\'evento'}:`, error);
      alert(`❌ Errore nell'eliminazione: ${error.message}`);
    } finally {
      // Reset flag dopo un delay per permettere nuove eliminazioni
      setTimeout(() => {
        setIsDeleting(false);
      }, 1000);
    }
  };

  const handleCreateAvailability = async (availabilityData: any) => {
    try {
      // Se non è specificato un user_id e l'utente non è admin, usa il suo ID
      if (!availabilityData.user_id && user.role !== 'ADMIN') {
        availabilityData.user_id = user.id;
      }
      
      console.log('🔄 Creating availability:', availabilityData);
      const result = await availabilityApi.createAvailability(availabilityData);
      console.log('✅ Availability created:', result);
      
      // Ricarica i dati per aggiornare il calendario
      console.log('🔄 Reloading data after availability creation...');
      await reloadData();
      console.log('✅ Data reloaded');
      
      alert('✅ Indisponibilità aggiunta con successo!');
    } catch (error: any) {
      console.error('Errore nella creazione dell\'indisponibilità:', error);
      alert('Errore nella creazione dell\'indisponibilità: ' + (error.message || 'Errore sconosciuto'));
    }
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      const newGroup = await groupsApi.create(groupData);
      setGroups([...groups, newGroup]);
      alert('✅ Gruppo creato con successo!');
    } catch (error: any) {
      console.error('Errore nella creazione del gruppo:', error);
      alert(`Errore nella creazione del gruppo: ${error.message}`);
    }
  };

  const handleCreateUser = async (userData: any) => {
    console.log('🚀 INIZIO handleCreateUser');
    console.log('📝 Form data ricevuto:', userData);
    
    try {
      // Mappa i campi dal formato frontend al formato backend
      const mappedUserData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role
      };
      
      console.log('📤 Chiamando API per creare utente...');
      const newUser = await usersApi.create(mappedUserData);
      console.log('✅ Utente creato con successo:', newUser);
      
      // Ricarica la lista degli utenti
      if (user.role === 'ADMIN') {
        console.log('🔄 Ricaricando lista utenti...');
        const updatedUsers = await usersApi.getAll();
        setUsers(updatedUsers);
        console.log('✅ Lista utenti aggiornata');
      }
      
      // Se l'utente è stato assegnato a dei gruppi, aggiorna la lista dei gruppi
      if (userData.selectedGroups && userData.selectedGroups.length > 0) {
        console.log('🔄 Ricaricando lista gruppi...');
        await reloadGroups();
        console.log('✅ Lista gruppi aggiornata');
        
        // Cache dei gruppi per l'utente appena creato (workaround backend limitation)
        try {
          const userGroupsToCache = userData.selectedGroups.map((groupId: string) => {
            const group = groups.find(g => g.id === groupId);
            return group;
          }).filter(Boolean);
          
          if (userGroupsToCache.length > 0) {
            localStorage.setItem(`userGroups_${newUser.id}`, JSON.stringify(userGroupsToCache));
            console.log('💾 Cached groups for user:', newUser.id, userGroupsToCache);
          }
        } catch (cacheError) {
          console.error('Error caching user groups:', cacheError);
        }
      }
      
      // Chiudi il modal
      console.log('🔒 Chiudendo modal...');
      setShowCreateUserModal(false);
      
      // Ricarica il contatore delle notifiche dato che potrebbe essere stata creata una nuova notifica
      console.log('🔄 Ricaricando contatore notifiche...');
      await reloadNotificationsCount();
      
      console.log('🎉 Mostrando messaggio di successo...');
      alert('✅ Utente creato con successo! Le credenziali di accesso sono state inviate via email.');
      console.log('✅ FINE handleCreateUser - SUCCESSO COMPLETATO');
    } catch (error: any) {
      console.error('❌ ERRORE CATTURATO in handleCreateUser:', error);
      console.error('❌ Tipo errore:', typeof error);
      console.error('❌ Error keys:', Object.keys(error || {}));
      
      // Gestisci diversi tipi di errore
      let errorMessage = 'Errore sconosciuto nella creazione dell\'utente';
      
      if (error?.message) {
        errorMessage = error.message;
        console.log('📝 Usando error.message:', errorMessage);
      } else if (error?.error) {
        errorMessage = error.error;
        console.log('📝 Usando error.error:', errorMessage);
      } else if (typeof error === 'string') {
        errorMessage = error;
        console.log('📝 Usando errore come stringa:', errorMessage);
      }
      
      console.log('🚨 Mostrando alert di errore:', errorMessage);
      alert(`❌ Errore nella creazione dell'utente: ${errorMessage}`);
      console.log('❌ FINE handleCreateUser - ERRORE GESTITO');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      await usersApi.delete(userId);
      
      // Ricarica la lista degli utenti
      const updatedUsers = await usersApi.getAll();
      setUsers(updatedUsers);
      
      alert('✅ Utente eliminato con successo.');
    } catch (error: any) {
      console.error('Errore nell\'eliminazione dell\'utente:', error);
      alert(`Errore nell'eliminazione dell'utente: ${error.message}`);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    if (!window.confirm('Sei sicuro di voler sbloccare questo utente? Potrà nuovamente accedere al sistema.')) {
      return;
    }

    try {
      await usersApi.unlock(userId);
      
      // Ricarica la lista degli utenti
      const updatedUsers = await usersApi.getAll();
      setUsers(updatedUsers);
      
      alert('✅ Utente sbloccato con successo. Ora può accedere al sistema.');
    } catch (error: any) {
      console.error('Errore nello sblocco dell\'utente:', error);
      alert(`Errore nello sblocco dell'utente: ${error.message}`);
    }
  };

  const handleEditUser = (userItem: any) => {
    if (user.role !== 'ADMIN') {
      alert('⚠️ Solo gli admin possono modificare gli utenti');
      return;
    }
    
    setSelectedUser(userItem);
    setShowEditUserModal(true);
  };

  const handleSaveUserChanges = async (userData: any) => {
    try {
      console.log('💾 Salvando modifiche utente:', userData);
      console.log('📝 ID utente da modificare:', selectedUser.id);
      console.log('📝 Dati utente originali:', selectedUser);
      
      // Mappa i campi dal formato frontend al formato backend
      const mappedUserData: any = {
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        role: userData.role
        // Note: phone field non esiste nel database, quindi lo escludiamo
        // Note: selectedGroups sarà gestito separatamente se necessario
      };
      
      // Aggiungi la password solo se è stata fornita
      if (userData.newPassword) {
        mappedUserData.password = userData.newPassword;
        console.log('🔐 Password inclusa nell\'aggiornamento');
      }
      
      console.log('📝 Dati mappati per backend:', mappedUserData);
      
      // Chiama l'API per aggiornare l'utente
      const updatedUserResponse = await usersApi.update(selectedUser.id, mappedUserData);
      console.log('✅ Risposta dall\'API aggiornamento:', updatedUserResponse);
      
      // Ricarica la lista degli utenti
      const updatedUsers = await usersApi.getAll();
      console.log('🔄 Lista utenti ricaricata:', updatedUsers);
      setUsers(updatedUsers);
      
      // Chiudi il modal
      setShowEditUserModal(false);
      setSelectedUser(null);
      
      alert('✅ Dati utente aggiornati con successo!');
    } catch (error: any) {
      console.error('❌ Errore nell\'aggiornamento dell\'utente:', error);
      console.error('❌ Stack trace:', error.stack);
      alert(`Errore nel salvataggio: ${error.message}`);
    }
  };

  const handleGroupClick = (group: any) => {
    setSelectedGroup(group);
    setShowGroupDetailModal(true);
  };

  const handleGroupUpdated = async () => {
    await reloadGroups();
  };

  const handleEditGroup = (group: any) => {
    if (user.role !== 'ADMIN') {
      alert('⚠️ Solo gli admin possono modificare i gruppi');
      return;
    }
    
    setSelectedGroupForEdit(group);
    setShowEditGroupModal(true);
    setShowGroupDetailModal(false); // Chiudi il modal dettagli
  };

  const handleSaveGroupChanges = async (groupData: any) => {
    try {
      console.log('💾 Salvando modifiche gruppo:', groupData);
      
      // Chiama l'API per aggiornare il gruppo
      await groupsApi.update(selectedGroupForEdit.id, groupData);
      
      // Ricarica la lista dei gruppi
      await reloadGroups();
      
      // Chiudi il modal
      setShowEditGroupModal(false);
      setSelectedGroupForEdit(null);
      
      alert('✅ Gruppo aggiornato con successo!');
    } catch (error: any) {
      console.error('Errore nella modifica del gruppo:', error);
      alert(`Errore nel salvataggio: ${error.message}`);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il gruppo "${groupName}"? Questa azione eliminerà anche tutti gli eventi e disponibilità associati al gruppo. Questa azione non può essere annullata.`)) {
      return;
    }

    try {
      await groupsApi.delete(groupId);
      
      // Ricarica la lista dei gruppi
      await reloadGroups();
      
      alert(`✅ Gruppo "${groupName}" eliminato con successo.`);
    } catch (error: any) {
      console.error('Errore nell\'eliminazione del gruppo:', error);
      alert(`❌ Errore nell'eliminazione del gruppo: ${error.message}`);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      // Qui dovresti chiamare l'API per salvare i dati dell'utente
      // await usersApi.updateProfile(userProfile);
      alert('✅ Profilo aggiornato con successo!');
    } catch (error: any) {
      console.error('Errore nel salvataggio del profilo:', error);
      alert('Errore nel salvataggio: ' + (error.message || 'Errore sconosciuto'));
    }
  };

  // Handler per il cambio password
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async () => {
    try {
      // Validazione
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        alert('Compila tutti i campi per cambiare la password');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('La nuova password e la conferma non corrispondono');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        alert('La nuova password deve essere di almeno 6 caratteri');
        return;
      }

      // Chiamata API per cambiare password
      await usersApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Reset form e successo
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      alert('✅ Password cambiata con successo!');
    } catch (error: any) {
      console.error('Errore nel cambio password:', error);
      alert('Errore nel cambio password: ' + (error.message || 'Password attuale non corretta'));
    }
  };

  // Session timeout logic
  const handleSessionTimeout = () => {
    console.log('⏰ Session timeout - logging out user');
    
    // Pulisce i dati di sessione
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    
    // Ricarica la pagina per tornare al login
    window.location.reload();
  };

  const handleSessionWarning = () => {
    console.log('⚠️ Session timeout warning');
    setRemainingTime(getRemainingTime()); // Usa il tempo rimanente reale
    setShowTimeoutModal(true);
  };

  const handleExtendSession = () => {
    console.log('🔄 Extending session');
    setShowTimeoutModal(false);
    // Il reset del timer è gestito automaticamente dall'hook
  };

  // Inizializza session timeout (30 minuti con warning a 5 min)
  const { resetTimer, getRemainingTime } = useSessionTimeout({
    onTimeout: handleSessionTimeout,
    onWarning: handleSessionWarning,
    timeoutMinutes: 30,
    warningMinutes: 5
  });

  // Collega API activity callback al session timeout reset
  React.useEffect(() => {
    setUserActivityCallback(() => {
      if (import.meta.env.DEV) {
        console.log('🔄 API activity detected - resetting session timer');
      }
      resetTimer();
    });

    // Cleanup
    return () => {
      setUserActivityCallback(() => {});
    };
  }, [resetTimer]);

  // Update countdown timer quando il modal è aperto
  React.useEffect(() => {
    if (!showTimeoutModal) return;

    const interval = setInterval(() => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setShowTimeoutModal(false);
        handleSessionTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showTimeoutModal, getRemainingTime]);

  // Export functions
  const convertToCSV = (data: any[], headers: string[]): string => {
    if (data.length === 0) return headers.join(',') + '\n';
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(' ', '_')] || '';
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value).replace(/"/g, '""');
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
            ? `"${stringValue}"` 
            : stringValue;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsers = async () => {
    try {
      // Carica utenti completi dal backend con tutte le relazioni
      const detailedUsers = await usersApi.getForExport();

      const headers = [
        'ID', 'Nome', 'Cognome', 'Email', 'Ruolo', 'Stato Email', 
        'Data Creazione', 'Ultimo Aggiornamento', 'Numero Gruppi', 
        'Lista Gruppi', 'Numero Eventi Creati', 'Lista Eventi',
        'Numero Indisponibilità', 'Lista Indisponibilità', 'Numero Notifiche',
        'Notifiche Non Lette'
      ];
      
      const userData = detailedUsers.map((user: any) => ({
        id: user.id,
        nome: user.firstName || '',
        cognome: user.lastName || '',
        email: user.email,
        ruolo: user.role,
        stato_email: user.emailVerified ? 'Verificata' : 'Non Verificata',
        data_creazione: user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : '',
        ultimo_aggiornamento: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('it-IT') : '',
        numero_gruppi: user.groupMemberships?.length || 0,
        lista_gruppi: user.groupMemberships?.map((gm: any) => gm.group.name).join('; ') || '',
        numero_eventi_creati: user.events?.length || 0,
        lista_eventi: user.events?.map((e: any) => `${e.title} (${new Date(e.startTime).toLocaleDateString('it-IT')}) - €${e.fee || 0}`).join('; ') || '',
        numero_indisponibilita: user.dayAvailabilities?.filter((a: any) => a.type === 'BUSY').length || 0,
        lista_indisponibilita: user.dayAvailabilities?.filter((a: any) => a.type === 'BUSY').map((a: any) => `${new Date(a.date).toLocaleDateString('it-IT')} [${a.group?.name || 'Nessun gruppo'}] - ${a.notes || 'Nessuna nota'}`).join('; ') || '',
        numero_notifiche: user.notifications?.length || 0,
        notifiche_non_lette: user.notifications?.filter((n: any) => !n.isRead).length || 0
      }));
      
      const csv = convertToCSV(userData, headers);
      downloadCSV(csv, `utenti_completo_${new Date().toISOString().split('T')[0]}.csv`);
      
      console.log(`📊 Exported detailed data for ${userData.length} users`);
      
    } catch (error) {
      console.error('Errore durante l\'export utenti:', error);
      alert('Errore durante l\'export degli utenti. Riprova.');
    }
  };

  const exportGroups = () => {
    const headers = ['ID', 'Nome', 'Tipo', 'Genere', 'Descrizione', 'Email Contatto', 'Telefono', 'Membri'];
    const groupsData = groups.map(group => ({
      id: group.id,
      nome: group.name,
      tipo: group.type,
      genere: group.genre || '',
      descrizione: group.description || '',
      email_contatto: group.contact_email || '',
      telefono: group.contact_phone || '',
      membri: group.user_groups ? group.user_groups.length : 0
    }));
    
    const csv = convertToCSV(groupsData, headers);
    downloadCSV(csv, `gruppi_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportFutureEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    const futureEvents = events.filter(event => {
      if (!event.date) return false;
      const eventDate = event.date.split('T')[0];
      return eventDate >= today;
    });

    const headers = ['ID', 'Titolo', 'Data', 'Ora Inizio', 'Ora Fine', 'Tipo', 'Locale', 'Città', 'Gruppo', 'Cachet', 'Contatto', 'Note'];
    const eventsData = futureEvents.map(event => {
      const group = groups.find(g => g.id === event.group_id);
      return {
        id: event.id,
        titolo: event.title,
        data: event.date ? new Date(event.date).toLocaleDateString('it-IT') : '',
        ora_inizio: event.start_time || event.time || '',
        ora_fine: event.end_time || event.endTime || '',
        tipo: event.event_type || event.type || '',
        locale: event.venue_name || event.venue || '',
        città: event.venue_city || '',
        gruppo: group ? group.name : '',
        cachet: event.fee ? `€${event.fee}` : '',
        contatto: event.contact_responsible || '',
        note: event.notes || ''
      };
    });
    
    const csv = convertToCSV(eventsData, headers);
    downloadCSV(csv, `eventi_futuri_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExport = () => {
    const selectedCount = Object.values(exportOptions).filter(Boolean).length;
    
    if (selectedCount === 0) {
      alert('⚠️ Seleziona almeno una opzione da esportare');
      return;
    }

    let exportedItems: string[] = [];

    if (exportOptions.users) {
      exportUsers();
      exportedItems.push('Utenti');
    }

    if (exportOptions.groups) {
      exportGroups();
      exportedItems.push('Gruppi');
    }

    if (exportOptions.events) {
      exportFutureEvents();
      exportedItems.push('Eventi futuri');
    }

    alert(`✅ Export completato per: ${exportedItems.join(', ')}`);
  };


  const reloadNotificationsCount = async () => {
    if (user.role === 'ADMIN') {
      try {
        const notificationsCount = await notificationsApi.getUnreadCount();
        setUnreadNotificationsCount(notificationsCount.count || 0);
      } catch (error) {
        console.error('Errore nel ricaricamento contatore notifiche:', error);
        setUnreadNotificationsCount(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header - Hidden on mobile */}
      <header className="hidden md:block bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🎵 Calendariko - Dashboard {user.role === 'ADMIN' ? 'Admin' : 'Artista'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Benvenuto, {user.first_name} {user.last_name}
              </span>
              <button
                onClick={() => handleSectionClick('user')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === 'user'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ⚙️ Profilo
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium text-gray-700"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900">
              🎵 Calendariko
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">
                {user.first_name}
              </span>
              <button
                onClick={() => handleSectionClick('user')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeSection === 'user'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ⚙️ Profilo
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
              >
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
        <div className="px-4 py-6 sm:px-0">
          {/* Desktop Navigation Menu */}
          <div className="hidden md:block bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-3">
              <nav className="flex space-x-8">
                <button
                  onClick={() => handleSectionClick('home')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'home'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📅 Calendario
                </button>
                <button
                  onClick={() => handleSectionClick('groups')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'groups'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  👥 Gruppi
                </button>
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => handleSectionClick('users')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeSection === 'users'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    👤 Utenti
                  </button>
                )}
                <button
                  onClick={() => handleSectionClick('events')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === 'events'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {user.role === 'ADMIN' ? '🎤 Eventi' : '📅 Disponibilità'}
                </button>
                {user.role === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => handleSectionClick('notifications')}
                      className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                        activeSection === 'notifications'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      📧 Notifiche
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[20px] h-5 flex items-center justify-center">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleSectionClick('audit')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        activeSection === 'audit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      🔍 Audit Log
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {activeSection === 'home' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                    📅 Calendario Eventi e Disponibilità
                  </h3>
                  
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Caricamento dati...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Layout con calendario e cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendario */}
                        <div className="lg:col-span-2">
                          <SimpleCalendar 
                            events={events} 
                            onDayClick={handleDayClick} 
                            onEventClick={handleEventClick}
                            userRole={user.role} 
                          />
                        </div>

                    {/* Sidebar con funzioni rapide */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">🚀 Accesso Rapido</h4>
                        <div className="space-y-4">

                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => handleSectionClick('groups')}>
                            <h5 className="text-green-800 font-medium mb-1">👥 Gruppi</h5>
                            <p className="text-green-700 text-sm">
                              {user.role === 'ADMIN' ? 'Coordina band e artisti' : 'I tuoi gruppi'}
                            </p>
                          </div>


                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => handleSectionClick('events')}>
                            <h5 className="text-purple-800 font-medium mb-1">🎤 Eventi</h5>
                            <p className="text-purple-700 text-sm">
                              {user.role === 'ADMIN' ? 'Crea nuovi eventi' : 'Gestisci disponibilità'}
                            </p>
                          </div>

                          {user.role !== 'ADMIN' && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setShowAvailabilityModal(true)}>
                              <h5 className="text-orange-800 font-medium mb-1">📅 Indisponibilità</h5>
                              <p className="text-orange-700 text-sm">
                                Aggiungi giorni impegnato
                              </p>
                            </div>
                          )}

                          {user.role === 'ADMIN' && (
                            <>
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer hover:bg-yellow-100 transition-colors" onClick={() => handleSectionClick('users')}>
                                <h5 className="text-yellow-800 font-medium mb-1">👤 Utenti</h5>
                                <p className="text-yellow-700 text-sm">
                                  Gestisci account
                                </p>
                              </div>

                              <div className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => handleSectionClick('notifications')}>
                                <h5 className="text-red-800 font-medium mb-1 flex items-center justify-between">
                                  📧 Notifiche
                                  {unreadNotificationsCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                      {unreadNotificationsCount}
                                    </span>
                                  )}
                                </h5>
                                <p className="text-red-700 text-sm">
                                  {usersWithoutGroup.length > 0 
                                    ? `${usersWithoutGroup.length} utenti da assegnare` 
                                    : 'Gestisci sistema notifiche'
                                  }
                                </p>
                              </div>

                              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => handleSectionClick('audit')}>
                                <h5 className="text-indigo-800 font-medium mb-1">🔍 Audit Log</h5>
                                <p className="text-indigo-700 text-sm">
                                  Tracciamento azioni amministrative
                                </p>
                              </div>


                            </>
                          )}
                        </div>
                      </div>

                      {/* Prossimi eventi */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">⏰ Prossimi Eventi</h4>
                        <div 
                          className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSectionClick('events')}
                          title="Clicca per andare alla sezione eventi"
                        >
                          {events.slice(0, 3).map(event => (
                            <div key={event.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0">
                              <div>
                                <div 
                                  className="font-medium text-sm"
                                >
                                  {event.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(event.date).toLocaleDateString('it-IT')} - {event.time}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs ${
                                event.type === 'availability' ? 'bg-green-100 text-green-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {event.type === 'availability' ? 'Confermata' : 'Opzionata'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blocco Esporta */}
                  {user.role === 'ADMIN' && (
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                      <h4 className="text-blue-800 font-medium text-lg mb-3">📊 Esporta Dati</h4>
                      <p className="text-blue-700 mb-4 text-sm">
                        Esporta i dati del sistema in formato CSV per analisi esterne o backup.
                      </p>
                      
                      <div className="space-y-4">
                        {/* Opzioni di esportazione */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900 text-sm">Seleziona cosa esportare:</h5>
                          
                          <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border hover:bg-blue-25 transition-colors">
                              <input
                                type="checkbox"
                                checked={exportOptions.users}
                                onChange={(e) => setExportOptions({...exportOptions, users: e.target.checked})}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">👥 Lista Utenti</div>
                                <div className="text-sm text-gray-600">
                                  Esporta tutti gli utenti registrati ({users.length} totali)
                                </div>
                              </div>
                            </label>
                            
                            <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border hover:bg-blue-25 transition-colors">
                              <input
                                type="checkbox"
                                checked={exportOptions.groups}
                                onChange={(e) => setExportOptions({...exportOptions, groups: e.target.checked})}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">🎵 Lista Gruppi</div>
                                <div className="text-sm text-gray-600">
                                  Esporta tutti i gruppi musicali ({groups.length} totali)
                                </div>
                              </div>
                            </label>
                            
                            <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border hover:bg-blue-25 transition-colors">
                              <input
                                type="checkbox"
                                checked={exportOptions.events}
                                onChange={(e) => setExportOptions({...exportOptions, events: e.target.checked})}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">📅 Eventi Futuri</div>
                                <div className="text-sm text-gray-600">
                                  Esporta solo eventi che devono ancora svolgersi ({events.filter(e => e.date && e.date.split('T')[0] >= new Date().toISOString().split('T')[0]).length} totali)
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        {/* Pulsante Export */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-blue-200">
                          <button
                            onClick={handleExport}
                            disabled={!Object.values(exportOptions).some(Boolean)}
                            className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-base flex items-center justify-center gap-2"
                          >
                            <span>📥</span>
                            Esporta Selezionati
                          </button>
                          <button
                            onClick={() => setExportOptions({users: false, groups: false, events: false})}
                            className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium text-base"
                          >
                            🔄 Deseleziona Tutto
                          </button>
                        </div>
                        
                        <div className="text-xs text-blue-600 bg-blue-100 p-3 rounded-lg">
                          💡 I file CSV verranno scaricati nella cartella Downloads del tuo browser
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stato Sistema */}
                  <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-gray-800 font-medium text-lg mb-2">✅ Stato Sistema</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-green-600 font-medium">Frontend</div>
                        <div className="text-gray-600">Operativo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 font-medium">Backend</div>
                        <div className="text-gray-600">Operativo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 font-medium">Database</div>
                        <div className="text-gray-600">Connesso</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 font-medium">Auth</div>
                        <div className="text-gray-600">Attivo</div>
                      </div>
                    </div>
                  </div>
                    </>
                  )}
                </div>
              )}


              {activeSection === 'groups' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    👥 Gestione Gruppi
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="text-green-800 font-medium text-lg mb-3">
                      {user.role === 'ADMIN' ? 'Tutti i Gruppi' : 'I Tuoi Gruppi'}
                    </h4>
                    <p className="text-green-700 mb-4">
                      {user.role === 'ADMIN' 
                        ? 'Gestisci tutti i gruppi del sistema. Clicca su un gruppo per vedere i membri e gestire l\'appartenenza.'
                        : 'Visualizza i tuoi gruppi e gestisci la tua appartenenza. Clicca per entrare e vedere gli altri membri.'
                      }
                    </p>
                    
                    {/* Campo di ricerca gruppi */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="🔍 Cerca gruppo per nome, tipo o genere..."
                        value={groupsSearchTerm}
                        onChange={(e) => setGroupsSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {(() => {
                        if (import.meta.env.DEV) {
                          console.log('🔍 GROUPS SECTION - User role:', user.role, 'Groups loaded:', groups.length);
                        }
                        
                        // groups contiene già i gruppi corretti per il tipo di utente
                        let filteredGroups = groups;
                        
                        // Applica filtro di ricerca
                        if (groupsSearchTerm.trim()) {
                          filteredGroups = filteredGroups.filter(group =>
                            group.name.toLowerCase().includes(groupsSearchTerm.toLowerCase()) ||
                            group.type.toLowerCase().includes(groupsSearchTerm.toLowerCase()) ||
                            (group.genre && group.genre.toLowerCase().includes(groupsSearchTerm.toLowerCase()))
                          );
                        }
                        
                        return filteredGroups.length === 0 ? (
                          <div className="bg-white p-3 rounded border">
                            <strong>Stato:</strong> {user.role === 'ADMIN' ? 'Nessun gruppo creato ancora' : 'Non fai parte di nessun gruppo ancora'}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filteredGroups.map(group => {
                              // Per utenti normali sono sempre membri (già filtrato). Per admin verifica membership.
                              const isUserMember = user.role === 'ADMIN' 
                                ? group.user_groups?.some((ug: any) => ug.user_id === user.id)
                                : true;
                            
                            return (
                              <div 
                                key={group.id} 
                                className="bg-white p-4 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                {/* Layout ottimizzato per mobile */}
                                <div className="space-y-3">
                                  {/* Nome band più grande e prominente */}
                                  <div 
                                    className="cursor-pointer"
                                    onClick={() => handleGroupClick(group)}
                                  >
                                    <h5 className="font-semibold text-lg text-gray-900 mb-2">{group.name}</h5>
                                    
                                    {/* Tipo e genere su riga separata */}
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        group.type === 'BAND' ? 'bg-purple-100 text-purple-700' :
                                        group.type === 'DJ' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {group.type === 'BAND' ? 'Band' : 
                                         group.type === 'DJ' ? 'DJ' : 
                                         group.type ? group.type : 'Tipo non specificato'}
                                      </span>
                                      {group.genre && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                          🎵 {group.genre}
                                        </span>
                                      )}
                                      {isUserMember && (
                                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium">
                                          ✅ Membro
                                        </span>
                                      )}
                                    </div>

                                    {/* Descrizione se presente */}
                                    {group.description && (
                                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{group.description}</p>
                                    )}

                                    {/* Numero membri */}
                                    {group.user_groups && (
                                      <div className="text-sm text-gray-500 mb-2">
                                        👥 {group.user_groups.length} {group.user_groups.length === 1 ? 'membro' : 'membri'}
                                      </div>
                                    )}
                                  </div>

                                  {/* Pulsanti con layout ottimizzato per desktop */}
                                  <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 pt-2 border-t border-gray-100 lg:justify-start">
                                    <button
                                      onClick={() => handleGroupClick(group)}
                                      className="flex-1 sm:flex-initial px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                                      title="Visualizza dettagli gruppo"
                                    >
                                      👁️ Visualizza
                                    </button>
                                    {user.role === 'ADMIN' && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditGroup(group);
                                          }}
                                          className="flex-1 sm:flex-initial px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
                                          title="Modifica gruppo"
                                        >
                                          ✏️ Modifica
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteGroup(group.id, group.name);
                                          }}
                                          className="flex-1 sm:flex-initial px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                                          title="Elimina gruppo"
                                        >
                                          🗑️ Elimina
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                      })()}
                    </div>
                    {user.role === 'ADMIN' && (
                      <button 
                        onClick={() => setShowCreateGroupModal(true)}
                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        + Crea Nuovo Gruppo
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'events' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {user.role === 'ADMIN' ? '🎤 Gestione Eventi' : '📅 Le Tue Disponibilità'}
                  </h3>
                  <div className={`${user.role === 'ADMIN' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-6`}>
                    <h4 className={`${user.role === 'ADMIN' ? 'text-purple-800' : 'text-blue-800'} font-medium text-lg mb-3`}>
                      {user.role === 'ADMIN' ? 'Panoramica Eventi' : 'Gestione Disponibilità'}
                    </h4>
                    <p className={`${user.role === 'ADMIN' ? 'text-purple-700' : 'text-blue-700'} mb-4`}>
                      {user.role === 'ADMIN' 
                        ? 'Crea e gestisci le performance, imposta venue, compensi e traccia lo stato degli eventi.'
                        : 'Indica la tua disponibilità per i tuoi gruppi. Segna i giorni in cui sei impegnato o disponibile per performance.'
                      }
                    </p>
                    {user.role === 'ADMIN' ? (
                      // Statistiche per Admin - Eventi
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div 
                          className={`bg-white p-4 rounded border text-center cursor-pointer hover:bg-purple-50 transition-colors ${
                            eventsFilter === 'upcoming' ? 'ring-2 ring-purple-500' : ''
                          }`}
                          onClick={() => {
                            setEventsFilter(eventsFilter === 'upcoming' ? 'all' : 'upcoming');
                            setShowEventsList(true);
                            setCurrentPage(1);
                          }}
                          title="Clicca per filtrare gli eventi prossimi"
                        >
                          <div className="text-2xl font-bold text-purple-600">
                            {events.filter(e => new Date(e.date) >= new Date()).length}
                          </div>
                          <div className="text-sm text-gray-600">Eventi Prossimi</div>
                        </div>
                        <div 
                          className={`bg-white p-4 rounded border text-center cursor-pointer hover:bg-green-50 transition-colors ${
                            eventsFilter === 'completed' ? 'ring-2 ring-green-500' : ''
                          }`}
                          onClick={() => {
                            setEventsFilter(eventsFilter === 'completed' ? 'all' : 'completed');
                            setShowEventsList(true);
                            setCurrentPage(1);
                          }}
                          title="Clicca per filtrare gli eventi completati"
                        >
                          <div className="text-2xl font-bold text-green-600">
                            {events.filter(e => new Date(e.date) < new Date()).length}
                          </div>
                          <div className="text-sm text-gray-600">Eventi Completati</div>
                        </div>
                        <div 
                          className={`bg-white p-4 rounded border text-center cursor-pointer hover:bg-yellow-50 transition-colors ${
                            eventsFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''
                          }`}
                          onClick={() => {
                            setEventsFilter(eventsFilter === 'pending' ? 'all' : 'pending');
                            setShowEventsList(true);
                            setCurrentPage(1);
                          }}
                          title="Clicca per filtrare gli eventi in sospeso"
                        >
                          <div className="text-2xl font-bold text-yellow-600">
                            {events.filter(e => e.status === 'PROPOSED').length}
                          </div>
                          <div className="text-sm text-gray-600">Eventi In Sospeso</div>
                        </div>
                      </div>
                    ) : (
                      // Statistiche per Artist - Disponibilità
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded border text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {groups.filter(group => 
                              group.user_groups?.some((ug: any) => ug.user_id === user.id)
                            ).length}
                          </div>
                          <div className="text-sm text-gray-600">Tuoi Gruppi</div>
                        </div>
                        <div 
                          className={`bg-white p-4 rounded border text-center cursor-pointer hover:bg-green-50 transition-colors ${
                            eventsFilter === 'upcoming' ? 'ring-2 ring-green-500' : ''
                          }`}
                          onClick={() => {
                            setEventsFilter(eventsFilter === 'upcoming' ? 'all' : 'upcoming');
                            setShowEventsList(true);
                            setCurrentPage(1);
                          }}
                          title="Clicca per filtrare i tuoi eventi prossimi"
                        >
                          <div className="text-2xl font-bold text-green-600">
                            {events.filter(e => new Date(e.date) >= new Date()).length}
                          </div>
                          <div className="text-sm text-gray-600">Eventi Prossimi</div>
                        </div>
                        <div className="bg-white p-4 rounded border text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            0
                          </div>
                          <div className="text-sm text-gray-600">Giorni Impegnato</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-3">
                        {user.role === 'ADMIN' ? (
                          // Pulsanti per Admin
                          <>
                            <button 
                              onClick={() => {
                                setSelectedDate(new Date().toISOString().split('T')[0]);
                                setIsModalOpen(true);
                              }}
                              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                            >
                              + Crea Nuovo Evento
                            </button>
                            <button 
                              onClick={() => {
                                setShowEventsList(!showEventsList);
                                if (showEventsList) setCurrentPage(1); // Reset pagina quando si chiude
                              }}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                            >
                              {showEventsList ? 'Nascondi Lista' : 'Visualizza Prossimi Eventi'}
                            </button>
                          </>
                        ) : (
                          // Pulsanti per Artist
                          <>
                            <button 
                              onClick={() => setShowAvailabilityModal(true)}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                              📅 Gestisci Disponibilità
                            </button>
                            <button 
                              onClick={() => {
                                setShowEventsList(!showEventsList);
                                if (showEventsList) setCurrentPage(1); // Reset pagina quando si chiude
                              }}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                            >
                              {showEventsList ? 'Nascondi Lista' : 'Visualizza I Tuoi Prossimi Eventi'}
                            </button>
                          </>
                        )}
                      </div>
                      
                      {showEventsList && (() => {
                        // Applica il filtro in base alla selezione
                        let filteredEvents = events;
                        if (eventsFilter === 'upcoming') {
                          filteredEvents = events.filter(e => new Date(e.date) >= new Date());
                        } else if (eventsFilter === 'completed') {
                          filteredEvents = events.filter(e => new Date(e.date) < new Date());
                        } else if (eventsFilter === 'pending') {
                          filteredEvents = events.filter(e => e.status === 'PROPOSED');
                        } else {
                          // 'all' - mostra solo eventi futuri di default
                          filteredEvents = events.filter(e => new Date(e.date) >= new Date());
                        }
                        
                        const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
                        const startIndex = (currentPage - 1) * eventsPerPage;
                        const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);
                        
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="font-medium text-gray-900">
                                {eventsFilter === 'upcoming' ? 
                                  (user.role === 'ADMIN' ? 'Eventi Prossimi' : 'I Tuoi Eventi Prossimi') :
                                  eventsFilter === 'completed' ?
                                    (user.role === 'ADMIN' ? 'Eventi Completati' : 'I Tuoi Eventi Completati') :
                                    eventsFilter === 'pending' ?
                                      (user.role === 'ADMIN' ? 'Eventi In Sospeso' : 'I Tuoi Eventi In Sospeso') :
                                      (user.role === 'ADMIN' ? 'Tutti gli Eventi' : 'I Tuoi Eventi')
                                }
                                <span className="text-sm text-gray-500 ml-2">({filteredEvents.length} totali)</span>
                              </h5>
                              {totalPages > 1 && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                  >
                                    ← Prec
                                  </button>
                                  <span className="text-sm text-gray-600">
                                    {currentPage} di {totalPages}
                                  </span>
                                  <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                  >
                                    Succ →
                                  </button>
                                </div>
                              )}
                            </div>
                            {filteredEvents.length === 0 ? (
                              <p className="text-gray-500 text-center py-4">
                                {eventsFilter === 'upcoming' ? 'Nessun evento futuro programmato' :
                                 eventsFilter === 'completed' ? 'Nessun evento completato' :
                                 eventsFilter === 'pending' ? 'Nessun evento in sospeso' :
                                 'Nessun evento trovato'}
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {paginatedEvents.map(event => (
                                  <div key={event.id} className="border border-gray-100 rounded p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h6 
                                          className={`font-medium text-gray-900 ${user.role === 'ADMIN' ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
                                          onClick={() => user.role === 'ADMIN' && handleEditEvent(event)}
                                          title={user.role === 'ADMIN' ? 'Clicca per modificare evento' : ''}
                                        >
                                          {event.title}
                                        </h6>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          event.type === 'availability' ? 'bg-green-100 text-green-700' :
                                          'bg-blue-100 text-blue-700'
                                        }`}>
                                          {event.type === 'availability' ? 'Confermata' : 'Opzionata'}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        📅 {new Date(event.date).toLocaleDateString('it-IT')} - ⏰ {event.time}
                                      </div>
                                      {event.venue && (
                                        <div className="text-sm text-gray-600">📍 {event.venue}</div>
                                      )}
                                      {event.group && (
                                        <div className="text-sm text-gray-600">👥 {event.group.name}</div>
                                      )}
                                      {event.contact_responsible && (
                                        <div className="text-sm text-gray-600">👤 Contatto: {event.contact_responsible}</div>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteEvent(event.id, event.title);
                                      }}
                                      className="text-red-500 hover:text-red-700 ml-2"
                                      title="Elimina evento"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'users' && user.role === 'ADMIN' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    👤 Gestione Utenti
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h4 className="text-yellow-800 font-medium text-lg mb-3">Utenti Sistema</h4>
                    <p className="text-yellow-700 mb-4">
                      Gestisci account utente, assegna ruoli e controlla i permessi di accesso.
                    </p>
                    
                    {/* Campo di ricerca utenti */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="🔍 Cerca utente per nome, cognome, email o ruolo..."
                        value={usersSearchTerm}
                        onChange={(e) => setUsersSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(() => {
                        // Filtra gli utenti in base alla ricerca
                        let filteredUsers = users;
                        
                        // Applica filtro di ricerca
                        if (usersSearchTerm.trim()) {
                          filteredUsers = users.filter(userItem =>
                            userItem.first_name.toLowerCase().includes(usersSearchTerm.toLowerCase()) ||
                            userItem.last_name.toLowerCase().includes(usersSearchTerm.toLowerCase()) ||
                            userItem.email.toLowerCase().includes(usersSearchTerm.toLowerCase()) ||
                            userItem.role.toLowerCase().includes(usersSearchTerm.toLowerCase()) ||
                            (userItem.phone && userItem.phone.toLowerCase().includes(usersSearchTerm.toLowerCase()))
                          );
                        }
                        
                        return filteredUsers.length === 0 ? (
                          <div className="bg-white p-3 rounded border text-center text-gray-500">
                            {usersSearchTerm.trim() ? 'Nessun utente trovato per la ricerca' : 'Nessun utente trovato'}
                          </div>
                        ) : (
                          filteredUsers.map((userItem) => (
                            <div 
                              key={userItem.id} 
                              className={`p-4 rounded border transition-colors ${
                                userItem.account_locked ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                          {/* Layout ottimizzato per desktop e mobile */}
                          <div className="space-y-3">
                            {/* Nome utente più grande e prominente */}
                            <div>
                              <h5 className="font-semibold text-lg text-gray-900 mb-2">{userItem.first_name} {userItem.last_name}</h5>
                              
                              {/* Email subito sotto il nome */}
                              <div className="text-sm text-gray-600 mb-2">
                                📧 {userItem.email}
                              </div>
                            </div>

                            {/* Informazioni utente organizzate */}
                            <div className="space-y-2">
                              {/* Ruolo e stato su riga separata */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  userItem.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                  userItem.role === 'ARTIST' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  👤 {userItem.role}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  userItem.account_locked 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {userItem.account_locked ? '🔒 Bloccato' : '✅ Attivo'}
                                </span>
                              </div>

                              {/* Telefono se presente */}
                              {userItem.phone && (
                                <div className="text-sm text-gray-600">
                                  📱 {userItem.phone}
                                </div>
                              )}

                              {/* Data creazione */}
                              <div className="text-sm text-gray-500">
                                📅 Creato: {userItem.createdAt || userItem.created_at ? 
                                  new Date(userItem.createdAt || userItem.created_at).toLocaleDateString('it-IT') : 
                                  'Data non disponibile'}
                              </div>

                              {/* Informazioni di sicurezza */}
                              {userItem.failed_login_attempts > 0 && (
                                <div className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                  ⚠️ Tentativi falliti: {userItem.failed_login_attempts}
                                </div>
                              )}

                              {/* Data blocco se presente */}
                              {userItem.locked_at && (
                                <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                                  🔒 Bloccato il: {new Date(userItem.locked_at).toLocaleDateString('it-IT')} alle{' '}
                                  {new Date(userItem.locked_at).toLocaleTimeString('it-IT')}
                                </div>
                              )}
                            </div>

                            {/* Pulsanti con layout ottimizzato per desktop */}
                            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 pt-2 border-t border-gray-100 lg:justify-start">
                              {user.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleEditUser(userItem)}
                                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                                  title="Modifica dati utente"
                                >
                                  ✏️ Modifica
                                </button>
                              )}
                              {userItem.account_locked && (
                                <button
                                  onClick={() => handleUnlockUser(userItem.id)}
                                  className="flex-1 sm:flex-initial px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                                  title="Sblocca utente"
                                >
                                  🔓 Sblocca
                                </button>
                              )}
                              {userItem.id !== user.id && (
                                <button
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  className="flex-1 sm:flex-initial px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                                  title="Elimina utente"
                                >
                                  🗑️ Elimina
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                          ))
                        );
                      })()}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => setShowCreateUserModal(true)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                      >
                        + Aggiungi Nuovo Utente
                      </button>
                      <button 
                        onClick={() => alert('Funzionalità di gestione permessi in sviluppo')}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                      >
                        Gestisci Permessi
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && user.role === 'ADMIN' && (
                <Notifications onNotificationsChange={reloadNotificationsCount} />
              )}

              {activeSection === 'audit' && user.role === 'ADMIN' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    🔍 Log Audit Sistema
                  </h3>
                  <AuditLogs />
                </div>
              )}


              {activeSection === 'user' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    👤 Il Tuo Profilo
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-6">
                    <h4 className="text-slate-800 font-medium text-lg mb-3">I Tuoi Dati</h4>
                    <p className="text-slate-700 mb-6">
                      Gestisci le tue informazioni personali, dati di fatturazione e preferenze account.
                    </p>

                    <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
                      {/* Informazioni Personali */}
                      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">📝</span>
                          Informazioni Personali
                        </h5>
                        <form className="space-y-4">
                          <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                              <input
                                type="text"
                                value={userProfile.firstName}
                                onChange={(e) => handleProfileChange('firstName', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                              <input
                                type="text"
                                value={userProfile.lastName}
                                onChange={(e) => handleProfileChange('lastName', e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">📧 Email *</label>
                            <input
                              type="email"
                              value={userProfile.email}
                              onChange={(e) => handleProfileChange('email', e.target.value)}
                              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">📱 Telefono</label>
                            <input
                              type="tel"
                              value={userProfile.phone}
                              onChange={(e) => handleProfileChange('phone', e.target.value)}
                              placeholder="+39 123 456 7890"
                              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🎂 Data di Nascita</label>
                            <input
                              type="date"
                              value={userProfile.birthDate}
                              onChange={(e) => handleProfileChange('birthDate', e.target.value)}
                              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            />
                          </div>
                        </form>
                      </div>

                      {/* Dati di Fatturazione */}
                      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">🧾</span>
                          Dati di Fatturazione
                        </h5>
                        <form className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Ragione Sociale</label>
                            <input
                              type="text"
                              value={userProfile.businessName}
                              onChange={(e) => handleProfileChange('businessName', e.target.value)}
                              placeholder="Nome azienda o nome completo"
                              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🆔 Partita IVA / Codice Fiscale</label>
                            <input
                              type="text"
                              value={userProfile.vatNumber}
                              onChange={(e) => handleProfileChange('vatNumber', e.target.value)}
                              placeholder="IT12345678901"
                              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">🏠 Indirizzo</label>
                            <input
                              type="text"
                              value={userProfile.address}
                              onChange={(e) => handleProfileChange('address', e.target.value)}
                              placeholder="Via, Piazza, ecc."
                              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            />
                          </div>
                          <div className="space-y-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">📮 CAP</label>
                              <input
                                type="text"
                                value={userProfile.zipCode}
                                onChange={(e) => handleProfileChange('zipCode', e.target.value)}
                                placeholder="20100"
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">🏙️ Città</label>
                              <input
                                type="text"
                                value={userProfile.city}
                                onChange={(e) => handleProfileChange('city', e.target.value)}
                                placeholder="Milano"
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">🗺️ Provincia</label>
                              <input
                                type="text"
                                value={userProfile.province}
                                onChange={(e) => handleProfileChange('province', e.target.value)}
                                placeholder="MI"
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                              />
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Sezione Gruppi (Solo Visualizzazione) */}
                    <div className="mt-6 bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-4 flex flex-col sm:flex-row sm:items-center">
                        <span className="flex items-center">
                          <span className="mr-2">👥</span>
                          I Tuoi Gruppi
                        </span>
                        <span className="mt-1 sm:mt-0 sm:ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded w-fit">Solo visualizzazione</span>
                      </h5>
                      <div className="space-y-3">
                        {groups.filter(group => 
                          group.user_groups?.some((ug: any) => ug.user_id === user.id)
                        ).map(group => (
                          <div key={group.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-base">{group.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {group.type === 'BAND' ? '🎸 Band' : 
                                 group.type === 'DJ' ? '🎧 DJ' : 
                                 group.type ? `🎤 ${group.type}` : '❓ Tipo non specificato'} 
                                {group.genre && ` • ${group.genre}`}
                              </div>
                            </div>
                            <div className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium w-fit">
                              ✅ Membro
                            </div>
                          </div>
                        ))}
                        {groups.filter(group => 
                          group.user_groups?.some((ug: any) => ug.user_id === user.id)
                        ).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">🎵</div>
                            <p>Non fai ancora parte di nessun gruppo</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded-lg">
                        💡 Per modificare i tuoi gruppi di appartenenza, contatta l'amministratore del sistema.
                      </p>
                    </div>

                    {/* Sezione Sicurezza - Cambio Password */}
                    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 mt-6">
                      <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">🔐</span>
                        Sicurezza Account
                      </h5>
                      <p className="text-sm text-gray-600 mb-4">
                        Cambia la tua password per mantenere l'account sicuro
                      </p>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password Attuale *
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                            placeholder="Inserisci la password attuale"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nuova Password *
                            </label>
                            <input
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                              placeholder="Almeno 6 caratteri"
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Conferma Nuova Password *
                            </label>
                            <input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                              placeholder="Ripeti la nuova password"
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleChangePassword}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          🔐 Cambia Password
                        </button>
                      </form>
                    </div>

                    {/* Sezione Backup Management - Solo Admin */}
                    {user.role === 'ADMIN' && (
                      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 mt-6">
                        <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                          <span className="mr-2">💾</span>
                          Database Backup
                        </h5>
                        <BackupManagement />
                      </div>
                    )}

                    {/* Pulsanti Azione */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 pb-20 sm:pb-0">
                      <button 
                        onClick={handleSaveProfile}
                        className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
                      >
                        💾 Salva Modifiche
                      </button>
                      <button 
                        onClick={() => window.location.reload()}
                        className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium text-base"
                      >
                        🔄 Annulla
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal per eventi del giorno */}
      <DayEventsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        events={getEventsForDate(selectedDate)}
        groups={groups}
        user={user}
        userGroups={user.role !== 'ADMIN' ? groups.filter(group => 
          group.user_groups?.some((ug: any) => ug.user_id === user.id)
        ) : userGroups}
        users={users}
        onCreateEvent={handleCreateEvent}
        onDeleteEvent={handleDeleteEvent}
        onCreateAvailability={handleCreateAvailability}
        onEditEvent={handleEditEvent}
      />

      {/* Modal per creazione gruppi */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* Modal per creazione utenti */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onCreateUser={handleCreateUser}
        groups={groups}
      />

      {/* Modal per dettagli gruppo */}
      <GroupDetailModal
        isOpen={showGroupDetailModal}
        onClose={() => setShowGroupDetailModal(false)}
        group={selectedGroup}
        currentUser={user}
        onGroupUpdated={handleGroupUpdated}
        onEditGroup={handleEditGroup}
        onEditEvent={handleEditEvent}
      />

      <AvailabilityModal
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        user={user}
        userGroups={groups.filter(group => 
          group.user_groups?.some((ug: any) => ug.user_id === user.id)
        )}
        onDataChanged={reloadData}
      />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          <button
            onClick={() => handleSectionClick('home')}
            className={`flex flex-col items-center px-2 py-2 text-xs ${
              activeSection === 'home'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg">📅</span>
            <span>Calendario</span>
          </button>
          <button
            onClick={() => handleSectionClick('groups')}
            className={`flex flex-col items-center px-2 py-2 text-xs ${
              activeSection === 'groups'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg">👥</span>
            <span>Gruppi</span>
          </button>
          {user.role === 'ADMIN' && (
            <button
              onClick={() => handleSectionClick('users')}
              className={`flex flex-col items-center px-2 py-2 text-xs ${
                activeSection === 'users'
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-lg">👤</span>
              <span>Utenti</span>
            </button>
          )}
          <button
            onClick={() => handleSectionClick('events')}
            className={`flex flex-col items-center px-2 py-2 text-xs ${
              activeSection === 'events'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{user.role === 'ADMIN' ? '🎤' : '📅'}</span>
            <span>{user.role === 'ADMIN' ? 'Eventi' : 'Disponibilità'}</span>
          </button>
          {user.role === 'ADMIN' && (
            <>
              <button
                onClick={() => handleSectionClick('notifications')}
                className={`flex flex-col items-center px-1 py-2 text-xs relative ${
                  activeSection === 'notifications'
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                <span className="text-lg">📧</span>
                <span>Notifiche</span>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[18px] h-4 flex items-center justify-center text-[10px]">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleSectionClick('audit')}
                className={`flex flex-col items-center px-1 py-2 text-xs ${
                  activeSection === 'audit'
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                <span className="text-lg">🔍</span>
                <span>Audit</span>
              </button>
            </>
          )}
          <button
            onClick={() => handleSectionClick('user')}
            className={`flex flex-col items-center px-2 py-2 text-xs ${
              activeSection === 'user'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span>Profilo</span>
          </button>
        </div>
      </nav>

      {/* Modal per modifica eventi */}
      {selectedEvent && (
        <EditEventModal
          isOpen={showEditEventModal}
          onClose={() => {
            setShowEditEventModal(false);
            setSelectedEvent(null);
          }}
          onSave={handleSaveEventChanges}
          event={selectedEvent}
          groups={groups}
        />
      )}

      {/* Modal per dettagli eventi */}
      <EventDetailsModal
        event={selectedEventForDetails}
        isOpen={showEventDetailsModal}
        onClose={() => {
          setShowEventDetailsModal(false);
          setSelectedEventForDetails(null);
        }}
        onEdit={(event) => {
          setSelectedEvent(event);
          setShowEditEventModal(true);
        }}
        onDelete={handleDeleteEvent}
        currentUser={user}
      />

      {/* Modal per modifica utenti */}
      {selectedUser && (
        <EditUserModal
          isOpen={showEditUserModal}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          onSaveUser={handleSaveUserChanges}
          user={selectedUser}
          groups={groups}
        />
      )}

      {/* Modal per modifica gruppi */}
      {selectedGroupForEdit && (
        <EditGroupModal
          isOpen={showEditGroupModal}
          onClose={() => {
            setShowEditGroupModal(false);
            setSelectedGroupForEdit(null);
          }}
          onSaveGroup={handleSaveGroupChanges}
          group={selectedGroupForEdit}
        />
      )}

      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        onExtend={handleExtendSession}
        onLogout={handleSessionTimeout}
        remainingMinutes={remainingTime}
      />
    </div>
  );
};

export default Dashboard;