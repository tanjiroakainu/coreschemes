import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScheduleNote } from '@/lib/storage';

interface ScheduleNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: string;
  timeSlot: string;
  existingNote?: ScheduleNote | null;
  onSave: (notes: string) => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export default function ScheduleNoteDialog({
  open,
  onOpenChange,
  day,
  timeSlot,
  existingNote,
  onSave,
  onDelete,
  readOnly = false,
}: ScheduleNoteDialogProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingNote) {
      setNotes(existingNote.notes);
    } else {
      setNotes('');
    }
  }, [existingNote, open]);

  const handleSave = () => {
    if (notes.trim()) {
      onSave(notes.trim());
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (onDelete && existingNote) {
      onDelete();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? 'Schedule Note' : existingNote ? 'Edit Schedule Note' : 'Add Schedule Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Day:</span> {day}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Time:</span> {timeSlot}
            </p>
          </div>

          {existingNote && readOnly && (
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              <p className="text-xs text-gray-500">
                <span className="font-medium">Added by:</span> {existingNote.addedByName} ({existingNote.addedByPosition})
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">Date:</span> {new Date(existingNote.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={6}
              placeholder="Enter notes for this schedule slot..."
              readOnly={readOnly}
            />
          </div>
        </div>

        <DialogFooter>
          {!readOnly && (
            <>
              {existingNote && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {existingNote ? 'Update' : 'Save'}
              </Button>
            </>
          )}
          {readOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

