import { useState, useEffect, useRef } from 'react';
import { DateSelectArg, EventInput } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getClientAvailability, setClientAvailability, deleteClientAvailability, ClientAvailability, getRequests, ClientRequest } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RequestDetailsDialog from '@/components/client/RequestDetailsDialog';

interface AvailabilityFormProps {
  existingAvailability: ClientAvailability | null;
  onSave: (available: boolean, notes?: string) => void;
  onDelete: () => void;
  onClose: () => void;
  onViewRequests?: () => void;
  requestCount?: number;
}

const AvailabilityForm = ({ existingAvailability, onSave, onDelete, onClose, onViewRequests, requestCount = 0 }: AvailabilityFormProps) => {
  const [available, setAvailable] = useState<boolean>(existingAvailability?.available ?? true);
  const [notes, setNotes] = useState<string>(existingAvailability?.notes || '');

  useEffect(() => {
    if (existingAvailability) {
      setAvailable(existingAvailability.available);
      setNotes(existingAvailability.notes || '');
    } else {
      setAvailable(true);
      setNotes('');
    }
  }, [existingAvailability]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(available, notes.trim() || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {requestCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This date has {requestCount} client request{requestCount > 1 ? 's' : ''}. 
                {!available && existingAvailability && (
                  <span className="block mt-1 text-red-700">
                    Setting this date as "Not Available" will prevent clients from submitting new requests on this date.
                  </span>
                )}
              </p>
            </div>
            {onViewRequests && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewRequests}
                className="ml-2 bg-white hover:bg-blue-100 text-blue-700 border-blue-300"
              >
                View Requests
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-2">Availability Status *</label>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setAvailable(true)}
            className={`flex-1 ${available ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            <span className="mr-2">✓</span> Available
          </Button>
          <Button
            type="button"
            onClick={() => setAvailable(false)}
            className={`flex-1 ${!available ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            <span className="mr-2">🚫</span> Not Available
          </Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Add any notes about this availability..."
        />
      </div>

      <div className="flex justify-between gap-2 pt-4 border-t">
        {existingAvailability && (
          <Button
            type="button"
            onClick={onDelete}
            variant="destructive"
          >
            Remove Setting
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit">
            Save
          </Button>
        </div>
      </div>
    </form>
  );
};

const ClientAvailabilityCalendar = () => {
  const [availability, setAvailability] = useState<ClientAvailability[]>([]);
  const [currentEvents, setCurrentEvents] = useState<EventInput[]>([]);
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
    
    // Get all client requests to show which dates have requests
    const allRequests = getRequests();
    
    // Group requests by date
    const requestsByDate = new Map<string, number>();
    allRequests.forEach((request) => {
      const dateStr = request.date;
      requestsByDate.set(dateStr, (requestsByDate.get(dateStr) || 0) + 1);
    });
    
    // Convert availability to calendar events
    const events: EventInput[] = [];
    
    // Add availability events
    avail.forEach((item) => {
      const requestCount = requestsByDate.get(item.date) || 0;
      const title = item.available 
        ? (requestCount > 0 ? `✓ Available (${requestCount} request${requestCount > 1 ? 's' : ''})` : '✓ Available')
        : (requestCount > 0 ? `🚫 Not Available (${requestCount} request${requestCount > 1 ? 's' : ''})` : '🚫 Not Available');
      
      events.push({
        id: `availability-${item.date}`,
        title: title,
        start: item.date,
        allDay: true,
        backgroundColor: item.available ? '#10b981' : '#ef4444',
        borderColor: item.available ? '#10b981' : '#ef4444',
        textColor: '#ffffff',
        extendedProps: {
          isAvailability: true,
          available: item.available,
          notes: item.notes,
          requestCount: requestCount,
        },
      });
    });
    
    // Add client request events for dates without availability settings
    requestsByDate.forEach((count, dateStr) => {
      const hasAvailability = avail.some(a => a.date === dateStr);
      if (!hasAvailability) {
        // Date has requests but no availability setting
        events.push({
          id: `client-requests-${dateStr}`,
          title: `${count} Client Request${count > 1 ? 's' : ''}`,
          start: dateStr,
          allDay: true,
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          textColor: '#ffffff',
          extendedProps: {
            isClientRequest: true,
            requestCount: count,
          },
        });
      }
    });
    
    setCurrentEvents(events);
  };

  const handleDateClick = (selectInfo: DateSelectArg) => {
    const dateStr = selectInfo.startStr.split('T')[0];
    setSelectedDate(dateStr);
    
    // Get all requests for this date
    const allRequests = getRequests();
    const requestsForDate = allRequests.filter(req => req.date === dateStr);
    setDateRequests(requestsForDate);
    
    // Check if availability already exists for this date
    const existing = availability.find(a => a.date === dateStr);
    if (existing) {
      setSelectedAvailability(existing);
    } else {
      setSelectedAvailability(null);
    }
    
    setIsDialogOpen(true);
  };

  const handleEventClick = (info: any) => {
    const event = currentEvents.find((e) => e.id === info.event.id);
    if (event) {
      const dateStr = info.event.startStr?.split('T')[0] || '';
      if (dateStr) {
        // Get all requests for this date
        const allRequests = getRequests();
        const requestsForDate = allRequests.filter(req => req.date === dateStr);
        setDateRequests(requestsForDate);
        setSelectedDate(dateStr);
        
        // Check if availability already exists for this date
        const existing = availability.find(a => a.date === dateStr);
        if (existing) {
          setSelectedAvailability(existing);
        } else {
          setSelectedAvailability(null);
        }
        
        setIsDialogOpen(true);
      }
    }
  };

  const getRequestCountForDate = (dateStr: string): number => {
    const allRequests = getRequests();
    return allRequests.filter(req => req.date === dateStr).length;
  };

  const handleSaveAvailability = (available: boolean, notes?: string) => {
    if (!selectedDate) return;
    
    setClientAvailability(selectedDate, available, notes);
    loadAvailability();
    setIsDialogOpen(false);
    setSelectedDate(null);
    setSelectedAvailability(null);
  };

  const handleDeleteAvailability = () => {
    if (!selectedDate) return;
    
    deleteClientAvailability(selectedDate);
    loadAvailability();
    setIsDialogOpen(false);
    setSelectedDate(null);
    setSelectedAvailability(null);
  };

  return (
    <>
      <style>{`
        .fc-header-toolbar {
          margin-bottom: 1rem;
        }
        .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .fc-daygrid-day {
          cursor: pointer;
        }
        .fc-daygrid-day:hover {
          background-color: #f3f4f6;
        }
      `}</style>

      <div className="px-4 md:px-10 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Availability Calendar</h1>
            <p className="text-sm text-gray-600 mt-1">
              Click on dates to set availability status for clients
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
              <span>indicates the office is available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">🚫</span>
              <span>indicates the office is not available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">📅</span>
              <span>indicates client requests on this date</span>
            </div>
          </div>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: '',
            }}
            initialView="dayGridMonth"
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateClick}
            eventClick={handleEventClick}
            events={currentEvents}
            height="auto"
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAvailability ? 'Edit Availability' : 'Set Availability'}
            </DialogTitle>
            <DialogDescription>
              Set the availability status for {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'this date'}
            </DialogDescription>
          </DialogHeader>

          <AvailabilityForm
            existingAvailability={selectedAvailability}
            requestCount={selectedDate ? getRequestCountForDate(selectedDate) : 0}
            onSave={(available, notes) => {
              handleSaveAvailability(available, notes);
            }}
            onDelete={handleDeleteAvailability}
            onViewRequests={() => {
              setIsDialogOpen(false);
              setIsRequestsDialogOpen(true);
            }}
            onClose={() => {
              setIsDialogOpen(false);
              setSelectedDate(null);
              setSelectedAvailability(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Client Requests Dialog */}
      <Dialog open={isRequestsDialogOpen} onOpenChange={setIsRequestsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Client Requests for {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Selected Date'}
            </DialogTitle>
            <DialogDescription>
              {dateRequests.length > 0 
                ? `View details of ${dateRequests.length} client request${dateRequests.length > 1 ? 's' : ''}`
                : 'No requests found for this date'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {dateRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No client requests found for this date.
              </div>
            ) : (
              <div className="space-y-3">
                {dateRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsRequestDetailsOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{request.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                          <span>Client: {request.clientName || request.clientEmail || 'N/A'}</span>
                          <span>Time: {request.time || 'N/A'}</span>
                          <span>Location: {request.location || 'N/A'}</span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'denied'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsRequestsDialogOpen(false);
                setSelectedDate(null);
                setDateRequests([]);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <RequestDetailsDialog
        open={isRequestDetailsOpen}
        onOpenChange={setIsRequestDetailsOpen}
        request={selectedRequest}
        canEdit={false}
        canDelete={false}
        customActions={
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsRequestDetailsOpen(false);
                setSelectedRequest(null);
              }}
            >
              Close
            </Button>
          </div>
        }
      />
    </>
  );
};

export default ClientAvailabilityCalendar;

