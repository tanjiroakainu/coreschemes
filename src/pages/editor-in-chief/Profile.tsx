import { useState, useEffect } from 'react';
import { getCurrentUser, getStaffers, updateStaffer, Staffer, updateUser } from '@/lib/storage';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';

export default function ExecutiveProfile() {
  const [staffer, setStaffer] = useState<Staffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
    
    // Listen for storage changes to refresh data
    const handleStorageChange = () => {
      loadProfile();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('stafferUpdated', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('stafferUpdated', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const loadProfile = () => {
    const user = getCurrentUser();
    if (user?.email) {
      const staffers = getStaffers();
      const foundStaffer = staffers.find((s) => s.email.toLowerCase() === user.email.toLowerCase());
      if (foundStaffer) {
        setStaffer(foundStaffer);
        setPreview(foundStaffer.avatar || null);
        setFormData({
          firstName: foundStaffer.firstName,
          lastName: foundStaffer.lastName,
          email: foundStaffer.email,
        });
      }
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
      };
      reader.readAsDataURL(file);
      setMessage(null);
    }
  };

  const handleSave = () => {
    if (!staffer) return;

    try {
      // Update staffer with new data
      const updatedStaffer = updateStaffer(staffer.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        avatar: preview || undefined,
      });

      if (updatedStaffer) {
        // Also update user account
        const user = getCurrentUser();
        if (user) {
          updateUser(user.id, {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            avatar: preview || undefined,
          });
        }

        setStaffer(updatedStaffer);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Dispatch event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileUpdated'));
        }

        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-10 py-6">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!staffer) {
    return (
      <div className="px-4 md:px-10 py-6">
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-amber-600">My Profile</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-500">
                    {staffer.firstName.charAt(0)}
                    {staffer.lastName.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-image-input"
                />
                <label
                  htmlFor="profile-image-input"
                  className="cursor-pointer inline-block px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                >
                  Choose File
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Position (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <input
              type="text"
              value={staffer.position}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Position cannot be changed
            </p>
          </div>

          {/* Section (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <input
              type="text"
              value={staffer.section.charAt(0).toUpperCase() + staffer.section.slice(1)}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

