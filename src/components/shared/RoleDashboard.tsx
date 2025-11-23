import { useEffect, useState } from 'react';
import { getCurrentUser, getStaffers, updateStaffer, Staffer } from '@/lib/storage';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RoleDashboardProps {
  roleName: string;
}

export default function RoleDashboard({ roleName }: RoleDashboardProps) {
  const [staffer, setStaffer] = useState<Staffer | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    avatar: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStafferData();
    
    // Listen for storage changes to refresh data
    const handleStorageChange = () => {
      loadStafferData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events (same-tab updates)
    window.addEventListener('stafferUpdated', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stafferUpdated', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const loadStafferData = () => {
    setLoading(true);
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser?.email) {
      const staffers = getStaffers();
      // Find staffer by email (case-insensitive)
      const foundStaffer = staffers.find((s) => 
        s.email && currentUser.email && 
        s.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()
      );
      
      if (foundStaffer) {
        setStaffer(foundStaffer);
        setImagePreview(foundStaffer.avatar || null);
      } else {
        // If staffer not found, log for debugging
        console.log('Staffer not found for email:', currentUser.email);
        console.log('Available staffers:', staffers.map(s => s.email));
      }
    } else {
      console.log('No current user email found');
    }
    setLoading(false);
  };

  const handleEditClick = () => {
    if (staffer) {
      setEditFormData({
        firstName: staffer.firstName,
        lastName: staffer.lastName,
        email: staffer.email,
        password: '',
        avatar: staffer.avatar || '',
      });
      setImagePreview(staffer.avatar || null);
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
    if (!staffer) return;

    if (!editFormData.firstName || !editFormData.lastName || !editFormData.email) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      // Update staffer - do NOT allow position or section to be changed
      const updates: Partial<Staffer> = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        avatar: editFormData.avatar || staffer.avatar,
      };

      // Only update password if provided
      if (editFormData.password && editFormData.password.trim() !== '') {
        updates.password = editFormData.password;
      }

      updateStaffer(staffer.id, updates);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditOpen(false);
      
      // Reload data after a short delay
      setTimeout(() => {
        loadStafferData();
      }, 500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <>
        <div className="p-6 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">{roleName} Dashboard</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">{roleName} Dashboard</h1>
          
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

          {staffer ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {staffer.avatar ? (
                    <img
                      src={staffer.avatar}
                      alt={`${staffer.firstName} ${staffer.lastName}`}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-medium">
                      {getInitials(staffer.firstName, staffer.lastName)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {staffer.firstName} {staffer.lastName}
                    </h2>
                    <p className="text-gray-600">{staffer.position}</p>
                    <p className="text-sm text-gray-500 capitalize">Section: {staffer.section}</p>
                  </div>
                </div>
                <Button
                  onClick={handleEditClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <p className="text-gray-600">
                {user?.email ? `Staffer profile not found for ${user.email}` : 'No user logged in'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">Role</h3>
              <p className="text-sm sm:text-base text-gray-600">{staffer?.position || roleName}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">Section</h3>
              <p className="text-sm sm:text-base text-gray-600 capitalize">{staffer?.section || 'N/A'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">Email</h3>
              <p className="text-sm sm:text-base text-gray-600 break-words">{staffer?.email || user?.email || 'N/A'}</p>
            </div>
          </div>
          
          {staffer && (
            <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-800">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Full Name:</span>
                  <p className="text-gray-900">{staffer.firstName} {staffer.lastName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Position:</span>
                  <p className="text-gray-900">{staffer.position}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Email:</span>
                  <p className="text-gray-900">{staffer.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Section:</span>
                  <p className="text-gray-900 capitalize">{staffer.section}</p>
                </div>
                {staffer.createdAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Member Since:</span>
                    <p className="text-gray-900">
                      {new Date(staffer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Role and section cannot be changed.
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                    htmlFor="profile-image-upload"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-block"
                  >
                    Choose File
                  </label>
                  <input
                    type="file"
                    id="profile-image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* First Name and Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  required
                  value={editFormData.firstName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  required
                  value={editFormData.lastName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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

            {/* Role and Section (Read-only) */}
            {staffer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">
                    Position (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    value={staffer.position}
                    disabled
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">
                    Section (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    value={staffer.section}
                    disabled
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600 cursor-not-allowed capitalize"
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
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

      <Footer />
    </>
  );
}

