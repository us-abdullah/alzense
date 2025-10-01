import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WalkSession, CalmZone, StressZone } from '../types';

interface SessionHistoryProps {
  sessions: WalkSession[];
  calmZones: CalmZone[];
  stressZones: StressZone[];
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions, calmZones, stressZones }) => {
  const [selectedSession, setSelectedSession] = useState<WalkSession | null>(null);

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'calm': return '🙂';
      case 'neutral': return '😐';
      case 'stressed': return '😟';
      default: return '❓';
    }
  };

  // const getMoodColor = (mood: string) => {
  //   switch (mood) {
  //     case 'calm': return '#4ade80';
  //     case 'neutral': return '#fbbf24';
  //     case 'stressed': return '#ef4444';
  //     default: return '#6b7280';
  //   }
  // };

  const getSessionDuration = (session: WalkSession) => {
    if (!session.endTime) return 'In Progress';
    const duration = session.endTime - session.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getSessionStats = (session: WalkSession) => {
    const total = session.moodEntries.length;
    if (total === 0) return { calm: 0, neutral: 0, stressed: 0 };
    
    return {
      calm: Math.round((session.calmCount / total) * 100),
      neutral: Math.round((session.neutralCount / total) * 100),
      stressed: Math.round((session.stressCount / total) * 100)
    };
  };

  const getOverallTrend = (sessions: WalkSession[]) => {
    if (sessions.length < 2) return 'stable';
    
    const recentSessions = sessions.slice(-5); // Last 5 sessions
    const avgStressRate = recentSessions.reduce((sum, session) => {
      const total = session.moodEntries.length;
      return sum + (total > 0 ? session.stressCount / total : 0);
    }, 0) / recentSessions.length;

    const olderSessions = sessions.slice(-10, -5);
    if (olderSessions.length === 0) return 'stable';
    
    const olderAvgStressRate = olderSessions.reduce((sum, session) => {
      const total = session.moodEntries.length;
      return sum + (total > 0 ? session.stressCount / total : 0);
    }, 0) / olderSessions.length;

    if (avgStressRate < olderAvgStressRate - 0.1) return 'improving';
    if (avgStressRate > olderAvgStressRate + 0.1) return 'declining';
    return 'stable';
  };

  const trend = getOverallTrend(sessions);

  return (
    <div className="page-content">
      <h1 className="page-title">Walk History</h1>

      {/* Overall Stats */}
      <div className="card">
        <h2 className="card-title">Overall Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {sessions.length}
            </div>
            <div>Total Walks</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>
              {calmZones.length}
            </div>
            <div>Calm Zones</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
              {stressZones.length}
            </div>
            <div>Stress Zones</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: trend === 'improving' ? '#4ade80' : trend === 'declining' ? '#ef4444' : '#6b7280' }}>
              {trend === 'improving' ? <TrendingUp size={32} /> : trend === 'declining' ? <TrendingDown size={32} /> : <Minus size={32} />}
            </div>
            <div>Trend</div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card">
        <h2 className="card-title">Recent Walks</h2>
        {sessions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            No walk sessions recorded yet. Start your first walk to see history here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions
              .sort((a, b) => b.startTime - a.startTime)
              .map((session) => {
                const stats = getSessionStats(session);
                return (
                  <div
                    key={session.id}
                    className="session-item"
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      backgroundColor: selectedSession?.id === session.id ? '#f3f4f6' : 'white'
                    }}
                    onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} />
                        <span style={{ fontWeight: '600' }}>
                          {format(new Date(session.startTime), 'MMM dd, yyyy - h:mm a')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {getSessionDuration(session)}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: '#4ade80' }}>🙂</span>
                        <span>{stats.calm}%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: '#fbbf24' }}>😐</span>
                        <span>{stats.neutral}%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: '#ef4444' }}>😟</span>
                        <span>{stats.stressed}%</span>
                      </div>
                    </div>

                    {session.summary && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                        {session.summary}
                      </div>
                    )}

                    {selectedSession?.id === session.id && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Mood Entries</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                          {session.moodEntries.map((entry) => (
                            <div
                              key={entry.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{getMoodIcon(entry.mood)}</span>
                                <span style={{ fontWeight: '500' }}>{entry.mood}</span>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                  {format(new Date(entry.timestamp), 'h:mm:ss a')}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {entry.noiseLevel.toFixed(0)}dB
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Calm and Stress Zones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <h3 className="card-title" style={{ color: '#4ade80' }}>Calm Zones</h3>
          {calmZones.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>No calm zones identified yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {calmZones.map((zone) => (
                <div
                  key={zone.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    Calm Score: {(zone.calmScore * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Visits: {zone.visitCount} • Last: {format(new Date(zone.lastVisited), 'MMM dd')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ color: '#ef4444' }}>Stress Zones</h3>
          {stressZones.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>No stress zones identified yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stressZones.map((zone) => (
                <div
                  key={zone.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#fef2f2',
                    borderRadius: '6px',
                    border: '1px solid #fecaca'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    Stress Score: {(zone.stressScore * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Count: {zone.stressCount} • Last: {format(new Date(zone.lastStressed), 'MMM dd')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
