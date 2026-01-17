
import React, { useState, useMemo } from 'react';
import { Member, WorshipDate, ScheduleEntry, Role } from '../types.ts';
import { Calendar, RefreshCw, Download, CalendarPlus, Trash2, Info, Copy, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';

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

  // Cálculo de estatísticas da escala atual
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => counts[m.name] = 0);
    
    // Fix: cast Object.values to string[] to ensure 'name' is treated as a valid string index.
    schedule.forEach(entry => {
      (Object.values(entry.assignments) as string[]).forEach(name => {
        if (name && name !== "⚠️ FALTA" && counts[name] !== undefined) {
          counts[name]++;
        }
      });
    });
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [schedule, members]);

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
      alert("Adicione membros antes de gerar a escala.");
      return;
    }
    if (dates.length === 0) {
      alert("Adicione pelo menos uma data.");
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const newScheduleEntries: ScheduleEntry[] = [];
      const globalWorkload: Record<string, number> = {};
      members.forEach(m => globalWorkload[m.id] = 0);

      // Variável para rastrear quem tocou no ÚLTIMO culto processado
      let lastDateAssignments: Set<string> = new Set();

      // Processar cada data em ordem cronológica
      dates.forEach((worshipDate, dateIdx) => {
        const assignments: Record<Role, string> = {} as any;
        const escaladosHoje = new Set<string>();

        // Ordem de preenchimento das funções (pode influenciar prioridade)
        const rolesOrder = Object.values(Role);

        rolesOrder.forEach(role => {
          // 1. Filtrar candidatos qualificados e disponíveis
          const candidates = members.filter(m => {
            const sabeFuncao = m.roles.includes(role);
            const unavail = m.unavailableDates || [];
            const podeData = !unavail.includes(worshipDate.date);
            const jaEscaladoHoje = escaladosHoje.has(m.id);
            return sabeFuncao && podeData && !jaEscaladoHoje;
          });

          if (candidates.length > 0) {
            // 2. Calcular SCORE para cada candidato (Quanto MENOR o score, MELHOR a prioridade)
            const scoredCandidates = candidates.map(m => {
              let score = globalWorkload[m.id] * 20; // Penaliza quem já tocou muito no total
              
              // Penalidade pesada se tocou no culto imediatamente anterior
              if (lastDateAssignments.has(m.id)) {
                score += 100;
              }

              // Adiciona um pequeno fator aleatório para desempatar e rotacionar
              score += Math.random() * 5;

              return { member: m, score };
            });

            // 3. Ordenar por score e pegar o melhor
            scoredCandidates.sort((a, b) => a.score - b.score);
            const selected = scoredCandidates[0].member;

            assignments[role] = selected.name;
            escaladosHoje.add(selected.id);
            globalWorkload[selected.id]++;
          } else {
            assignments[role] = "⚠️ FALTA";
          }
        });

        newScheduleEntries.push({
          date: worshipDate.date,
          assignments
        });

        // Atualizar quem tocou nesta data para ser a referência da próxima
        lastDateAssignments = escaladosHoje;
      });

      onScheduleUpdate(newScheduleEntries);
      setIsGenerating(false);
    }, 600);
  };

  const copyToClipboard = () => {
    if (schedule.length === 0) return;

    let text = "🎵 *ESCALA DE LOUVOR*\n\n";
    schedule.forEach(entry => {
      text += `📅 *${formatDateDisplay(entry.date)}* (${getDayOfWeek(entry.date).toUpperCase()})\n`;
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

  const clearScheduleOnly = () => {
    if (confirm("Deseja limpar apenas a escala gerada?")) {
      onScheduleUpdate([]);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Configuração de Datas */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
              Sugerir Próximas Datas
            </button>
            <button
              onClick={clearScheduleOnly}
              className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 px-3 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition"
            >
              Limpar Escala
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={addDate}
            disabled={!newDate}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-bold"
          >
            Adicionar
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {dates.map(d => (
            <div key={d.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-300 transition shadow-sm">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800">{formatDateDisplay(d.date)}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400">{getDayOfWeek(d.date)}</span>
              </div>
              <button onClick={() => removeDate(d.id)} className="text-slate-300 hover:text-red-500 transition p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Estatísticas de Equilíbrio */}
      {schedule.length > 0 && (
        <section className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-indigo-300" />
            <h3 className="text-lg font-bold">Equilíbrio da Escala</h3>
          </div>
          <p className="text-indigo-200 text-xs mb-4">Veja quantas vezes cada pessoa foi escalada para garantir um sorteio justo:</p>
          <div className="flex flex-wrap gap-3">
            {stats.map(([name, count]) => (
              <div key={name} className="bg-indigo-800/50 border border-indigo-700/50 px-3 py-2 rounded-xl flex items-center gap-3">
                <span className="text-sm font-medium">{name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count > 0 ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                  {count}x
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cabeçalho da Escala */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Escala de Louvor
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
              {copied ? 'Copiado!' : 'Copiar p/ WhatsApp'}
            </button>
          )}
          <button
            onClick={generateSchedule}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Equilibrando...' : 'Gerar Escala'}
          </button>
        </div>
      </div>

      {/* Lista da Escala */}
      <div className="grid gap-6">
        {schedule.map((entry, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-200 transition group">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center group-hover:bg-indigo-50/30 transition">
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
                {isWorshipDay(entry.date) ? 'Culto Oficial' : 'Extra'}
              </div>
            </div>
            {/* Grid ajustado para 4 colunas (agora com 8 funções no total) */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(entry.assignments).map(([role, name]) => (
                <div key={role} className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{role}</span>
                  <div className={`px-3 py-2 rounded-lg border text-sm font-semibold truncate transition ${
                    name === '⚠️ FALTA' 
                      ? 'bg-red-50 text-red-600 border-red-100 italic' 
                      : 'bg-white text-slate-800 border-slate-100 group-hover:border-indigo-100'
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
            <h3 className="text-lg font-bold text-slate-400">Nenhuma escala gerada</h3>
            <p className="text-slate-400 text-sm">Clique em "Gerar Escala" para distribuir os membros nas datas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGenerator;
