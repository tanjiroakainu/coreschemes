import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ClientTable from './ClientTable';
import StafferForm from '../staffers/StafferForm';
import {
  getStaffers,
  createStaffer,
  updateStaffer,
  deleteStaffer,
  Staffer,
} from '@/lib/storage';

export default function ClientManagement() {
  const [clients, setClients] = useState<Staffer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Staffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    
    const handleStorageChange = () => {
      loadClients();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('stafferUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stafferUpdated', handleStorageChange);
    };
  }, []);

  const loadClients = () => {
    const allStaffers = getStaffers();
    const clientStaffers = allStaffers.filter((s) => s.section === 'clients');
    setClients(clientStaffers);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (client: Staffer) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleSave = (clientData: Omit<Staffer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      setSuccess(null);

      if (editingClient) {
        updateStaffer(editingClient.id, clientData);
        setSuccess('Client updated successfully');
      } else {
        createStaffer(clientData);
        setSuccess('Client created successfully');
      }

      setIsFormOpen(false);
      setEditingClient(null);
      loadClients();

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save client');
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleDelete = (clientId: string) => {
    try {
      setError(null);
      deleteStaffer(clientId);
      setSuccess('Client deleted successfully');
      loadClients();

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingClient(null);
    }
  };

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
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            Manage client accounts and view their registration details.
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-md px-4 py-2 font-medium whitespace-nowrap"
          type="button"
        >
          + Add Client
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ClientTable
          key={clients.length}
          clients={clients}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <StafferForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSave={handleSave}
        editingStaffer={editingClient}
        restrictSections={['clients']}
      />
    </div>
  );
}

