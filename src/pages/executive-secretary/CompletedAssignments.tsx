import CompletedAssignments from '@/components/shared/CompletedAssignments';

export default function ExecutiveSecretaryCompletedAssignments() {
  return (
    <CompletedAssignments
      title="Executive Completed Assignments"
      description="Completed assignments handled by executive team members."
      sectionFilter={['executives']}
    />
  );
}


