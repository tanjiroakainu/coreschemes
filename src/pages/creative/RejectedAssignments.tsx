import RejectedAssignments from '@/components/shared/RejectedAssignments';

export default function CreativeRejectedAssignments() {
  return (
    <RejectedAssignments
      title="Creative Rejected Assignments"
      description="Rejected assignments handled by the creative team."
      sectionFilter={['creatives']}
    />
  );
}

