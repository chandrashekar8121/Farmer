import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { FertilizerTask } from '../types';

export const SchedulePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState<FertilizerTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.schedules.list();
      setTasks(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load fertilizer schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleStatus = async (task: FertilizerTask) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await api.schedules.updateStatus(task.id, nextStatus);
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update task.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  const voiceSpeechText =
    language === 'te'
      ? `మీ వద్ద మొత్తం ${tasks.length} పనులు ఉన్నాయి. అందులో ${pendingCount} పనులు ఇంకా పూర్తి చేయవలసి ఉంది.`
      : `You have ${tasks.length} total fertilizer application tasks, with ${pendingCount} remaining.`;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3.5 py-1.5 rounded-full text-base font-bold">
          <CalendarCheck className="w-5 h-5 text-emerald-700" />
          <span>{t.navSchedule}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
              ఎరువుల క్యాలెండర్ మరియు రిమైండర్లు (Schedules)
            </h1>
            <p className="text-gray-600 text-lg">
              Track upcoming split applications to guarantee maximum crop uptake and avoid wastage.
            </p>
          </div>
        </div>

        <VoiceAssistant textToSpeak={voiceSpeechText} />
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-lg flex items-center gap-2">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <Filter className="w-5 h-5 text-gray-500 mr-1" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
            filter === 'all'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-700 hover:bg-emerald-50'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
            filter === 'pending'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-amber-50'
          }`}
        >
          Upcoming / Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-xl text-base font-bold transition-all ${
            filter === 'completed'
              ? 'bg-green-700 text-white shadow-sm'
              : 'text-gray-700 hover:bg-green-50'
          }`}
        >
          Completed ({tasks.length - pendingCount})
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 text-lg font-medium">
          Loading reminder schedule...
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`farmer-card p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  isDone ? 'opacity-70 border-gray-200 bg-gray-50/50' : 'border-emerald-600/30'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full ${
                        isDone
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isDone ? 'COMPLETED' : `DUE: ${task.due_date}`}
                    </span>
                    <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      {task.stage_name}
                    </span>
                  </div>

                  <h3
                    className={`text-xl font-black ${
                      isDone ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {task.task_title}
                  </h3>

                  <p className="text-base text-gray-700 font-medium">
                    Apply: <strong className="text-emerald-900">{task.product_name}</strong> (
                    {task.quantity_kg} kg)
                  </p>

                  {task.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      📝 {task.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(task)}
                  className={`farmer-touch-target px-6 py-3 rounded-2xl font-bold text-lg flex items-center gap-2 transition-all shadow-sm ${
                    isDone
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10'
                  }`}
                >
                  <CheckCircle2 className={`w-6 h-6 ${isDone ? 'text-gray-600' : 'text-white'}`} />
                  <span>{isDone ? 'Mark as Pending' : 'Mark Completed (పూర్తయింది)'}</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 bg-white rounded-3xl border-2 border-dashed border-gray-300 text-center space-y-3">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-xl font-bold text-gray-700">No scheduled tasks found</h3>
          <p className="text-gray-500 text-base">
            Generate a fertilizer recommendation from the Soil Test page to populate automated split dosage reminders.
          </p>
        </div>
      )}
    </div>
  );
};
