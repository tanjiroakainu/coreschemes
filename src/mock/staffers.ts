// /mock/staffers.ts

export const mockStaffers = [
  // 4 Executives
  {
    id: 'e1',
    name: 'Alex Reyes',
    role: 'Editor-in-Chief',
    group: 'executives',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
  {
    id: 'e2',
    name: 'Maria Santos',
    role: 'Associate Editor',
    group: 'executives',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
  },
  {
    id: 'e3',
    name: 'Julius Cruz',
    role: 'Managing Editor',
    group: 'executives',
    avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
  },
  {
    id: 'e4',
    name: 'Kristine Uy',
    role: 'Executive Secretary',
    group: 'executives',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
  },

  // 20 Scribes
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `s${i + 1}`,
    name: `Scribe Member ${i + 1}`,
    role: 'Writer',
    group: 'scribes',
    avatar: `https://randomuser.me/api/portraits/men/${i + 10}.jpg`,
  })),

  // 20 Creatives
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `c${i + 1}`,
    name: `Creative Staff ${i + 1}`,
    role: 'Graphic Artist',
    group: 'creatives',
    avatar: `https://randomuser.me/api/portraits/women/${i + 10}.jpg`,
  })),

  // 10 Managerial
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `m${i + 1}`,
    name: `Managerial Staff ${i + 1}`,
    role: 'Logistics',
    group: 'managerial',
    avatar: `https://randomuser.me/api/portraits/lego/${(i + 1) % 10}.jpg`,
  })),
];
