import ClientManagement from '@/components/admin/clients/ClientManagement';
import Footer from '@/components/shared/Footer';

export default function AdminClientManagement() {
  return (
    <>
      <div className="p-4 sm:p-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">Client User Management</h1>
          <ClientManagement />
        </div>
      </div>
      <Footer />
    </>
  );
}

