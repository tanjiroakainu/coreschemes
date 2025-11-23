import StafferManagement from '@/components/admin/staffers/StafferManagement';
import Footer from '@/components/shared/Footer';

export default function AdminStaffer() {
  return (
    <>
      <div className="p-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Staffer Management</h1>
          <StafferManagement />
        </div>
      </div>
      <Footer />
    </>
  );
}

