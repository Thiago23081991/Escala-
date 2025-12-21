
export enum Role {
  MINISTRO = 'Ministro',
  TECLADO = 'Teclado',
  VIOLAO = 'Violão',
  BAIXO = 'Baixo',
  BATERIA = 'Bateria',
  BACKVOCAL = 'Backvocal'
}

export interface Member {
  id: string;
  name: string;
  roles: Role[];
  unavailableDates: string[]; // ISO Strings
}

export interface WorshipDate {
  id: string;
  date: string; // ISO String
}

export interface ScheduleEntry {
  date: string;
  assignments: Record<Role, string>; // Role -> Member ID or "⚠️ FALTA"
}

export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '16:9' | '9:16' | '1:1';
