import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DateSelectArg, EventInput } from '@fullcalendar/core';
import { getCurrentUser, getStaffers } from '@/lib/storage';

interface EventDialogueProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  selectedDate: DateSelectArg | null;
  editEvent: EventInput | null;
  onAddEvent: (data: any) => void;
  onAddTask: (data: any) => void;
}

export default function EventDialogue({
  isDialogOpen,
  setIsDialogOpen,
  selectedDate,
  editEvent,
  onAddEvent,
  onAddTask,
}: EventDialogueProps) {
  const [activeTab, setActiveTab] = useState<'event' | 'task'>('event');
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    stafferId: '',
    stafferName: '',
    contact: '',
  });
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    stafferId: '',
    stafferName: '',
    contact: '',
  });
  const [staffers, setStaffers] = useState<any[]>([]);

  useEffect(() => {
    const allStaffers = getStaffers();
    setStaffers(allStaffers);
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      resetForms();
      return;
    }

    if (editEvent) {
      // Editing existing event - populate form
      const startDate = new Date(editEvent.start as string);
      const dateStr = startDate.toISOString().split('T')[0];
      const startTime = editEvent.startTime || startDate.toTimeString().slice(0, 5);
      const endTime = (editEvent as any).endTime || '';
      
      if (editEvent.task) {
        setTaskData({
          title: (editEvent.title as string).replace(/\s*\([^)]*\)/, '') || '',
          description: editEvent.description || '',
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          location: editEvent.location || '',
          stafferId: (editEvent as any).stafferId || '',
          stafferName: (editEvent as any).stafferName || editEvent.staffer || '',
          contact: editEvent.contact || '',
        });
        setActiveTab('task');
      } else {
        setEventData({
          title: (editEvent.title as string).replace(/\s*\([^)]*\)/, '') || '',
          description: editEvent.description || '',
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          location: editEvent.location || '',
          stafferId: (editEvent as any).stafferId || '',
          stafferName: (editEvent as any).stafferName || editEvent.staffer || '',
          contact: editEvent.contact || '',
        });
        setActiveTab('event');
      }
    } else if (selectedDate) {
      // New event - reset form with only date pre-filled
      let dateStr: string;
      if (selectedDate.startStr) {
        dateStr = selectedDate.startStr.includes('T') 
          ? selectedDate.startStr.split('T')[0] 
          : selectedDate.startStr;
      } else {
        dateStr = new Date().toISOString().split('T')[0];
      }
      
      setEventData({
        title: '',
        description: '',
        date: dateStr,
        startTime: '',
        endTime: '',
        location: '',
        stafferId: '',
        stafferName: '',
        contact: '',
      });
      setTaskData({
        title: '',
        description: '',
        date: dateStr,
        startTime: '',
        endTime: '',
        location: '',
        stafferId: '',
        stafferName: '',
        contact: '',
      });
      setActiveTab('event'); // Reset to event tab for new entries
    }
  }, [isDialogOpen, editEvent]);

  const resetForms = () => {
    setEventData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      stafferId: '',
      stafferName: '',
      contact: '',
    });
    setTaskData({
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      stafferId: '',
      stafferName: '',
      contact: '',
    });
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = getCurrentUser();
    // Use startTime and endTime directly
    const startTime = eventData.startTime.trim() || '';
    const endTime = eventData.endTime.trim() || startTime;
    
    onAddEvent({
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      staffer: eventData.stafferName || eventData.stafferId,
      stafferId: eventData.stafferId,
      stafferName: eventData.stafferName,
      contact: eventData.contact,
      startTime: startTime,
      endTime: endTime,
      date: eventData.date,
      assignedBy: currentUser?.email || currentUser?.id || '',
      assignedByName: currentUser?.name || 'Admin',
      assignedByRole: currentUser?.role || 'admin',
    });

    resetForms();
    setActiveTab('event');
    setIsDialogOpen(false);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = getCurrentUser();
    // Use startTime and endTime directly
    const startTime = taskData.startTime.trim() || '';
    const endTime = taskData.endTime.trim() || startTime;

    const taskWithTime = {
      title: taskData.title,
      description: taskData.description,
      location: taskData.location,
      staffer: taskData.stafferName || taskData.stafferId,
      stafferId: taskData.stafferId,
      stafferName: taskData.stafferName,
      contact: taskData.contact,
      startTime: startTime,
      endTime: endTime,
      date: taskData.date,
      assignedBy: currentUser?.email || currentUser?.id || '',
      assignedByName: currentUser?.name || 'Admin',
      assignedByRole: currentUser?.role || 'admin',
    };

    if (onAddTask) {
      onAddTask(taskWithTime);
    }

    resetForms();
    setActiveTab('event');
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) {
        resetForms();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <DialogDescription>
            {editEvent ? 'Update the event details below.' : 'Fill in the details to create a new event or task.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'event' | 'task')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="event">Event</TabsTrigger>
            <TabsTrigger value="task">Task</TabsTrigger>
          </TabsList>

          <TabsContent value="event" className="mt-4">
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={eventData.date}
                    onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={eventData.startTime}
                    onChange={(e) => setEventData({ ...eventData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time (Optional)</label>
                <input
                  type="time"
                  value={eventData.endTime}
                  onChange={(e) => setEventData({ ...eventData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign To</label>
                <select
                  value={eventData.stafferId}
                  onChange={(e) => {
                    const staffer = staffers.find(s => s.id === e.target.value);
                    setEventData({
                      ...eventData,
                      stafferId: e.target.value,
                      stafferName: staffer ? `${staffer.firstName} ${staffer.lastName}` : '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select staffer...</option>
                  {staffers.map((staffer) => (
                    <option key={staffer.id} value={staffer.id}>
                      {staffer.firstName} {staffer.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  value={eventData.contact}
                  onChange={(e) => setEventData({ ...eventData, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Event</Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="task" className="mt-4">
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={taskData.date}
                    onChange={(e) => setTaskData({ ...taskData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={taskData.startTime}
                    onChange={(e) => setTaskData({ ...taskData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time (Optional)</label>
                <input
                  type="time"
                  value={taskData.endTime}
                  onChange={(e) => setTaskData({ ...taskData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={taskData.location}
                  onChange={(e) => setTaskData({ ...taskData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign To</label>
                <select
                  value={taskData.stafferId}
                  onChange={(e) => {
                    const staffer = staffers.find(s => s.id === e.target.value);
                    setTaskData({
                      ...taskData,
                      stafferId: e.target.value,
                      stafferName: staffer ? `${staffer.firstName} ${staffer.lastName}` : '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select staffer...</option>
                  {staffers.map((staffer) => (
                    <option key={staffer.id} value={staffer.id}>
                      {staffer.firstName} {staffer.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  value={taskData.contact}
                  onChange={(e) => setTaskData({ ...taskData, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Task</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

