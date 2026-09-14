import React, { useState } from 'react';
import { Clock, MapPin, Plus, CheckCircle2 } from 'lucide-react';
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
    <section className="mb-8">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Day-Of Schedule</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1A1B25]">
            Timeline & Itinerary
          </h2>
          <p className="text-xs text-[#666D80]">
            The chronological flow for September 19
          </p>
        </div>

        {isAdminOrOwner && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#DFE1E6] hover:bg-[#F6F8FA] text-xs font-bold text-[#1A1B25] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Add Time Slot'}</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="mb-4 p-4 bg-white rounded-2xl border border-amber-200 shadow-xs space-y-3">
          <div className="font-extrabold text-sm text-[#1A1B25]">Add Itinerary Stop</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="e.g. 02:00 PM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
              required
            />
            <input
              type="text"
              placeholder="Title (e.g. Group Photos & Drone Shot)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
            />
            <input
              type="text"
              placeholder="Extra details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[#DFE1E6] focus:outline-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#1A1B25] text-white rounded-xl text-xs font-bold hover:bg-[#272835] transition cursor-pointer"
          >
            Save to Timeline
          </button>
        </form>
      )}

      {/* Timeline items list */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#DFE1E6]">
        {timeline.map((item, idx) => (
          <div key={item.id} className="relative group">
            {/* Timeline node bullet */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center text-[10px] font-black text-amber-700 shadow-xs">
              {idx + 1}
            </div>

            {/* Content card */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#ECEFF3] shadow-xs hover:border-amber-200 transition">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 text-xs font-black tracking-wide border border-amber-200/50">
                  {item.time}
                </span>
                {item.location && (
                  <span className="text-xs text-[#666D80] font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{item.location}</span>
                  </span>
                )}
              </div>

              <h4 className="text-sm font-extrabold text-[#1A1B25]">
                {item.title}
              </h4>

              {item.details && (
                <p className="text-xs text-[#666D80] mt-0.5">
                  {item.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
