import { useState, useEffect, Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Staffer } from '@/lib/storage';

interface ClientTableProps {
  clients: Staffer[];
  onEdit: (client: Staffer) => void;
  onDelete: (clientId: string) => void;
}

export default function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Staffer | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Reset expanded rows when clients change
  useEffect(() => {
    setExpandedRows(new Set());
  }, [clients.length]);

  const toggleRow = (clientId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDeleteClick = (client: Staffer) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
    setOpenDropdownId(null);
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      onDelete(clientToDelete.id);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleEdit = (client: Staffer) => {
    setOpenDropdownId(null);
    onEdit(client);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Position</TableHead>
              <TableHead className="text-right font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => {
                const isExpanded = expandedRows.has(client.id);
                const fullName = `${client.firstName} ${client.lastName}`;

                return (
                  <Fragment key={client.id}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <button
                          onClick={() => toggleRow(client.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          type="button"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {client.avatar ? (
                            <img
                              src={client.avatar}
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                              {getInitials(client.firstName, client.lastName)}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div>
                          <div className="font-medium">{client.position}</div>
                          <div className="text-xs text-gray-500 capitalize">{client.section}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu 
                          open={openDropdownId === client.id}
                          onOpenChange={(open) => {
                            setOpenDropdownId(open ? client.id : null);
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 hover:bg-gray-100 text-gray-600"
                              type="button"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="min-w-[120px] z-[9999] bg-white border border-gray-200 shadow-lg"
                            sideOffset={5}
                            onCloseAutoFocus={(e) => e.preventDefault()}
                          >
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEdit(client);
                              }}
                              className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick(client);
                              }}
                              className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
                              variant="destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-gray-50 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Account Credentials</h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Email:</span>
                                  <p className="text-sm text-gray-900 break-words">{client.email}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Password:</span>
                                  <p className="text-sm text-gray-900 font-mono">
                                    {client.password ? '•'.repeat(client.password.length) : 'Not set'}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1 break-words">
                                    Actual: {client.password || 'Not set'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Profile Information</h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Full Name:</span>
                                  <p className="text-sm text-gray-900">{fullName}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Position:</span>
                                  <p className="text-sm text-gray-900">{client.position}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Section:</span>
                                  <p className="text-sm text-gray-900 capitalize">{client.section}</p>
                                </div>
                                {client.classification && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Classification:</span>
                                    <p className="text-sm text-gray-900">{client.classification}</p>
                                  </div>
                                )}
                                {client.segment && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Segment:</span>
                                    <p className="text-sm text-gray-900">{client.segment}</p>
                                  </div>
                                )}
                                {client.othersSpecify && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Others Specify:</span>
                                    <p className="text-sm text-gray-900 break-words">{client.othersSpecify}</p>
                                  </div>
                                )}
                                {client.createdAt && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Created:</span>
                                    <p className="text-sm text-gray-900">
                                      {new Date(client.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {client.updatedAt && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Last Updated:</span>
                                    <p className="text-sm text-gray-900">
                                      {new Date(client.updatedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {clients.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No clients found.
          </div>
        ) : (
          clients.map((client) => {
            const fullName = `${client.firstName} ${client.lastName}`;
            return (
              <div key={client.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    {client.avatar ? (
                      <img
                        src={client.avatar}
                        alt={fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                        {getInitials(client.firstName, client.lastName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 break-words">{fullName}</h3>
                      <p className="text-xs text-gray-500">{client.position}</p>
                      <p className="text-xs text-gray-500 capitalize">{client.section}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        type="button"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(client)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {client.classification && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Classification:</span> {client.classification}
                  </div>
                )}
                {client.segment && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Segment:</span> {client.segment}
                  </div>
                )}
                {client.email && (
                  <div className="text-xs text-gray-600 break-words">
                    <span className="font-medium">Email:</span> {client.email}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <span>⚠</span> Delete account ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

