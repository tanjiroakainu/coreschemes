import { useState, useEffect } from 'react';
import { DateSelectArg, EventInput } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getRequestsByStatus, ClientRequest, createAssignment, getCurrentUser, getStaffers } from '@/lib/storage';
import SendInviteDialog, { InviteDetails } from '@/components/executive/SendInviteDialog';

export default function EditorInChiefCalendar() {
  const [currentEvents, setCurrentEvents] = useState<EventInput[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ClientRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('requestUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('requestUpdated', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    // Load events
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        setCurrentEvents(JSON.parse(savedEvents));
      }
    }
    
    // Load approved requests
    const requests = getRequestsByStatus('approved');
    setApprovedRequests(requests);
    
    // Load current user
    const user = getCurrentUser();
    setCurrentUser(user);
  };

  const handleDateClick = (_selectInfo: DateSelectArg) => {
    // Executives can assign tasks by clicking dates
    // Show approved requests that can be assigned
    if (approvedRequests.length > 0) {
      // For now, show the first available request
      // In a real system, you'd show a dialog to select which request
      setSelectedRequest(approvedRequests[0]);
      setIsInviteDialogOpen(true);
    }
  };

  const handleEventClick = (info: any) => {
    // Show event details or assignment options
    const event = currentEvents.find((e) => e.id === info.event.id);
    if (event) {
      // Check if this event is linked to a request
      const requestId = (event.extendedProps as any)?.requestId;
      if (requestId) {
        const request = approvedRequests.find(r => r.id === requestId);
        if (request) {
          setSelectedRequest(request);
          setIsInviteDialogOpen(true);
        }
      }
    }
  };

  const handleInviteSend = ({ stafferIds, notes, location }: InviteDetails) => {
    if (!selectedRequest || !currentUser) return;
    
    const staffers = getStaffers();
    
    stafferIds.forEach(stafferId => {
      const staffer = staffers.find(s => s.id === stafferId);
      if (staffer) {
        createAssignment({
          requestId: selectedRequest.id,
          assignedTo: staffer.id,
          assignedToId: staffer.id,
          assignedToEmail: staffer.email,
          assignedToName: `${staffer.firstName} ${staffer.lastName}`,
          section: staffer.section,
          assignedBy: currentUser.name || 'Executive',
          status: 'pending',
          notes: notes || undefined,
          taskLocation: location || undefined,
        });
      }
    });
    
    loadData();
    setSelectedRequest(null);
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
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            Click dates to assign tasks to your team members
          </p>
        </div>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="dayGridMonth"
          editable={true}
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

      <SendInviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        requestId={selectedRequest?.id || ''}
        onSend={handleInviteSend}
      />
    </>
  );
}
