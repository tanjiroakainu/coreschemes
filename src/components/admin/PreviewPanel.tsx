import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { EventInput, formatDate } from '@fullcalendar/core';

interface EventPreviewPanelProps {
  events: EventInput[];
  onDelete?: (id: string) => void;
  onEdit?: (event: EventInput) => void;
  onAddEvent?: () => void;
}

export default function EventPreviewPanel({
  events,
  onEdit,
  onAddEvent,
}: EventPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'class-schedule'>('events');

  // Show all events in both tabs - events and tasks are both shown in both tabs
  const regularEvents = events; // All events show in Events tab
  const classScheduleEvents = events; // All events also show in Class Schedule tab

  const formatEventTime = (event: EventInput) => {
    const start = new Date(event.start as string);
    const end = event.end ? new Date(event.end as string) : null;

    const startTime =
      event.startTime ||
      start.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

    const endTime =
      event.endTime ||
      (end?.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }) || '');

    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  const formatEventDate = (event: EventInput) => {
    const start = new Date(event.start as string);
    return formatDate(start, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEventTitle = (event: EventInput) => {
    const title = event.title as string;
    return title?.replace(/\s*\([^)]*\)/, '') || 'Untitled';
  };

  return (
    <div className="mt-10">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'events' | 'class-schedule')} className="w-full">
        <TabsList className="inline-flex h-auto items-center justify-start rounded-none bg-transparent p-0 gap-0 border-b">
          <div className="flex items-center gap-2">
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-400 rounded-none px-4 py-2"
            >
              Events
            </TabsTrigger>
            {onAddEvent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddEvent();
                }}
                className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400"
                title="Add Event"
                type="button"
              >
                <Plus className="h-3 w-3 text-gray-700" />
              </button>
            )}
          </div>
          <TabsTrigger
            value="class-schedule"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-400 rounded-none px-4 py-2"
          >
            Class Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No events scheduled
                    </TableCell>
                  </TableRow>
                ) : (
                  regularEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onEdit && onEdit(event)}
                    >
                      <TableCell className="font-medium">
                        {getEventTitle(event)}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {event.description || '—'}
                      </TableCell>
                      <TableCell>{formatEventDate(event)}</TableCell>
                      <TableCell>{formatEventTime(event)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="class-schedule" className="mt-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classScheduleEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No class schedule entries
                    </TableCell>
                  </TableRow>
                ) : (
                  classScheduleEvents.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onEdit && onEdit(event)}
                    >
                      <TableCell className="font-medium">
                        {getEventTitle(event)}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {event.description || '—'}
                      </TableCell>
                      <TableCell>{formatEventDate(event)}</TableCell>
                      <TableCell>{formatEventTime(event)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
