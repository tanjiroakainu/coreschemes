import CompletedAssignments from '@/components/shared/CompletedAssignments';

export default function CreativeCompletedAssignments() {
  return (
    <CompletedAssignments
      title="Creative Completed Assignments"
      description="Completed assignments handled by the creative team."
      sectionFilter={['creatives']}
    />
  );
}


