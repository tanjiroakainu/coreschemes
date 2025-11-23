import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Staffer } from '@/lib/storage';

const POSITIONS = [
  'Editor-in-Chief',
  'Associate Editor',
  'Managing Editor',
  'Executive Secretary',
  'Technical Editor',
  'Section Head',
  'Writer',
  'Graphic Artist',
  'Creative Director',
  'Newsletter Editor',
  'Feature Editor',
  'News Editor',
  'Opinion Editor',
  'Sports Editor',
  'Literary Editor',
  'H.R Manager',
  'Circulation Manager',
  'Online account manager',
  'Regular Staff',
  'Logistics',
  'Client',
];

const SECTIONS = [
  { value: 'executives', label: 'Executives' },
  { value: 'scribes', label: 'Scribes' },
  { value: 'creatives', label: 'Creatives' },
  { value: 'managerial', label: 'Managerial' },
  { value: 'clients', label: 'Clients' },
] as const;

interface StafferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (staffer: Omit<Staffer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingStaffer?: Staffer | null;
  restrictSections?: Staffer['section'][]; // Optional: restrict which sections can be selected
}

export default function StafferForm({
  open,
  onOpenChange,
  onSave,
  editingStaffer,
  restrictSections,
}: StafferFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    position: '',
    section: (restrictSections && restrictSections.length > 0 ? restrictSections[0] : 'executives') as Staffer['section'],
    avatar: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (editingStaffer) {
      setFormData({
        firstName: editingStaffer.firstName,
        lastName: editingStaffer.lastName,
        email: editingStaffer.email,
        password: editingStaffer.password || '',
        position: editingStaffer.position,
        section: editingStaffer.section,
        avatar: editingStaffer.avatar || '',
      });
      setImagePreview(editingStaffer.avatar || null);
    } else {
      // Default to first available section if restricted, otherwise 'executives'
      const defaultSection = restrictSections && restrictSections.length > 0 
        ? restrictSections[0] 
        : 'executives';
      
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        position: '',
        section: defaultSection,
        avatar: '',
      });
      setImagePreview(null);
    }
  }, [editingStaffer, open, restrictSections]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      // Create preview and base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      position: formData.position,
      section: formData.section,
      avatar: formData.avatar,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingStaffer ? 'Edit Staffer Account' : 'Create staffer account'}
          </DialogTitle>
          <DialogDescription>
            {editingStaffer
              ? 'Update the staffer information below.'
              : 'Fill in the information to create a new staffer account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Profile Image Upload */}
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
                  htmlFor="avatar-upload"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-block"
                >
                  Choose File
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Add
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
              {!editingStaffer && (
                <span className="text-xs text-gray-500 ml-2">Create temporary password</span>
              )}
            </label>
            <input
              type="password"
              id="password"
              required={!editingStaffer}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={editingStaffer ? 'Leave empty to keep current password' : ''}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="position" className="block text-sm font-medium mb-1">
                Position
              </label>
              <select
                id="position"
                required
                value={formData.position}
                onChange={(e) => {
                  const newPosition = e.target.value;
                  // Auto-set section to 'clients' when Client position is selected
                  const newSection = newPosition === 'Client' 
                    ? 'clients' as Staffer['section']
                    : formData.section;
                  setFormData({ ...formData, position: newPosition, section: newSection });
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Position</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="section" className="block text-sm font-medium mb-1">
                Section
              </label>
              <select
                id="section"
                required
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value as Staffer['section'] })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={(!!restrictSections && restrictSections.length === 1) || formData.position === 'Client'}
              >
                {SECTIONS.filter(sec => 
                  !restrictSections || restrictSections.includes(sec.value)
                ).map((sec) => (
                  <option key={sec.value} value={sec.value}>
                    {sec.label}
                  </option>
                ))}
              </select>
              {restrictSections && restrictSections.length > 0 && restrictSections.length < SECTIONS.length && (
                <p className="text-xs text-gray-500 mt-1">
                  Only {restrictSections.map(s => SECTIONS.find(sec => sec.value === s)?.label).join(', ')} sections are available
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
            >
              {editingStaffer ? 'Update Account' : 'Create account'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

