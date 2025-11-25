import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRequestsByStatus, updateRequest, ClientRequest, getCurrentUser, getAssignments, Assignment } from '@/lib/storage';
import RequestDetailsDialog from '@/components/client/RequestDetailsDialog';
import ReasonOfDenialDialog from '@/components/admin/ReasonOfDenialDialog';
import { Button } from '@/components/ui/button';
import { MdCheck, MdClose } from 'react-icons/md';

export default function AdminRequests() {
  const [pendingRequests, setPendingRequests] = useState<ClientRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ClientRequest[]>([]);
  const [deniedRequests, setDeniedRequests] = useState<ClientRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDenialDialogOpen, setIsDenialDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [requestToDeny, setRequestToDeny] = useState<string | null>(null);
  const [requestAssignmentsMap, setRequestAssignmentsMap] = useState<Record<string, number>>({});
  const [requestRejectedAssignmentsMap, setRequestRejectedAssignmentsMap] = useState<Record<string, Assignment[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
    
    // Listen for storage changes to refresh data
    const handleStorageChange = () => {
      loadRequests();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events (same-tab updates)
    window.addEventListener('requestUpdated', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('requestUpdated', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
    };
  }, []);

  const loadRequests = () => {
    const pending = getRequestsByStatus('pending');
    const approved = getRequestsByStatus('approved');
    const denied = getRequestsByStatus('denied');
    setPendingRequests(pending);
    setApprovedRequests(approved);
    setDeniedRequests(denied);

    const assignments = getAssignments();
    const map: Record<string, number> = {};
    const rejectedMap: Record<string, Assignment[]> = {};
    assignments.forEach((assignment: Assignment) => {
      if (assignment.requestId) {
        map[assignment.requestId] = (map[assignment.requestId] || 0) + 1;
        if (assignment.status === 'rejected') {
          if (!rejectedMap[assignment.requestId]) {
            rejectedMap[assignment.requestId] = [];
          }
          rejectedMap[assignment.requestId].push(assignment);
        }
      }
    });
    setRequestAssignmentsMap(map);
    setRequestRejectedAssignmentsMap(rejectedMap);
  };

  const handleRowClick = (request: ClientRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const getAssignmentCount = (requestId: string): number => {
    return requestAssignmentsMap[requestId] || 0;
  };

  const getRejectedAssignments = (requestId: string): Assignment[] => {
    return requestRejectedAssignmentsMap[requestId] || [];
  };

  const handleAssignFromRequests = (requestId: string) => {
    localStorage.setItem('assignmentRequestId', requestId);
    navigate('/admin/assignment');
  };

  const handleApprove = (requestId: string) => {
    const currentUser = getCurrentUser();
    const adminName = currentUser?.name || 'Admin';
    
    updateRequest(requestId, {
      status: 'approved',
      approvedBy: adminName,
      dateApproved: new Date().toISOString(),
    });
    loadRequests();
    setIsDetailsOpen(false);
    setSelectedRequest(null);
  };

  const handleDenyClick = (requestId: string) => {
    setRequestToDeny(requestId);
    setIsDenialDialogOpen(true);
    setIsDetailsOpen(false);
  };

  const handleDenyConfirm = (reason: string) => {
    if (!requestToDeny) return;
    
    const currentUser = getCurrentUser();
    const adminName = currentUser?.name || 'Admin';
    
    updateRequest(requestToDeny, {
      status: 'denied',
      deniedBy: adminName,
      dateDenied: new Date().toISOString(),
      reasonOfDenial: reason,
    });
    loadRequests();
    setRequestToDeny(null);
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

  const getCurrentRequests = () => {
    switch (activeTab) {
      case 'pending':
        return pendingRequests;
      case 'approved':
        return approvedRequests;
      case 'denied':
        return deniedRequests;
      default:
        return [];
    }
  };

  return (
    <div className="px-4 md:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-amber-600">Full details of pending request/ review for approval or denial</h1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto flex flex-wrap overflow-x-auto">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm sm:text-base whitespace-nowrap"
          >
            Pending Request
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm sm:text-base whitespace-nowrap"
          >
            Approved request
          </TabsTrigger>
          <TabsTrigger
            value="denied"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm sm:text-base whitespace-nowrap"
          >
            Denied request
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
                    {activeTab === 'pending' ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Requested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </>
                    ) : activeTab === 'approved' ? (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Approved
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approved By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approval Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assignment Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Denied
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Denied By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Denial Notes
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentRequests().length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          activeTab === 'pending'
                            ? 3
                            : activeTab === 'approved'
                            ? 7
                            : 5
                        }
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No {activeTab} requests found.
                      </td>
                    </tr>
                  ) : (
                    getCurrentRequests().map((request) => (
                      <tr
                        key={request.id}
                        onClick={() => handleRowClick(request)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.title}
                        </td>
                        {activeTab === 'pending' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(request.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </td>
                          </>
                        ) : activeTab === 'approved' ? (
                          <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.clientName || request.clientEmail || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.dateApproved ? formatDate(request.dateApproved) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.approvedBy || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                          {request.approvalNotes ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-2">
                              <p className="text-xs whitespace-pre-wrap break-words line-clamp-2">
                                {request.approvalNotes}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No notes</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAssignmentCount(request.id) > 0 ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Assigned ({getAssignmentCount(request.id)})
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getAssignmentCount(request.id) === 0 ? (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignFromRequests(request.id);
                              }}
                            >
                              Assign Task
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">Already assigned</span>
                          )}
                        </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.clientName || request.clientEmail || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.dateDenied ? formatDate(request.dateDenied) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.deniedBy || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                              {request.reasonOfDenial ? (
                                <div className="bg-red-50 border border-red-200 rounded-md p-2">
                                  <p className="text-xs whitespace-pre-wrap break-words line-clamp-2">
                                    {request.reasonOfDenial}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">No notes</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {getCurrentRequests().length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No {activeTab} requests found.
                </div>
              ) : (
                getCurrentRequests().map((request) => (
                  <div
                    key={request.id}
                    onClick={() => handleRowClick(request)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900 flex-1 pr-2">
                        {request.title}
                      </h3>
                      {activeTab === 'pending' && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 flex-shrink-0">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      {activeTab === 'pending' ? (
                        <p>{formatDate(request.createdAt)}</p>
                      ) : activeTab === 'approved' ? (
                        <>
                          <p>Client: {request.clientName || request.clientEmail || 'N/A'}</p>
                          <p>Approved: {request.dateApproved ? formatDate(request.dateApproved) : 'N/A'}</p>
                          <p>By: {request.approvedBy || 'N/A'}</p>
                          {request.approvalNotes && (
                            <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Approval Notes:</p>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                                {request.approvalNotes}
                              </p>
                            </div>
                          )}
                          <p className="mt-2">
                            Status:{' '}
                            {getAssignmentCount(request.id) > 0
                              ? `Assigned (${getAssignmentCount(request.id)})`
                              : 'Unassigned'}
                          </p>
                          {getAssignmentCount(request.id) === 0 && (
                            <Button
                              type="button"
                              size="sm"
                              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignFromRequests(request.id);
                              }}
                            >
                              Assign Task
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <p>Client: {request.clientName || request.clientEmail || 'N/A'}</p>
                          <p>Denied: {request.dateDenied ? formatDate(request.dateDenied) : 'N/A'}</p>
                          <p>By: {request.deniedBy || 'N/A'}</p>
                          {request.reasonOfDenial && (
                            <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Denial Notes:</p>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                                {request.reasonOfDenial}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Tabs>

      <RequestDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        request={selectedRequest}
        canEdit={false}
        canDelete={false}
        customActions={
          selectedRequest?.status === 'pending' ? (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => selectedRequest && handleDenyClick(selectedRequest.id)}
                className="flex items-center gap-2"
              >
                <MdClose size={18} />
                Deny
              </Button>
              <Button
                type="button"
                onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <MdCheck size={18} />
                Approve
              </Button>
            </div>
          ) : selectedRequest && getRejectedAssignments(selectedRequest.id).length > 0 ? (
            <div className="pt-4 border-t">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Rejected Assignments</h3>
                <div className="space-y-2">
                  {getRejectedAssignments(selectedRequest.id).map((assignment: Assignment) => (
                    <div key={assignment.id} className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.assignedToName || 'N/A'} - Rejected by {assignment.rejectedBy || 'N/A'}
                      </p>
                      {assignment.rejectionReason && (
                        <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">
                          {assignment.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : undefined
        }
      />

      <ReasonOfDenialDialog
        open={isDenialDialogOpen}
        onOpenChange={setIsDenialDialogOpen}
        onConfirm={handleDenyConfirm}
      />
    </div>
  );
}

