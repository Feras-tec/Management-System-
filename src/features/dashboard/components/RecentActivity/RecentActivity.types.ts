export interface ActivityItem {
  id: string;
  title: string;
  date: string;
}

export interface RecentActivityProps {
  items: ActivityItem[];
}
