import RejectedAssignments from '@/components/shared/RejectedAssignments';

export default function ScribeRejectedAssignments() {
  return (
    <RejectedAssignments
      title="Scribe Rejected Assignments"
      description="Rejected assignments handled by the scribe team."
      sectionFilter={['scribes']}
    />
  );
}

