export type Email = {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  category: 'inbox' | 'sent' | 'draft';
  read: boolean;
};
