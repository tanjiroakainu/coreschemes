import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createRequest, updateRequest, getCurrentUser, ClientRequest } from '@/lib/storage';
import { MdAttachFile } from 'react-icons/md';

interface ClientRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
  onSuccess?: () => void;
  editingRequest?: ClientRequest | null;
}

export default function ClientRequestForm({
  open,
  onOpenChange,
  selectedDate,
  onSuccess,
  editingRequest,
}: ClientRequestFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: selectedDate || '',
    time: '',
    location: '',
    personToContact: '',
    contactInfo: '',
    serviceNeeded: '',
    attachedFile: '',
    fileName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load editing request data or set selected date
  useEffect(() => {
    if (editingRequest) {
      setFormData({
        title: editingRequest.title || '',
        description: editingRequest.description || '',
        date: editingRequest.date || '',
        time: editingRequest.time || '',
        location: editingRequest.location || '',
        personToContact: editingRequest.personToContact || '',
        contactInfo: editingRequest.contactInfo || '',
        serviceNeeded: editingRequest.serviceNeeded || '',
        attachedFile: editingRequest.attachedFile || '',
        fileName: editingRequest.fileName || '',
      });
    } else if (selectedDate) {
      setFormData((prev) => ({ ...prev, date: selectedDate }));
    }
  }, [editingRequest, selectedDate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          attachedFile: base64String,
          fileName: file.name,
        }));
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.title || !formData.description || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = getCurrentUser();
      
      if (editingRequest) {
        // Update existing request
        updateRequest(editingRequest.id, {
          ...formData,
          attachedFile: formData.attachedFile,
          fileName: formData.fileName,
        });
      } else {
        // Create new request
        createRequest({
          ...formData,
          attachedFile: formData.attachedFile,
          fileName: formData.fileName,
          status: 'pending',
          clientEmail: currentUser?.email || '',
          clientName: currentUser?.name || '',
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: selectedDate || '',
        time: '',
        location: '',
        personToContact: '',
        contactInfo: '',
        serviceNeeded: '',
        attachedFile: '',
        fileName: '',
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      date: selectedDate || '',
      time: '',
      location: '',
      personToContact: '',
      contactInfo: '',
      serviceNeeded: '',
      attachedFile: '',
      fileName: '',
    });
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRequest ? 'Edit Request' : 'Request Form'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Person to contact</label>
              <input
                type="text"
                value={formData.personToContact}
                onChange={(e) => setFormData({ ...formData, personToContact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact info</label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Service needed</label>
            <input
              type="text"
              value={formData.serviceNeeded}
              onChange={(e) => setFormData({ ...formData, serviceNeeded: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attach file</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
              >
                <MdAttachFile size={20} />
                <span>{formData.fileName || 'Choose file'}</span>
              </label>
              {formData.fileName && (
                <span className="text-sm text-gray-600">{formData.fileName}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Submitting...' : editingRequest ? 'Save changes' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

