import React from 'react';
import { getAnalytics, getEmails, getCalendarEvents, getTeamMembers, getDeployments, getDocuments, getIntegrations } from '../api';

const SummarizerAgent = ({ setState, getState }) => {
  const generateSummary = async () => {
    try {
      // Gather data from state (or fetch fresh)
      const state = getState();
      const { emails = [], calendarEvents = [], teamMembers = [] } = state;

      // Build a simple prompt (could be sent to backend LLM)
      const payload = {
        emails: emails.slice(0, 5).map(e => ({ sender: e.sender, subject: e.subject })),
        events: calendarEvents.slice(0, 5).map(e => ({ title: e.title, time: e.time })),
        // optionally include other data
      };

      // Call backend summarization endpoint
      const res = await fetch('/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Summary generation failed');
      const { summary } = await res.json();

      // Store summary in state under a key like 'dailyBrief'
      setState(prev => ({ ...prev, dailyBrief: summary }));
    } catch (err) {
      console.error('SummarizerAgent error:', err);
      // Optionally set an error state
    }
  };

  const init = () => {
    // Generate summary on mount and then every 30 minutes
    generateSummary();
    const interval = setInterval(generateSummary, 30 * 60 * 1000);
    return () => clearInterval(interval);
  };

  return { generateSummary, init };
};

export default SummarizerAgent;