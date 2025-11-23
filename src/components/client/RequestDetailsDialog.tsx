import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClientRequest, deleteRequest } from '@/lib/storage';
import { MdEdit, MdDelete, MdAttachFile } from 'react-icons/md';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface RequestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ClientRequest | null;
  onEdit?: (request: ClientRequest) => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  customActions?: React.ReactNode;
}

export default function RequestDetailsDialog({
  open,
  onOpenChange,
  request,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  customActions,
}: RequestDetailsDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!request) return null;

  const handleDelete = () => {
    deleteRequest(request.id);
    setShowDeleteDialog(false);
    onOpenChange(false);
    if (onDelete) {
      onDelete();
    }
  };

  const handleViewFile = () => {
    if (request.attachedFile) {
      // Open file in new window
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${request.fileName || 'Attachment'}</title></head>
            <body style="margin:0; padding:20px;">
              ${request.attachedFile.startsWith('data:image') 
                ? `<img src="${request.attachedFile}" style="max-width:100%; height:auto;" />`
                : `<iframe src="${request.attachedFile}" style="width:100%; height:100vh; border:none;"></iframe>`
              }
            </body>
          </html>
        `);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <p className="text-gray-700">{request.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <p className="text-gray-700">{request.time || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <p className="text-gray-700">{request.date}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact info</label>
              <p className="text-gray-700">{request.contactInfo || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <p className="text-gray-700">{request.location || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Person to contact</label>
              <p className="text-gray-700">{request.personToContact || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service needed</label>
              <p className="text-gray-700">{request.serviceNeeded || 'N/A'}</p>
            </div>
            {request.attachedFile && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">View File attached</label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleViewFile}
                  className="flex items-center gap-2"
                >
                  <MdAttachFile size={20} />
                  {request.fileName || 'View Attachment'}
                </Button>
              </div>
            )}
            {request.status === 'approved' && request.approvedBy && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Approved By</label>
                  <p className="text-gray-700">{request.approvedBy}</p>
                </div>
                {request.dateApproved && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Date Approved</label>
                    <p className="text-gray-700">{new Date(request.dateApproved).toLocaleDateString()}</p>
                  </div>
                )}
              </>
            )}
            {request.status === 'denied' && request.deniedBy && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Denied By</label>
                  <p className="text-gray-700">{request.deniedBy}</p>
                </div>
                {request.dateDenied && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Date Denied</label>
                    <p className="text-gray-700">{new Date(request.dateDenied).toLocaleDateString()}</p>
                  </div>
                )}
                {request.reasonOfDenial && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Reason of Denial</label>
                    <p className="text-gray-700 whitespace-pre-wrap bg-red-50 p-3 rounded border border-red-200">
                      {request.reasonOfDenial}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {customActions ? (
            customActions
          ) : (canEdit || canDelete) && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              {canEdit && onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onEdit(request);
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <MdEdit size={18} />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2"
                >
                  <MdDelete size={18} />
                  Delete
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <span>⚠️</span>
              <span>Delete request?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

