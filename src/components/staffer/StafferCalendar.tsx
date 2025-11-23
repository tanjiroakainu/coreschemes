import { useState, useEffect } from 'react';
import { EventInput } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getCurrentUser, getStaffers } from '@/lib/storage';

const StafferCalendar = () => {
  const [filteredEvents, setFilteredEvents] = useState<EventInput[]>([]);

  // Load saved events from localStorage and filter by assigned staffer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        const allEvents = JSON.parse(savedEvents);
        
        // Filter events assigned to current user
        const user = getCurrentUser();
        if (user) {
          // Try to find staffer by email
          const allStaffers = getStaffers();
          const staffer = allStaffers.find((s: any) => 
            s.email === user.email || s.id === user.id
          );
          const stafferId = staffer?.id || user.id || user.email;
          
          const assignedEvents = allEvents.filter((event: EventInput) => {
            const eventStafferId = (event as any).stafferId;
            // Show events assigned to this staffer, or events with no assignment
            return !eventStafferId || eventStafferId === stafferId;
          });
          
          setFilteredEvents(assignedEvents);
        } else {
          // If no user, show all events
          setFilteredEvents(allEvents);
        }
      }
    }
    
    // Listen for event updates
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const savedEvents = localStorage.getItem('events');
        if (savedEvents) {
          const allEvents = JSON.parse(savedEvents);
          
          const user = getCurrentUser();
          if (user) {
            const allStaffers = getStaffers();
            const staffer = allStaffers.find((s: any) => 
              s.email === user.email || s.id === user.id
            );
            const stafferId = staffer?.id || user.id || user.email;
            
            const assignedEvents = allEvents.filter((event: EventInput) => {
              const eventStafferId = (event as any).stafferId;
              return !eventStafferId || eventStafferId === stafferId;
            });
            
            setFilteredEvents(assignedEvents);
          } else {
            setFilteredEvents(allEvents);
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('eventUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('eventUpdated', handleStorageChange);
    };
  }, []);

  return (
    <>
      <style>{`
        .task-event {
          background-color: #facc15 !important;
          color: #000 !important;
        }
        .calendar-event {
          background-color: #3b82f6 !important;
          color: #fff !important;
        }
        .fc-toolbar {
          flex-direction: column;
          gap: 0.5rem;
        }
        @media (min-width: 640px) {
          .fc-toolbar {
            flex-direction: row;
          }
        }
        .fc-toolbar-title {
          font-size: 1.25rem;
        }
        @media (min-width: 640px) {
          .fc-toolbar-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
      <div className="px-2 sm:px-4 md:px-10 py-4 sm:py-6 space-y-4 sm:space-y-8">
        <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        initialView="dayGridMonth"
        editable={false}
        selectable={false}
        events={filteredEvents}
        eventClassNames={(arg) => {
          const isTask = arg.event.extendedProps.task;
          return isTask ? 'task-event' : 'calendar-event';
        }}
      />
      </div>
    </>
  );
};

export default StafferCalendar;

