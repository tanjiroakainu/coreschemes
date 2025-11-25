import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getAssignments, Assignment, deleteAssignment, getCurrentUser, createAssignment, updateAssignment, getStaffers } from '@/lib/storage';
import EventDialogue from '@/components/admin/AdminCalendarDialog';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import { EventInput } from '@fullcalendar/core';

interface RoleCalendarProps {
  canEdit?: boolean; // Whether the role can create/edit/delete events
  filterByUser?: boolean; // Whether to filter assignments by current user
}

const RoleCalendar = ({ canEdit = true, filterByUser = false }: RoleCalendarProps) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'class-schedule'>('events');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editEvent, setEditEvent] = useState<EventInput | null>(null);
  const [selectedDate, setSelectedDate] = useState<any>(null);

  useEffect(() => {
    loadAssignments();
    
    // Listen for assignment updates
    const handleStorageChange = () => {
      loadAssignments();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
    };
  }, [filterByUser]);

  const loadAssignments = () => {
    const allAssignments = getAssignments();
    
    // Filter by current user if needed
    let filtered = allAssignments;
    if (filterByUser) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        filtered = allAssignments.filter(assignment => {
          return assignment.assignedToId === currentUser.id || 
                 assignment.assignedToEmail === currentUser.email ||
                 assignment.assignedTo === currentUser.id ||
                 assignment.assignedTo === currentUser.email;
        });
      }
    }
    
    setAssignments(filtered);
  };

  // Filter assignments: Events are those without requestId and without taskTitle
  // Class Schedule are those with taskTitle
  const getEvents = () => {
    return assignments.filter(assignment => {
      return !assignment.requestId && !assignment.taskTitle;
    });
  };

  const getClassSchedule = () => {
    return assignments.filter(assignment => {
      return assignment.taskTitle;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (assignment: Assignment) => {
    if (assignment.taskTime) {
      return assignment.taskTime;
    }
    return 'N/A';
  };

  const handleAddNew = () => {
    if (!canEdit) return;
    setEditEvent(null);
    setSelectedDate({
      startStr: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (assignment: Assignment) => {
    if (!canEdit) return;
    // Convert assignment to EventInput format for editing
    const timeParts = assignment.taskTime?.split(' - ') || [];
    const startTime = timeParts[0] || '';
    const endTime = timeParts[1] || startTime;
    
    const eventInput: EventInput = {
      id: assignment.id,
      title: assignment.taskTitle || 'Event',
      description: assignment.notes || '',
      location: assignment.taskLocation || '',
      start: assignment.taskDate || assignment.assignedAt,
      startTime: startTime,
      endTime: endTime !== startTime ? endTime : '',
      stafferId: assignment.assignedToId || assignment.assignedTo,
      stafferName: assignment.assignedToName,
      contact: '',
      task: !!assignment.taskTitle,
    };
    
    setEditEvent(eventInput);
    setSelectedDate({
      startStr: assignment.taskDate || assignment.assignedAt.split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (assignmentId: string) => {
    if (!canEdit) return;
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        deleteAssignment(assignmentId);
        loadAssignments();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment');
      }
    }
  };

  const handleAddEvent = (data: any) => {
    const currentUser = getCurrentUser();
    const staffers = getStaffers();
    const staffer = staffers.find(s => s.id === data.stafferId);
    
    if (!staffer) {
      alert('Please select a staffer to assign to');
      return;
    }
    
    // Check if editing
    const isEditing = !!editEvent;
    
    if (isEditing && editEvent) {
      // Update existing assignment
      const timeStr = data.endTime && data.endTime !== data.startTime
        ? `${data.startTime} - ${data.endTime}`
        : data.startTime;
      
      updateAssignment(editEvent.id as string, {
        taskTitle: data.title,
        taskDate: data.date,
        taskTime: timeStr,
        taskLocation: data.location,
        notes: data.description,
        assignedTo: staffer.id,
        assignedToId: staffer.id,
        assignedToEmail: staffer.email,
        assignedToName: `${staffer.firstName} ${staffer.lastName}`,
        section: staffer.section,
      });
    } else {
      // Create new assignment (Event - no taskTitle)
      const timeStr = data.endTime && data.endTime !== data.startTime
        ? `${data.startTime} - ${data.endTime}`
        : data.startTime;
      
      createAssignment({
        assignedTo: staffer.id,
        assignedToId: staffer.id,
        assignedToEmail: staffer.email,
        assignedToName: `${staffer.firstName} ${staffer.lastName}`,
        section: staffer.section,
        taskDate: data.date,
        taskTime: timeStr,
        taskLocation: data.location,
        notes: data.description,
        assignedBy: currentUser?.name || 'User',
        assignedByEmail: currentUser?.email,
        status: 'pending',
      });
    }
    
    loadAssignments();
    setIsDialogOpen(false);
    setEditEvent(null);
  };

  const handleAddTask = (data: any) => {
    const currentUser = getCurrentUser();
    const staffers = getStaffers();
    const staffer = staffers.find(s => s.id === data.stafferId);
    
    if (!staffer) {
      alert('Please select a staffer to assign to');
      return;
    }
    
    // Check if editing
    const isEditing = !!editEvent;
    
    if (isEditing && editEvent) {
      // Update existing assignment
      const timeStr = data.endTime && data.endTime !== data.startTime
        ? `${data.startTime} - ${data.endTime}`
        : data.startTime;
      
      updateAssignment(editEvent.id as string, {
        taskTitle: data.title, // Class Schedule has taskTitle
        taskDate: data.date,
        taskTime: timeStr,
        taskLocation: data.location,
        notes: data.description,
        assignedTo: staffer.id,
        assignedToId: staffer.id,
        assignedToEmail: staffer.email,
        assignedToName: `${staffer.firstName} ${staffer.lastName}`,
        section: staffer.section,
      });
    } else {
      // Create new assignment (Class Schedule - has taskTitle)
      const timeStr = data.endTime && data.endTime !== data.startTime
        ? `${data.startTime} - ${data.endTime}`
        : data.startTime;
      
      createAssignment({
        assignedTo: staffer.id,
        assignedToId: staffer.id,
        assignedToEmail: staffer.email,
        assignedToName: `${staffer.firstName} ${staffer.lastName}`,
        section: staffer.section,
        taskTitle: data.title, // Class Schedule has taskTitle
        taskDate: data.date,
        taskTime: timeStr,
        taskLocation: data.location,
        notes: data.description,
        assignedBy: currentUser?.name || 'User',
        assignedByEmail: currentUser?.email,
        status: 'pending',
      });
    }
    
    loadAssignments();
    setIsDialogOpen(false);
    setEditEvent(null);
  };

  const currentItems = activeTab === 'events' ? getEvents() : getClassSchedule();

  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-600">Calendar</h1>
        {canEdit && (
          <Button
            onClick={handleAddNew}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
          >
            <MdAdd size={20} />
            Add New
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
          <TabsTrigger
            value="events"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none"
          >
            Events
          </TabsTrigger>
          <TabsTrigger
            value="class-schedule"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none"
          >
            Class Schedule
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
                        No {activeTab === 'events' ? 'events' : 'class schedule items'} found.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((assignment) => {
                      const title = assignment.taskTitle || 'Event';
                      const description = assignment.notes || '';
                      const date = formatDate(assignment.taskDate || assignment.assignedAt);
                      const time = formatTime(assignment);
                      
                      return (
                        <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {title}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {time}
                          </td>
                          {canEdit && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(assignment)}
                                  className="flex items-center gap-1"
                                >
                                  <MdEdit size={16} />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(assignment.id)}
                                  className="flex items-center gap-1"
                                >
                                  <MdDelete size={16} />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No {activeTab === 'events' ? 'events' : 'class schedule items'} found.
                </div>
              ) : (
                currentItems.map((assignment) => {
                  const title = assignment.taskTitle || 'Event';
                  const description = assignment.notes || '';
                  const date = formatDate(assignment.taskDate || assignment.assignedAt);
                  const time = formatTime(assignment);
                  
                  return (
                    <div key={assignment.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-2">
                          <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
                          <p className="text-xs text-gray-500 mt-1">{date}</p>
                          <p className="text-xs text-gray-500">{time}</p>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(assignment)}
                            className="flex-1 flex items-center justify-center gap-1"
                          >
                            <MdEdit size={16} />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(assignment.id)}
                            className="flex-1 flex items-center justify-center gap-1"
                          >
                            <MdDelete size={16} />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Tabs>

      {canEdit && (
        <EventDialogue
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          selectedDate={selectedDate}
          editEvent={editEvent}
          onAddEvent={handleAddEvent}
          onAddTask={handleAddTask}
        />
      )}
    </div>
  );
};

export default RoleCalendar;

