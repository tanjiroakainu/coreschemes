import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EventInput } from '@fullcalendar/core';
import { Pencil, Trash2 } from 'lucide-react';

interface EventDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventInput | null;
  onEdit: (event: EventInput) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export default function EventDetailsDialog({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  readOnly = false,
}: EventDetailsDialogProps) {
  if (!event) return null;

  const startDate = new Date(event.start as string);
  const endDate = event.end ? new Date(event.end as string) : null;
  const dateStr = startDate.toLocaleDateString();
  const timeStr = event.startTime || startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTimeStr = event.endTime || (endDate?.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  }) || '');

  const title = (event.title as string)?.replace(/\s*\([^)]*\)/, '') || 'Untitled Event';

  const resolvedLocation =
    ((event as any)?.taskLocation as string | undefined) ||
    (event.location as string | undefined) ||
    ((event.extendedProps as any)?.location as string | undefined);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Title:</label>
            <p className="mt-1 text-gray-900">{title}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Description:</label>
            <p className="mt-1 text-gray-900">{event.description || '—'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Date:</label>
              <p className="mt-1 text-gray-900">{dateStr}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Time:</label>
              <p className="mt-1 text-gray-900">
                {endTimeStr ? `${timeStr} - ${endTimeStr}` : timeStr}
              </p>
            </div>
          </div>

          {resolvedLocation && (
            <div>
              <label className="text-sm font-medium text-gray-600">Location:</label>
              <p className="mt-1 text-gray-900">{resolvedLocation}</p>
            </div>
          )}

          {(event.staffer || (event as any).stafferName) && (
            <div>
              <label className="text-sm font-medium text-gray-600">Assigned Staffer:</label>
              <p className="mt-1 text-gray-900">{(event as any).stafferName || event.staffer || '—'}</p>
            </div>
          )}

          {event.contact && (
            <div>
              <label className="text-sm font-medium text-gray-600">Contact Person:</label>
              <p className="mt-1 text-gray-900">{event.contact}</p>
            </div>
          )}

          {((event as any).assignedByName || (event as any).assignedBy) && (
            <div>
              <label className="text-sm font-medium text-gray-600">Assigned By:</label>
              <p className="mt-1 text-gray-900">
                {(event as any).assignedByName || 'Admin'}
                {((event as any).assignedByRole && (event as any).assignedByRole !== 'admin') && (
                  <span className="text-xs text-gray-500 ml-2">({(event as any).assignedByRole})</span>
                )}
              </p>
            </div>
          )}

          {!readOnly && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(event);
                }}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (event.id) {
                    onDelete(event.id as string);
                  }
                }}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

