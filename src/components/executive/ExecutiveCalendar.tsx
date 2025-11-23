import { useState, useEffect } from 'react';
import { DateSelectArg, EventInput } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getRequests, ClientRequest, createAssignment, getCurrentUser, getTeamMembersByExecutive, getStaffers, getAssignments, createInvitation, updateAssignment, deleteAssignment, Assignment } from '@/lib/storage';
import SendInviteDialog, { InviteDetails } from '@/components/executive/SendInviteDialog';
import EventDetailsDialog from '@/components/admin/EventDetailsDialog';
import TeamTaskDialog, { TeamTaskFormData } from '@/components/executive/TeamTaskDialog';

interface ExecutiveCalendarProps {
  rolePath?: string;
}

export default function ExecutiveCalendar({ rolePath: _rolePath }: ExecutiveCalendarProps) {
  const [currentEvents, setCurrentEvents] = useState<EventInput[]>([]);
  const [allRequests, setAllRequests] = useState<ClientRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventInput | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('requestUpdated', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);
    window.addEventListener('eventUpdated', handleStorageChange); // Listen for admin calendar updates
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('requestUpdated', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
      window.removeEventListener('eventUpdated', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    // Load all requests (no restriction on status)
    const requests = getRequests();
    setAllRequests(requests);
    
    // Load current user
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Load team members
    if (user?.email) {
      const members = getTeamMembersByExecutive(user.email);
      const allStaffers = getStaffers();
      const teamStaffers = members.map(member => {
        const staffer = allStaffers.find(s => s.id === member.stafferId);
        return staffer;
      }).filter((s): s is any => s !== undefined);
      setTeamMembers(teamStaffers);
    }
    
    if (typeof window !== 'undefined' && user) {
      const allEvents: EventInput[] = [];
      
      // 1. Load events from admin calendar that are assigned to this executive
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        try {
          const adminEvents = JSON.parse(savedEvents);
          // Find staffer by email or ID
          const allStaffers = getStaffers();
          const staffer = allStaffers.find((s: any) => 
            s.email === user.email || s.id === user.id
          );
          const stafferId = staffer?.id || user.id || user.email;
          
          // Filter events assigned to this executive
          const assignedAdminEvents = adminEvents.filter((event: EventInput) => {
            const eventStafferId = (event as any).stafferId;
            return eventStafferId && eventStafferId === stafferId;
          }).map((event: EventInput) => ({
            ...event,
            extendedProps: {
              ...event.extendedProps,
              fromAdmin: true,
              assignedBy: (event as any).assignedByName || 'Admin',
            },
          }));
          
          allEvents.push(...assignedAdminEvents);
        } catch (e) {
          console.error('Error parsing admin events:', e);
        }
      }
      
      // 2. Load events from assignments (executive's own assignments to team members AND admin-assigned tasks to executive)
      if (user?.email) {
        const assignments = getAssignments();
        const teamMembers = getTeamMembersByExecutive(user.email);
        const teamMemberIds = teamMembers.map(m => m.stafferId);
        const executiveId = user.id || user.email;
        const allStaffers = getStaffers();
        const teamMemberTokenSet = new Set<string>();
        teamMemberIds.forEach(id => {
          if (id) {
            teamMemberTokenSet.add(id.toLowerCase());
          }
        });
        teamMembers.forEach(member => {
          const staffer = allStaffers.find(s => s.id === member.stafferId);
          if (staffer?.email) {
            teamMemberTokenSet.add(staffer.email.toLowerCase());
          }
        });
        const executiveTokenSet = new Set<string>();
        [executiveId, user.id, user.email].forEach(value => {
          if (value) {
            executiveTokenSet.add(value.toLowerCase());
          }
        });
        
        // Create events from all assignments for team members AND assignments assigned directly to executive
        const assignmentEvents: EventInput[] = assignments
          .filter((assignment) => {
            const recipients = [
              assignment.assignedTo,
              assignment.assignedToId,
              assignment.assignedToEmail,
            ]
              .filter((value): value is string => Boolean(value))
              .map((value) => value.toLowerCase());
            const matchesTeamMember = recipients.some((recipient) => teamMemberTokenSet.has(recipient));
            const matchesExecutive = recipients.some((recipient) => executiveTokenSet.has(recipient));
            return matchesTeamMember || matchesExecutive;
          })
          .map(assignment => {
            const request = assignment.requestId ? requests.find(r => r.id === assignment.requestId) : null;
            const startDate = assignment.taskDate
              ? assignment.taskTime
                ? `${assignment.taskDate}T${assignment.taskTime}`
                : assignment.taskDate
              : request?.date || new Date().toISOString();
            const isAdminAssigned = assignment.assignedBy === 'Admin' || 
                                   (assignment.assignedByEmail && assignment.assignedByEmail !== user.email);
            return {
              id: `assignment-${assignment.id}`,
              title: assignment.taskTitle || request?.title || 'Assignment',
              start: startDate,
              description: assignment.notes || request?.description || '',
              location: assignment.taskLocation || request?.location || '',
              extendedProps: {
                task: true,
                assignmentId: assignment.id,
                requestId: assignment.requestId,
                fromAdmin: isAdminAssigned,
                assignedBy: assignment.assignedBy || 'Admin',
                description: assignment.notes || request?.description || '',
                location: assignment.taskLocation || request?.location || '',
              },
            };
          });
        
        allEvents.push(...assignmentEvents);
      }
      
      setCurrentEvents(allEvents);
    }
  };

  const handleDateClick = (selectInfo: DateSelectArg) => {
    // Executives can assign tasks by clicking dates
    // No restriction - can create assignments directly without requests
    setSelectedDate(selectInfo);
    // Set selectedRequest to null to indicate we're creating a new assignment
    setSelectedRequest(null);
    setIsInviteDialogOpen(true);
  };

  const canManageAssignment = (assignment: Assignment | null): boolean => {
    if (!assignment || !currentUser) return false;
    
    const userEmail = currentUser.email?.toLowerCase();
    const assignedByEmail = assignment.assignedByEmail?.toLowerCase();
    const assignedBy = assignment.assignedBy;
    
    // Assignment is manageable if:
    // 1. It was assigned by this executive (check by email)
    // 2. OR it's a team task (no requestId) and not explicitly from Admin
    const isAssignedByMe = assignedByEmail === userEmail;
    const isTeamTask = !assignment.requestId;
    const isFromAdmin = assignedBy === 'Admin' || assignedBy === 'Admin/Executive';
    
    return isAssignedByMe || (isTeamTask && !isFromAdmin);
  };

  const handleEventClick = (info: any) => {
    // Show event details
    const event = currentEvents.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      
      // Check if this is a team assignment that can be edited
      const assignmentId = (event.extendedProps as any)?.assignmentId;
      if (assignmentId) {
        const assignments = getAssignments();
        const assignment = assignments.find(a => a.id === assignmentId);
        if (assignment && canManageAssignment(assignment)) {
          setEditingAssignment(assignment);
        }
      }
      
      setIsEventDetailsOpen(true);
      
      // If it's an assignment event, also set the request if available
      const requestId = (event.extendedProps as any)?.requestId;
      if (requestId) {
        const request = allRequests.find(r => r.id === requestId);
        if (request) {
          setSelectedRequest(request);
        }
      }
    }
  };

  const handleInviteSend = ({ stafferIds, notes, location }: InviteDetails) => {
    if (!currentUser) return;
    
    const staffers = getStaffers();
    const taskDate = selectedDate?.startStr || new Date().toISOString();
    const taskTitle = selectedRequest?.title || `Task on ${new Date(taskDate).toLocaleDateString()}`;
    
    stafferIds.forEach(stafferId => {
      const staffer = staffers.find(s => s.id === stafferId);
      if (staffer) {
        // Create assignment (with or without request)
        const assignment = createAssignment({
          requestId: selectedRequest?.id,
          assignedTo: staffer.id,
          assignedToId: staffer.id,
          assignedToEmail: staffer.email,
          assignedToName: `${staffer.firstName} ${staffer.lastName}`,
          section: staffer.section,
          assignedBy: currentUser.name || 'Executive',
          assignedByEmail: currentUser.email,
          taskDate: taskDate,
          taskTitle: taskTitle,
          notes: notes || undefined,
          taskLocation: location || undefined,
        });
        
        // Create invitation (only if there's a request)
        if (selectedRequest?.id) {
          createInvitation({
            assignmentId: assignment.id,
            requestId: selectedRequest.id,
            invitedTo: stafferId,
            invitedToName: `${staffer.firstName} ${staffer.lastName}`,
            invitedBy: currentUser.email || currentUser.id,
            invitedByName: currentUser.name || 'Executive',
            status: 'pending',
          });
        }
      }
    });
    
    loadData();
    setIsInviteDialogOpen(false);
    setSelectedRequest(null);
    setSelectedDate(null);
  };

  const handleEditAssignment = (event: EventInput) => {
    const assignmentId = (event.extendedProps as any)?.assignmentId;
    if (assignmentId) {
      const assignments = getAssignments();
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment && canManageAssignment(assignment)) {
        setEditingAssignment(assignment);
        setIsEventDetailsOpen(false);
        setIsTaskEditDialogOpen(true);
      }
    }
  };

  const handleDeleteAssignment = (eventId: string) => {
    // Extract assignment ID from event ID (format: "assignment-{id}")
    const assignmentId = eventId.replace('assignment-', '');
    if (assignmentId) {
      const assignments = getAssignments();
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment && canManageAssignment(assignment)) {
        if (window.confirm(`Are you sure you want to delete "${assignment.taskTitle || 'this assignment'}"?`)) {
          deleteAssignment(assignmentId);
          loadData();
          setIsEventDetailsOpen(false);
          setSelectedEvent(null);
        }
      }
    }
  };

  const handleTaskEditSubmit = (data: TeamTaskFormData) => {
    if (!editingAssignment || !currentUser) return;
    
    const staffer = teamMembers.find(m => m.id === data.stafferId);
    if (!staffer) return;
    
    updateAssignment(editingAssignment.id, {
      assignedTo: staffer.id,
      assignedToId: staffer.id,
      assignedToEmail: staffer.email,
      assignedToName: `${staffer.firstName} ${staffer.lastName}`,
      section: staffer.section,
      taskTitle: data.title,
      taskDate: data.date,
      taskTime: data.time || undefined,
      notes: data.description,
      taskLocation: data.location || undefined,
    });
    
    loadData();
    setIsTaskEditDialogOpen(false);
    setEditingAssignment(null);
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
            Click dates to assign tasks to your team members. Assignments require approval.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4">
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
            selectMinDistance={0}
            eventClassNames={(arg) => {
              const isTask = arg.event.extendedProps.task;
              return isTask ? 'task-event' : 'calendar-event';
            }}
          />
        </div>
      </div>

      <SendInviteDialog
        open={isInviteDialogOpen}
        onOpenChange={(open) => {
          setIsInviteDialogOpen(open);
          if (!open) {
            setSelectedRequest(null);
            setSelectedDate(null);
          }
        }}
        requestId={selectedRequest?.id || ''}
        onSend={handleInviteSend}
      />

      <EventDetailsDialog
        isOpen={isEventDetailsOpen}
        onClose={() => {
          setIsEventDetailsOpen(false);
          setSelectedEvent(null);
          setEditingAssignment(null);
        }}
        event={selectedEvent}
        onEdit={handleEditAssignment}
        onDelete={handleDeleteAssignment}
        readOnly={!editingAssignment}
      />

      <TeamTaskDialog
        open={isTaskEditDialogOpen}
        onOpenChange={(open) => {
          setIsTaskEditDialogOpen(open);
          if (!open) {
            setEditingAssignment(null);
          }
        }}
        teamMembers={teamMembers}
        onSubmit={handleTaskEditSubmit}
        initialData={editingAssignment ? {
          assignmentId: editingAssignment.id,
          stafferId: editingAssignment.assignedToId || editingAssignment.assignedTo,
          title: editingAssignment.taskTitle || '',
          description: editingAssignment.notes || '',
          date: editingAssignment.taskDate || new Date().toISOString().split('T')[0],
          time: editingAssignment.taskTime || '',
          location: editingAssignment.taskLocation || '',
        } : undefined}
      />
    </>
  );
}

