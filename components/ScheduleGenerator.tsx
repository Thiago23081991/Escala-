
import React, { useState } from 'react';
import { Member, WorshipDate, ScheduleEntry, Role } from '../types.ts';
import { Calendar, RefreshCw, Download, CalendarPlus, Trash2, Info, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  members: Member[];
  dates: WorshipDate[];
  onDatesUpdate: (dates: WorshipDate[]) => void;
  onScheduleUpdate: (entries: ScheduleEntry[]) => void;
  schedule: ScheduleEntry[];
}

const ScheduleGenerator: React.FC<Props> = ({ members, dates, onDatesUpdate, onScheduleUpdate, schedule }) => {
  const [newDate, setNewDate] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getDayOfWeek = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const isWorshipDay = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNum = date.getDay(); 
    return [0, 2, 4].includes(dayNum);
  };

  const addDate = () => {
    if (!newDate) return;
    if (dates.find(d => d.id === newDate)) return;
    onDatesUpdate([...dates, { id: newDate, date: newDate }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDate('');
  };

  const suggestNextDates = () => {
    const suggestions: WorshipDate[] = [];
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    while (suggestions.length < 9) {
      const day = current.getDay();
      if ([0, 2, 4].includes(day)) {
        const iso = current.toISOString().split('T')[0];
        if (!dates.find(d => d.id === iso)) {
          suggestions.push({ id: iso, date: iso });
        }
      }
      current.setDate(current.getDate() + 1);
    }
    onDatesUpdate([...dates, ...suggestions].sort((a, b) => a.date.localeCompare(b.date)));
  };

  const removeDate = (id: string) => {
    onDatesUpdate(dates.filter(d => d.id !== id));
    onScheduleUpdate(schedule.filter(s => s.date !== id));
  };

  const generateSchedule = () => {
    if (members.length === 0) {
      alert("Por favor, adicione membros na aba 'Membros' antes de gerar a escala.");
      return;
    }
    if (dates.length === 0) {
      alert("Adicione pelo menos uma data de culto.");
      return;
    }

    setIsGenerating(true);
    console.group("Relatório de Geração de Escala (Lógica de Rotação)");

    setTimeout(() => {
      const history: Record<string, string[]> = {};
      Object.values(Role).forEach(role => {
        const lastThreeEntries = schedule.slice(-3);
        history[role] = lastThreeEntries
          .map(entry => entry.assignments[role])
          .filter(name => name && name !== "⚠️ FALTA");
      });

      const newScheduleEntries: ScheduleEntry[] = dates.map(worshipDate => {
        const assignments: Record<Role, string> = {} as any;
        const escaladosHoje = new Set<string>();

        Object.values(Role).forEach(role => {
          const roleHistory = history[role] || [];
          
          const candidates = members.filter(m => {
            const sabeFuncao = m.roles.includes(role);
            const unavail = m.unavailableDates || [];
            const podeData = !unavail.includes(worshipDate.date);
            const jaEscaladoHoje = escaladosHoje.has(m.id);
            return sabeFuncao && podeData && !jaEscaladoHoje;
          });

          if (candidates.length > 0) {
            const priorityCandidates = candidates.filter(m => !roleHistory.includes(m.name));
            
            let selected;
            if (priorityCandidates.length > 0) {
              selected = priorityCandidates[Math.floor(Math.random() * priorityCandidates.length)];
            } else {
              selected = candidates[Math.floor(Math.random() * candidates.length)];
            }

            assignments[role] = selected.name;
            escaladosHoje.add(selected.id);

            roleHistory.push(selected.name);
            if (roleHistory.length > 3) roleHistory.shift();
            history[role] = roleHistory;
          } else {
            assignments[role] = "⚠️ FALTA";
          }
        });

        return {
          date: worshipDate.date,
          assignments
        };
      });

      onScheduleUpdate(newScheduleEntries);
      setIsGenerating(false);
      console.groupEnd();
    }, 800);
  };

  const copyToClipboard = () => {
    if (schedule.length === 0) return;

    let text = "🎵 *ESCALA DE LOUVOR*\n\n";
    schedule.forEach(entry => {
      text += `📅 *${formatDateDisplay(entry.date)}* (${getDayOfWeek(entry.date)})\n`;
      Object.entries(entry.assignments).forEach(([role, name]) => {
        text += `• ${role}: ${name}\n`;
      });
      text += "\n";
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetAll = () => {
    if (confirm("Isso apagará TODOS os dados (Membros, Datas e Escalas). Tem certeza?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-indigo-600" />
            Configurar Datas
          </h3>
          <div className="flex gap-2">
            <button
              onClick={suggestNextDates}
              className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Sugerir Datas (Ter, Qui, Dom)
            </button>
            <button
              onClick={resetAll}
              className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 px-3 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition"
            >
              Resetar Tudo
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${
                  newDate && !isWorshipDay(newDate) ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
                }`}
              />
              {newDate && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isWorshipDay(newDate) ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {getDayOfWeek(newDate)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={addDate}
              disabled={!newDate}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-bold"
            >
              Adicionar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {dates.map(d => (
            <div key={d.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 group hover:border-indigo-300 transition shadow-sm">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800">
                  {formatDateDisplay(d.date)}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  {getDayOfWeek(d.date)}
                </span>
              </div>
              <button
                onClick={() => removeDate(d.id)}
                className="text-slate-300 hover:text-red-500 transition p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {dates.length === 0 && (
            <div className="text-center w-full py-4 border border-dashed border-slate-200 rounded-lg">
              <p className="text-sm text-slate-400 italic">Nenhuma data selecionada para a escala.</p>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Escala Semanal
          {schedule.length > 0 && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          {schedule.length > 0 && (
            <button
              onClick={copyToClipboard}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition shadow-sm border ${
                copied ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar para WhatsApp'}
            </button>
          )}
          <button
            onClick={generateSchedule}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Sorteando...' : 'Gerar Escala'}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {schedule.map((entry, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-200 transition">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
                  {formatDateDisplay(entry.date).split('/')[0]}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{formatDateDisplay(entry.date)}</h4>
                  <p className="text-[10px] uppercase font-bold text-slate-400">{getDayOfWeek(entry.date)}</p>
                </div>
              </div>
              <div className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${isWorshipDay(entry.date) ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                {isWorshipDay(entry.date) ? 'Culto Oficial' : 'Evento Extra'}
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(entry.assignments).map(([role, name]) => (
                <div key={role} className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{role}</span>
                  <div className={`px-3 py-2 rounded-lg border text-sm font-semibold truncate ${
                    name === '⚠️ FALTA' 
                      ? 'bg-red-50 text-red-600 border-red-100 italic' 
                      : 'bg-white text-slate-800 border-slate-100'
                  }`}>
                    {name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {schedule.length === 0 && (
          <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <RefreshCw className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400">Escala não gerada</h3>
            <p className="text-slate-400 text-sm">Selecione as datas acima e clique em "Gerar Escala" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGenerator;
