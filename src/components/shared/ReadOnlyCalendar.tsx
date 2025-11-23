import { useState, useEffect } from 'react';
import { EventInput } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import PreviewPanel from '@/components/admin/PreviewPanel';
import EventDetailsDialog from '@/components/admin/EventDetailsDialog';
import { getCurrentUser, getStaffers, getStafferById } from '@/lib/storage';

interface ReadOnlyCalendarProps {
  role?: string;
}

export default function ReadOnlyCalendar({ role: _role }: ReadOnlyCalendarProps) {
  const [currentEvents, setCurrentEvents] = useState<EventInput[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventInput[]>([]);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);

  // Load saved events from localStorage and filter by assigned staffer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        const allEvents = JSON.parse(savedEvents);
        setCurrentEvents(allEvents);
        
        // Filter events assigned to current user
        const user = getCurrentUser();
        if (user) {
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
          setFilteredEvents(allEvents);
        }
      }
    }
  }, []);

  // Listen for event changes (when admin updates events)
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        const savedEvents = localStorage.getItem('events');
        if (savedEvents) {
          const allEvents = JSON.parse(savedEvents);
          setCurrentEvents(allEvents);
          
          const user = getCurrentUser();
          if (user) {
            const staffer = getStafferById(user.id || '') || 
                           (user.email ? getStafferById(user.email) : null);
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

  const handleEventClick = (info: any) => {
    const event = currentEvents.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsEventDetailsOpen(true);
    }
  };

  const getEventClassNames = (arg: any) => {
    const isTask = arg.event.extendedProps.task;
    return isTask ? 'task-event' : 'calendar-event';
  };

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
        .fc-header-toolbar {
          margin-bottom: 1rem;
        }
        .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        @media (min-width: 640px) {
          .fc-toolbar-title {
            font-size: 1.5rem;
          }
        }
        .fc-daygrid-day {
          cursor: default;
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
        .fc-toolbar-chunk {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>

      <div className="px-2 sm:px-4 md:px-10 py-4 sm:py-6 space-y-4 sm:space-y-8">
        <div className="w-full">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: '',
            }}
            initialView="dayGridMonth"
            editable={false}
            selectable={false}
            dayMaxEvents={true}
            events={filteredEvents}
            eventClick={handleEventClick}
            eventClassNames={getEventClassNames}
            height="auto"
          />
        </div>

        <PreviewPanel
          events={filteredEvents}
          onEdit={(event) => {
            // Read-only: just show details
            setSelectedEvent(event);
            setIsEventDetailsOpen(true);
          }}
          onAddEvent={undefined}
        />
      </div>

      <EventDetailsDialog
        isOpen={isEventDetailsOpen}
        onClose={() => {
          setIsEventDetailsOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={() => {
          // Read-only: do nothing
        }}
        onDelete={() => {
          // Read-only: do nothing
        }}
        readOnly={true}
      />
    </>
  );
}

