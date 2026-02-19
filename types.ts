
export enum RelationType {
  PARENT = 'parent',
  PARALLEL = 'parallel'
}

export interface Relation {
  id: string;
  type: RelationType;
}

export interface Schedule {
  id: string;
  title: string;
  originalTitle: string;
  date: string;
  time: string;
  allDay: boolean;
  owner: string;
  ownerDept?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerContactType?: string;
  completed: boolean;
  relations: Relation[];
  selectedFragments: string[];
  reminders?: number[]; // 存储提醒的偏移量（分钟），例如 [5, 30, 1440]
}

export interface WeekConfig {
  baseDate: string;
  baseWeek: number;
}

export interface ApiConfig {
  baseUrlLine: string;
  apiVersionLine: string;
  modelNameLine: string;
  apiKeyLine: string; // 新增字段
}

export type TabType = 'widget' | 'upload';
