import { FormEvent, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithPassword, getCurrentUser, getRedirectPathFromPosition, getStaffers } from '@/lib/storage';
import { MdOutlineLogin } from 'react-icons/md';
import Footer from '@/components/shared/Footer';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check for registration success parameter
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Registration successful! Please login with your credentials.');
      // Clear the URL parameter
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await signInWithPassword(email, password);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data?.user) {
      handleRoleRedirect(data.user);
    }
  };

  const handleRoleRedirect = (user: { id: string; role: string }) => {
    if (!user || !user.role) {
      setErrorMessage('Failed to fetch user role');
      return;
    }

    redirectByRole(user.role);
  };

  const redirectByRole = (role: string) => {
    const user = getCurrentUser();
    
    // If user has a position, use position-based redirect
    if (user?.position) {
      const redirectPath = getRedirectPathFromPosition(user.position);
      navigate(redirectPath);
      return;
    }
    
    // Fallback to role-based redirect
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'staffer':
        // Try to find staffer by email to get position
        const staffers = getStaffers();
        const staffer = staffers.find((s) => s.email.toLowerCase() === user?.email?.toLowerCase());
        if (staffer) {
          const redirectPath = getRedirectPathFromPosition(staffer.position);
          navigate(redirectPath);
        } else {
          navigate('/staffer/assignment');
        }
        break;
      case 'client':
        navigate('/client/request');
        break;
      case 'section-head':
        navigate('/section-head/assignment');
        break;
      default:
        setErrorMessage('Unknown role');
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row bg-neutral-900">
        {/* Left Side (neutral background) */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center flex-col gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TGP Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-white text-4xl font-bold text-center px-4">Welcome Back</h1>
        </div>

        {/* Right Side (Login form) */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-neutral-700 min-h-screen md:min-h-0">
          <div className="w-full max-w-sm backdrop-blur-md rounded-xl shadow-xl p-4 sm:p-6 border border-white/20 bg-neutral-100">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
              <MdOutlineLogin size={24} /> Login
            </h2>

            {errorMessage && (
              <p className="text-red-500 mb-4 text-sm text-center">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-green-600 mb-4 text-sm text-center bg-green-50 border border-green-200 rounded px-4 py-2">
                {successMessage}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-1 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border rounded border-gray-400 focus:outline-none focus:ring focus:border-gray-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block mb-1 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border rounded border-gray-400 focus:outline-none focus:ring focus:border-gray-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-neutral-700 text-white py-2 px-4 rounded hover:bg-amber-200 transition duration-200"
              >
                Login
              </button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                New client?{' '}
                <a href="/register" className="text-amber-600 hover:text-amber-700 underline">
                  Register here
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

