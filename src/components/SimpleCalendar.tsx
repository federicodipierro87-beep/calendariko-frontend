import React, { useState } from 'react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'rehearsal' | 'availability' | 'availability-busy';
  fee?: number;
  contact_responsible?: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  group?: {
    id: string;
    name: string;
  };
}

interface SimpleCalendarProps {
  events?: Event[];
  onDayClick?: (date: string) => void;
  onEventClick?: (event: Event) => void;
  userRole?: string;
}

type CalendarView = 'month' | 'week' | 'day';

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({ events = [], onDayClick, onEventClick, userRole }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [isMobile, setIsMobile] = useState(false);

  // Hook per gestire il resize della finestra
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === month &&
           today.getFullYear() === year;
  };

  const hasEvent = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const filteredEvents = getFilteredEvents(dayStr);
    return filteredEvents.length > 0;
  };

  const getFilteredEvents = (dayStr: string) => {
    let dayEvents = events.filter(event => event.date === dayStr);
    
    // Non filtrare più le indisponibilità per gli admin - le mostriamo come eventi normali
    return dayEvents;
  };

  const getEventTypeColor = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = getFilteredEvents(dayStr);
    
    // Non coloriamo più lo sfondo del giorno - gli eventi ora sono ben visibili
    // Lasciamo solo un leggero accento al bordo se ci sono eventi
    if (dayEvents.length === 0) return '';
    
    return 'border-gray-300'; // Bordo neutro quando ci sono eventi
  };

  const getDayEvents = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return getFilteredEvents(dayStr);
  };

  const handleDayClick = (day: number) => {
    if (onDayClick) {
      const clickedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      onDayClick(clickedDate);
    }
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation(); // Previene il click sul giorno
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Helper functions for different views
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekDays = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getEventDisplayName = (event: Event) => {
    if (event.type === 'availability-busy') {
      // L'evento ha già il titolo corretto dal backend (nome gruppo per admin, "Indisponibile" per user)
      return event.title;
    }
    return event.title;
  };

  const getEventDisplayNameWithBand = (event: Event) => {
    if (event.type === 'availability-busy') {
      // Rimuovi la X dal nome della band per le indisponibilità
      let title = event.title;
      if (title.startsWith('❌ ')) {
        title = title.substring(2);
      }
      return title.trim();
    }
    
    // Per eventi normali nella vista mese, mostra solo il nome della band
    if (event.group?.name) {
      return event.group.name;
    }
    
    // Fallback al titolo se non c'è gruppo
    return event.title;
  };

  const getEventTime = (event: Event) => {
    // Le indisponibilità non hanno orario
    if (event.type === 'availability-busy') {
      return '';
    }
    return formatTime(event.time);
  };

  const getEventTooltip = (event: Event) => {
    const name = getEventDisplayName(event);
    const time = getEventTime(event);
    if (time) {
      return `${name} - ${time}`;
    }
    return name;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return getFilteredEvents(dateStr);
  };

  const previousPeriod = () => {
    if (currentView === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (currentView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (currentView === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (currentView === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (currentView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (currentView === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const getViewTitle = () => {
    if (currentView === 'month') {
      return `${monthNames[month]} ${year}`;
    } else if (currentView === 'week') {
      const weekDates = getWeekDays();
      const start = weekDates[0];
      const end = weekDates[6];
      const startMonth = start.getMonth();
      const endMonth = end.getMonth();
      
      if (startMonth === endMonth) {
        return `${start.getDate()} - ${end.getDate()} ${monthNames[startMonth]} ${start.getFullYear()}`;
      } else {
        return `${start.getDate()} ${monthNames[startMonth]} - ${end.getDate()} ${monthNames[endMonth]} ${start.getFullYear()}`;
      }
    } else {
      return `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  const renderWeekView = () => {
    const weekDates = getWeekDays();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <>
        {/* Header giorni della settimana */}
        <div className="flex border-b bg-gray-50 flex-shrink-0 h-16">
          <div className="w-16 flex-shrink-0 border-r"></div>
          {weekDates.map((date, index) => (
            <div key={index} className="flex-1 p-2 border-r text-center">
              <div className="text-xs text-gray-500 uppercase">
                {weekDays[date.getDay()]}
              </div>
              <div className={`text-lg font-medium ${
                date.toDateString() === new Date().toDateString() 
                  ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' 
                  : 'text-gray-900'
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grid ore e eventi - Fixed height container */}
        <div className="flex-1 overflow-y-scroll" style={{ height: 'calc(100% - 64px)' }}>
          <div className="flex">
            {/* Colonna ore - Fixed content height */}
            <div className="w-16 flex-shrink-0 border-r bg-gray-50">
              {hours.map(hour => (
                <div key={hour} className="h-12 border-b flex items-start justify-end pr-2 pt-1">
                  <span className="text-xs text-gray-500">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Colonne giorni - Fixed content height */}
            {weekDates.map((date, dayIndex) => {
              const dayEvents = getEventsForDate(date);
              
              return (
                <div key={dayIndex} className="flex-1 border-r relative">
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className="h-12 border-b hover:bg-blue-50 cursor-pointer"
                      onClick={() => onDayClick && onDayClick(date.toISOString().split('T')[0])}
                    ></div>
                  ))}

                  {/* Eventi */}
                  {dayEvents.map((event, eventIndex) => {
                    const timeStr = event.time || '00:00';
                    const [hourStr, minuteStr] = timeStr.split(':');
                    const startHour = parseInt(hourStr) || 0;
                    const startMinute = parseInt(minuteStr) || 0;
                    const topPosition = (startHour * 48) + (startMinute * 48 / 60);

                    const getEventColor = (type: string) => {
                      switch(type) {
                        case 'availability-busy': return 'bg-red-500';
                        case 'availability': return 'bg-green-500';
                        case 'rehearsal': return 'bg-blue-500';
                        default: return 'bg-purple-500';
                      }
                    };

                    return (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        className={`absolute left-1 right-1 ${getEventColor(event.type)} text-white text-xs p-1 rounded shadow z-10`}
                        style={{ 
                          top: `${topPosition}px`,
                          height: '40px'
                        }}
                        title={getEventTooltip(event)}
                      >
                        <div className="font-medium truncate">
                          {getEventDisplayName(event)}
                        </div>
                        <div className="truncate">{getEventTime(event)}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDate(currentDate);

    return (
      <>
        {/* Header giorno */}
        <div className="flex border-b bg-gray-50 p-4 flex-shrink-0 h-20">
          <div className="text-center w-full">
            <div className="text-sm text-gray-500 uppercase">
              {weekDays[currentDate.getDay()]}
            </div>
            <div className={`text-2xl font-medium ${
              currentDate.toDateString() === new Date().toDateString()
                ? 'bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto'
                : 'text-gray-900'
            }`}>
              {currentDate.getDate()}
            </div>
          </div>
        </div>

        {/* Grid ore e eventi - Fixed height container */}
        <div className="flex-1 overflow-y-scroll" style={{ height: 'calc(100% - 80px)' }}>
          <div className="flex">
            {/* Colonna ore - Fixed content height */}
            <div className="w-20 flex-shrink-0 border-r bg-gray-50">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b flex items-start justify-end pr-2 pt-1">
                  <span className="text-sm text-gray-500">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Colonna giorno - Fixed content height */}
            <div className="flex-1 relative">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="h-16 border-b hover:bg-blue-50 cursor-pointer"
                  onClick={() => onDayClick && onDayClick(currentDate.toISOString().split('T')[0])}
                ></div>
              ))}

              {/* Eventi */}
              {dayEvents.map((event, eventIndex) => {
                const timeStr = event.time || '00:00';
                const [hourStr, minuteStr] = timeStr.split(':');
                const startHour = parseInt(hourStr) || 0;
                const startMinute = parseInt(minuteStr) || 0;
                const topPosition = (startHour * 64) + (startMinute * 64 / 60);

                const getEventColor = (type: string) => {
                  switch(type) {
                    case 'availability-busy': return 'bg-red-500';
                    case 'availability': return 'bg-green-500';
                    case 'rehearsal': return 'bg-blue-500';
                    default: return 'bg-purple-500';
                  }
                };

                return (
                  <div
                    key={`${event.id}-${eventIndex}`}
                    className={`absolute left-2 right-2 ${getEventColor(event.type)} text-white p-2 rounded shadow z-10`}
                    style={{ 
                      top: `${topPosition}px`,
                      height: '50px'
                    }}
                    title={getEventTooltip(event)}
                  >
                    <div className="font-medium truncate">
                      {getEventDisplayName(event)}
                    </div>
                    <div className="text-sm truncate">{getEventTime(event)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Giorni vuoti prima del primo giorno del mese
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[2rem] md:min-h-[3rem]"></div>
      );
    }

    // Giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      const todayClass = isToday(day) ? 'bg-blue-500 text-white font-bold' : '';
      const eventClass = hasEvent(day) ? getEventTypeColor(day) : '';
      const hoverClass = onDayClick ? 'hover:bg-blue-100 hover:border-blue-300' : 'hover:bg-gray-50';
      const dayEvents = getDayEvents(day);
      
      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`min-h-[4rem] md:min-h-[5rem] lg:min-h-[6rem] border border-gray-200 cursor-pointer ${hoverClass} ${todayClass} ${eventClass} transition-colors p-1 flex flex-col`}
          title={onDayClick ? (
            userRole !== 'ADMIN' 
              ? 'Clicca per visualizzare eventi e gestire indisponibilità' 
              : 'Clicca per visualizzare/creare eventi'
          ) : ''}
        >
          <div className="text-xs md:text-sm font-medium mb-1 flex-shrink-0">{day}</div>
          <div className="flex-1 overflow-hidden space-y-0.5">
            {dayEvents.slice(0, isMobile ? 3 : 4).map((event, index) => {
              const getEventStyle = (eventType: string) => {
                switch(eventType) {
                  case 'availability-busy':
                    return {
                      backgroundColor: '#dc2626',
                      color: 'white'
                    };
                  case 'availability':
                    return {
                      backgroundColor: '#16a34a',
                      color: 'white'
                    };
                  case 'rehearsal':
                    return {
                      backgroundColor: '#2563eb',
                      color: 'white'
                    };
                  default:
                    return {
                      backgroundColor: '#7c3aed',
                      color: 'white'
                    };
                }
              };

              const style = getEventStyle(event.type);
              
              return (
                <div
                  key={event.id}
                  className="text-xs px-1.5 py-0.5 rounded-sm cursor-pointer hover:opacity-90 transition-opacity font-medium shadow-sm"
                  style={style}
                  onClick={(e) => handleEventClick(event, e)}
                  title={`${getEventDisplayNameWithBand(event)}${getEventTime(event) ? ` - ${getEventTime(event)}` : ''}`}
                >
                  <div className="truncate leading-tight">
                    {getEventDisplayNameWithBand(event)}
                  </div>
                </div>
              );
            })}
            {dayEvents.length > (isMobile ? 3 : 4) && (
              <div 
                className="text-xs text-gray-600 font-medium cursor-pointer hover:text-gray-800 transition-colors px-1"
                onClick={() => handleDayClick(day)}
                title="Clicca per vedere tutti gli eventi"
              >
                +{dayEvents.length - (isMobile ? 3 : 4)} altri eventi
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Header del calendario - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          <button
            onClick={previousPeriod}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 text-center">
            {getViewTitle()}
          </h2>
          <button
            onClick={nextPeriod}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            →
          </button>
        </div>
        <div className="flex items-center justify-center space-x-2">
          {/* View selector - Mobile responsive */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('month')}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                currentView === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mese
            </button>
            <button
              onClick={() => setCurrentView('week')}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                currentView === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sett
            </button>
            <button
              onClick={() => setCurrentView('day')}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                currentView === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Giorno
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Oggi
          </button>
        </div>
      </div>


      {/* Contenuto del calendario basato sulla vista */}
      {currentView === 'month' ? (
        <>
          {/* Giorni della settimana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Griglia del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
        </>
      ) : currentView === 'week' ? (
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          {/* Header settimana - Mobile responsive */}
          <div className="grid grid-cols-8 h-12 sm:h-16 border-b bg-gray-50">
            <div className="flex items-center justify-center text-xs font-bold border-r col-span-1">
              <span className="hidden sm:inline">Ora</span>
              <span className="sm:hidden">H</span>
            </div>
            {getWeekDays().map((date, index) => (
              <div key={index} className="flex flex-col items-center justify-center p-1 sm:p-2 border-r last:border-r-0">
                <div className="text-xs sm:text-xs text-gray-500 uppercase">
                  <span className="hidden sm:inline">{weekDays[date.getDay()]}</span>
                  <span className="sm:hidden">{weekDays[date.getDay()].slice(0, 1)}</span>
                </div>
                <div className={`text-xs sm:text-sm font-medium ${
                  date.toDateString() === new Date().toDateString() 
                    ? 'bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center' 
                    : 'text-gray-900'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Griglia calendario - Mobile responsive */}
          <div className="overflow-x-auto overflow-y-auto" style={{height: '400px'}}>
            <div className="grid grid-cols-8 min-w-full">
              {/* Colonna ore */}
              <div className="border-r bg-gray-50 col-span-1 min-w-0">
                {Array.from({ length: 17 }, (_, hour) => (
                  <div key={hour + 7} className="h-10 sm:h-12 flex items-start justify-end pr-1 sm:pr-2 pt-1 border-b text-xs text-gray-500">
                    <span className="hidden sm:inline">{(hour + 7).toString().padStart(2, '0')}:00</span>
                    <span className="sm:hidden">{(hour + 7).toString().padStart(2, '0')}</span>
                  </div>
                ))}
              </div>

              {/* Colonne giorni */}
              {getWeekDays().map((date, dayIndex) => {
                const dayEvents = getEventsForDate(date);
                return (
                  <div key={dayIndex} className="border-r last:border-r-0 relative min-w-0">
                    {/* Griglia ore */}
                    {Array.from({ length: 17 }, (_, hour) => (
                      <div 
                        key={hour + 7}
                        className="h-10 sm:h-12 border-b cursor-pointer hover:bg-blue-50"
                        onClick={() => onDayClick && onDayClick(date.toISOString().split('T')[0])}
                      />
                    ))}

                    {/* Eventi */}
                    {dayEvents.map((event, eventIndex) => {
                      // Fix per il parsing dell'orario con supporto ISO timestamps
                      let timeStr = event.time || '09:00';
                      
                      // Se è un timestamp ISO (contiene T), estrai solo l'orario
                      if (timeStr && timeStr.includes('T')) {
                        try {
                          const date = new Date(timeStr);
                          const hours = date.getHours().toString().padStart(2, '0');
                          const minutes = date.getMinutes().toString().padStart(2, '0');
                          timeStr = `${hours}:${minutes}`;
                        } catch (e) {
                          timeStr = '09:00';
                        }
                      }
                      
                      // Se timeStr non è nel formato HH:MM, usa un default
                      if (!timeStr || !timeStr.includes(':') || timeStr.length > 5) {
                        timeStr = '09:00';
                      }
                      
                      const [hourStr, minuteStr] = timeStr.split(':');
                      let startHour = parseInt(hourStr);
                      let startMinute = parseInt(minuteStr) || 0;
                      
                      // Validazione extra per ore valide
                      if (isNaN(startHour) || startHour < 0 || startHour > 23) {
                        startHour = 9;
                      }
                      if (isNaN(startMinute) || startMinute < 0 || startMinute > 59) {
                        startMinute = 0;
                      }
                      
                      // Calcola posizione solo per ore 7-23:30 (17 ore visibili)
                      if (startHour < 7 || startHour >= 24) {
                        return null;
                      }
                      
                      // Calcolo responsive per altezza celle
                      const cellHeight = isMobile ? 40 : 48; // 10 = h-10, 12 = h-12 in px
                      const topPosition = ((startHour - 7) * cellHeight) + (startMinute * cellHeight / 60);

                      let backgroundColor = '#8b5cf6';
                      if (event.type === 'availability-busy') backgroundColor = '#ef4444';
                      if (event.type === 'availability') backgroundColor = '#22c55e';
                      if (event.type === 'rehearsal') backgroundColor = '#3b82f6';

                      return (
                        <div
                          key={`${event.id}-${eventIndex}`}
                          className="absolute left-0.5 right-0.5 sm:left-1 sm:right-1 text-white text-xs rounded shadow z-10 overflow-hidden cursor-pointer"
                          style={{
                            top: `${topPosition}px`,
                            height: isMobile ? '30px' : '40px',
                            backgroundColor: backgroundColor,
                            padding: isMobile ? '2px' : '4px'
                          }}
                          title={`Clicca per dettagli: ${getEventTooltip(event)}`}
                          onClick={(e) => handleEventClick(event, e)}
                        >
                          <div className="font-bold leading-tight text-xs sm:text-xs truncate">
                            {getEventDisplayName(event)}
                          </div>
                          {!isMobile && (
                            <div className="text-xs opacity-90 leading-tight truncate">
                              {getEventTime(event)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          {/* Header giorno - Mobile responsive */}
          <div className="grid grid-cols-2 h-16 sm:h-20 border-b bg-gray-50">
            <div className="flex items-center justify-center text-xs sm:text-sm font-bold border-r">
              <span className="hidden sm:inline">Ora</span>
              <span className="sm:hidden">H</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <div className="text-xs text-gray-500 uppercase">
                {weekDays[currentDate.getDay()]}
              </div>
              <div className={`text-lg sm:text-xl font-bold ${
                currentDate.toDateString() === new Date().toDateString()
                  ? 'bg-blue-500 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center'
                  : 'text-gray-900'
              }`}>
                {currentDate.getDate()}
              </div>
            </div>
          </div>

          {/* Griglia calendario - Mobile responsive */}
          <div className="overflow-y-auto" style={{height: '400px'}}>
            <div className="grid grid-cols-2">
              {/* Colonna ore */}
              <div className="border-r bg-gray-50">
                {Array.from({ length: 17 }, (_, hour) => (
                  <div key={hour + 7} className="h-12 sm:h-16 flex items-start justify-end pr-2 pt-1 border-b text-xs sm:text-sm text-gray-500">
                    <span className="hidden sm:inline">{(hour + 7).toString().padStart(2, '0')}:00</span>
                    <span className="sm:hidden">{(hour + 7).toString().padStart(2, '0')}</span>
                  </div>
                ))}
              </div>

              {/* Colonna giorno */}
              <div className="relative">
                {/* Griglia ore */}
                {Array.from({ length: 17 }, (_, hour) => (
                  <div 
                    key={hour + 7}
                    className="h-12 sm:h-16 border-b cursor-pointer hover:bg-blue-50"
                    onClick={() => onDayClick && onDayClick(currentDate.toISOString().split('T')[0])}
                  />
                ))}

                {/* Eventi */}
                {getEventsForDate(currentDate).map((event, eventIndex) => {
                  // Fix per il parsing dell'orario con supporto ISO timestamps
                  let timeStr = event.time || '09:00';
                  
                  // Se è un timestamp ISO (contiene T), estrai solo l'orario
                  if (timeStr && timeStr.includes('T')) {
                    try {
                      const date = new Date(timeStr);
                      const hours = date.getHours().toString().padStart(2, '0');
                      const minutes = date.getMinutes().toString().padStart(2, '0');
                      timeStr = `${hours}:${minutes}`;
                    } catch (e) {
                      timeStr = '09:00';
                    }
                  }
                  
                  // Se timeStr non è nel formato HH:MM, usa un default
                  if (!timeStr || !timeStr.includes(':') || timeStr.length > 5) {
                    timeStr = '09:00';
                  }
                  
                  const [hourStr, minuteStr] = timeStr.split(':');
                  let startHour = parseInt(hourStr);
                  let startMinute = parseInt(minuteStr) || 0;
                  
                  // Validazione extra per ore valide
                  if (isNaN(startHour) || startHour < 0 || startHour > 23) {
                    startHour = 9;
                  }
                  if (isNaN(startMinute) || startMinute < 0 || startMinute > 59) {
                    startMinute = 0;
                  }
                  
                  // Calcola posizione solo per ore 7-23:30 (17 ore visibili)
                  if (startHour < 7 || startHour >= 24) {
                    return null;
                  }
                  
                  // Calcolo responsive per altezza celle
                  const cellHeight = isMobile ? 48 : 64; // h-12 = 48px, h-16 = 64px
                  const topPosition = ((startHour - 7) * cellHeight) + (startMinute * cellHeight / 60);

                  let backgroundColor = '#8b5cf6';
                  if (event.type === 'availability-busy') backgroundColor = '#ef4444';
                  if (event.type === 'availability') backgroundColor = '#22c55e';
                  if (event.type === 'rehearsal') backgroundColor = '#3b82f6';

                  return (
                    <div
                      key={`${event.id}-${eventIndex}`}
                      className="absolute left-2 right-2 text-white rounded shadow z-10 overflow-hidden cursor-pointer"
                      style={{
                        top: `${topPosition}px`,
                        height: isMobile ? '40px' : '55px',
                        backgroundColor: backgroundColor,
                        padding: isMobile ? '4px' : '8px',
                        fontSize: isMobile ? '12px' : '14px'
                      }}
                      title={`Clicca per dettagli: ${getEventTooltip(event)}`}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div className="font-bold leading-tight mb-1 truncate">
                        {getEventDisplayName(event)}
                      </div>
                      <div className="text-xs opacity-90 leading-tight truncate">
                        {getEventTime(event)}
                      </div>
                      {!isMobile && (
                        <div className="text-xs opacity-80 leading-tight truncate">
                          {event.type === 'rehearsal' ? 'Prova' : 
                           event.type === 'availability' ? 'Disponibile' : 'Occupato'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legenda - Mobile responsive */}
      <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded flex-shrink-0"></div>
          <span className="truncate">Eventi</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded flex-shrink-0"></div>
          <span className="truncate">Prove</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded flex-shrink-0"></div>
          <span className="truncate">Disponibilità</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded flex-shrink-0"></div>
          <span className="truncate">Indisponibilità</span>
        </div>
        <div className="flex items-center space-x-1 sm:col-span-1 col-span-2 justify-center sm:justify-start">
          <div className="w-3 h-3 bg-blue-500 rounded flex-shrink-0"></div>
          <span className="truncate">Oggi</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleCalendar;