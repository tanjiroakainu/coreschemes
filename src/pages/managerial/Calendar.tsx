import RoleCalendar from '@/components/shared/RoleCalendar';
import Footer from '@/components/shared/Footer';

export default function ManagerialCalendar() {
  return (
    <>
      <RoleCalendar canEdit={true} filterByUser={true} />
      <Footer />
    </>
  );
}
