import React, { useState } from 'react';
import { MapPin, Plus, CheckSquare } from 'lucide-react';
import { TimelineEntry, UserPersona } from '../types';

interface TimelineSectionProps {
  timeline: TimelineEntry[];
  currentPersona: UserPersona;
  onAddTimelineEntry: (entry: Omit<TimelineEntry, 'id'>) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  timeline,
  currentPersona,
  onAddTimelineEntry,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [time, setTime] = useState('02:00 PM');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');

  const isAdminOrOwner = currentPersona.role === 'owner' || currentPersona.role === 'admin';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTimelineEntry({
      time,
      title,
      location: location.trim() || undefined,
      details: details.trim() || undefined,
    });
    setTitle('');
    setLocation('');
    setDetails('');
    setShowAddForm(false);
  };

  return (
    <section id="timeline-section" className="scroll-mt-20">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1B25]">
            Timeline & Itinerary
          </h2>
          <p className="text-sm text-[#808897] mt-1 font-normal">
            The chronological flow for the event
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-11 h-11 rounded-full bg-[#1A1B25] hover:bg-[#272835] text-white flex items-center justify-center transition shadow-xs cursor-pointer shrink-0"
          title={showAddForm ? 'Cancel' : 'Add Itinerary Stop'}
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="mt-4 p-5 bg-white rounded-3xl border border-[#ECEFF3] shadow-xs space-y-3">
          <div className="font-bold text-sm text-[#1A1B25]">Add Itinerary Stop</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              placeholder="e.g. 02:00 PM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-full border border-[#DFE1E6] focus:outline-none focus:border-[#808897]"
              required
            />
            <input
              type="text"
              placeholder="Title (e.g. Group Photos & Drone Shot)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2 text-xs rounded-full border border-[#DFE1E6] focus:outline-none focus:border-[#808897]"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-full border border-[#DFE1E6] focus:outline-none focus:border-[#808897]"
            />
            <input
              type="text"
              placeholder="Extra details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-full border border-[#DFE1E6] focus:outline-none focus:border-[#808897]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-[#1A1B25] text-white rounded-full text-xs font-bold hover:bg-[#272835] transition cursor-pointer"
          >
            Save to Timeline
          </button>
        </form>
      )}

      {/* Main Timeline Content */}
      {timeline.length === 0 ? (
        <div className="bg-[#F6F8FA] rounded-3xl py-16 sm:py-20 px-6 flex flex-col items-center justify-center text-center mt-5 select-none">
          <CheckSquare className="w-8 h-8 text-[#A4ABB8] stroke-[1.5] mb-3" />
          <p className="text-sm font-semibold text-[#808897]">
            No itinerary items yet
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F6F8FA] shadow-[3px_4px_20px_0px_#ECEFF3] divide-y divide-[#ECEFF3]">
          {timeline.map((item) => (
            <div key={item.id} className="py-3.5 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3 min-w-0">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F8F9FB] border border-[#DFE1E6] text-[#1A1B25] shrink-0 mt-0.5">
                  {item.time}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#1A1B25]">
                    {item.title}
                  </h4>
                  {item.details && (
                    <p className="text-xs text-[#808897] mt-0.5">
                      {item.details}
                    </p>
                  )}
                </div>
              </div>

              {item.location && (
                <span className="text-xs text-[#666D80] font-semibold flex items-center gap-1 shrink-0 bg-[#F8F9FB] px-2.5 py-1 rounded-full border border-[#ECEFF3]">
                  <MapPin className="w-3 h-3 text-[#808897]" />
                  <span className="hidden sm:inline">{item.location}</span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

