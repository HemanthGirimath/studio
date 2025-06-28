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

export const emails: Email[] = [
  {
    id: '1',
    from: 'Alice Johnson',
    to: 'You',
    subject: 'Project Update',
    body: `Hi team,

Just a quick update on the Phoenix project. We've completed the initial design phase and will be moving into development next week. Please review the attached documents and provide your feedback by Friday.

Best,
Alice`,
    date: '2024-07-29T10:00:00Z',
    category: 'inbox',
    read: true,
  },
  {
    id: '2',
    from: 'Marketing Team',
    to: 'You',
    subject: 'Weekly Newsletter',
    body: 'Check out our latest blog posts and company news in this week\'s newsletter. We have exciting updates about our new product launch!',
    date: '2024-07-29T09:00:00Z',
    category: 'inbox',
    read: false,
  },
  {
    id: '3',
    from: 'Bob Williams',
    to: 'You',
    subject: 'Lunch on Wednesday?',
    body: 'Hey, are you free for lunch this Wednesday? There\'s a new cafe downtown I wanted to try out. Let me know!',
    date: '2024-07-28T14:30:00Z',
    category: 'inbox',
    read: true,
  },
  {
    id: '4',
    from: 'You',
    to: 'Charlie Brown',
    subject: 'Re: Design Mockups',
    body: `Hi Charlie,

Thanks for sending those over. The mockups look great! I have a few minor suggestions which I've added as comments in the Figma file.

Let's sync up tomorrow to discuss.

Cheers,
You`,
    date: '2024-07-28T11:00:00Z',
    category: 'sent',
    read: true,
  },
  {
    id: '5',
    from: 'You',
    to: 'Support Team',
    subject: 'Issue with my account',
    body: 'Hello, I am having trouble accessing my account dashboard. Could you please assist? Thank you.',
    date: '2024-07-27T16:45:00Z',
    category: 'sent',
    read: true,
  },
  {
    id: '6',
    from: 'You',
    to: 'Team',
    subject: 'Brainstorming Session',
    body: 'Hi everyone, let\'s schedule a brainstorming session for the Q4 marketing campaign. Please fill out your availability on the Doodle poll: [link]',
    date: '2024-07-26T09:15:00Z',
    category: 'sent',
    read: true,
  },
  {
    id: '7',
    from: 'You',
    to: 'David Lee',
    subject: 'Travel Itinerary',
    body: 'Hi David, here is the draft for our upcoming business trip. Please check the flight times and hotel booking details.',
    date: 'Draft',
    category: 'draft',
    read: true,
  },
  {
    id: '8',
    from: 'You',
    to: '',
    subject: 'Ideas for new feature',
    body: 'Initial thoughts on the voice command integration...',
    date: 'Draft',
    category: 'draft',
    read: true,
  },
];
