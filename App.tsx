
import React, { useState, useEffect, useCallback } from 'react';
import { Member, WorshipDate, ScheduleEntry, Role } from './types';
import MemberManager from './components/MemberManager';
import ScheduleGenerator from './components/ScheduleGenerator';
import AiTools from './components/AiTools';
import { Music, Users, Calendar, Sparkles, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'ai'>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [worshipDates, setWorshipDates] = useState<WorshipDate[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  // Load initial data
  useEffect(() => {
    const savedMembers = localStorage.getItem('members');
    const savedDates = localStorage.getItem('dates');
    const savedSchedule = localStorage.getItem('schedule');

    if (savedMembers) setMembers(JSON.parse(savedMembers));
    if (savedDates) setWorshipDates(JSON.parse(savedDates));
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
  }, []);

  // Save data on changes
  useEffect(() => {
    localStorage.setItem('members', JSON.stringify(members));
    localStorage.setItem('dates', JSON.stringify(worshipDates));
    localStorage.setItem('schedule', JSON.stringify(schedule));
  }, [members, worshipDates, schedule]);

  const addMember = (member: Member) => setMembers(prev => [...prev, member]);
  const updateMember = (updated: Member) => setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
  const deleteMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

  const addDate = (date: WorshipDate) => setWorshipDates(prev => [...prev, date]);
  const deleteDate = (id: string) => setWorshipDates(prev => prev.filter(d => d.id !== id));

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:pl-64">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col bg-white border-r border-slate-200 md:flex">
        <div className="p-6">
          <h1 className="flex items-center gap-2 text-xl font-bold text-indigo-600">
            <Music className="w-8 h-8" />
            <span>EscalaLouvor</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Painel</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              activeTab === 'members' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Membros</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              activeTab === 'ai' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Ferramentas IA</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        {activeTab === 'dashboard' && (
          <ScheduleGenerator 
            members={members} 
            dates={worshipDates} 
            onDatesUpdate={setWorshipDates}
            onScheduleUpdate={setSchedule}
            schedule={schedule}
          />
        )}
        {activeTab === 'members' && (
          <MemberManager 
            members={members} 
            onAdd={addMember} 
            onUpdate={updateMember} 
            onDelete={deleteMember} 
          />
        )}
        {activeTab === 'ai' && <AiTools />}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 flex w-full border-t border-slate-200 bg-white md:hidden">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-1 flex-col items-center py-2 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-xs">Escala</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex flex-1 flex-col items-center py-2 ${activeTab === 'members' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs">Membros</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-1 flex-col items-center py-2 ${activeTab === 'ai' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-xs">IA</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
