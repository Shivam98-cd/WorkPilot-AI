import { backendLogout } from '../api';
import { auth, signOut } from '../firebase';

const DataFetchAgent = ({ setData, getData }) => {
  const fetchDashboardData = async () => {
    try {
      // Example: fetch from backend API
      // const response = await fetch('/api/dashboard');
      // const data = await response.json();
      // For now use mock data
      const mockData = {
        emails: [
          { id: 1, sender: 'Robert Chen', role: 'CFO', subject: 'Q3 Budget Approval — Action Required', time: '8m', priority: 'urgent' },
          { id: 2, sender: 'Acme Corp', role: 'Client', subject: 'Service complaint — ticket #4821', time: '32m', priority: 'urgent' },
          { id: 3, sender: 'HR Team', role: 'Internal', subject: 'Team offsite planning for August', time: '1h', priority: 'normal' },
        ],
        meetings: [
          { id: 1, time: '10:00', label: 'AM', title: 'Daily Standup', dur: '15m', people: 5, status: 'ready', color: '#10b981' },
          { id: 2, time: '14:00', label: 'PM', title: 'Client Call — Acme', dur: '60m', people: 3, status: 'ready', color: '#3b82f6' },
          { id: 3, time: '16:00', label: 'PM', title: 'Deep Work Block 🔒', dur: '2h', people: 1, status: 'protected', color: '#8b5cf6' },
        ],
        team: [
          { id: 1, name: 'Sarah Chen', task: 'UI mockups', progress: 100, status: 'done' },
          { id: 2, name: 'John Smith', task: 'API integration', progress: 65, status: 'track' },
          { id: 3, name: 'Mike Chen', task: 'Backend testing', progress: 30, status: 'late' },
          { id: 4, name: 'Priya Sharma', task: 'No update', progress: 0, status: 'missing' },
        ],
        aiActions: [
          { id: 1, time: '9:14', text: 'Sent 3 follow-up emails to Acme Corp', reversible: true },
          { id: 2, time: '9:02', text: 'Scheduled team meeting Wednesday 3pm', reversible: false },
          { id: 3, time: '8:45', text: 'Archived 12 newsletters', reversible: false },
          { id: 4, time: '8:30', text: 'Generated morning briefing', reversible: false },
        ],
        tickerItems: [
          '⚡ Sent follow-up to Acme Corp',
          '📅 Meeting scheduled — Wednesday 3pm',
          '📧 3 urgent emails processed',
          '🚀 Deployment v2.4.2 at 67%',
          '👥 Mike Chen task — 2 days overdue',
          '✅ Daily standup brief ready',
          '📄 Budget_2026 at 67%',
        ],
      };
      setData(mockData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const init = () => {
    fetchDashboardData();
    // Set up interval for refreshing data
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  };

  return {
    fetchDashboardData,
    init,
  };
};

export default DataFetchAgent;