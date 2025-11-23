import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getTeamMembersByExecutive, getStaffers, Staffer, getAssignmentsByStaffer, getCurrentUser } from '@/lib/storage';

export interface InviteDetails {
  stafferIds: string[];
  notes?: string;
  location?: string;
}

interface SendInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId?: string;
  onSend: (details: InviteDetails) => void;
}

export default function SendInviteDialog({
  open,
  onOpenChange,
  requestId: _requestId,
  onSend,
}: SendInviteDialogProps) {
  const [teamMembers, setTeamMembers] = useState<Staffer[]>([]);
  const [selectedStafferIds, setSelectedStafferIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'members' | 'others'>('members');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (open) {
      loadTeamMembers();
      setNotes('');
      setLocation('');
    } else {
      setSelectedStafferIds(new Set());
    }
  }, [open]);

  const loadTeamMembers = () => {
    const user = getCurrentUser();
    
    if (user?.email) {
      // Get team members added by this executive
      const members = getTeamMembersByExecutive(user.email);
      const allStaffers = getStaffers();
      
      // Get staffer objects for team members
      const teamStaffers = members
        .map(member => allStaffers.find(s => s.id === member.stafferId))
        .filter((s): s is Staffer => s !== undefined);
      
      setTeamMembers(teamStaffers);
    }
  };

  const getWorkload = (staffer: Staffer): number => {
    const assignments = getAssignmentsByStaffer(staffer.id, staffer.email);
    return assignments.filter(a => a.status === 'pending').length;
  };

  const handleToggleSelection = (stafferId: string) => {
    const newSelection = new Set(selectedStafferIds);
    if (newSelection.has(stafferId)) {
      newSelection.delete(stafferId);
    } else {
      newSelection.add(stafferId);
    }
    setSelectedStafferIds(newSelection);
  };

  const handleSend = () => {
    if (selectedStafferIds.size > 0) {
      onSend({
        stafferIds: Array.from(selectedStafferIds),
        notes: notes.trim() || undefined,
        location: location.trim() || undefined,
      });
      setSelectedStafferIds(new Set());
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedStafferIds(new Set());
    setNotes('');
    setLocation('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send invite to:</DialogTitle>
          <DialogDescription>
            Select team members to assign this task to.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="others">Others</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <div className="space-y-4">
              {teamMembers.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No team members. Add members in "My Team" first.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Staffer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Workload
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Select
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teamMembers.map((staffer) => {
                          const workload = getWorkload(staffer);
                          const isSelected = selectedStafferIds.has(staffer.id);
                          
                          return (
                            <tr
                              key={staffer.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                    workload > 0 ? 'border-green-500' : 'border-gray-300 bg-gray-100'
                                  }`}>
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
                                  <span className="text-sm font-medium text-gray-900">
                                    {staffer.firstName} {staffer.lastName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {workload}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelection(staffer.id)}
                                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {teamMembers.map((staffer) => {
                      const workload = getWorkload(staffer);
                      const isSelected = selectedStafferIds.has(staffer.id);
                      
                      return (
                        <div
                          key={staffer.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              workload > 0 ? 'border-green-500' : 'border-gray-300 bg-gray-100'
                            }`}>
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
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {staffer.firstName} {staffer.lastName}
                              </p>
                              <p className="text-xs text-gray-500">Workload: {workload}</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelection(staffer.id)}
                            className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded flex-shrink-0 ml-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="others" className="mt-4">
            <div className="space-y-4">
              <p className="text-gray-500 text-center py-8">
                Others tab - can be used for external invites or other staffers
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="invite-notes">
              Notes / Description
            </label>
            <textarea
              id="invite-notes"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add instructions, coverage details, etc."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="invite-location">
              Location (optional)
            </label>
            <input
              id="invite-location"
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-amber-500 focus:border-amber-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location or meeting link"
            />
          </div>
        </div>

        <div className="flex justify-center pt-4 border-t">
          <Button
            type="button"
            onClick={handleSend}
            disabled={selectedStafferIds.size === 0}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8"
          >
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

