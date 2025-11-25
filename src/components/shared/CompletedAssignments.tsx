import { useEffect, useState } from 'react';
import { Assignment, ClientRequest, getAssignments, getRequestById } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { MdInfo } from 'react-icons/md';

interface CompletedAssignmentsProps {
  title?: string;
  sectionFilter?: Assignment['section'][];
  description?: string;
}

export default function CompletedAssignments({
  title = 'Completed Assignments',
  sectionFilter,
  description,
}: CompletedAssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
    };
  }, [sectionFilter?.join(',')]);

  const loadData = () => {
    const allAssignments = getAssignments();
    const completed = allAssignments
      .filter((assignment) => assignment.status === 'completed')
      .filter((assignment) =>
        sectionFilter && sectionFilter.length > 0 ? sectionFilter.includes(assignment.section) : true
      )
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    setAssignments(completed);
  };

  const getRequestForAssignment = (assignment: Assignment): ClientRequest | null => {
    if (assignment.requestId) {
      return getRequestById(assignment.requestId);
    }
    return null;
  };

  const formatDateTime = (value?: string) => {
    if (!value) return 'N/A';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const getStatusColor = () => 'bg-blue-100 text-blue-800';

  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-amber-600">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No completed assignments recorded yet.</p>
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
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => {
                  const request = getRequestForAssignment(assignment);
                  const title = assignment.taskTitle || request?.title || 'Assignment';
                  const taskDate = assignment.taskDate || request?.date || assignment.assignedAt;
                  return (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.assignedToName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {assignment.section}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(taskDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor()}`}
                        >
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {assignments.map((assignment) => {
              const request = getRequestForAssignment(assignment);
              const title = assignment.taskTitle || request?.title || 'Assignment';
              const taskDate = assignment.taskDate || request?.date || assignment.assignedAt;

              return (
                <div key={assignment.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
                      <p className="text-xs text-gray-500">{assignment.assignedToName || 'N/A'}</p>
                      <p className="text-xs text-gray-500 capitalize">Section: {assignment.section}</p>
                      <p className="text-xs text-gray-500">{formatDate(taskDate)}</p>
                    </div>
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor()}`}
                    >
                      Completed
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setIsDetailsOpen(true);
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

      {/* Details Dialog */}
      {selectedAssignment && isDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
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
                  const assignedOn = formatDateTime(selectedAssignment.assignedAt);
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                        <p className="text-gray-900">{resolvedTitle}</p>
                      </div>
                      {request && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              Request Description
                            </label>
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
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Request Location</label>
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
                        <label className="block text-sm font-medium text-gray-500 mb-1">Assigned To</label>
                        <p className="text-gray-900">{selectedAssignment.assignedToName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Assigned By</label>
                        <p className="text-gray-900">{selectedAssignment.assignedBy || 'Admin/Executive'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Assigned On</label>
                        <p className="text-gray-900">{assignedOn}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor()}`}
                        >
                          Completed
                        </span>
                      </div>
                      {request && request.approvalNotes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">Request Approval Notes</label>
                          <p className="text-gray-900 whitespace-pre-wrap bg-green-50 p-3 rounded border border-green-200">
                            {request.approvalNotes}
                          </p>
                        </div>
                      )}
                      {request && selectedAssignment.notes && (
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
    </div>
  );
}


