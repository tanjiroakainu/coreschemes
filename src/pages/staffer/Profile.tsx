import { useState, useEffect } from 'react';
import { getCurrentUser, getStaffers, updateStaffer, Staffer } from '@/lib/storage';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';

export default function StafferProfile() {
  const [staffer, setStaffer] = useState<Staffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!staffer || !preview) {
      setMessage({ type: 'error', text: 'Please select an image to upload' });
      return;
    }

    try {
      // Update staffer with new avatar
      updateStaffer(staffer.id, { avatar: preview });
      setMessage({ type: 'success', text: 'Profile image updated successfully!' });
      
      // Reload profile
      setTimeout(() => {
        loadProfile();
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile image' });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!staffer) {
    return (
      <>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <p className="text-gray-600">Staffer profile not found.</p>
        </div>
        <Footer />
      </>
    );
  }

  const fullName = `${staffer.firstName} ${staffer.lastName}`;
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <div className="p-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">My Profile</h1>

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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image Section */}
              <div className="flex-shrink-0">
                <div className="w-48 h-48 mx-auto md:mx-0">
                  {preview ? (
                    <img
                      src={preview}
                      alt={fullName}
                      className="w-full h-full rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-4xl font-medium border-4 border-gray-200">
                      {getInitials(staffer.firstName, staffer.lastName)}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="image-upload"
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Choose File
                  </label>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {preview && (
                  <Button
                    onClick={handleSave}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700"
                  >
                    Save Image
                  </Button>
                )}
              </div>

              {/* Profile Information */}
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900 font-medium">{fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{staffer.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <p className="text-gray-900">{staffer.position}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <p className="text-gray-900 capitalize">{staffer.section}</p>
                  </div>
                  {staffer.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                      <p className="text-gray-900">
                        {new Date(staffer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

