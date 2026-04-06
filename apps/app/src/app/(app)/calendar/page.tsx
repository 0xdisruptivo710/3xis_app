'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, X,
  Clock, MapPin, Users, Loader2, Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  color: string;
  start_datetime: string;
  end_datetime: string | null;
  is_all_day: boolean;
  is_team_event: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  team_meeting: 'Reuniao de equipe',
  training: 'Treinamento',
  personal_reminder: 'Lembrete',
  goal: 'Meta',
  other: 'Outro',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  team_meeting: '#4CAF50',
  training: '#FF6B00',
  personal_reminder: '#2196F3',
  goal: '#FFD700',
  other: '#9E9E9E',
};

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function CalendarPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('personal_reminder');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formIsTeam, setFormIsTeam] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data } = await supabase
      .from('x3_calendar_events')
      .select('*')
      .gte('start_datetime', startOfMonth)
      .lte('start_datetime', endOfMonth)
      .order('start_datetime');

    setEvents(data || []);
    setLoading(false);
  }, [user, year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return days;
  }, [year, month]);

  function getEventsForDay(day: number): CalendarEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.start_datetime.startsWith(dateStr));
  }

  const selectedDateEvents = events.filter((e) => e.start_datetime.startsWith(selectedDate));

  function goToPrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function selectDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  }

  async function handleCreateEvent() {
    if (!user || !formTitle.trim()) return;
    setSaving(true);

    const startDatetime = `${formDate || selectedDate}T${formTime}:00`;

    await supabase.from('x3_calendar_events').insert({
      user_id: user.id,
      title: formTitle,
      description: formDescription || null,
      event_type: formType,
      color: EVENT_TYPE_COLORS[formType] || '#FF6B00',
      start_datetime: startDatetime,
      is_team_event: formIsTeam,
    });

    setShowForm(false);
    setFormTitle('');
    setFormDescription('');
    setFormType('personal_reminder');
    setFormTime('09:00');
    setFormIsTeam(false);
    setSaving(false);
    fetchEvents();
  }

  async function deleteEvent(eventId: string) {
    await supabase.from('x3_calendar_events').delete().eq('id', eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-brand-on-surface">
          Calendario
        </h1>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={goToPrevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} className="text-brand-on-surface" />
        </button>
        <h2 className="font-display font-bold text-brand-on-surface">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={goToNextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronRight size={20} className="text-brand-on-surface" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="card p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-brand-muted py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDay(day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={day}
                onClick={() => selectDay(day)}
                className={cn(
                  'relative w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-colors',
                  isSelected
                    ? 'bg-brand-primary text-white'
                    : isToday
                    ? 'bg-brand-primary/10 text-brand-primary font-bold'
                    : 'hover:bg-gray-50 text-brand-on-surface'
                )}
              >
                <span className="text-xs font-medium">{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <div
                        key={j}
                        className={cn(
                          'w-1 h-1 rounded-full',
                          isSelected ? 'bg-white' : ''
                        )}
                        style={!isSelected ? { backgroundColor: e.color } : undefined}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-sm text-brand-on-surface">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h3>
          <span className="text-xs text-brand-muted">
            {selectedDateEvents.length} evento{selectedDateEvents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays size={24} className="mx-auto text-brand-muted mb-2" />
            <p className="text-sm text-brand-muted">Nenhum evento neste dia.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
            className="space-y-2"
          >
            {selectedDateEvents.map((event) => (
              <motion.div
                key={event.id}
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                className="card flex items-start gap-3"
              >
                <div
                  className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-brand-on-surface">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-brand-muted flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(event.start_datetime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {event.is_team_event && (
                      <span className="text-[10px] text-brand-primary flex items-center gap-1">
                        <Users size={10} />
                        Equipe
                      </span>
                    )}
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: event.color }}
                    >
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="p-1.5 rounded-lg text-brand-muted hover:text-brand-error hover:bg-brand-error/10 transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Create event modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg text-brand-on-surface">
                  Novo evento
                </h3>
                <button onClick={() => setShowForm(false)} className="p-1 text-brand-muted">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Titulo do evento"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field w-full"
                />

                <textarea
                  placeholder="Descricao (opcional)"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="input-field w-full resize-none"
                />

                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="input-field w-full"
                >
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formDate || selectedDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="input-field"
                  />
                </div>

                <label className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={formIsTeam}
                    onChange={(e) => setFormIsTeam(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-brand-on-surface">Evento de equipe</span>
                </label>

                <button
                  onClick={handleCreateEvent}
                  disabled={saving || !formTitle.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Criar evento'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setShowForm(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className="fixed right-4 bottom-24 w-14 h-14 bg-brand-primary text-white rounded-2xl shadow-lg shadow-brand-primary/30 flex items-center justify-center hover:bg-brand-primary/90 active:scale-95 transition-transform z-20"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  );
}
