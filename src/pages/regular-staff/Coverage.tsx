import { useState, useEffect } from 'react';
import { 
  getTeamMembersByExecutive, 
  getCurrentUser, 
  TeamMember, 
  getScheduleNotesByStaffer,
  getScheduleNoteByDayAndTime,
  ScheduleNote,
  getTeamMembers,
} from '@/lib/storage';
import ScheduleNoteDialog from '@/components/shared/ScheduleNoteDialog';

const TIME_SLOTS = [
  '07:00AM-07:30AM', '07:30AM-08:00AM', '08:00AM-08:30AM', '08:30AM-09:00AM',
  '09:00AM-09:30AM', '09:30AM-10:00AM', '10:00AM-10:30AM', '10:30AM-11:00AM',
  '11:00AM-11:30AM', '11:30AM-12:00PM', '12:00PM-12:30PM', '12:30PM-01:00PM',
  '01:00PM-01:30PM', '01:30PM-02:00PM', '02:00PM-02:30PM', '02:30PM-03:00PM',
  '03:00PM-03:30PM', '03:30PM-04:00PM', '04:00PM-04:30PM', '04:30PM-05:00PM',
  '05:00PM-05:30PM', '05:30PM-06:00PM', '06:00PM-06:30PM', '06:30PM-07:00PM',
  '07:00PM-07:30PM',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function RegularStaffCoverage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeSemester, setActiveSemester] = useState<'1st' | '2nd'>('1st');
  const [scheduleNotes, setScheduleNotes] = useState<ScheduleNote[]>([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<ScheduleNote | null>(null);

  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('teamUpdated', handleStorageChange);
    window.addEventListener('scheduleNoteUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('teamUpdated', handleStorageChange);
      window.removeEventListener('scheduleNoteUpdated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (selectedMember) {
      loadScheduleNotes();
    }
  }, [selectedMember, activeSemester]);

  const loadData = () => {
    const user = getCurrentUser();
    
    // Get all team members - regular staff can see notes for any team member
    // If they're part of a team, show those members; otherwise show all team members
    const allTeamMembers = getTeamMembers();
    
    // Try to get team members by executive first (if regular staff is part of a team)
    if (user?.email) {
      const membersByExecutive = getTeamMembersByExecutive(user.email);
      if (membersByExecutive.length > 0) {
        setTeamMembers(membersByExecutive);
        if (!selectedMember) {
          setSelectedMember(membersByExecutive[0]);
        }
        return;
      }
    }
    
    // If no team members found by executive, show all team members
    // This allows regular staff to see notes for all team members
    if (allTeamMembers.length > 0) {
      setTeamMembers(allTeamMembers);
      if (!selectedMember) {
        setSelectedMember(allTeamMembers[0]);
      }
    } else {
      setTeamMembers([]);
    }
  };

  const loadScheduleNotes = () => {
    if (selectedMember) {
      const notes = getScheduleNotesByStaffer(selectedMember.stafferId, activeSemester);
      setScheduleNotes(notes);
    }
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
  };

  const handleCellClick = (day: string, timeSlot: string) => {
    if (!selectedMember) return;
    
    const existingNote = getScheduleNoteByDayAndTime(
      selectedMember.stafferId,
      day,
      timeSlot,
      activeSemester
    );
    
    if (existingNote) {
      setSelectedDay(day);
      setSelectedTimeSlot(timeSlot);
      setSelectedNote(existingNote);
      setNoteDialogOpen(true);
    }
  };

  const getNoteForSlot = (day: string, timeSlot: string): ScheduleNote | null => {
    return scheduleNotes.find(
      (n) => n.day === day && n.timeSlot === timeSlot
    ) || null;
  };

  return (
    <div className="px-4 md:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-amber-600">Coverage</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSemester('1st')}
            className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${
              activeSemester === '1st'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            1st Sem
          </button>
          <button
            onClick={() => setActiveSemester('2nd')}
            className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${
              activeSemester === '2nd'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            2nd Sem
          </button>
        </div>
      </div>

      {teamMembers.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Team Member:
          </label>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleMemberClick(member)}
                className={`px-4 py-2 rounded text-sm ${
                  selectedMember?.id === member.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {member.stafferName}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-center">Class Schedule & Availability</h2>
          {selectedMember && (
            <p className="text-center text-sm text-gray-600">
              Schedule for: <span className="font-medium">{selectedMember.stafferName}</span>
            </p>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Time
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {TIME_SLOTS.map((timeSlot) => (
                  <tr key={timeSlot} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">
                      {timeSlot}
                    </td>
                    {DAYS.map((day) => {
                      const note = getNoteForSlot(day, timeSlot);
                      
                      return (
                        <td
                          key={day}
                          className={`px-2 py-2 text-xs text-center border border-gray-100 min-w-[120px] ${
                            note ? 'cursor-pointer hover:bg-amber-50 transition-colors' : ''
                          }`}
                          onClick={() => note && handleCellClick(day, timeSlot)}
                        >
                          {note ? (
                            <div className="bg-amber-100 p-2 rounded text-amber-800 relative group">
                              <div className="font-medium mb-1">{note.notes}</div>
                              <div className="text-[10px] text-amber-600 mt-1">
                                By: {note.addedByName} ({note.addedByPosition})
                              </div>
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] text-amber-600">👁️</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedMember && teamMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center">
            Select a team member to view their schedule
          </p>
        </div>
      )}

      {teamMembers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center">
            No team members available. Notes added by executives will appear here when available.
          </p>
        </div>
      )}

      <ScheduleNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        day={selectedDay}
        timeSlot={selectedTimeSlot}
        existingNote={selectedNote}
        onSave={() => {}}
        readOnly={true}
      />
    </div>
  );
}

