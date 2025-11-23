import { useState, useEffect } from 'react';
import { EventInput } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const SectionHeadCalendar = () => {
  const [currentEvents, setCurrentEvents] = useState<EventInput[]>([]);

  // Load saved events from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        setCurrentEvents(JSON.parse(savedEvents));
      }
    }
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
        events={currentEvents}
        eventClassNames={(arg) => {
          const isTask = arg.event.extendedProps.task;
          return isTask ? 'task-event' : 'calendar-event';
        }}
      />
      </div>
    </>
  );
};

export default SectionHeadCalendar;

