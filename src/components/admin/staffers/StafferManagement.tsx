import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import StafferTable from './StafferTable';
import StafferForm from './StafferForm';
import {
  getStaffers,
  createStaffer,
  updateStaffer,
  deleteStaffer,
  Staffer,
} from '@/lib/storage';

const SECTIONS = [
  { key: 'all', label: 'All' },
  { key: 'executives', label: 'Executives' },
  { key: 'scribes', label: 'Scribes' },
  { key: 'creatives', label: 'Creatives' },
  { key: 'managerial', label: 'Managerial' },
  { key: 'clients', label: 'Clients' },
] as const;

export default function StafferManagement() {
  const [staffers, setStaffers] = useState<Staffer[]>([]);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaffer, setEditingStaffer] = useState<Staffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadStaffers();
    
    // Listen for storage changes to refresh data
    const handleStorageChange = () => {
      loadStaffers();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events (same-tab updates)
    window.addEventListener('stafferUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stafferUpdated', handleStorageChange);
    };
  }, []);

  const loadStaffers = () => {
    const allStaffers = getStaffers();
    setStaffers(allStaffers);
  };

  const handleAdd = () => {
    setEditingStaffer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (staffer: Staffer) => {
    setEditingStaffer(staffer);
    setIsFormOpen(true);
  };

  const handleSave = (stafferData: Omit<Staffer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      setSuccess(null);
      
      if (editingStaffer) {
        updateStaffer(editingStaffer.id, stafferData);
        setSuccess('Staffer updated successfully!');
      } else {
        createStaffer(stafferData);
        setSuccess('Staffer created successfully!');
      }
      setIsFormOpen(false);
      setEditingStaffer(null);
      // Reload staffers immediately to refresh the table
      loadStaffers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving staffer:', error);
      setError(error?.message || 'Failed to save staffer. Please try again.');
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDelete = (stafferId: string) => {
    try {
      setError(null);
      setSuccess(null);
      deleteStaffer(stafferId);
      setSuccess('Staffer deleted successfully!');
      loadStaffers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error deleting staffer:', error);
      setError(error?.message || 'Failed to delete staffer. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingStaffer(null);
    }
  };

  const filteredStaffers =
    activeSection === 'all'
      ? staffers
      : staffers.filter((s) => s.section === activeSection);

  return (
    <div className="w-full space-y-6">
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 min-w-0">
          <TabsList className="inline-flex h-auto items-center justify-start rounded-none bg-transparent p-0 gap-6">
            {SECTIONS.map((section) => (
              <TabsTrigger
                key={section.key}
                value={section.key}
                className="data-[state=active]:bg-transparent data-[state=active]:text-amber-600 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:shadow-none rounded-none px-0 py-2 text-base font-normal"
              >
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          onClick={handleAdd}
          className="bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-md px-4 py-2 font-medium whitespace-nowrap"
          type="button"
        >
          + Add Staffer
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <StafferTable
          key={staffers.length}
          staffers={filteredStaffers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <StafferForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSave={handleSave}
        editingStaffer={editingStaffer}
      />
    </div>
  );
}

