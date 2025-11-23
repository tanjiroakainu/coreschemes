import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Footer from '@/components/shared/Footer';
import { createStaffer, createUser } from '@/lib/storage';

interface RegistrationData {
  classification: string;
  segment: string;
  classificationOthers?: string;
  segmentOthers?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatar?: string;
}

const CLASSIFICATIONS = [
  'Department',
  'Office',
  'Organization',
  'Others',
];

const SEGMENTS = [
  'Item 1',
  'Item 2',
  'Item 3',
  'Item 4',
  'Item 5',
  'Item 6',
  'Item 7',
  'Item 8',
  'Item 9',
  'Others',
];

export default function ClientRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<RegistrationData>({
    classification: '',
    segment: '',
    classificationOthers: '',
    segmentOthers: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    avatar: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, avatar: base64String });
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classification || !formData.segment) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.classification === 'Others' && !formData.classificationOthers) {
      setError('Please specify classification');
      return;
    }
    if (formData.segment === 'Others' && !formData.segmentOthers) {
      setError('Please specify segment');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Create staffer
      const othersSpecify = formData.classification === 'Others' 
        ? formData.classificationOthers 
        : formData.segment === 'Others' 
        ? formData.segmentOthers 
        : undefined;

      const stafferData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        position: 'Client',
        section: 'clients' as const,
        avatar: formData.avatar || '',
        classification: formData.classification === 'Others' ? formData.classificationOthers : formData.classification,
        segment: formData.segment === 'Others' ? formData.segmentOthers : formData.segment,
        othersSpecify: othersSpecify,
      };

      createStaffer(stafferData);

      // Create user account
      createUser({
        email: formData.email,
        password: formData.password,
        role: 'client',
        name: `${formData.firstName} ${formData.lastName}`,
        position: 'Client',
        avatar: formData.avatar,
      });

      // Redirect to login
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-900">
        {/* Left Side (neutral background) */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center flex-col gap-4 bg-neutral-800">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TGP Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-white text-4xl font-bold text-center px-4">
            {step === 1 ? 'Welcome!' : 'Create Account'}
          </h1>
        </div>

        {/* Right Side (Registration form) */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-amber-500 min-h-screen md:min-h-0">
          <div className="w-full max-w-md backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-white/20 bg-white">
            {step === 1 ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
                  Welcome, <span className="underline">_____</span>!
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Please tell us which group you belong to.
                </p>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <div>
                    <label htmlFor="classification" className="block text-sm font-medium text-gray-700 mb-2">
                      Classification
                    </label>
                    <select
                      id="classification"
                      value={formData.classification}
                      onChange={(e) => {
                        setFormData({ ...formData, classification: e.target.value, classificationOthers: '' });
                        setError('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      required
                    >
                      <option value="">Select Classification</option>
                      {CLASSIFICATIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.classification === 'Others' && (
                    <div>
                      <label htmlFor="classificationOthers" className="block text-sm font-medium text-gray-700 mb-2">
                        Others: specify
                      </label>
                      <input
                        type="text"
                        id="classificationOthers"
                        value={formData.classificationOthers}
                        onChange={(e) => setFormData({ ...formData, classificationOthers: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Please specify"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="segment" className="block text-sm font-medium text-gray-700 mb-2">
                      Segment
                    </label>
                    <select
                      id="segment"
                      value={formData.segment}
                      onChange={(e) => {
                        setFormData({ ...formData, segment: e.target.value, segmentOthers: '' });
                        setError('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      required
                    >
                      <option value="">Select Segment</option>
                      {SEGMENTS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.segment === 'Others' && (
                    <div>
                      <label htmlFor="segmentOthers" className="block text-sm font-medium text-gray-700 mb-2">
                        Others: specify
                      </label>
                      <input
                        type="text"
                        id="segmentOthers"
                        value={formData.segmentOthers}
                        onChange={(e) => setFormData({ ...formData, segmentOthers: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Please specify"
                        required
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gray-300 text-gray-800 hover:bg-gray-400 py-2 px-4 rounded-md font-medium"
                  >
                    Next
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
                  Create staffer account
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Fill in the information to create a new staffer account.
                </p>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep2Submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Image
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-sm">No image</span>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="avatar"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="avatar"
                          className="cursor-pointer inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                        >
                          Choose File
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Add
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Create temporary password"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Register
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

