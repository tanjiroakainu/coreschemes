import RoleCalendar from '@/components/shared/RoleCalendar';
import Footer from '@/components/shared/Footer';

export default function ScribeCalendar() {
  return (
    <>
      <RoleCalendar canEdit={true} filterByUser={true} />
      <Footer />
    </>
  );
}
