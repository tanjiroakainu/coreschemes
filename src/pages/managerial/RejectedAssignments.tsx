import RejectedAssignments from '@/components/shared/RejectedAssignments';

export default function ManagerialRejectedAssignments() {
  return (
    <RejectedAssignments
      title="Managerial Rejected Assignments"
      description="Rejected assignments handled by the managerial team."
      sectionFilter={['managerial']}
    />
  );
}

