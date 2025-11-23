import { useState, useEffect } from 'react';
import { EventInput, DateSelectArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ClientRequestForm from './ClientRequestForm';
import RequestDetailsDialog from './RequestDetailsDialog';
import { getClientAvailability, getRequests, getCurrentUser, getRequestById, ClientRequest, deleteRequest } from '@/lib/storage';

const ClientCalendar = () => {
  const [currentEvents, setCurrentEvents] = useState<EventInput[]>([]);
  const [availabilityEvents, setAvailabilityEvents] = useState<EventInput[]>([]);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<ClientRequest | null>(null);

  // Load saved events and availability from localStorage
  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('clientAvailabilityUpdated', handleStorageChange);
    window.addEventListener('requestUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clientAvailabilityUpdated', handleStorageChange);
      window.removeEventListener('requestUpdated', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    if (typeof window !== 'undefined') {
      const currentUser = getCurrentUser();
      const clientEvents: EventInput[] = [];
      
      // Only show client's own requests, NOT admin calendar events
      // Load client requests and convert them to calendar events
      const requests = getRequests();
      const clientRequests = requests.filter((req) => {
        // Show requests created by this client
        if (currentUser?.email && req.clientEmail) {
          return req.clientEmail.toLowerCase() === currentUser.email.toLowerCase();
        }
        // If no client email match, show all requests (fallback for testing)
        return true;
      });
      
      // Convert client requests to calendar events
      clientRequests.forEach((request) => {
        const eventDate = request.date;
        const eventTime = request.time || '';
        
        // Create event ID from request ID
        const eventId = `client-request-${request.id}`;
        
        // Build start datetime
        let startDateTime: string;
        if (eventTime) {
          const [hours, minutes] = eventTime.split(':');
          if (hours && minutes) {
            const localDate = new Date(`${eventDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
            startDateTime = localDate.toISOString();
          } else {
            startDateTime = eventDate;
          }
        } else {
          startDateTime = eventDate;
        }
        
        clientEvents.push({
          id: eventId,
          title: request.title,
          description: request.description,
          start: startDateTime,
          allDay: !eventTime,
          location: request.location,
          extendedProps: {
            isClientRequest: true,
            requestId: request.id,
            status: request.status,
          },
        });
      });
      
      setCurrentEvents(clientEvents);
      
      // Don't load or display availability events to clients
      // Availability is only used to block requests, not to display
      setAvailabilityEvents([]);
    }
  };

  const handleDateClick = (selectInfo: DateSelectArg) => {
    // Format date as YYYY-MM-DD
    const dateStr = selectInfo.startStr.split('T')[0];
    
    // Check if date is available
    const availability = getClientAvailability();
    const dateAvailability = availability.find(a => a.date === dateStr);
    
    // Only allow request if date is available (or not set)
    // This is hidden from clients - they just get a message if date is unavailable
    if (dateAvailability && !dateAvailability.available) {
      alert('This date is not available for requests. Please select another date.');
      return;
    }
    
    setSelectedDate(dateStr);
    setEditingRequest(null);
    setIsRequestFormOpen(true);
  };

  const handleEventClick = (info: any) => {
    const event = currentEvents.find((e) => e.id === info.event.id);
    if (event && event.extendedProps?.isClientRequest) {
      const requestId = event.extendedProps.requestId;
      if (requestId) {
        const request = getRequestById(requestId);
        if (request) {
          setSelectedRequest(request);
          setIsDetailsDialogOpen(true);
        }
      }
    }
  };

  const handleEdit = (request: ClientRequest) => {
    setEditingRequest(request);
    setIsDetailsDialogOpen(false);
    setSelectedDate(request.date);
    setIsRequestFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedRequest) {
      deleteRequest(selectedRequest.id);
      loadData();
      setIsDetailsDialogOpen(false);
      setSelectedRequest(null);
    }
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
        <div className="mb-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Click dates to set your request</p>
        </div>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          events={currentEvents}
          select={handleDateClick}
          eventClick={handleEventClick}
          eventClassNames={(arg) => {
            const isTask = arg.event.extendedProps.task;
            return isTask ? 'task-event' : 'calendar-event';
          }}
        />
      </div>

      <ClientRequestForm
        open={isRequestFormOpen}
        onOpenChange={(open) => {
          setIsRequestFormOpen(open);
          if (!open) {
            setEditingRequest(null);
            setSelectedDate('');
          }
        }}
        selectedDate={selectedDate}
        editingRequest={editingRequest}
        onSuccess={() => {
          // Reload client requests
          loadData();
          setEditingRequest(null);
        }}
      />

      <RequestDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        request={selectedRequest}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={selectedRequest?.status === 'pending'}
        canDelete={selectedRequest?.status === 'pending'}
      />
    </>
  );
};

export default ClientCalendar;

