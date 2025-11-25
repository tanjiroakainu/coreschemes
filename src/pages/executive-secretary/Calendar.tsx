import RoleCalendar from '@/components/shared/RoleCalendar';
import Footer from '@/components/shared/Footer';

export default function ExecutiveSecretaryCalendar() {
  return (
    <>
      <RoleCalendar canEdit={true} filterByUser={false} />
      <Footer />
    </>
  );
}
