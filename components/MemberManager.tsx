
import React, { useState } from 'react';
import { Member, Role } from '../types.ts';
import { Plus, Trash2, CalendarOff, X, Check, Users, UserPlus, Settings2 } from 'lucide-react';

interface Props {
  members: Member[];
  onAdd: (m: Member) => void;
  onUpdate: (m: Member) => void;
  onDelete: (id: string) => void;
}

const MemberManager: React.FC<Props> = ({ members, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [editingUnavail, setEditingUnavail] = useState<string | null>(null);
  const [editingRoles, setEditingRoles] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName || selectedRoles.length === 0) return;
    onAdd({
      id: crypto.randomUUID(),
      name: newName,
      phone: newPhone,
      email: newEmail,
      roles: selectedRoles,
      unavailableDates: []
    });
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setSelectedRoles([]);
    setIsAdding(false);
  };

  const toggleRole = (role: Role) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleMemberRole = (memberId: string, role: Role) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const currentRoles = member.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    if (newRoles.length === 0) return;

    onUpdate({
      ...member,
      roles: newRoles
    });
  };

  const addUnavailableDate = (memberId: string, date: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const dates = member.unavailableDates || [];
    if (dates.includes(date)) return;

    onUpdate({
      ...member,
      unavailableDates: [...dates, date].sort()
    });
  };

  const removeUnavailableDate = (memberId: string, date: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    onUpdate({
      ...member,
      unavailableDates: (member.unavailableDates || []).filter(d => d !== date)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Equipe de Louvor</h2>
          <p className="text-sm text-slate-500">{members.length} membros cadastrados</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-md shadow-indigo-100"
        >
          <UserPlus className="w-4 h-4" />
          Novo Membro
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Adicionar Membro</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: 11999999999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: joao@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">O que esta pessoa toca/faz?</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Role).map(role => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedRoles.includes(role)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName || selectedRoles.length === 0}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-indigo-700 transition"
            >
              Salvar Cadastro
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(member => (
          <div key={member.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col hover:border-indigo-200 transition group">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                  {member.name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingRoles(editingRoles === member.id ? null : member.id);
                      setEditingUnavail(null);
                    }}
                    className={`p-1.5 rounded-lg transition ${editingRoles === member.id ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-500'}`}
                    title="Editar Funções"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(member.id)}
                    className="text-slate-300 hover:text-red-500 transition p-1.5"
                    title="Remover Membro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h4 className="font-bold text-lg text-slate-800 mb-1">{member.name}</h4>
              <div className="flex flex-col gap-1 mb-3">
                {(member.phone || member.email) ? (
                  <>
                    {member.phone && <span className="text-[10px] uppercase font-bold text-slate-400">📞 {member.phone}</span>}
                    {member.email && <span className="text-[10px] uppercase font-bold text-slate-400">✉️ {member.email}</span>}
                  </>
                ) : (
                  <span className="text-[10px] uppercase font-bold text-slate-300">Sem contato cadastrado</span>
                )}
              </div>
              
              {editingRoles === member.id ? (
                <div className="mb-4 space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in duration-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Selecionar Funções:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.values(Role).map(role => (
                      <button
                        key={role}
                        onClick={() => toggleMemberRole(member.id, role)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition border ${
                          member.roles.includes(role)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setEditingRoles(null)}
                    className="w-full text-[10px] font-bold text-indigo-600 pt-1 hover:underline"
                  >
                    Finalizar Edição
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1 mb-4">
                  {member.roles.map(role => (
                    <span key={role} className="text-[10px] uppercase tracking-wider font-bold bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded">
                      {role}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-50 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Indisponibilidade</span>
                  <button 
                    onClick={() => {
                      setEditingUnavail(editingUnavail === member.id ? null : member.id);
                      setEditingRoles(null);
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    {editingUnavail === member.id ? 'Fechar' : 'Editar'}
                  </button>
                </div>
                
                {editingUnavail === member.id ? (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <input 
                      type="date" 
                      onChange={(e) => {
                        if (e.target.value) {
                          addUnavailableDate(member.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full text-xs p-2 border border-slate-200 rounded"
                    />
                    <div className="flex flex-wrap gap-1">
                      {(member.unavailableDates || []).map(date => (
                        <span key={date} className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {date.split('-').reverse().slice(0, 2).join('/')}
                          <button onClick={() => removeUnavailableDate(member.id, date)}><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {(member.unavailableDates || []).length > 0 
                      ? `${(member.unavailableDates || []).length} datas bloqueadas`
                      : 'Disponível em todas as datas'}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberManager;
