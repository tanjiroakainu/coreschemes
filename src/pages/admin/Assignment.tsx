import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getRequestsByStatus, 
  ClientRequest, 
  getAssignments,
  createAssignment,
  Assignment,
  getCurrentUser,
  Staffer,
} from '@/lib/storage';
import AssignToDialog from '@/components/admin/AssignToDialog';
import { Button } from '@/components/ui/button';

export default function AdminAssignment() {
  const [pendingRequests, setPendingRequests] = useState<ClientRequest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'preview'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
    
    // Listen for storage changes to refresh data
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('requestUpdated', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('requestUpdated', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    // Get approved requests that don't have assignments yet
    const approvedRequests = getRequestsByStatus('approved');
    const allAssignments = getAssignments();
    
    // Filter out requests that already have assignments
    const unassignedRequests = approvedRequests.filter(request => {
      return !allAssignments.some(assignment => assignment.requestId === request.id);
    });
    
    setPendingRequests(unassignedRequests);
    // Show all assignments (from both requests and calendar)
    setAssignments(allAssignments);

    const selectedRequestId = localStorage.getItem('assignmentRequestId');
    if (selectedRequestId) {
      localStorage.removeItem('assignmentRequestId');
      const requestToPreselect = approvedRequests.find((request) => request.id === selectedRequestId);
      if (requestToPreselect) {
        setSelectedRequest(requestToPreselect);
        setActiveTab('pending');
        setIsAssignDialogOpen(true);
      }
    }
  };

  const handleRequestClick = (request: ClientRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleAssignClick = (request: ClientRequest) => {
    setSelectedRequest(request);
    setIsAssignDialogOpen(true);
  };

  const handleAssign = (staffer: Staffer) => {
    if (!selectedRequest) return;
    
    const currentUser = getCurrentUser();
    
    createAssignment({
      requestId: selectedRequest.id,
      assignedTo: staffer.id,
      assignedToId: staffer.id,
      assignedToEmail: staffer.email,
      assignedToName: `${staffer.firstName} ${staffer.lastName}`,
      section: staffer.section,
      assignedBy: currentUser?.name || 'Admin',
      status: 'pending',
    });
    
    loadData();
    setSelectedRequest(null);
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

  const getRequestForAssignment = (assignment: Assignment): ClientRequest | null => {
    const approvedRequests = getRequestsByStatus('approved');
    return approvedRequests.find(r => r.id === assignment.requestId) || null;
  };


  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-amber-600">Assignment</h1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none"
          >
            Pending Assignment
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none"
          >
            Assignment Preview
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {activeTab === 'pending' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left: Request List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Approved Requests</h3>
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending assignments</p>
                ) : (
                  <div className="space-y-2">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        onClick={() => handleRequestClick(request)}
                        className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{request.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(request.createdAt)}</p>
                          </div>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignClick(request);
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            size="sm"
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                {selectedRequest ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                      <p className="text-gray-900">{selectedRequest.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                        <p className="text-gray-900">{selectedRequest.date}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Time</label>
                        <p className="text-gray-900">{selectedRequest.time || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                        <p className="text-gray-900">{selectedRequest.location || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Contact info</label>
                        <p className="text-gray-900">{selectedRequest.contactInfo || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Person to contact</label>
                      <p className="text-gray-900">{selectedRequest.personToContact || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Service needed</label>
                      <p className="text-gray-900">{selectedRequest.serviceNeeded || 'N/A'}</p>
                    </div>
                    <div className="pt-4">
                      <Button
                        type="button"
                        onClick={() => handleAssignClick(selectedRequest)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Select a request to view details</p>
                )}
              </div>
            </div>
          ) : (
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
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No assignments found
                        </td>
                      </tr>
                    ) : (
                      assignments.map((assignment) => {
                        const request = getRequestForAssignment(assignment);
                        const title = assignment.taskTitle || request?.title || 'Assignment';
                        
                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment.assignedToName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment.section.charAt(0).toUpperCase() + assignment.section.slice(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(assignment.assignedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  assignment.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : assignment.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : assignment.status === 'approved'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {request ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRequestClick(request)}
                                >
                                  View
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400">Calendar Assignment</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {assignments.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No assignments found
                  </div>
                ) : (
                  assignments.map((assignment) => {
                    const request = getRequestForAssignment(assignment);
                    const title = assignment.taskTitle || request?.title || 'Assignment';
                    
                    return (
                      <div key={assignment.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
                            <p className="text-xs text-gray-500">Assigned to: {assignment.assignedToName}</p>
                            <p className="text-xs text-gray-500">Section: {assignment.section.charAt(0).toUpperCase() + assignment.section.slice(1)}</p>
                            <p className="text-xs text-gray-500">{formatDate(assignment.assignedAt)}</p>
                          </div>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              assignment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : assignment.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : assignment.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                        </div>
                        {request && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRequestClick(request)}
                            className="w-full mt-2"
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </Tabs>

      <AssignToDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        onAssign={handleAssign}
      />

      {/* Details Dialog */}
      {selectedRequest && isDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Details</h2>
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                  <p className="text-gray-900">{selectedRequest.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                    <p className="text-gray-900">{selectedRequest.date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Time</label>
                    <p className="text-gray-900">{selectedRequest.time || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                    <p className="text-gray-900">{selectedRequest.location || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Contact info</label>
                    <p className="text-gray-900">{selectedRequest.contactInfo || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Person to contact</label>
                  <p className="text-gray-900">{selectedRequest.personToContact || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Service needed</label>
                  <p className="text-gray-900">{selectedRequest.serviceNeeded || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
