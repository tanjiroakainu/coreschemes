import RejectedAssignments from '@/components/shared/RejectedAssignments';

export default function ExecutiveSecretaryRejectedAssignments() {
  return (
    <RejectedAssignments
      title="Executive Rejected Assignments"
      description="Rejected assignments handled by executive team members."
      sectionFilter={['executives']}
    />
  );
}

