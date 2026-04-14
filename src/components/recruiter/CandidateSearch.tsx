import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, MapPin, Loader2, Users, X, ExternalLink,
  Briefcase, Phone, Mail, Globe, ChevronDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db, collection, query, where, getDocs } from '@/src/lib/firebase';

interface CandidateProfile {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  location?: string;
  bio?: string;
  phone?: string;
  website?: string;
  jobTitle?: string;
  skills?: string[];
  availability?: string;
  resumeUrl?: string;
  createdAt?: string;
}

const PAGE_SIZE = 20;

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: 'Immediate',
  '1-month': '1 Month',
  '3-months': '3 Months',
  open: 'Open to Offers',
};

function computeProfileCompletion(c: CandidateProfile): number {
  const fields = ['displayName', 'location', 'bio', 'phone', 'jobTitle', 'skills', 'resumeUrl', 'website'];
  const filled = fields.filter(f => {
    const val = (c as any)[f];
    if (Array.isArray(val)) return val.length > 0;
    return !!val;
  });
  return Math.round((filled.length / fields.length) * 100);
}

// ── Card ──────────────────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  onView,
}: {
  candidate: CandidateProfile;
  onView: () => void;
}) {
  const topSkills = (candidate.skills || []).slice(0, 3);
  const extraSkills = (candidate.skills || []).length - 3;
  const completion = computeProfileCompletion(candidate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/10 transition-all flex flex-col gap-4"
    >
      {/* Top row: avatar + name + completion */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            {candidate.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{candidate.displayName}</h3>
            {candidate.jobTitle && (
              <p className="text-xs text-slate-500 mt-0.5">{candidate.jobTitle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="text-[11px] font-bold text-orange-500">{completion}%</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-wide">Profile</span>
        </div>
      </div>

      {/* Skills */}
      {topSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topSkills.map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold"
            >
              {skill}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px]">
              +{extraSkills} more
            </span>
          )}
        </div>
      )}

      {/* Footer: location + availability + button */}
      <div className="flex items-end justify-between mt-auto gap-2">
        <div className="space-y-1 min-w-0">
          {candidate.location && (
            <p className="text-[11px] text-slate-400 flex items-center truncate">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{candidate.location}</span>
            </p>
          )}
          {candidate.availability && (
            <p className="text-[11px] text-slate-400 flex items-center">
              <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" />
              {AVAILABILITY_LABELS[candidate.availability] ?? candidate.availability}
            </p>
          )}
        </div>
        <button
          onClick={onView}
          className="flex-shrink-0 px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-all"
        >
          View Profile
        </button>
      </div>
    </motion.div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function CandidateModal({
  candidate,
  onClose,
}: {
  candidate: CandidateProfile;
  onClose: () => void;
}) {
  const completion = computeProfileCompletion(candidate);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-2xl flex-shrink-0">
              {candidate.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{candidate.displayName}</h2>
              {candidate.jobTitle && (
                <p className="text-slate-500 text-sm mt-0.5">{candidate.jobTitle}</p>
              )}
              {candidate.availability && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {AVAILABILITY_LABELS[candidate.availability] ?? candidate.availability}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
            {candidate.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {candidate.phone}
              </div>
            )}
            {candidate.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {candidate.location}
              </div>
            )}
            {candidate.website && (
              <a
                href={candidate.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-orange-500 hover:underline"
              >
                <Globe className="w-4 h-4 flex-shrink-0" />
                Portfolio / Website
              </a>
            )}
          </div>

          {/* Resume CTA */}
          {candidate.resumeUrl && (
            <div>
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                View Resume / CV
              </a>
            </div>
          )}

          {/* Bio */}
          {candidate.bio && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">About</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{candidate.bio}</p>
            </div>
          )}

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Profile completion bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Completion</h3>
              <span className="text-sm font-bold text-orange-500">{completion}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          {/* Member since */}
          {candidate.createdAt && (
            <p className="text-xs text-slate-400">
              Member since{' '}
              {new Date(candidate.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              })}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CandidateSearch() {
  const [allCandidates, setAllCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Raw filter inputs
  const [skillsInput, setSkillsInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Debounced text values (300 ms)
  const [debouncedSkills, setDebouncedSkills] = useState('');
  const [debouncedLocation, setDebouncedLocation] = useState('');

  // Client-side pagination
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);

  // Fetch from Firestore whenever availability changes (it's the only server-side filter)
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const constraints: any[] = [where('role', '==', 'candidate')];
        if (availabilityFilter) {
          constraints.push(where('availability', '==', availabilityFilter));
        }
        const q = query(collection(db, 'users'), ...constraints);
        const snapshot = await getDocs(q);
        const candidates = snapshot.docs.map(d => ({
          uid: d.id,
          ...(d.data() as Omit<CandidateProfile, 'uid'>),
        }));
        setAllCandidates(candidates);
        setVisibleCount(PAGE_SIZE);
      } catch (err) {
        console.error('Failed to fetch candidates:', err);
      } finally {
        setLoading(false);
        setFetched(true);
      }
    };
    fetchCandidates();
  }, [availabilityFilter]);

  // Debounce skills input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSkills(skillsInput);
      setVisibleCount(PAGE_SIZE);
    }, 300);
    return () => clearTimeout(t);
  }, [skillsInput]);

  // Debounce location input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedLocation(locationInput);
      setVisibleCount(PAGE_SIZE);
    }, 300);
    return () => clearTimeout(t);
  }, [locationInput]);

  // Client-side filtering
  const filtered = allCandidates.filter(c => {
    const skillMatch =
      !debouncedSkills ||
      (c.skills || []).some(s =>
        s.toLowerCase().includes(debouncedSkills.toLowerCase())
      );
    const locationMatch =
      !debouncedLocation ||
      (c.location || '').toLowerCase().includes(debouncedLocation.toLowerCase());
    return skillMatch && locationMatch;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter Candidates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Skills */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by skill..."
              value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>

          {/* Location */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Location..."
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>

          {/* Availability */}
          <div className="relative">
            <select
              value={availabilityFilter}
              onChange={e => setAvailabilityFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm appearance-none"
            >
              <option value="">Any availability</option>
              <option value="immediate">Immediate</option>
              <option value="1-month">1 Month</option>
              <option value="3-months">3 Months</option>
              <option value="open">Open to Offers</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-orange-500" />
            Candidate Pool
          </h2>
          {fetched && !loading && (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {filtered.length} {filtered.length === 1 ? 'Result' : 'Results'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : !fetched ? null : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No candidates match your filters.</p>
            <p className="text-slate-400 text-sm mt-1">Try broadening your search criteria.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visible.map(candidate => (
                <CandidateCard
                  key={candidate.uid}
                  candidate={candidate}
                  onView={() => setSelectedCandidate(candidate)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Load More ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <CandidateModal
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
