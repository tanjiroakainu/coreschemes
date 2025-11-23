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

interface StafferTableProps {
  staffers: Staffer[];
  onEdit: (staffer: Staffer) => void;
  onDelete: (stafferId: string) => void;
}

export default function StafferTable({ staffers, onEdit, onDelete }: StafferTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stafferToDelete, setStafferToDelete] = useState<Staffer | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Reset expanded rows when staffers change
  useEffect(() => {
    setExpandedRows(new Set());
  }, [staffers.length]);

  const toggleRow = (stafferId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(stafferId)) {
      newExpanded.delete(stafferId);
    } else {
      newExpanded.add(stafferId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDeleteClick = (staffer: Staffer) => {
    setStafferToDelete(staffer);
    setDeleteDialogOpen(true);
    setOpenDropdownId(null); // Close dropdown when opening delete dialog
  };

  const handleDeleteConfirm = () => {
    if (stafferToDelete) {
      onDelete(stafferToDelete.id);
      setDeleteDialogOpen(false);
      setStafferToDelete(null);
    }
  };

  const handleEdit = (staffer: Staffer) => {
    setOpenDropdownId(null); // Close dropdown
    onEdit(staffer);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-semibold">Staffer</TableHead>
              <TableHead className="font-semibold">Position</TableHead>
              <TableHead className="text-right font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No staffers found. Click "+ Add Staffer" to create one.
                </TableCell>
              </TableRow>
            ) : (
              staffers.map((staffer) => {
                const isExpanded = expandedRows.has(staffer.id);
                const fullName = `${staffer.firstName} ${staffer.lastName}`;

                return (
                  <Fragment key={staffer.id}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <button
                          onClick={() => toggleRow(staffer.id)}
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
                          {staffer.avatar ? (
                            <img
                              src={staffer.avatar}
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                              {getInitials(staffer.firstName, staffer.lastName)}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div>
                          <div className="font-medium">{staffer.position}</div>
                          <div className="text-xs text-gray-500 capitalize">{staffer.section}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu 
                          open={openDropdownId === staffer.id}
                          onOpenChange={(open) => {
                            setOpenDropdownId(open ? staffer.id : null);
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
                                handleEdit(staffer);
                              }}
                              className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick(staffer);
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
                                  <p className="text-sm text-gray-900">{staffer.email}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Password:</span>
                                  <p className="text-sm text-gray-900 font-mono">
                                    {staffer.password ? '•'.repeat(staffer.password.length) : 'Not set'}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Actual: {staffer.password || 'Not set'}
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
                                  <p className="text-sm text-gray-900">{staffer.position}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-500">Section:</span>
                                  <p className="text-sm text-gray-900 capitalize">{staffer.section}</p>
                                </div>
                                {staffer.createdAt && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Created:</span>
                                    <p className="text-sm text-gray-900">
                                      {new Date(staffer.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                {staffer.updatedAt && (
                                  <div>
                                    <span className="text-xs font-medium text-gray-500">Last Updated:</span>
                                    <p className="text-sm text-gray-900">
                                      {new Date(staffer.updatedAt).toLocaleDateString()}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <span>⚠</span> Delete account ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account ?
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

