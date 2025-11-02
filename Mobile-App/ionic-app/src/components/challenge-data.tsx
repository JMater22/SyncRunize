export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetDistance: string;
  duration: string;
}

export const challenges: Challenge[] = [
  {
    id: 'challenge-1',
    title: 'Couch to 5k',
    description: 'Build from walking to running 5K continuously with intervals.',
    targetDistance: '5km',
    duration: '56 days'
  },
  {
    id: 'challenge-2',
    title: 'The 7-Day Starter',
    description: 'Run at least 1 kilometer every day for a week.',
    targetDistance: '1km daily',
    duration: '7 days'
  },
  {
    id: 'challenge-3',
    title: '30-Day Streak',
    description: 'Run at least 1 mile every day for a month.',
    targetDistance: '1.6km',
    duration: '30 days'
  },
  {
    id: 'challenge-4',
    title: '5K Improver',
    description: 'Work on improving your 5K time with structured training.',
    targetDistance: '5 km',
    duration: '42 days'
  },
  {
    id: 'challenge-5',
    title: 'Weekend Long Run',
    description: 'Do one longer run each weekend, adding distance progressively.',
    targetDistance: 'Build to 10km',
    duration: '56 days'
  },
  {
    id: 'challenge-6',
    title: 'The 50K Month',
    description: 'Accumulate 50 kilometers total over the month at your pace.',
    targetDistance: '50km total',
    duration: '30 days'
  },
  {
    id: 'challenge-7',
    title: 'Three Times a Week',
    description: 'Run three days per week with rest days between.',
    targetDistance: '3-5km per run',
    duration: '30 days'
  },
  { 
    id: 'challenge-8',
    title: '10K Beginner',
    description: 'Progress from 5K to completing 10K distance.',
    targetDistance: '10km',
    duration: '63 days'
  },
  {
    id: 'challenge-9',
    title: '15-Minute Daily Run',
    description: 'Run for 15 minutes every day.',
    targetDistance: '1.5-2.5km daily',
    duration: '30 days'
  },
  {
    id: 'challenge-10',
    title: 'The 100K Quarter',
    description: 'Accumulate 100 kilometers over three months.',
    targetDistance: '100km total',
    duration: '90 days'
  },
  {
    id: 'challenge-11',
    title: '10K in 60 Minutes',
    description: 'Train to complete 10 kilometers in under 60 minutes.',
    targetDistance: '10km (under 60 min)',
    duration: '56 days'
  },
  {
    id: 'challenge-12',
    title: 'Marathon Prep',
    description: '16-week program to build endurance for a full marathon.',
    targetDistance: '42.2km',
    duration: '112 days'
  }
];