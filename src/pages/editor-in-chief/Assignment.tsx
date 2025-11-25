import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAssignments,
  getRequests,
  ClientRequest,
  Assignment,
  getCurrentUser,
  createInvitation,
  getInvitationsByExecutive,
  AssignmentInvitation,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getStaffers,
  Staffer,
  getTeamMembersByExecutive,
  approveAssignment,
  rejectAssignment,
  canApproveAssignment,
  getStafferById,
} from '@/lib/storage';
import SendInviteDialog, { InviteDetails } from '@/components/executive/SendInviteDialog';
import TeamTaskDialog, { TeamTaskFormData } from '@/components/executive/TeamTaskDialog';
import RejectedAssignments from '@/components/shared/RejectedAssignments';
import CompletedAssignments from '@/components/shared/CompletedAssignments';
import { Button } from '@/components/ui/button';
import { MdAdd, MdCheck, MdClose, MdEdit, MdDelete } from 'react-icons/md';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function ExecutiveAssignment() {
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [assignmentsNeedingApproval, setAssignmentsNeedingApproval] = useState<Assignment[]>([]);
  const [executiveAssignments, setExecutiveAssignments] = useState<Assignment[]>([]);
  const [invitations, setInvitations] = useState<AssignmentInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approval' | 'invitation' | 'rejected' | 'completed'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<Staffer[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Assignment | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [allRequests, setAllRequests] = useState<ClientRequest[]>([]);
  const [statusDraft, setStatusDraft] = useState<Assignment['status']>('pending');
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [isNotesDirty, setIsNotesDirty] = useState(false);
  const [isNotesSaving, setIsNotesSaving] = useState(false);

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
  
  useEffect(() => {
    if (pendingAssignments.length === 0) {
      setActiveAssignment(null);
      setSelectedRequest(null);
      return;
    }
    
    const exists = activeAssignment
      ? pendingAssignments.find((assignment) => assignment.id === activeAssignment.id)
      : null;
    
    if (!exists) {
      const next = pendingAssignments[0];
      setActiveAssignment(next);
      setSelectedRequest(next.requestId ? getRequestForAssignment(next) : null);
    }
  }, [pendingAssignments, activeAssignment]);

  useEffect(() => {
    if (!activeAssignment) {
      setStatusDraft('pending');
      setNotesDraft('');
      setIsNotesDirty(false);
      return;
    }
    setStatusDraft(activeAssignment.status);
    setNotesDraft(activeAssignment.notes || '');
    setIsNotesDirty(false);
  }, [activeAssignment]);

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    if (user?.email) {
      const requests = getRequests();
      setAllRequests(requests);
      const allAssignments = getAssignments();
      const allStaffers = getStaffers();
      
      // Get assignments assigned to this executive's team members
      const teamMemberRecords = getTeamMembersByExecutive(user.email);
      const teamMemberIds = teamMemberRecords.map(m => m.stafferId);
      const memberStaffers = teamMemberRecords
        .map(member => allStaffers.find((s: Staffer) => s.id === member.stafferId))
        .filter((s): s is Staffer => Boolean(s));
      setTeamMembers(memberStaffers);
      const teamMemberTokenSet = new Set<string>();
      teamMemberIds.forEach(id => {
        if (id) {
          teamMemberTokenSet.add(id.toLowerCase());
        }
      });
      memberStaffers.forEach(member => {
        if (member.email) {
          teamMemberTokenSet.add(member.email.toLowerCase());
        }
      });
      
      // Get executive's own ID/email for filtering admin-assigned tasks
      const executiveId = user.id || user.email;
      const executiveTokenSet = new Set<string>();
      [executiveId, user.id, user.email].forEach(value => {
        if (value) {
          executiveTokenSet.add(value.toLowerCase());
        }
      });

      const collectRecipientTokens = (assignment: Assignment): string[] => {
        return [
          assignment.assignedTo,
          assignment.assignedToId,
          assignment.assignedToEmail,
        ]
          .filter((value): value is string => Boolean(value))
          .map((value) => value.toLowerCase());
      };
      
      // Determine assignment matches
      const assignmentsWithMatches = allAssignments.map((assignment) => {
        const recipients = collectRecipientTokens(assignment);
        const matchesTeamMember = recipients.some((recipient) => teamMemberTokenSet.has(recipient));
        const matchesExecutive = recipients.some((recipient) => executiveTokenSet.has(recipient));
        return { assignment, matchesTeamMember, matchesExecutive };
      });

      // Get assignments for team members AND assignments assigned directly to this executive (from admin)
      const teamAssignments = assignmentsWithMatches
        .filter(({ matchesTeamMember, matchesExecutive }) => matchesTeamMember || matchesExecutive)
        .map(({ assignment }) => assignment);

      const directExecutiveAssignments = assignmentsWithMatches
        .filter(({ matchesExecutive }) => matchesExecutive)
        .map(({ assignment }) => assignment);
      setExecutiveAssignments(directExecutiveAssignments);
      
      setPendingAssignments(teamAssignments.filter(a => a.status === 'pending' || a.status === 'approved'));
      
      // Get assignments that need approval (pending status, assigned to team members OR directly to executive)
      // Include assignments created by this executive (they can approve/reject their own assignments)
      // Only show if user can approve
      if (canApproveAssignment(user)) {
        const needsApproval = allAssignments.filter((assignment) => {
          if (assignment.status !== 'pending') {
            return false;
          }
          const recipients = collectRecipientTokens(assignment);
          const matchesTeamMember = recipients.some((recipient) => teamMemberTokenSet.has(recipient));
          const matchesExecutive = recipients.some((recipient) => executiveTokenSet.has(recipient));
          return matchesTeamMember || matchesExecutive;
        });
        setAssignmentsNeedingApproval(needsApproval);
      }
      
      // Get invitations sent by this executive
      const myInvitations = getInvitationsByExecutive(user.email || user.id);
      setInvitations(myInvitations);
    }
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    setActiveAssignment(assignment);
    const request = getRequestForAssignment(assignment);
    if (request) {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
    } else {
      setSelectedRequest(null);
      setIsDetailsOpen(false);
    }
  };

  const handleSendInvite = (request: ClientRequest) => {
    setSelectedRequest(request);
    setIsInviteDialogOpen(true);
  };

  const handleInviteSend = ({ stafferIds, notes, location }: InviteDetails) => {
    if (!selectedRequest || !currentUser) return;
    
    // Create assignment first
    const staffers = getStaffers();
    
    stafferIds.forEach(stafferId => {
      const staffer = staffers.find((s: any) => s.id === stafferId);
      if (staffer) {
        // Create assignment (status will be 'pending' by default and needs approval)
        const assignment = createAssignment({
          requestId: selectedRequest.id,
          assignedTo: staffer.id,
          assignedToId: staffer.id,
          assignedToEmail: staffer.email,
          assignedToName: `${staffer.firstName} ${staffer.lastName}`,
          section: staffer.section,
          assignedBy: currentUser.name || 'Executive',
          notes: notes || undefined,
          taskLocation: location || undefined,
        });
        
        // Create invitation
        createInvitation({
          assignmentId: assignment.id,
          requestId: selectedRequest.id,
          invitedTo: stafferId,
          invitedToName: `${staffer.firstName} ${staffer.lastName}`,
          invitedBy: currentUser.email || currentUser.id,
          invitedByName: currentUser.name || 'Executive',
          status: 'pending',
        });
      }
    });
    
    loadData();
    setSelectedRequest(null);
  };

  const canManageTask = (assignment: Assignment) => {
    if (!currentUser) return false;
    if (assignment.requestId) return false;
    const identifier = currentUser.email || currentUser.id;
    return assignment.assignedByEmail === identifier || assignment.assignedBy === currentUser.name;
  };

  const handleTaskCreate = () => {
    if (teamMembers.length === 0) {
      alert('Add team members in My Team before creating tasks.');
      return;
    }
    setEditingTask(null);
    setIsTaskDialogOpen(true);
  };

  const handleTaskEdit = (assignment: Assignment) => {
    setEditingTask(assignment);
    setIsTaskDialogOpen(true);
  };

  const handleTaskDelete = (assignment: Assignment) => {
    if (!window.confirm('Delete this task?')) return;
    const removed = deleteAssignment(assignment.id);
    if (removed && activeAssignment?.id === assignment.id) {
      setActiveAssignment(null);
    }
    loadData();
  };

  const handleTaskDialogOpenChange = (open: boolean) => {
    setIsTaskDialogOpen(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  const handleTaskDialogSubmit = (data: TeamTaskFormData) => {
    if (!currentUser) return;
    const staffer = teamMembers.find((member) => member.id === data.stafferId);
    if (!staffer) return;
  const locationValue = data.location?.trim();

    if (editingTask) {
      updateAssignment(editingTask.id, {
        assignedTo: staffer.id,
        assignedToId: staffer.id,
        assignedToEmail: staffer.email,
        assignedToName: `${staffer.firstName} ${staffer.lastName}`,
        section: staffer.section,
        taskTitle: data.title,
        taskDate: data.date,
        taskTime: data.time || undefined,
        notes: data.description,
      taskLocation: locationValue || undefined,
      });
    } else {
      createAssignment({
        assignedTo: staffer.id,
        assignedToId: staffer.id,
        assignedToEmail: staffer.email,
        assignedToName: `${staffer.firstName} ${staffer.lastName}`,
        section: staffer.section,
        assignedBy: currentUser.name || 'Executive',
        taskTitle: data.title,
        taskDate: data.date,
        taskTime: data.time || undefined,
        notes: data.description,
      taskLocation: locationValue || undefined,
      });
    }

    loadData();
    setEditingTask(null);
    setIsTaskDialogOpen(false);
  };

  const handleStatusUpdate = () => {
    if (!activeAssignment || statusDraft === activeAssignment.status) return;
    setIsStatusSaving(true);
    updateAssignment(activeAssignment.id, { status: statusDraft });
    setTimeout(() => {
      loadData();
      setIsStatusSaving(false);
    }, 0);
  };

  const handleNotesSave = () => {
    if (!activeAssignment) return;
    setIsNotesSaving(true);
    updateAssignment(activeAssignment.id, { notes: notesDraft.trim() || undefined });
    setTimeout(() => {
      loadData();
      setIsNotesSaving(false);
      setIsNotesDirty(false);
    }, 0);
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

  const handleApprove = (assignment: Assignment) => {
    try {
      approveAssignment(assignment.id);
      loadData();
      setSelectedAssignment(null);
    } catch (error: any) {
      alert(error.message || 'Failed to approve assignment');
    }
  };

  const handleReject = () => {
    if (!selectedAssignment || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      rejectAssignment(selectedAssignment.id, rejectionReason);
      loadData();
      setIsRejectDialogOpen(false);
      setSelectedAssignment(null);
      setRejectionReason('');
    } catch (error: any) {
      alert(error.message || 'Failed to reject assignment');
    }
  };

  const getRequestForAssignment = (assignment: Assignment): ClientRequest | null => {
    if (!assignment.requestId) return null;
    return allRequests.find((r) => r.id === assignment.requestId) || null;
  };

  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-amber-600">Assignment</h1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto flex flex-wrap overflow-x-auto">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm sm:text-base whitespace-nowrap"
          >
            My Assignments
          </TabsTrigger>
          {canApproveAssignment(currentUser) && (
            <TabsTrigger
              value="approval"
              className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm sm:text-base whitespace-nowrap"
            >
              Approve Assignments
            </TabsTrigger>
          )}
          <TabsTrigger
            value="invitation"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm sm:text-base whitespace-nowrap"
          >
            Invitations
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm sm:text-base whitespace-nowrap"
          >
            Rejected
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 rounded-none text-sm sm:text-base whitespace-nowrap"
          >
            Completed
          </TabsTrigger>
        </TabsList>
          <Button
            type="button"
            onClick={handleTaskCreate}
            disabled={teamMembers.length === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 self-end sm:self-auto"
            title={teamMembers.length === 0 ? 'Add members in My Team first' : undefined}
          >
            <MdAdd size={18} />
            Add Task
          </Button>
        </div>

        <div className="mt-6">
          {activeTab === 'approval' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task/Request
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignmentsNeedingApproval.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No assignments pending approval
                        </td>
                      </tr>
                    ) : (
                      assignmentsNeedingApproval.map((assignment) => {
                        const request = getRequestForAssignment(assignment);
                        const title = assignment.taskTitle || request?.title || 'Task Assignment';
                        
                        return (
                          <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment.assignedToName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment.assignedBy || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(assignment.assignedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleApprove(assignment)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <MdCheck size={18} />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setIsRejectDialogOpen(true);
                                  }}
                                >
                                  <MdClose size={18} />
                                </Button>
                              </div>
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
                {assignmentsNeedingApproval.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No assignments pending approval
                  </div>
                ) : (
                  assignmentsNeedingApproval.map((assignment) => {
                    const request = getRequestForAssignment(assignment);
                    const title = assignment.taskTitle || request?.title || 'Task Assignment';
                    
                    return (
                      <div key={assignment.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                              {title}
                            </h3>
                            <p className="text-xs text-gray-500">Assigned to: {assignment.assignedToName}</p>
                            <p className="text-xs text-gray-500">By: {assignment.assignedBy || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{formatDate(assignment.assignedAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleApprove(assignment)}
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                          >
                            <MdCheck size={18} className="mr-1" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setIsRejectDialogOpen(true);
                            }}
                            className="flex-1"
                          >
                            <MdClose size={18} className="mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeTab === 'pending' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Assignment List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4">My Team Assignments</h3>
                {pendingAssignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No assignments</p>
                ) : (
                  <div className="space-y-2">
                    {pendingAssignments.map((assignment) => {
                      const request = getRequestForAssignment(assignment);
                      const title = assignment.taskTitle || request?.title || 'Assignment';
                      const assignmentDate = assignment.taskDate || request?.date || assignment.assignedAt;
                      const statusColor = assignment.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800';
                      const canManage = canManageTask(assignment);
                      
                      return (
                        <div
                          key={assignment.id}
                          onClick={() => handleAssignmentClick(assignment)}
                          className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-900">{title}</p>
                              <p className="text-sm text-gray-500">Assigned to: {assignment.assignedToName}</p>
                              {assignmentDate && (
                                <p className="text-sm text-gray-500">{formatDate(assignmentDate)}</p>
                              )}
                              {assignment.taskTime && (
                                <p className="text-xs text-gray-500">Time: {assignment.taskTime}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </span>
                              {canManage && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTaskEdit(assignment);
                                    }}
                                  >
                                    <MdEdit size={16} />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTaskDelete(assignment);
                                    }}
                                  >
                                    <MdDelete size={16} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Details Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                {activeAssignment ? (
                  (() => {
                    const request = getRequestForAssignment(activeAssignment);
                    const stafferInfo = getStafferById(activeAssignment.assignedTo);
                    const assignedToName = stafferInfo
                      ? `${stafferInfo.firstName} ${stafferInfo.lastName}`
                      : activeAssignment.assignedToName;
                    const assignedToEmail = stafferInfo?.email || activeAssignment.assignedTo;
                    const assignedByEmail = activeAssignment.assignedByEmail;
                    const assignedByName = activeAssignment.assignedBy || currentUser?.name || assignedByEmail || 'N/A';
                    const canManage = canManageTask(activeAssignment);
                    const taskDateDisplay = activeAssignment.taskDate
                      ? formatDate(activeAssignment.taskDate)
                      : request?.date || formatDate(activeAssignment.assignedAt);
                    const statusClass =
                      activeAssignment.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : activeAssignment.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : activeAssignment.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800';

                    return (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Task Title</label>
                          <p className="text-gray-900">
                            {activeAssignment.taskTitle || request?.title || 'Untitled Task'}
                          </p>
                        </div>

                        {request ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-500 mb-1">Request Details</label>
                              <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Request Date</label>
                                <p className="text-gray-900">{request.date}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Request Time</label>
                                <p className="text-gray-900">{request.time || 'N/A'}</p>
                              </div>
                            </div>
                        <div className="pt-2">
                          <Button
                            type="button"
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => handleSendInvite(request)}
                          >
                            Assign Another Member
                          </Button>
                        </div>
                          </>
                        ) : null}

                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                          {canManage ? (
                            <div className="space-y-2">
                              <textarea
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                                rows={4}
                                value={notesDraft}
                                onChange={(e) => {
                                  setNotesDraft(e.target.value);
                                  setIsNotesDirty(true);
                                }}
                                placeholder="Add instructions or reminders for this assignment"
                              />
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleNotesSave}
                                  disabled={isNotesSaving || !isNotesDirty}
                                >
                                  {isNotesSaving ? 'Saving...' : 'Save Notes'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {activeAssignment.notes || 'No additional notes'}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Assigned To</label>
                            <p className="text-gray-900">{assignedToName}</p>
                            <p className="text-xs text-gray-500 break-all">{assignedToEmail}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Assigned By</label>
                            <p className="text-gray-900">{assignedByName}</p>
                            {assignedByEmail && (
                              <p className="text-xs text-gray-500 break-all">{assignedByEmail}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                            <p className="text-gray-900">{taskDateDisplay}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Time</label>
                            <p className="text-gray-900">
                              {activeAssignment.taskTime || request?.time || 'N/A'}
                            </p>
                          </div>
                        </div>
                      {(activeAssignment.taskLocation || request?.location) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                          <p className="text-gray-900">
                            {activeAssignment.taskLocation || request?.location}
                          </p>
                        </div>
                      )}

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}
                            >
                              {activeAssignment.status.charAt(0).toUpperCase() + activeAssignment.status.slice(1)}
                            </span>
                            <div className="flex items-center gap-2">
                              <select
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                                value={statusDraft}
                                onChange={(e) => setStatusDraft(e.target.value as Assignment['status'])}
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="completed">Completed</option>
                                <option value="rejected">Rejected</option>
                              </select>
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleStatusUpdate}
                                disabled={isStatusSaving || statusDraft === activeAssignment.status}
                              >
                                {isStatusSaving ? 'Updating...' : 'Update'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                          {canManage && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleTaskEdit(activeAssignment)}
                              >
                                Edit Task
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleTaskDelete(activeAssignment)}
                              >
                                Delete Task
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-gray-500 text-center py-8">Select an assignment to view details</p>
                )}
              </div>
            </div>
          ) : activeTab === 'invitation' ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Assignments Awaiting Your Response</h2>
                    <p className="text-sm text-gray-500">
                      Review tasks assigned directly to you. Approve or reject them here.
                    </p>
                  </div>
                  {executiveAssignments.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No assignments to review.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Assigned By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Assigned At
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
                          {executiveAssignments.map((assignment) => {
                            const request = getRequestForAssignment(assignment);
                            const title = assignment.taskTitle || request?.title || 'Assignment';
                            return (
                              <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {title}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {assignment.assignedBy || 'Admin/Executive'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(assignment.assignedAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      assignment.status === 'approved'
                                        ? 'bg-green-100 text-green-800'
                                        : assignment.status === 'rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : assignment.status === 'completed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setActiveAssignment(assignment);
                                      const req = getRequestForAssignment(assignment);
                                      setSelectedRequest(req);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    Details
                                  </Button>
                                  {assignment.status === 'pending' && (
                                    <>
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="bg-green-600 text-white hover:bg-green-700"
                                        onClick={() => handleApprove(assignment)}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          setSelectedAssignment(assignment);
                                          setIsRejectDialogOpen(true);
                                        }}
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Invitations Sent</h2>
                      <p className="text-sm text-gray-500">
                        Track invitations you&apos;ve sent to your team members.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (teamMembers.length === 0) {
                          alert('Add team members before sending invitations.');
                          return;
                        }
                        setIsInviteDialogOpen(true);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Send Invitation
                    </Button>
                  </div>

                  {invitations.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No invitations sent</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Invited To
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sent At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {invitations.map((invitation) => {
                            const allRequests = getRequests();
                            const request = allRequests.find(r => r.id === invitation.requestId);
                            
                            return (
                              <tr key={invitation.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {request?.title || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {invitation.invitedToName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      invitation.status === 'accepted'
                                        ? 'bg-green-100 text-green-800'
                                        : invitation.status === 'declined'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(invitation.sentAt)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'rejected' ? (
            <RejectedAssignments
              title="Rejected Assignments"
              description="All rejected assignments for executives."
              sectionFilter={['executives']}
            />
          ) : activeTab === 'completed' ? (
            <CompletedAssignments
              title="Completed Assignments"
              description="All completed assignments for executives."
              sectionFilter={['executives']}
            />
          ) : null}
        </div>
      </Tabs>

      <TeamTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={handleTaskDialogOpenChange}
        teamMembers={teamMembers}
        onSubmit={handleTaskDialogSubmit}
        initialData={
          editingTask
            ? {
                assignmentId: editingTask.id,
                stafferId: editingTask.assignedTo,
                title: editingTask.taskTitle || '',
                description: editingTask.notes || '',
                date: editingTask.taskDate || editingTask.assignedAt.split('T')[0],
                time: editingTask.taskTime || '',
                location: editingTask.taskLocation || '',
              }
            : undefined
        }
      />

      <SendInviteDialog
        open={isInviteDialogOpen}
        onOpenChange={(open) => {
          setIsInviteDialogOpen(open);
          if (!open) {
            setSelectedRequest(null);
          }
        }}
        requestId={selectedRequest?.id || ''}
        onSend={handleInviteSend}
      />

      {/* Reject Assignment Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={(open) => {
        setIsRejectDialogOpen(open);
        if (!open) {
          setRejectionReason('');
          setSelectedAssignment(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Assignment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                required
                placeholder="Enter reason for rejection..."
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionReason('');
                  setSelectedAssignment(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="w-full sm:w-auto"
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      {selectedRequest && isDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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

