import React, { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
            Timeline & Itinerary
          </h2>
          <p className="text-xs sm:text-sm text-[#808897] mt-0.5">
            The chronological flow for the event
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#1A1B25] transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#666D80]" />
          <span>{showAddForm ? 'Cancel' : 'Add Itinerary'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="mb-4 p-5 bg-white rounded-3xl border border-[#F6F8FA] shadow-[3px_4px_20px_0px_#ECEFF3] space-y-3">
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

      {/* Main Timeline Card Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F6F8FA] shadow-[3px_4px_20px_0px_#ECEFF3] divide-y divide-[#ECEFF3]">
        {timeline.map((item, idx) => (
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

        {timeline.length === 0 && (
          <div className="py-8 text-center text-xs text-[#808897]">
            No itinerary items added yet.
          </div>
        )}
      </div>
    </section>
  );
};

