import { useState, useEffect, useRef } from 'react';
import { DateSelectArg, EventInput } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import EventDialogue from './AdminCalendarDialog';
import PreviewPanel from './PreviewPanel';
import EventDetailsDialog from './EventDetailsDialog';
import { getCurrentUser, createAssignment, getStaffers, getAssignments, updateAssignment, deleteAssignment } from '@/lib/storage';

const Calendar = () => {
  const [currentEvents, setCurrentEvents] = useState<EventInput[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [editEvent, setEditEvent] = useState<EventInput | null>(null);

  // Helper function to validate and clean events
  const validateAndCleanEvents = (events: EventInput[]): EventInput[] => {
    const seenIds = new Set<string>();
    const seenEvents = new Map<string, EventInput>();
    
    return events.filter((event: EventInput) => {
      // Must have an ID and start date
      if (!event.id || !event.start) {
        console.warn('Event missing ID or start date, removing:', event);
        return false;
      }
      
      // Check for duplicate IDs
      if (seenIds.has(event.id)) {
        console.warn('Duplicate event ID found, removing:', event.id);
        return false;
      }
      seenIds.add(event.id);
      
      // Validate start date
      const startDate = new Date(event.start as string | number | Date);
      if (isNaN(startDate.getTime())) {
        console.warn('Invalid start date, removing event:', event.id);
        return false;
      }
      
      // Validate end date if provided
      if (event.end) {
        const endDate = new Date(event.end as string | number | Date);
        if (isNaN(endDate.getTime())) {
          console.warn('Invalid end date, removing event:', event.id);
          return false;
        }
        // End date should be after or equal to start date
        if (endDate < startDate) {
          console.warn('End date before start date, will fix during normalization:', event.id);
        }
      }
      
      // Check for duplicate events (same date, title, staffer)
      const eventKey = `${event.start}-${event.title}-${(event as any).stafferId || ''}`;
      if (seenEvents.has(eventKey)) {
        console.warn('Duplicate event content found, removing:', event.id);
        return false;
      }
      seenEvents.set(eventKey, event);
      
      return true;
    }).map((event: EventInput) => {
      // Normalize event dates to ensure proper format
      const startDate = new Date(event.start as string | number | Date);
      
      let normalizedStart: string;
      let normalizedEnd: string;
      
      if (event.allDay) {
        // All-day events: use date-only format (YYYY-MM-DD)
        normalizedStart = startDate.toISOString().split('T')[0];
        
        if (event.end) {
          const endDate = new Date(event.end as string);
          normalizedEnd = endDate.toISOString().split('T')[0];
          // Ensure end is after start for all-day events
          if (normalizedEnd <= normalizedStart) {
            const nextDay = new Date(startDate);
            nextDay.setDate(nextDay.getDate() + 1);
            normalizedEnd = nextDay.toISOString().split('T')[0];
          }
        } else {
          // For all-day events without end, set end to next day
          const nextDay = new Date(startDate);
          nextDay.setDate(nextDay.getDate() + 1);
          normalizedEnd = nextDay.toISOString().split('T')[0];
        }
      } else {
        // Timed events: use full ISO datetime
        normalizedStart = startDate.toISOString();
        
        if (event.end) {
          const endDate = new Date(event.end as string);
          normalizedEnd = endDate.toISOString();
          // Ensure end is after or equal to start
          if (endDate < startDate) {
            normalizedEnd = normalizedStart;
          }
        } else {
          // If no end time, use start time
          normalizedEnd = normalizedStart;
        }
      }
      
      return {
        ...event,
        start: normalizedStart,
        end: normalizedEnd,
      };
    });
  };

  // Load saved events from localStorage and validate/clean them
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        try {
          const parsed = JSON.parse(savedEvents);
          // Validate and clean events
          const validEvents = validateAndCleanEvents(parsed);
          setCurrentEvents(validEvents);
          // Save cleaned events back if any were removed or modified
          if (validEvents.length !== parsed.length || JSON.stringify(validEvents) !== savedEvents) {
            localStorage.setItem('events', JSON.stringify(validEvents));
          }
        } catch (e) {
          console.error('Error parsing events:', e);
          // Clear corrupted events
          localStorage.removeItem('events');
          setCurrentEvents([]);
        }
      }
    }
  }, []); // Only run once on mount

  // Listen for storage changes (from other tabs/windows only)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle storage events from other tabs/windows
      if (e.key === 'events' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const validEvents = validateAndCleanEvents(parsed);
          setCurrentEvents(validEvents);
        } catch (error) {
          console.error('Error parsing events from storage:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Only set up listener once

  // Persist to localStorage on change (only when events actually change)
  const prevEventsRef = useRef<string>('');
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Skip on initial mount
    }
    
    if (typeof window !== 'undefined' && currentEvents.length >= 0) {
      // Clean and validate events before saving
      const cleanedEvents = validateAndCleanEvents(currentEvents);
      const eventsString = JSON.stringify(cleanedEvents);
      
      // Only save if events actually changed
      if (prevEventsRef.current !== eventsString) {
        prevEventsRef.current = eventsString;
        localStorage.setItem('events', eventsString);
        
        // Update state if cleaning removed any events
        if (cleanedEvents.length !== currentEvents.length) {
          setCurrentEvents(cleanedEvents);
        }
      }
    }
  }, [currentEvents]);

  const handleDateClick = (selectInfo: DateSelectArg) => {
    // Ensure we have a valid date selection
    if (!selectInfo.startStr) {
      console.error('Invalid date selection:', selectInfo);
      return;
    }
    setSelectedDate(selectInfo);
    setEditEvent(null);
    setIsDialogOpen(true);
  };

  const handleEventClick = (info: any) => {
    const event = currentEvents.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsEventDetailsOpen(true);
    }
  };

  const handleEventDrop = (info: any) => {
    const updatedEvents = currentEvents.map((event) =>
      event.id === info.event.id
        ? {
            ...event,
            start: info.event.startStr,
            end: info.event.endStr,
          }
        : event
    );
    setCurrentEvents(updatedEvents);
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
        <div className="w-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: '',
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateClick}
            events={currentEvents}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            eventClassNames={getEventClassNames}
            height="auto"
          />
        </div>

        <PreviewPanel
          events={currentEvents}
          onDelete={(id) => {
            // Find the event being deleted
            const eventToDelete = currentEvents.find(e => e.id === id);
            
            // Delete associated assignment if it exists
            if (eventToDelete) {
              const assignmentId = (eventToDelete as any).assignmentId;
              if (assignmentId) {
                try {
                  deleteAssignment(assignmentId);
                } catch (error) {
                  console.error('Error deleting assignment:', error);
                }
              } else {
                // Try to find assignment by matching event details
                const assignments = getAssignments();
                const eventTitle = (eventToDelete.title as string)?.replace(/\s*\([^)]*\)/, '') || '';
                const eventDate = eventToDelete.start ? new Date(eventToDelete.start as string).toISOString().split('T')[0] : '';
                const stafferId = (eventToDelete as any).stafferId;
                
                if (eventTitle && eventDate && stafferId) {
                  const matchingAssignment = assignments.find(a => 
                    a.taskTitle === eventTitle &&
                    a.taskDate === eventDate &&
                    (a.assignedToId === stafferId || a.assignedToEmail === stafferId)
                  );
                  
                  if (matchingAssignment) {
                    try {
                      deleteAssignment(matchingAssignment.id);
                    } catch (error) {
                      console.error('Error deleting assignment:', error);
                    }
                  }
                }
              }
            }
            
            setCurrentEvents((prev) => prev.filter((event) => event.id !== id));
          }}
          onEdit={(event) => {
            setSelectedDate({
              startStr: event.start as string,
              endStr: event.end as string,
              allDay: event.allDay ?? false,
              start: new Date(event.start as string),
              end: new Date(event.end as string),
              view: calendarRef.current?.getApi().view!,
              jsEvent: {} as any,
            });
            setEditEvent(event);
            setIsDialogOpen(true);
          }}
          onAddEvent={() => {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            setSelectedDate({
              startStr: dateStr,
              endStr: dateStr,
              allDay: false,
              start: today,
              end: today,
              view: calendarRef.current?.getApi().view!,
              jsEvent: {} as any,
            });
            setEditEvent(null);
            setIsDialogOpen(true);
          }}
        />
      </div>

      <EventDialogue
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedDate={selectedDate}
        editEvent={editEvent}
        onAddEvent={(data) => {
          if (!selectedDate) return;

          const isEditing = !!editEvent;
          const eventId = isEditing
            ? editEvent!.id
            : `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Use the date from the form, or fall back to selected date
          // Parse the selected date properly
          let selectedDateStr: string;
          if (selectedDate.startStr) {
            selectedDateStr = selectedDate.startStr.includes('T') 
              ? selectedDate.startStr.split('T')[0] 
              : selectedDate.startStr;
          } else {
            // Fallback to current date if startStr is not available
            selectedDateStr = new Date().toISOString().split('T')[0];
          }
          
          // Use form date if provided and valid, otherwise use selected date
          const dateStr = (data.date && data.date.trim() !== '') ? data.date : selectedDateStr;
          
          // Validate date format (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            console.error('Invalid date format:', dateStr);
            return;
          }
          
          const startTime = (data.startTime || '').trim();
          const endTime = (data.endTime || startTime).trim();
          
          // Build proper ISO date-time strings
          let startDateTime: string;
          let endDateTime: string;
          let isAllDay = false;
          
          if (startTime && startTime !== '') {
            // If time is provided, create datetime string in local timezone
            const [hours, minutes] = startTime.split(':');
            if (!hours || !minutes || isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) {
              console.error('Invalid time format:', startTime);
              alert('Invalid time format. Please use HH:MM format.');
              return;
            }
            
            // Create date object in local timezone, then convert to ISO
            const localDate = new Date(`${dateStr}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
            startDateTime = localDate.toISOString();
            
            if (endTime && endTime !== '' && endTime !== startTime) {
              const [endHours, endMins] = endTime.split(':');
              if (endHours && endMins && !isNaN(parseInt(endHours)) && !isNaN(parseInt(endMins))) {
                const localEndDate = new Date(`${dateStr}T${endHours.padStart(2, '0')}:${endMins.padStart(2, '0')}:00`);
                endDateTime = localEndDate.toISOString();
              } else {
                endDateTime = startDateTime;
              }
            } else {
              endDateTime = startDateTime;
            }
            isAllDay = false;
          } else {
            // If no time, use date only (all-day event)
            // For all-day events, FullCalendar expects YYYY-MM-DD format
            startDateTime = dateStr;
            // For all-day events, end should be the next day (exclusive end)
            const endDate = new Date(dateStr + 'T00:00:00');
            endDate.setDate(endDate.getDate() + 1);
            endDateTime = endDate.toISOString().split('T')[0];
            isAllDay = true;
          }

          // Validate the dates are valid
          const startDate = new Date(startDateTime);
          const endDateObj = new Date(endDateTime);
          if (isNaN(startDate.getTime()) || isNaN(endDateObj.getTime())) {
            console.error('Invalid date created:', { startDateTime, endDateTime, dateStr, startTime, endTime });
            alert('Invalid date or time. Please check your input.');
            return;
          }
          
          // Ensure end is not before start
          if (endDateObj < startDate) {
            console.error('End date before start date:', { startDateTime, endDateTime });
            endDateTime = startDateTime; // Fix by making end equal to start
          }
          
          // For timed events, ensure end is on the same day or later
          if (!isAllDay) {
            const startDay = startDate.toISOString().split('T')[0];
            const endDay = endDateObj.toISOString().split('T')[0];
            if (endDay < startDay) {
              console.warn('End date is on a different day, adjusting to same day');
              endDateTime = startDateTime;
            }
          }

          const newEvent: EventInput = {
            id: eventId,
            title: data.title,
            description: data.description,
            location: data.location,
            start: startDateTime,
            end: endDateTime,
            allDay: isAllDay,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            staffer: data.staffer,
            stafferId: data.stafferId,
            stafferName: data.stafferName,
            contact: data.contact,
            assignedBy: data.assignedBy,
            assignedByName: data.assignedByName,
            assignedByRole: data.assignedByRole,
          };
          
          console.log('Creating new event:', {
            id: newEvent.id,
            title: newEvent.title,
            start: newEvent.start,
            end: newEvent.end,
            allDay: newEvent.allDay,
            dateStr,
            startTime,
            endTime
          });

          // Handle assignment creation/update before updating events
          if (data.stafferId && data.stafferName) {
            const staffers = getStaffers();
            const staffer = staffers.find(s => s.id === data.stafferId || s.email === data.stafferId);
            const currentUser = getCurrentUser();
            
            if (staffer) {
              try {
                if (isEditing) {
                  // Find and update existing assignment
                  const assignments = getAssignments();
                  // First try to find by assignmentId stored in event
                  let existingAssignment = null;
                  if ((editEvent as any)?.assignmentId) {
                    existingAssignment = assignments.find(a => a.id === (editEvent as any).assignmentId);
                  }
                  // If not found, try to find by matching event details
                  if (!existingAssignment) {
                    const eventTitle = (editEvent?.title as string)?.replace(/\s*\([^)]*\)/, '') || '';
                    const eventDate = editEvent.start ? new Date(editEvent.start as string).toISOString().split('T')[0] : '';
                    const eventStafferId = (editEvent as any)?.stafferId;
                    
                    existingAssignment = assignments.find(a => 
                      a.taskTitle === eventTitle &&
                      a.taskDate === eventDate &&
                      (a.assignedToId === eventStafferId || a.assignedToEmail === eventStafferId || 
                       a.assignedToId === staffer.id || a.assignedToEmail === staffer.email)
                    );
                  }
                  
                  if (existingAssignment) {
                    updateAssignment(existingAssignment.id, {
                      assignedTo: staffer.id,
                      assignedToId: staffer.id,
                      assignedToEmail: staffer.email,
                      assignedToName: data.stafferName,
                      section: staffer.section,
                      taskTitle: data.title,
                      taskDate: dateStr,
                      taskTime: startTime || undefined,
                      notes: data.description || undefined,
                      taskLocation: data.location || undefined,
                    });
                    // Store assignment ID in event
                    (newEvent as any).assignmentId = existingAssignment.id;
                  }
                } else {
                  // Create new assignment
                  const assignment = createAssignment({
                    assignedTo: staffer.id,
                    assignedToId: staffer.id,
                    assignedToEmail: staffer.email,
                    assignedToName: data.stafferName,
                    section: staffer.section,
                    assignedBy: data.assignedByName || currentUser?.name || 'Admin',
                    assignedByEmail: currentUser?.email,
                    status: 'pending',
                    taskTitle: data.title,
                    taskDate: dateStr,
                    taskTime: startTime || undefined,
                    notes: data.description || undefined,
                    taskLocation: data.location || undefined,
                  });
                  // Store assignment ID in event
                  (newEvent as any).assignmentId = assignment.id;
                }
              } catch (error) {
                console.error('Error handling assignment from event:', error);
              }
            }
          }

          setCurrentEvents((prev) => {
            if (isEditing) {
              // When editing, preserve assignmentId if it exists
              const oldEvent = prev.find(e => e.id === eventId);
              if (oldEvent && (oldEvent as any).assignmentId && !(newEvent as any).assignmentId) {
                (newEvent as any).assignmentId = (oldEvent as any).assignmentId;
              }
              return prev.map((event) => (event.id === eventId ? newEvent : event));
            } else {
              // Check for duplicates before adding (by ID and by date/title)
              const existsById = prev.some(e => e.id === eventId);
              const existsByContent = prev.some(e => 
                e.start === newEvent.start && 
                e.title === newEvent.title &&
                (e as any).stafferId === (newEvent as any).stafferId
              );
              
              if (existsById) {
                console.warn('Event with this ID already exists:', eventId);
                return prev;
              }
              
              if (existsByContent) {
                console.warn('Duplicate event detected (same date, title, and staffer)');
                return prev;
              }
              
              return [...prev, newEvent];
            }
          });
        }}
        onAddTask={(task) => {
          if (!selectedDate) return;

          const isEditing = !!editEvent;
          const taskId = isEditing
            ? editEvent!.id
            : `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Use the date from the form, or fall back to selected date
          // Parse the selected date properly
          let selectedDateStr: string;
          if (selectedDate.startStr) {
            selectedDateStr = selectedDate.startStr.includes('T') 
              ? selectedDate.startStr.split('T')[0] 
              : selectedDate.startStr;
          } else {
            // Fallback to current date if startStr is not available
            selectedDateStr = new Date().toISOString().split('T')[0];
          }
          
          // Use form date if provided and valid, otherwise use selected date
          const dateStr = (task.date && task.date.trim() !== '') ? task.date : selectedDateStr;
          
          // Validate date format (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            console.error('Invalid date format:', dateStr);
            return;
          }
          
          const startTime = (task.startTime || '').trim();
          const endTime = (task.endTime || startTime).trim();
          
          // Build proper ISO date-time strings
          let startDateTime: string;
          let endDateTime: string;
          let isAllDay = false;
          
          if (startTime && startTime !== '') {
            // If time is provided, create datetime string in local timezone
            const [hours, minutes] = startTime.split(':');
            if (!hours || !minutes || isNaN(parseInt(hours)) || isNaN(parseInt(minutes))) {
              console.error('Invalid time format:', startTime);
              alert('Invalid time format. Please use HH:MM format.');
              return;
            }
            
            // Create date object in local timezone, then convert to ISO
            const localDate = new Date(`${dateStr}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
            startDateTime = localDate.toISOString();
            
            if (endTime && endTime !== '' && endTime !== startTime) {
              const [endHours, endMins] = endTime.split(':');
              if (endHours && endMins && !isNaN(parseInt(endHours)) && !isNaN(parseInt(endMins))) {
                const localEndDate = new Date(`${dateStr}T${endHours.padStart(2, '0')}:${endMins.padStart(2, '0')}:00`);
                endDateTime = localEndDate.toISOString();
              } else {
                endDateTime = startDateTime;
              }
            } else {
              endDateTime = startDateTime;
            }
            isAllDay = false;
          } else {
            // If no time, use date only (all-day event)
            // For all-day events, FullCalendar expects YYYY-MM-DD format
            startDateTime = dateStr;
            // For all-day events, end should be the next day (exclusive end)
            const endDate = new Date(dateStr + 'T00:00:00');
            endDate.setDate(endDate.getDate() + 1);
            endDateTime = endDate.toISOString().split('T')[0];
            isAllDay = true;
          }

          // Validate the dates are valid
          const startDate = new Date(startDateTime);
          const endDateObj = new Date(endDateTime);
          if (isNaN(startDate.getTime()) || isNaN(endDateObj.getTime())) {
            console.error('Invalid date created:', { startDateTime, endDateTime, dateStr, startTime, endTime });
            alert('Invalid date or time. Please check your input.');
            return;
          }
          
          // Ensure end is not before start
          if (endDateObj < startDate) {
            console.error('End date before start date:', { startDateTime, endDateTime });
            endDateTime = startDateTime; // Fix by making end equal to start
          }
          
          // For timed events, ensure end is on the same day or later
          if (!isAllDay) {
            const startDay = startDate.toISOString().split('T')[0];
            const endDay = endDateObj.toISOString().split('T')[0];
            if (endDay < startDay) {
              console.warn('End date is on a different day, adjusting to same day');
              endDateTime = startDateTime;
            }
          }

          const newTask: EventInput = {
            id: taskId,
            title: task.title,
            description: task.description,
            location: task.location,
            start: startDateTime,
            end: endDateTime,
            allDay: isAllDay,
            task: true,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            staffer: task.staffer,
            stafferId: task.stafferId,
            stafferName: task.stafferName,
            contact: task.contact,
            assignedBy: task.assignedBy,
            assignedByName: task.assignedByName,
            assignedByRole: task.assignedByRole,
          };

          // Handle assignment creation/update before updating events
          if (task.stafferId && task.stafferName) {
            const staffers = getStaffers();
            const staffer = staffers.find(s => s.id === task.stafferId || s.email === task.stafferId);
            const currentUser = getCurrentUser();
            
            if (staffer) {
              try {
                if (isEditing) {
                  // Find and update existing assignment
                  const assignments = getAssignments();
                  // First try to find by assignmentId stored in event
                  let existingAssignment = null;
                  if ((editEvent as any)?.assignmentId) {
                    existingAssignment = assignments.find(a => a.id === (editEvent as any).assignmentId);
                  }
                  // If not found, try to find by matching event details
                  if (!existingAssignment) {
                    const eventTitle = (editEvent?.title as string)?.replace(/\s*\([^)]*\)/, '') || '';
                    const eventDate = editEvent.start ? new Date(editEvent.start as string).toISOString().split('T')[0] : '';
                    const eventStafferId = (editEvent as any)?.stafferId;
                    
                    existingAssignment = assignments.find(a => 
                      a.taskTitle === eventTitle &&
                      a.taskDate === eventDate &&
                      (a.assignedToId === eventStafferId || a.assignedToEmail === eventStafferId ||
                       a.assignedToId === staffer.id || a.assignedToEmail === staffer.email)
                    );
                  }
                  
                  if (existingAssignment) {
                    updateAssignment(existingAssignment.id, {
                      assignedTo: staffer.id,
                      assignedToId: staffer.id,
                      assignedToEmail: staffer.email,
                      assignedToName: task.stafferName,
                      section: staffer.section,
                      taskTitle: task.title,
                      taskDate: dateStr,
                      taskTime: startTime || undefined,
                      notes: task.description || undefined,
                      taskLocation: task.location || undefined,
                    });
                    // Store assignment ID in task
                    (newTask as any).assignmentId = existingAssignment.id;
                  }
                } else {
                  // Create new assignment
                  const assignment = createAssignment({
                    assignedTo: staffer.id,
                    assignedToId: staffer.id,
                    assignedToEmail: staffer.email,
                    assignedToName: task.stafferName,
                    section: staffer.section,
                    assignedBy: task.assignedByName || currentUser?.name || 'Admin',
                    assignedByEmail: currentUser?.email,
                    status: 'pending',
                    taskTitle: task.title,
                    taskDate: dateStr,
                    taskTime: startTime || undefined,
                    notes: task.description || undefined,
                    taskLocation: task.location || undefined,
                  });
                  // Store assignment ID in task
                  (newTask as any).assignmentId = assignment.id;
                }
              } catch (error) {
                console.error('Error handling assignment from task:', error);
              }
            }
          }

          setCurrentEvents((prev) => {
            if (isEditing) {
              // When editing, preserve assignmentId if it exists
              const oldTask = prev.find(e => e.id === taskId);
              if (oldTask && (oldTask as any).assignmentId && !(newTask as any).assignmentId) {
                (newTask as any).assignmentId = (oldTask as any).assignmentId;
              }
              return prev.map((event) => (event.id === taskId ? newTask : event));
            } else {
              // Check for duplicates before adding (by ID and by date/title)
              const existsById = prev.some(e => e.id === taskId);
              const existsByContent = prev.some(e => 
                e.start === newTask.start && 
                e.title === newTask.title &&
                (e as any).stafferId === (newTask as any).stafferId
              );
              
              if (existsById) {
                console.warn('Task with this ID already exists:', taskId);
                return prev;
              }
              
              if (existsByContent) {
                console.warn('Duplicate task detected (same date, title, and staffer)');
                return prev;
              }
              
              return [...prev, newTask];
            }
          });
        }}
      />

      <EventDetailsDialog
        isOpen={isEventDetailsOpen}
        onClose={() => {
          setIsEventDetailsOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={(event) => {
          setIsEventDetailsOpen(false);
          setSelectedDate({
            startStr: event.start as string,
            endStr: event.end as string,
            allDay: event.allDay ?? false,
            start: new Date(event.start as string),
            end: new Date(event.end as string),
            view: calendarRef.current?.getApi().view!,
            jsEvent: {} as any,
          });
          setEditEvent(event);
          setIsDialogOpen(true);
        }}
        onDelete={(id) => {
          // Find the event being deleted
          const eventToDelete = currentEvents.find(e => e.id === id);
          
          // Delete associated assignment if it exists
          if (eventToDelete) {
            const assignmentId = (eventToDelete as any).assignmentId;
            if (assignmentId) {
              try {
                deleteAssignment(assignmentId);
              } catch (error) {
                console.error('Error deleting assignment:', error);
              }
            } else {
              // Try to find assignment by matching event details
              const assignments = getAssignments();
              const eventTitle = (eventToDelete.title as string)?.replace(/\s*\([^)]*\)/, '') || '';
              const eventDate = eventToDelete.start ? new Date(eventToDelete.start as string).toISOString().split('T')[0] : '';
              const stafferId = (eventToDelete as any).stafferId;
              
              if (eventTitle && eventDate && stafferId) {
                const matchingAssignment = assignments.find(a => 
                  a.taskTitle === eventTitle &&
                  a.taskDate === eventDate &&
                  (a.assignedToId === stafferId || a.assignedToEmail === stafferId)
                );
                
                if (matchingAssignment) {
                  try {
                    deleteAssignment(matchingAssignment.id);
                  } catch (error) {
                    console.error('Error deleting assignment:', error);
                  }
                }
              }
            }
          }
          
          setCurrentEvents((prev) => prev.filter((event) => event.id !== id));
          setIsEventDetailsOpen(false);
          setSelectedEvent(null);
        }}
      />
    </>
  );
};

export default Calendar;
