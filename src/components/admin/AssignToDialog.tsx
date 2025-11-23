import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getStaffers, Staffer } from '@/lib/storage';

interface AssignToDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (staffer: Staffer) => void;
}

const SECTION_LABELS: Record<Staffer['section'], string> = {
  executives: 'Executives',
  scribes: 'Scribes',
  creatives: 'Creatives',
  managerial: 'Managerial',
  clients: 'Clients',
};

export default function AssignToDialog({
  open,
  onOpenChange,
  onAssign,
}: AssignToDialogProps) {
  const [staffers, setStaffers] = useState<Staffer[]>([]);
  const [selectedStafferId, setSelectedStafferId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Get all staffers, preferably section heads
      const allStaffers = getStaffers();
      // Filter for section heads or all staffers if no section heads
      const sectionHeads = allStaffers.filter(s => 
        s.position.toLowerCase().includes('section head') || 
        s.position.toLowerCase().includes('head')
      );
      setStaffers(sectionHeads.length > 0 ? sectionHeads : allStaffers);
    }
  }, [open]);

  const handleAssign = () => {
    if (selectedStafferId) {
      const selectedStaffer = staffers.find(s => s.id === selectedStafferId);
      if (selectedStaffer) {
        onAssign(selectedStaffer);
        setSelectedStafferId(null);
        onOpenChange(false);
      }
    }
  };

  const handleClose = () => {
    setSelectedStafferId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign to:</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section head
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No staffers available for assignment
                    </td>
                  </tr>
                ) : (
                  staffers.map((staffer) => (
                    <tr
                      key={staffer.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedStafferId === staffer.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 bg-gray-100'
                            }`}
                          >
                            {selectedStafferId === staffer.id && (
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {staffer.firstName} {staffer.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {SECTION_LABELS[staffer.section]}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="radio"
                          checked={selectedStafferId === staffer.id}
                          onChange={() => setSelectedStafferId(staffer.id)}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              type="button"
              onClick={handleAssign}
              disabled={!selectedStafferId}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

