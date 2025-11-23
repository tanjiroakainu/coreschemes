import { useState, useEffect } from 'react';
import { getAssignmentsByStaffer, getCurrentUser, Assignment, getInvitationsByStaffer, AssignmentInvitation, getRequestById, ClientRequest, approveAssignment, rejectAssignment, canApproveAssignment, updateAssignment } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MdInfo } from 'react-icons/md';

interface AssignmentNotificationProps {
  role?: string;
}

export default function AssignmentNotification({ role: _role }: AssignmentNotificationProps) {
  const executiveRoles = [
    'editor-in-chief',
    'associate editor',
    'associate-editor',
    'managing editor',
    'managing-editor',
    'executive secretary',
    'executive-secretary',
  ];
  const isExecutiveView = Boolean(
    _role &&
      executiveRoles.some((execRole) =>
        _role.toLowerCase().includes(execRole)
      )
  );
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [invitations, setInvitations] = useState<AssignmentInvitation[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<AssignmentInvitation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInvitationDetailsOpen, setIsInvitationDetailsOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [currentUser, setCurrentUserState] = useState<any>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<'pending' | 'completed'>('pending');
  const [selfStatusLoadingId, setSelfStatusLoadingId] = useState<string | null>(null);
  const [managerStatusLoadingId, setManagerStatusLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);
    window.addEventListener('invitationUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
      window.removeEventListener('invitationUpdated', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    const user = getCurrentUser();
    
    if (user?.id || user?.email) {
      setCurrentUserState(user);
      // Get pending and approved assignments (notifications)
      const myAssignments = getAssignmentsByStaffer(user.id, user.email);
      const notifications = myAssignments.filter(a => 
        a.status === 'pending' || a.status === 'approved' || a.status === 'completed'
      );
      setAssignments(notifications);
      
      if (!isExecutiveView) {
        const invitationIdentifier = user.email || user.id;
        const myInvitations = getInvitationsByStaffer(invitationIdentifier);
        const pendingInvitations = myInvitations.filter(i => i.status === 'pending');
        setInvitations(pendingInvitations);
      } else {
        setInvitations([]);
      }
    }
  };

  const getRequestForAssignment = (assignment: Assignment): ClientRequest | null => {
    if (assignment.requestId) {
      return getRequestById(assignment.requestId);
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getInvitationStatusColor = (status: AssignmentInvitation['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleApprove = (assignment: Assignment) => {
    setActionLoadingId(assignment.id);
    try {
      approveAssignment(assignment.id);
      setTimeout(loadData, 0);
    } catch (error: any) {
      alert(error?.message || 'Failed to approve assignment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectConfirm = () => {
    if (!selectedAssignment || !rejectionReason.trim()) return;
    setActionLoadingId(selectedAssignment.id);
    try {
      rejectAssignment(selectedAssignment.id, rejectionReason.trim());
      setIsRejectDialogOpen(false);
      setSelectedAssignment(null);
      setRejectionReason('');
      setTimeout(loadData, 0);
    } catch (error: any) {
      alert(error?.message || 'Failed to reject assignment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const isOwnAssignment = (assignment: Assignment): boolean => {
    if (!currentUser) return false;
    const identifiers = [
      assignment.assignedTo,
      assignment.assignedToId,
      assignment.assignedToEmail,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    const userIdentifiers = [currentUser.id, currentUser.email]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    return userIdentifiers.some((identifier) => identifiers.includes(identifier));
  };

  const handleSelfStatusUpdate = (assignment: Assignment, newStatus: Assignment['status']) => {
    if (assignment.status === newStatus) return;
    setSelfStatusLoadingId(assignment.id);
    updateAssignment(assignment.id, { status: newStatus });
    setTimeout(() => {
      loadData();
      setSelfStatusLoadingId(null);
    }, 0);
  };

  const canManageTeamStatus = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'section-head') return true;
    if (isExecutiveView) return true;
    if (currentUser.position) {
      const position = currentUser.position.toLowerCase();
      if (
        position.includes('editor-in-chief') ||
        position.includes('associate editor') ||
        position.includes('managing editor') ||
        position.includes('executive secretary')
      ) {
        return true;
      }
    }
    return false;
  };

  const handleManagerStatusUpdate = (assignment: Assignment, newStatus: Assignment['status']) => {
    if (assignment.status === newStatus || !canManageTeamStatus()) return;
    setManagerStatusLoadingId(assignment.id);
    updateAssignment(assignment.id, { status: newStatus });
    setTimeout(() => {
      loadData();
      setManagerStatusLoadingId(null);
    }, 0);
  };

  const canUpdateTeamStatus = canManageTeamStatus();

  const filteredAssignments = assignments.filter((assignment) =>
    assignmentFilter === 'pending'
      ? assignment.status !== 'completed'
      : assignment.status === 'completed'
  );

  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-amber-600">Assignment Notifications</h1>

      {/* Assignments Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Assignments</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={assignmentFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssignmentFilter('pending')}
            >
              Pending
            </Button>
            <Button
              type="button"
              variant={assignmentFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAssignmentFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              {assignmentFilter === 'pending' ? 'No pending assignments' : 'No completed assignments'}
            </p>
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
                      Team Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {canUpdateTeamStatus && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status Update
                      </th>
                    )}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssignments.map((assignment) => {
                    const request = getRequestForAssignment(assignment);
                    const title = assignment.taskTitle || request?.title || 'Assignment';
                    
                    return (
                      <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.assignedToName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.assignedBy || 'Admin/Executive'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(assignment.assignedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                        </td>
                        {canUpdateTeamStatus && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={assignment.status === 'pending' ? 'default' : 'outline'}
                                disabled={managerStatusLoadingId === assignment.id}
                                onClick={() => handleManagerStatusUpdate(assignment, 'pending')}
                              >
                                Pending
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={assignment.status === 'completed' ? 'default' : 'outline'}
                                disabled={managerStatusLoadingId === assignment.id}
                                onClick={() => handleManagerStatusUpdate(assignment, 'completed')}
                              >
                                Completed
                              </Button>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <MdInfo size={18} />
                          </Button>
                          {assignment.status === 'pending' && canApproveAssignment(currentUser) && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                disabled={actionLoadingId === assignment.id}
                                onClick={() => handleApprove(assignment)}
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={actionLoadingId === assignment.id}
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setIsRejectDialogOpen(true);
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {isOwnAssignment(assignment) && (
                            <div className="inline-flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={assignment.status === 'pending' ? 'default' : 'outline'}
                                disabled={selfStatusLoadingId === assignment.id}
                                onClick={() => handleSelfStatusUpdate(assignment, 'pending')}
                              >
                                Pending
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={assignment.status === 'completed' ? 'default' : 'outline'}
                                disabled={selfStatusLoadingId === assignment.id}
                                onClick={() => handleSelfStatusUpdate(assignment, 'completed')}
                              >
                                Completed
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => {
                const request = getRequestForAssignment(assignment);
                const title = assignment.taskTitle || request?.title || 'Assignment';
                
                return (
                  <div key={assignment.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
                        <p className="text-xs text-gray-500">Team Member: {assignment.assignedToName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Assigned by: {assignment.assignedBy || 'Admin/Executive'}</p>
                        <p className="text-xs text-gray-500">{formatDate(assignment.assignedAt)}</p>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsDetailsOpen(true);
                        }}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      {assignment.status === 'pending' && canApproveAssignment(currentUser) && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            className="flex-1 bg-green-600 text-white hover:bg-green-700"
                            disabled={actionLoadingId === assignment.id}
                            onClick={() => handleApprove(assignment)}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            disabled={actionLoadingId === assignment.id}
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {canUpdateTeamStatus && (
                        <div className="flex flex-wrap gap-2 w-full">
                          <Button
                            type="button"
                            size="sm"
                            variant={assignment.status === 'pending' ? 'default' : 'outline'}
                            className="flex-1"
                            disabled={managerStatusLoadingId === assignment.id}
                            onClick={() => handleManagerStatusUpdate(assignment, 'pending')}
                          >
                            Pending
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={assignment.status === 'completed' ? 'default' : 'outline'}
                            className="flex-1"
                            disabled={managerStatusLoadingId === assignment.id}
                            onClick={() => handleManagerStatusUpdate(assignment, 'completed')}
                          >
                            Completed
                          </Button>
                        </div>
                      )}
                      {!canUpdateTeamStatus && isOwnAssignment(assignment) && (
                        <div className="flex flex-1 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={assignment.status === 'pending' ? 'default' : 'outline'}
                            className="flex-1"
                            disabled={selfStatusLoadingId === assignment.id}
                            onClick={() => handleSelfStatusUpdate(assignment, 'pending')}
                          >
                            Pending
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={assignment.status === 'completed' ? 'default' : 'outline'}
                            className="flex-1"
                            disabled={selfStatusLoadingId === assignment.id}
                            onClick={() => handleSelfStatusUpdate(assignment, 'completed')}
                          >
                            Completed
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Invitations Section */}
      {!isExecutiveView && (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Assignment Invitations</h2>
        {invitations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No pending invitations</p>
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
                      Invited By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map((invitation) => {
                    const request = invitation.requestId ? getRequestById(invitation.requestId) : null;
                    const title = request?.title || 'Assignment Invitation';
                    
                    return (
                      <tr key={invitation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.invitedByName || 'Executive'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invitation.sentAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvitationStatusColor(invitation.status)}`}>
                            {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvitation(invitation);
                              setIsInvitationDetailsOpen(true);
                            }}
                          >
                            <MdInfo size={18} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {invitations.map((invitation) => {
                const request = invitation.requestId ? getRequestById(invitation.requestId) : null;
                const title = request?.title || 'Assignment Invitation';
                
                return (
                  <div key={invitation.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
                        <p className="text-xs text-gray-500">Invited by: {invitation.invitedByName || 'Executive'}</p>
                        <p className="text-xs text-gray-500">{formatDate(invitation.sentAt)}</p>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvitationStatusColor(invitation.status)}`}>
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInvitation(invitation);
                        setIsInvitationDetailsOpen(true);
                      }}
                      className="w-full mt-2"
                    >
                      View Details
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Assignment Details Dialog */}
      {selectedAssignment && isDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Assignment Details</h2>
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedAssignment(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {(() => {
                  const request = getRequestForAssignment(selectedAssignment);
                  const resolvedTitle = selectedAssignment.taskTitle || request?.title || 'Assignment';
                  const resolvedTaskDate = selectedAssignment.taskDate || request?.date || 'N/A';
                  const resolvedTaskTime = selectedAssignment.taskTime || request?.time || 'N/A';
                  const resolvedLocation = selectedAssignment.taskLocation || request?.location || 'N/A';
                  const assignedAt = formatDate(selectedAssignment.assignedAt);
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                        <p className="text-gray-900">{resolvedTitle}</p>
                      </div>
                      {request && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Request Description</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                              <p className="text-gray-900">{request.date}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Time</label>
                              <p className="text-gray-900">{request.time || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                            <p className="text-gray-900">{request.location || 'N/A'}</p>
                          </div>
                        </>
                      )}
                      {!request && selectedAssignment.notes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Task Notes</label>
                          <p className="text-gray-900 whitespace-pre-wrap">{selectedAssignment.notes}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Task Date</label>
                        <p className="text-gray-900">{resolvedTaskDate}</p>
                      </div>
                      {resolvedTaskTime && resolvedTaskTime !== 'N/A' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Task Time</label>
                          <p className="text-gray-900">{resolvedTaskTime}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                        <p className="text-gray-900">{resolvedLocation}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Assigned By</label>
                        <p className="text-gray-900">{selectedAssignment.assignedBy || 'Admin/Executive'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Assigned On</label>
                        <p className="text-gray-900">{assignedAt}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedAssignment.status)}`}>
                          {selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                        </span>
                      </div>
                      {selectedAssignment.notes && request && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Task Notes</label>
                          <p className="text-gray-900 whitespace-pre-wrap">{selectedAssignment.notes}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Details Dialog */}
      {selectedInvitation && isInvitationDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Invitation Details</h2>
                <button
                  onClick={() => {
                    setIsInvitationDetailsOpen(false);
                    setSelectedInvitation(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {(() => {
                  const request = selectedInvitation.requestId ? getRequestById(selectedInvitation.requestId) : null;
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                        <p className="text-gray-900">{request?.title || 'Assignment Invitation'}</p>
                      </div>
                      {request && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                              <p className="text-gray-900">{request.date}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Time</label>
                              <p className="text-gray-900">{request.time || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                            <p className="text-gray-900">{request.location || 'N/A'}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Invited By</label>
                        <p className="text-gray-900">{selectedInvitation.invitedByName || 'Executive'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvitationStatusColor(selectedInvitation.status)}`}>
                          {selectedInvitation.status.charAt(0).toUpperCase() + selectedInvitation.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Sent At</label>
                        <p className="text-gray-900">{formatDate(selectedInvitation.sentAt)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAssignment && (
        <Dialog open={isRejectDialogOpen} onOpenChange={(open) => {
          setIsRejectDialogOpen(open);
          if (!open) {
            setRejectionReason('');
            setActionLoadingId(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Assignment</DialogTitle>
              <DialogDescription>Provide a reason for rejecting "{selectedAssignment.taskTitle || 'Assignment'}".</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setRejectionReason('');
                    setSelectedAssignment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!rejectionReason.trim() || actionLoadingId === selectedAssignment.id}
                  onClick={handleRejectConfirm}
                >
                  Reject
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

