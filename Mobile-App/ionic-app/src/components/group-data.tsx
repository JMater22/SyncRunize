export interface Group {
  id: string;
  name: string;
  type: 'suggested' | 'joined';
}

export const suggestedGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Trail Runners',
    type: 'suggested'
  },
  {
    id: 'group-2',
    name: 'Sprint Team',
    type: 'suggested'
  },
  {
    id: 'group-3',
    name: 'Yoga Enthusiasts',
    type: 'suggested'
  }
];

export const joinedGroups: Group[] = [
  {
    id: 'group-joined-1',
    name: 'Trail Runners',
    type: 'joined'
  }
];