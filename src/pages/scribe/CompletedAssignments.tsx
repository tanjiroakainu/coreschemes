import CompletedAssignments from '@/components/shared/CompletedAssignments';

export default function ScribeCompletedAssignments() {
  return (
    <CompletedAssignments
      title="Scribe Completed Assignments"
      description="Completed assignments handled by the scribe team."
      sectionFilter={['scribes']}
    />
  );
}


