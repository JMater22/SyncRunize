export interface Post {
  id: number;
  username: string;
  timestamp: string;
  content: string;
}

export const posts: Post[] = [
  {
    id: 1,
    username: "Adams Smith",
    timestamp: "3 hrs ago",
    content: "Just completed my first 10K! 🏃 Feeling amazing!"
  },
  {
    id: 2,
    username: "Adams Smith",
    timestamp: "4 hrs ago",
    content: "Great run with the team today! Marathon training is on track! 🏃‍♀️🏃‍♂️"
  },
  {
    id: 3,
    username: "Adams Smith",
    timestamp: "5 hrs ago",
    content: "Morning jog in the park. So refreshing! 🌳"
  }
];