import { useState, useEffect } from 'react';
import { getAssignmentsByStaffer, getCurrentUser, Assignment, updateAssignment, getRequestById, ClientRequest } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { MdInfo } from 'react-icons/md';

export default function StafferAssignment() {
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
  }, []);

  const loadData = () => {
    const user = getCurrentUser();
    
    if (user?.id || user?.email) {
      const myAssignments = getAssignmentsByStaffer(user.id, user.email);
      setAssignments(myAssignments);
    }
  };

  const handleStatusChange = (assignmentId: string, newStatus: 'pending' | 'completed') => {
    updateAssignment(assignmentId, { status: newStatus });
    loadData();
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

  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-amber-600">My Assignments</h1>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No assignments yet</p>
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
                    Date
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
                {assignments.map((assignment) => {
                  const request = getRequestForAssignment(assignment);
                  const title = assignment.taskTitle || request?.title || 'Assignment';
                  const date = assignment.taskDate || request?.date || assignment.assignedAt;
                  
                  return (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {assignment.status === 'approved' && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleStatusChange(assignment.id, 'completed')}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Mark Complete
                            </Button>
                          )}
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
                        </div>
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
              const date = assignment.taskDate || request?.date || assignment.assignedAt;
              
              return (
                <div key={assignment.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
                      <p className="text-xs text-gray-500">{formatDate(date)}</p>
                    </div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </div>
                  {assignment.status === 'approved' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleStatusChange(assignment.id, 'completed')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                    >
                      Mark Complete
                    </Button>
                  )}
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
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                        <p className="text-gray-900">{selectedAssignment.taskTitle || request?.title || 'Assignment'}</p>
                      </div>
                      {request && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
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
                        <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedAssignment.status)}`}>
                          {selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                        </span>
                      </div>
                      {selectedAssignment.status === 'approved' && (
                        <Button
                          type="button"
                          onClick={() => {
                            handleStatusChange(selectedAssignment.id, 'completed');
                            setIsDetailsOpen(false);
                            setSelectedAssignment(null);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Mark as Completed
                        </Button>
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

