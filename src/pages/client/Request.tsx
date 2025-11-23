import { useState, useEffect } from 'react';
import { getRequests, ClientRequest as ClientRequestType } from '@/lib/storage';
import ClientRequestForm from '@/components/client/ClientRequestForm';
import RequestDetailsDialog from '@/components/client/RequestDetailsDialog';
import { Button } from '@/components/ui/button';
import { MdAdd } from 'react-icons/md';

export default function ClientRequest() {
  const [requests, setRequests] = useState<ClientRequestType[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequestType | null>(null);
  const [editingRequest, setEditingRequest] = useState<ClientRequestType | null>(null);

  useEffect(() => {
    loadRequests();
    
    // Listen for storage changes to refresh data
    const handleStorageChange = () => {
      loadRequests();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events (same-tab updates)
    window.addEventListener('requestUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('requestUpdated', handleStorageChange);
    };
  }, []);

  const loadRequests = () => {
    const allRequests = getRequests();
    // Sort by date requested (newest first)
    const sorted = allRequests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setRequests(sorted);
  };

  const handleRowClick = (request: ClientRequestType) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleEdit = (request: ClientRequestType) => {
    setEditingRequest(request);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    loadRequests();
    setEditingRequest(null);
  };

  const handleDelete = () => {
    loadRequests();
  };

  const getStatusColor = (status: ClientRequestType['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
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

  return (
    <div className="px-4 md:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-600">Request Tracker</h1>
        <Button
          onClick={() => {
            setEditingRequest(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <MdAdd size={20} />
          New Request
        </Button>
      </div>

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
                  Date Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No requests found. Click "New Request" to create one.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => handleRowClick(request)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {requests.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No requests found. Click "New Request" to create one.
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                onClick={() => handleRowClick(request)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 flex-1 pr-2">
                    {request.title}
                  </h3>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full flex-shrink-0 ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDate(request.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <ClientRequestForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingRequest(null);
          }
        }}
        editingRequest={editingRequest}
        onSuccess={handleFormSuccess}
      />

      <RequestDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        request={selectedRequest}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={selectedRequest?.status === 'pending'}
        canDelete={selectedRequest?.status === 'pending'}
      />
    </div>
  );
}
