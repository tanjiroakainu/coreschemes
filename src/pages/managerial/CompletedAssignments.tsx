import CompletedAssignments from '@/components/shared/CompletedAssignments';

export default function ManagerialCompletedAssignments() {
  return (
    <CompletedAssignments
      title="Managerial Completed Assignments"
      description="Completed assignments handled by the managerial team."
      sectionFilter={['managerial']}
    />
  );
}


