import { useState, useEffect } from 'react';
import { getCurrentUser, updateUser, User } from '@/lib/storage';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { MdPerson, MdLock, MdDelete } from 'react-icons/md';

export default function AdminSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    avatar: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    
    // Listen for storage changes to refresh data
    const handleStorageChange = () => {
      loadUserData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const loadUserData = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setImagePreview(currentUser.avatar || null);
    }
    setLoading(false);
  };

  const handleEditClick = () => {
    if (user) {
      setEditFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        avatar: user.avatar || '',
      });
      setImagePreview(user.avatar || null);
      setIsEditOpen(true);
      setMessage(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setEditFormData({ ...editFormData, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!user) return;

    if (!editFormData.name || !editFormData.email) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      const updates: Partial<User> = {
        name: editFormData.name,
        email: editFormData.email,
        avatar: editFormData.avatar || user.avatar,
      };

      // Only update password if provided
      if (editFormData.password && editFormData.password.trim() !== '') {
        updates.password = editFormData.password;
      }

      updateUser(user.id, updates);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditOpen(false);
      
      // Reload data and trigger custom event to update layout
      setTimeout(() => {
        loadUserData();
        // Trigger a custom event to notify layout of profile update
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }, 500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!user) return;

    // Verify current password
    if (user.password !== currentPassword) {
      setMessage({ type: 'error', text: 'Current password is incorrect' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      updateUser(user.id, { password: newPassword });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      e.currentTarget.reset();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password' });
    }
  };

  const handleDeleteAccount = () => {
    // This would typically require additional confirmation and admin privileges
    setMessage({ type: 'error', text: 'Account deletion requires additional verification. Please contact system administrator.' });
    setDeleteDialogOpen(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <>
        <div className="p-6">
          <p>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <p className="text-gray-600">User not found.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="p-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Settings</h1>

          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200">
                <TabsList className="w-full justify-start bg-transparent h-auto p-0">
                  <TabsTrigger
                    value="profile"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-4"
                  >
                    <div className="flex items-center gap-2">
                      <MdPerson size={20} />
                      <span>Profile</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="password"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-4"
                  >
                    <div className="flex items-center gap-2">
                      <MdLock size={20} />
                      <span>Password</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="delete"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-red-600 data-[state=active]:border-b-2 data-[state=active]:border-red-600 rounded-none px-6 py-4"
                  >
                    <div className="flex items-center gap-2">
                      <MdDelete size={20} />
                      <span>Delete Account</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="profile" className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
                    <Button
                      onClick={handleEditClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Edit Profile
                    </Button>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 flex items-center justify-center bg-gray-100">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'Admin'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl font-medium">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{user.name || 'Admin User'}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500 capitalize mt-1">Role: {user.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                      <p className="text-gray-900">{user.name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                      <p className="text-gray-900 capitalize">{user.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Position</label>
                      <p className="text-gray-900">{user.position || 'Admin'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="password" className="p-6">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                        Current Password *
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        required
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                        New Password *
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Update Password
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="delete" className="p-6">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Delete Account</h2>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 mb-2">
                      <strong>Warning:</strong> This action cannot be undone.
                    </p>
                    <p className="text-red-700 text-sm">
                      Deleting your account will permanently remove all your data from the system.
                    </p>
                  </div>
                  <Button
                    onClick={() => setDeleteDialogOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Account
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Role cannot be changed.
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div
              className={`p-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveProfile();
            }}
            className="space-y-4 mt-4"
          >
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium mb-2">Profile Image</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-gray-100">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">No image</span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="admin-image-upload"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-block"
                  >
                    Choose File
                  </label>
                  <input
                    type="file"
                    id="admin-image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
                <span className="text-xs text-gray-500 ml-2">(Leave empty to keep current password)</span>
              </label>
              <input
                type="password"
                id="password"
                value={editFormData.password}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, password: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password or leave empty"
              />
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">
                Role (Cannot be changed)
              </label>
              <input
                type="text"
                value={user.role}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600 cursor-not-allowed capitalize"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setMessage(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <span>⚠</span> Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </>
  );
}
