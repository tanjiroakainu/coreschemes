import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getClientAvailability, ClientAvailability, getRequests, ClientRequest } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RequestDetailsDialog from '@/components/client/RequestDetailsDialog';
import Footer from '@/components/shared/Footer';

const ExecutiveClientAvailabilityCalendar = () => {
  const [availability, setAvailability] = useState<ClientAvailability[]>([]);
  const [currentEvents, setCurrentEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRequestsDialogOpen, setIsRequestsDialogOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<ClientAvailability | null>(null);
  const [dateRequests, setDateRequests] = useState<ClientRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // Load availability data
  useEffect(() => {
    loadAvailability();
    
    const handleStorageChange = () => {
      loadAvailability();
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

  const loadAvailability = () => {
    const avail = getClientAvailability();
    setAvailability(avail);
    
    // Convert availability to calendar events
    const events = avail.map((item) => {
      const dateStr = item.date.split('T')[0];
      const requestCount = getRequestCountForDate(dateStr);
      
      return {
        id: item.date,
        title: item.available 
          ? `✓ Available${requestCount > 0 ? ` (${requestCount} request${requestCount > 1 ? 's' : ''})` : ''}`
          : `🚫 Not Available${requestCount > 0 ? ` (${requestCount} request${requestCount > 1 ? 's' : ''})` : ''}`,
        start: dateStr,
        allDay: true,
        backgroundColor: item.available ? '#10b981' : '#ef4444',
        borderColor: item.available ? '#10b981' : '#ef4444',
        textColor: '#ffffff',
        extendedProps: {
          available: item.available,
          notes: item.notes,
          requestCount,
        },
      };
    });
    
    setCurrentEvents(events);
  };

  const getRequestCountForDate = (dateStr: string): number => {
    const allRequests = getRequests();
    const normalizedDate = dateStr.split('T')[0];
    return allRequests.filter(req => {
      const reqDate = req.date.split('T')[0];
      return reqDate === normalizedDate;
    }).length;
  };

  const handleDateClick = (clickInfo: any) => {
    const dateStr = clickInfo.dateStr ? clickInfo.dateStr.split('T')[0] : clickInfo.startStr?.split('T')[0] || '';
    const avail = availability.find(a => a.date.split('T')[0] === dateStr);
    
    setSelectedDate(dateStr);
    setSelectedAvailability(avail || null);
    
    // Get requests for this date
    const allRequests = getRequests();
    const normalizedDate = dateStr;
    const requestsForDate = allRequests.filter(req => {
      const reqDate = req.date.split('T')[0];
      return reqDate === normalizedDate;
    });
    setDateRequests(requestsForDate);
    
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="px-4 md:px-10 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-600">Client Availability Calendar</h1>
          <p className="text-sm text-gray-500">Read-only view</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Legend:</strong>
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Not Available</span>
              </div>
            </div>
          </div>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            events={currentEvents}
            dateClick={handleDateClick}
            editable={false}
            selectable={true}
            selectMirror={false}
            dayMaxEvents={true}
            height="auto"
            eventDisplay="block"
            eventTextColor="#ffffff"
          />
        </div>
      </div>

      {/* View Details Dialog (Read-only) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Availability Details - {selectedDate ? formatDate(selectedDate) : ''}</DialogTitle>
            <DialogDescription>
              View availability status and client requests for this date (Read-only)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {dateRequests.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This date has {dateRequests.length} client request{dateRequests.length > 1 ? 's' : ''}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsRequestsDialogOpen(true);
                    }}
                    className="ml-2 px-3 py-1 text-sm bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded"
                  >
                    View Requests
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Availability Status</label>
              <div className="flex gap-2">
                <div
                  className={`flex-1 p-3 rounded-md ${
                    selectedAvailability?.available
                      ? 'bg-green-100 border-2 border-green-500'
                      : selectedAvailability
                      ? 'bg-red-100 border-2 border-red-500'
                      : 'bg-gray-100 border-2 border-gray-300'
                  }`}
                >
                  {selectedAvailability?.available ? (
                    <span className="text-green-800 font-semibold">✓ Available</span>
                  ) : selectedAvailability ? (
                    <span className="text-red-800 font-semibold">🚫 Not Available</span>
                  ) : (
                    <span className="text-gray-600">No availability setting</span>
                  )}
                </div>
              </div>
            </div>

            {selectedAvailability?.notes && (
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {selectedAvailability.notes}
                </div>
              </div>
            )}

            {!selectedAvailability && (
              <div className="text-sm text-gray-500 italic">
                No availability setting has been configured for this date.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedDate(null);
                  setSelectedAvailability(null);
                  setDateRequests([]);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Requests List Dialog */}
      <Dialog open={isRequestsDialogOpen} onOpenChange={setIsRequestsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Requests for {selectedDate ? formatDate(selectedDate) : ''}</DialogTitle>
            <DialogDescription>
              View all client requests for this date
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {dateRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No requests for this date</p>
            ) : (
              <div className="space-y-3">
                {dateRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsRequestDetailsOpen(true);
                      setIsRequestsDialogOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{request.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Client: {request.clientName || request.clientEmail || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: <span className={`font-semibold ${
                            request.status === 'approved' ? 'text-green-600' :
                            request.status === 'denied' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <RequestDetailsDialog
          open={isRequestDetailsOpen}
          onOpenChange={setIsRequestDetailsOpen}
          request={selectedRequest}
          canEdit={false}
          canDelete={false}
        />
      )}

      <Footer />
    </>
  );
};

export default ExecutiveClientAvailabilityCalendar;

