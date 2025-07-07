export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}
