import { useState, useEffect } from 'react';
import { getTeamMembersByExecutive, getStaffers, Staffer, addTeamMember, removeTeamMember, getCurrentUser, TeamMember, getAssignmentsByStaffer, createStaffer, updateStaffer, getStafferById } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StafferForm from '@/components/admin/staffers/StafferForm';

const SECTION_LABELS: Record<Staffer['section'], string> = {
  executives: 'Executives',
  scribes: 'Scribes',
  creatives: 'Creatives',
  managerial: 'Managerial',
  clients: 'Clients',
};

export default function MyTeam() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableStaffers, setAvailableStaffers] = useState<Staffer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaffer, setEditingStaffer] = useState<Staffer | null>(null);
  const [selectedSection, setSelectedSection] = useState<Staffer['section'] | 'all'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('teamUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('teamUpdated', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    if (user?.email) {
      // Get team members added by this executive
      const members = getTeamMembersByExecutive(user.email);
      setTeamMembers(members);
      
      // Get all staffers (excluding executives)
      const allStaffers = getStaffers();
      const nonExecutives = allStaffers.filter(s => 
        s.section !== 'executives'
      );
      setAvailableStaffers(nonExecutives);
    }
  };

  const handleAddMember = (staffer: Staffer) => {
    if (!currentUser) return;
    
    addTeamMember({
      stafferId: staffer.id,
      stafferName: `${staffer.firstName} ${staffer.lastName}`,
      section: staffer.section,
      addedBy: currentUser.email || currentUser.id,
      addedByName: currentUser.name || 'Executive',
    });
    
    setIsAddDialogOpen(false);
    loadData(); // Reload to refresh the list
  };

  const handleCreateStaffer = (stafferData: Omit<Staffer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      setSuccess(null);
      
      // Ensure executives cannot create executive accounts
      if (stafferData.section === 'executives') {
        setError('Executives cannot create executive accounts. Please select Scribes, Creatives, or Managerial.');
        return;
      }
      
      // Create the staffer account
      const newStaffer = createStaffer(stafferData);
      
      // Automatically add the newly created staffer to the executive's team
      if (currentUser) {
        addTeamMember({
          stafferId: newStaffer.id,
          stafferName: `${newStaffer.firstName} ${newStaffer.lastName}`,
          section: newStaffer.section,
          addedBy: currentUser.email || currentUser.id,
          addedByName: currentUser.name || 'Executive',
        });
      }
      
      setSuccess('Staffer account created and added to your team successfully!');
      setIsCreateDialogOpen(false);
      loadData(); // Reload to refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error creating staffer:', error);
      setError(error?.message || 'Failed to create staffer account. Please try again.');
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    const staffer = getStafferById(member.stafferId);
    if (staffer) {
      setEditingStaffer(staffer);
      setIsEditDialogOpen(true);
    } else {
      setError('Staffer not found. Please refresh the page.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleUpdateStaffer = (stafferData: Omit<Staffer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!editingStaffer) return;
      
      // Ensure executives cannot edit staffers to become executives
      if (stafferData.section === 'executives') {
        setError('Executives cannot change staffers to executive accounts. Please select Scribes, Creatives, or Managerial.');
        return;
      }
      
      // Update the staffer account
      // Only include password if it's provided and not empty
      const updates: Partial<Staffer> = {
        firstName: stafferData.firstName,
        lastName: stafferData.lastName,
        email: stafferData.email,
        position: stafferData.position,
        section: stafferData.section,
        avatar: stafferData.avatar,
      };
      
      // Only add password if it's provided and not empty
      if (stafferData.password && stafferData.password.trim() !== '') {
        updates.password = stafferData.password;
      }
      
      const updatedStaffer = updateStaffer(editingStaffer.id, updates);
      
      if (updatedStaffer) {
        // Update team member name if it changed
        const member = teamMembers.find(m => m.stafferId === editingStaffer.id);
        if (member && (member.stafferName !== `${updatedStaffer.firstName} ${updatedStaffer.lastName}`)) {
          // The team member name will be updated automatically on next load
          // since it's derived from the staffer data
        }
        
        setSuccess('Staffer account updated successfully!');
        setIsEditDialogOpen(false);
        setEditingStaffer(null);
        loadData(); // Reload to refresh the list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to update staffer account');
      }
    } catch (error: any) {
      console.error('Error updating staffer:', error);
      setError(error?.message || 'Failed to update staffer account. Please try again.');
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member from your team?')) {
      removeTeamMember(memberId);
      setSuccess('Team member removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const getTaskCount = (stafferId: string): number => {
    // Get assignments for this staffer
    const staffer = getStafferById(stafferId);
    const assignments = getAssignmentsByStaffer(stafferId, staffer?.email);
    return assignments.length;
  };

  const filteredStaffers = selectedSection === 'all'
    ? availableStaffers
    : availableStaffers.filter(s => s.section === selectedSection);

  // Filter out staffers already in team
  const availableToAdd = filteredStaffers.filter(staffer => 
    !teamMembers.some(member => member.stafferId === staffer.id)
  );

  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-600">My Team</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <MdAdd size={20} />
            Create Account
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
          >
            <MdAdd size={20} />
            Add Member
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. of tasks catered
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    No team members yet. Click "Create Account" or "Add Member" to add staffers to your team.
                  </td>
                </tr>
              ) : (
                teamMembers.map((member) => {
                  const staffer = availableStaffers.find(s => s.id === member.stafferId);
                  const taskCount = getTaskCount(member.stafferId);
                  
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                            taskCount > 0 ? 'border-green-500' : 'border-gray-300 bg-gray-100'
                          }`}>
                            {staffer?.avatar ? (
                              <img
                                src={staffer.avatar}
                                alt={member.stafferName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-600 font-medium">
                                {member.stafferName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {member.stafferName}
                          </span>
                          <div className="ml-auto flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMember(member);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <MdEdit size={18} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveMember(member.id);
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <MdDelete size={18} />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {taskCount}
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
          {teamMembers.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No team members yet. Click "Create Account" or "Add Member" to add staffers to your team.
            </div>
          ) : (
            teamMembers.map((member) => {
              const staffer = availableStaffers.find(s => s.id === member.stafferId);
              const taskCount = getTaskCount(member.stafferId);
              
              return (
                <div
                  key={member.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        taskCount > 0 ? 'border-green-500' : 'border-gray-300 bg-gray-100'
                      }`}>
                        {staffer?.avatar ? (
                          <img
                            src={staffer.avatar}
                            alt={member.stafferName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-600 font-medium">
                            {member.stafferName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {member.stafferName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMember(member);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        <MdEdit size={18} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(member.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <MdDelete size={18} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 ml-[52px]">Tasks: {taskCount}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as Staffer['section'] | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Sections</option>
                <option value="scribes">Scribes</option>
                <option value="creatives">Creatives</option>
                <option value="managerial">Managerial</option>
                <option value="clients">Clients</option>
              </select>
            </div>

            <div className="space-y-2">
              {availableToAdd.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No available staffers to add
                </p>
              ) : (
                availableToAdd.map((staffer) => (
                  <div
                    key={staffer.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        {staffer.avatar ? (
                          <img
                            src={staffer.avatar}
                            alt={staffer.firstName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-600 font-medium">
                            {staffer.firstName.charAt(0)}{staffer.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {staffer.firstName} {staffer.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {SECTION_LABELS[staffer.section]}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleAddMember(staffer)}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Staffer Account Dialog */}
      <StafferForm
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setError(null);
            setSuccess(null);
          }
        }}
        onSave={handleCreateStaffer}
        editingStaffer={null}
        restrictSections={['scribes', 'creatives', 'managerial']} // Executives can only create non-executive accounts
      />

      {/* Edit Staffer Account Dialog */}
      <StafferForm
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingStaffer(null);
            setError(null);
            setSuccess(null);
          }
        }}
        onSave={handleUpdateStaffer}
        editingStaffer={editingStaffer}
        restrictSections={['scribes', 'creatives', 'managerial']} // Executives can only edit to non-executive accounts
      />
    </div>
  );
}

