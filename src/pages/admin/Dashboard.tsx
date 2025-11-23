import { useState, useEffect } from 'react';
import { getRequests, getStaffers, Staffer, getAssignments } from '@/lib/storage';

export default function AdminDashboard() {
  const [totalRequests, setTotalRequests] = useState(0);
  const [approvedRequests, setApprovedRequests] = useState(0);
  const [deniedRequests, setDeniedRequests] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [taskDistribution, setTaskDistribution] = useState<Array<{
    staffer: Staffer;
    taskCount: number;
  }>>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Listen for storage changes to refresh data
    const handleStorageChange = () => {
      loadDashboardData();
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

  const loadDashboardData = () => {
    const allRequests = getRequests();
    const allAssignments = getAssignments();
    const staffers = getStaffers();
    
    // Calculate statistics
    const total = allRequests.length;
    const approved = allRequests.filter(r => r.status === 'approved').length;
    const denied = allRequests.filter(r => r.status === 'denied').length;
    const completed = allAssignments.filter(a => a.status === 'completed').length;
    
    setTotalRequests(total);
    setApprovedRequests(approved);
    setDeniedRequests(denied);
    setCompletedTasks(completed);
    
    // Calculate task distribution based on actual assignments
    const distribution = staffers.map(staffer => {
      // Count assignments for this staffer (from both requests and calendar)
      const stafferTokens = [staffer.id, staffer.email]
        .filter((value): value is string => Boolean(value))
        .map(value => value.toLowerCase());
      const taskCount = allAssignments.filter(assignment => {
        const recipients = [
          assignment.assignedTo,
          assignment.assignedToId,
          assignment.assignedToEmail,
        ]
          .filter((value): value is string => Boolean(value))
          .map(value => value.toLowerCase());
        return recipients.some(recipient => stafferTokens.includes(recipient));
      }).length;
      
      return {
        staffer,
        taskCount: taskCount || 0,
      };
    }).filter(item => item.taskCount > 0); // Only show staffers with tasks
    
    // Sort by task count descending
    distribution.sort((a, b) => b.taskCount - a.taskCount);
    
    setTaskDistribution(distribution);
  };

  return (
    <div className="px-4 md:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-amber-600">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total no. of requests</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalRequests}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total no. of approved requests</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{approvedRequests}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Total no. of denied requests</h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{deniedRequests}</p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task distribution</h3>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Staffer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">No. of tasks catered</th>
                </tr>
              </thead>
              <tbody>
                {taskDistribution.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500">
                      No task distribution data available
                    </td>
                  </tr>
                ) : (
                  taskDistribution.map((item) => (
                    <tr key={item.staffer.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center">
                            {item.staffer.avatar ? (
                              <img
                                src={item.staffer.avatar}
                                alt={item.staffer.firstName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-green-600 font-medium">
                                {item.staffer.firstName.charAt(0)}{item.staffer.lastName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.staffer.firstName} {item.staffer.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.taskCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {taskDistribution.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No task distribution data available
              </div>
            ) : (
              taskDistribution.map((item) => (
                <div key={item.staffer.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-green-500 flex items-center justify-center">
                      {item.staffer.avatar ? (
                        <img
                          src={item.staffer.avatar}
                          alt={item.staffer.firstName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-green-600 font-medium">
                          {item.staffer.firstName.charAt(0)}{item.staffer.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.staffer.firstName} {item.staffer.lastName}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">{item.taskCount}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Total no. of completed task</h3>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600">{completedTasks}</p>
        </div>
      </div>
    </div>
  );
}
