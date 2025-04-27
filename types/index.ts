export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Board {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  users?: User[];
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  labels?: string[];
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}
