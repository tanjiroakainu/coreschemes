import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Staffer } from '@/lib/storage';

export interface TeamTaskFormData {
  assignmentId?: string;
  stafferId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface TeamTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: Staffer[];
  onSubmit: (data: TeamTaskFormData) => void;
  initialData?: TeamTaskFormData;
}

export default function TeamTaskDialog({
  open,
  onOpenChange,
  teamMembers,
  onSubmit,
  initialData,
}: TeamTaskDialogProps) {
  const [formData, setFormData] = useState<TeamTaskFormData>({
    assignmentId: undefined,
    stafferId: '',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: '',
  });

  useEffect(() => {
    if (open) {
      const defaultStafferId = initialData?.stafferId || teamMembers[0]?.id || '';
      
      setFormData({
        assignmentId: initialData?.assignmentId,
        stafferId: defaultStafferId,
        title: initialData?.title || '',
        description: initialData?.description || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
        location: initialData?.location || '',
      });
    }
  }, [open, initialData, teamMembers]);

  const handleChange = (field: keyof TeamTaskFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stafferId || !formData.title || !formData.date) {
      return;
    }
    onSubmit(formData);
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      onOpenChange(false);
    }
  };

  const isEditMode = Boolean(formData.assignmentId);
  const hasTeamMembers = teamMembers.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Add Task'}</DialogTitle>
          <DialogDescription>
            Assign a task to one of your team members.
          </DialogDescription>
        </DialogHeader>

        {hasTeamMembers ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="staffer">
                Team Member
              </label>
              <select
                id="staffer"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                value={formData.stafferId}
                onChange={(e) => handleChange('stafferId', e.target.value)}
                required
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName} ({member.section})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="title">
                Task Title
              </label>
              <input
                id="title"
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                placeholder="Enter task title"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="startTime">
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="time"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="endTime">
                End Time (Optional)
              </label>
              <input
                id="endTime"
                type="time"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="description">
                Notes (optional)
              </label>
              <textarea
                id="description"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Additional details about this task"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="location">
                Location (optional)
              </label>
              <input
                id="location"
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Enter venue or meeting link"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                {isEditMode ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center text-gray-500 text-sm">
            You don't have any team members yet. Add members under &quot;My Team&quot; first.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


