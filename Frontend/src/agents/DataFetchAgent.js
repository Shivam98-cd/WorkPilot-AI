
const DataFetchAgent = ({ setData, getData }) => {
  const fetchDashboardData = async () => {
    try {
      const emptyLiveState = {
        emails: [],
        meetings: [],
        team: [],
        aiActions: [],
        tickerItems: [
          '⚡ SuperBrain Autonomous Workflows Active',
          '🛡️ Schedule Guardian Monitoring Calendar',
          '📧 Live Email Triage & Draft Engine Online',
          '🚀 Multi-Hop Tool Execution Ready',
          '🔒 Executive Safeguards & Role Enforcement Enabled',
        ],
      };
      setData(emptyLiveState);
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