import React, { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { format } from 'date-fns';

const ExportData: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'report'>('report');

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const data = StorageService.exportData();
      const sessions = StorageService.loadSessions();
      const calmZones = StorageService.loadCalmZones();
      const stressZones = StorageService.loadStressZones();
      
      if (exportFormat === 'json') {
        downloadFile(data, 'alzense-data.json', 'application/json');
      } else if (exportFormat === 'csv') {
        const csvData = generateCSV(sessions);
        downloadFile(csvData, 'alzense-sessions.csv', 'text/csv');
      } else if (exportFormat === 'report') {
        const reportData = generateReport(sessions, calmZones, stressZones);
        downloadFile(reportData, 'alzense-report.html', 'text/html');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (sessions: any[]) => {
    const headers = [
      'Session ID',
      'Start Time',
      'End Time',
      'Duration (minutes)',
      'Total Entries',
      'Calm Count',
      'Neutral Count',
      'Stressed Count',
      'Calm Percentage',
      'Neutral Percentage',
      'Stressed Percentage',
      'Average Noise Level',
      'Summary'
    ];

    const rows = sessions.map(session => {
      const duration = session.endTime ? (session.endTime - session.startTime) / 60000 : 0;
      const total = session.moodEntries.length;
      const calmPct = total > 0 ? (session.calmCount / total * 100).toFixed(1) : 0;
      const neutralPct = total > 0 ? (session.neutralCount / total * 100).toFixed(1) : 0;
      const stressedPct = total > 0 ? (session.stressCount / total * 100).toFixed(1) : 0;
      const avgNoise = session.moodEntries.length > 0 
        ? (session.moodEntries.reduce((sum: number, entry: any) => sum + entry.noiseLevel, 0) / session.moodEntries.length).toFixed(1)
        : 0;

      return [
        session.id,
        format(new Date(session.startTime), 'yyyy-MM-dd HH:mm:ss'),
        session.endTime ? format(new Date(session.endTime), 'yyyy-MM-dd HH:mm:ss') : 'In Progress',
        duration.toFixed(1),
        total,
        session.calmCount,
        session.neutralCount,
        session.stressCount,
        calmPct,
        neutralPct,
        stressedPct,
        avgNoise,
        session.summary || ''
      ];
    });

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateReport = (sessions: any[], calmZones: any[], stressZones: any[]) => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.endTime).length;
    const totalCalmZones = calmZones.length;
    const totalStressZones = stressZones.length;
    
    const totalMoodEntries = sessions.reduce((sum, session) => sum + session.moodEntries.length, 0);
    const totalCalmEntries = sessions.reduce((sum, session) => sum + session.calmCount, 0);
    const totalStressedEntries = sessions.reduce((sum, session) => sum + session.stressCount, 0);
    
    const overallCalmRate = totalMoodEntries > 0 ? (totalCalmEntries / totalMoodEntries * 100).toFixed(1) : '0';
    const overallStressRate = totalMoodEntries > 0 ? (totalStressedEntries / totalMoodEntries * 100).toFixed(1) : '0';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alzense Care Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #4ade80, #3b82f6);
            color: white;
            border-radius: 12px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .section {
            background: white;
            padding: 30px;
            margin-bottom: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .section h2 {
            color: #1e293b;
            margin-bottom: 20px;
            font-size: 1.5rem;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #6b7280;
            font-size: 0.9rem;
        }
        .mood-summary {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        .mood-item {
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            min-width: 120px;
        }
        .mood-calm { background-color: #f0fdf4; color: #166534; }
        .mood-neutral { background-color: #fffbeb; color: #92400e; }
        .mood-stressed { background-color: #fef2f2; color: #991b1b; }
        .mood-emoji { font-size: 2rem; margin-bottom: 10px; }
        .mood-percentage { font-size: 1.5rem; font-weight: 700; }
        .zone-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        .zone-item {
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .zone-calm {
            background-color: #f0fdf4;
            border-color: #bbf7d0;
        }
        .zone-stress {
            background-color: #fef2f2;
            border-color: #fecaca;
        }
        .zone-score {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .zone-details {
            font-size: 0.9rem;
            color: #6b7280;
        }
        .session-item {
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 10px;
            background: #f8fafc;
        }
        .session-date {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 5px;
        }
        .session-stats {
            display: flex;
            gap: 20px;
            font-size: 0.9rem;
            color: #6b7280;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6b7280;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 Alzense Care Report</h1>
        <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
    </div>

    <div class="section">
        <h2>📊 Overall Statistics</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalSessions}</div>
                <div class="stat-label">Total Walks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${completedSessions}</div>
                <div class="stat-label">Completed Walks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalMoodEntries}</div>
                <div class="stat-label">Mood Entries</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalCalmZones}</div>
                <div class="stat-label">Calm Zones</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalStressZones}</div>
                <div class="stat-label">Stress Zones</div>
            </div>
        </div>

        <h3>Mood Distribution</h3>
        <div class="mood-summary">
            <div class="mood-item mood-calm">
                <div class="mood-emoji">🙂</div>
                <div class="mood-percentage">${overallCalmRate}%</div>
                <div>Calm</div>
            </div>
            <div class="mood-item mood-neutral">
                <div class="mood-emoji">😐</div>
                <div class="mood-percentage">${(100 - parseFloat(overallCalmRate) - parseFloat(overallStressRate)).toFixed(1)}%</div>
                <div>Neutral</div>
            </div>
            <div class="mood-item mood-stressed">
                <div class="mood-emoji">😟</div>
                <div class="mood-percentage">${overallStressRate}%</div>
                <div>Stressed</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🌿 Calm Zones</h2>
        ${totalCalmZones === 0 ? 
          '<p style="text-align: center; color: #6b7280; font-style: italic;">No calm zones identified yet. Continue logging walks to discover peaceful areas.</p>' :
          `<div class="zone-list">
            ${calmZones.map(zone => `
              <div class="zone-item zone-calm">
                <div class="zone-score">Calm Score: ${(zone.calmScore * 100).toFixed(0)}%</div>
                <div class="zone-details">
                  Visits: ${zone.visitCount}<br>
                  Last visited: ${format(new Date(zone.lastVisited), 'MMM dd, yyyy')}
                </div>
              </div>
            `).join('')}
          </div>`
        }
    </div>

    <div class="section">
        <h2>⚠️ Stress Zones</h2>
        ${totalStressZones === 0 ? 
          '<p style="text-align: center; color: #6b7280; font-style: italic;">No stress zones identified yet. This is great news!</p>' :
          `<div class="zone-list">
            ${stressZones.map(zone => `
              <div class="zone-item zone-stress">
                <div class="zone-score">Stress Score: ${(zone.stressScore * 100).toFixed(0)}%</div>
                <div class="zone-details">
                  Stress instances: ${zone.stressCount}<br>
                  Last stressed: ${format(new Date(zone.lastStressed), 'MMM dd, yyyy')}
                </div>
              </div>
            `).join('')}
          </div>`
        }
    </div>

    <div class="section">
        <h2>📅 Recent Walk Sessions</h2>
        ${sessions.length === 0 ? 
          '<p style="text-align: center; color: #6b7280; font-style: italic;">No walk sessions recorded yet.</p>' :
          sessions
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, 10)
            .map(session => {
              const duration = session.endTime ? (session.endTime - session.startTime) / 60000 : 0;
              const total = session.moodEntries.length;
              const calmPct = total > 0 ? (session.calmCount / total * 100).toFixed(1) : 0;
              const stressedPct = total > 0 ? (session.stressCount / total * 100).toFixed(1) : 0;
              
              return `
                <div class="session-item">
                  <div class="session-date">${format(new Date(session.startTime), 'MMMM dd, yyyy - h:mm a')}</div>
                  <div class="session-stats">
                    <span>Duration: ${duration.toFixed(1)} min</span>
                    <span>Entries: ${total}</span>
                    <span>Calm: ${calmPct}%</span>
                    <span>Stressed: ${stressedPct}%</span>
                  </div>
                  ${session.summary ? `<div style="margin-top: 10px; font-style: italic; color: #6b7280;">${session.summary}</div>` : ''}
                </div>
              `;
            }).join('')
        }
    </div>

    <div class="footer">
        <p>This report was generated by Alzense - A geo-emotional mapping tool for Alzheimer's care.</p>
        <p>For more information, visit the Alzense application.</p>
    </div>
</body>
</html>
    `;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const reportData = generateReport(
          StorageService.loadSessions(),
          StorageService.loadCalmZones(),
          StorageService.loadStressZones()
        );
        
        const blob = new Blob([reportData], { type: 'text/html' });
        const file = new File([blob], 'alzense-report.html', { type: 'text/html' });
        
        await navigator.share({
          title: 'Alzense Care Report',
          text: 'Care report generated by Alzense',
          files: [file]
        });
      } catch (error) {
        console.error('Share failed:', error);
        alert('Sharing not supported or failed. Please use the download option.');
      }
    } else {
      alert('Sharing not supported on this device. Please use the download option.');
    }
  };

  const sessions = StorageService.loadSessions();
  const calmZones = StorageService.loadCalmZones();
  const stressZones = StorageService.loadStressZones();

  return (
    <div className="page-content">
      <h1 className="page-title">Export & Share Data</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Export Options */}
        <div className="card">
          <h2 className="card-title">Export Data</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Export Format
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'report')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="report">HTML Report (Recommended)</option>
              <option value="json">Raw Data (JSON)</option>
              <option value="csv">Sessions Data (CSV)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              {exportFormat === 'report' && 'A comprehensive HTML report with statistics, charts, and insights.'}
              {exportFormat === 'json' && 'Complete raw data in JSON format for technical analysis.'}
              {exportFormat === 'csv' && 'Session data in CSV format for spreadsheet analysis.'}
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Download size={20} />
            {isExporting ? 'Exporting...' : 'Download Export'}
          </button>
        </div>

        {/* Share Options */}
        <div className="card">
          <h2 className="card-title">Share Report</h2>
          
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Share a care report with family members or healthcare providers.
          </p>

          <button
            className="btn btn-secondary"
            onClick={handleShare}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Share2 size={20} />
            Share Report
          </button>
        </div>

        {/* Data Summary */}
        <div className="card">
          <h2 className="card-title">Data Summary</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Total Walk Sessions</span>
              <span style={{ fontWeight: '600', color: '#3b82f6' }}>{sessions.length}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Calm Zones Identified</span>
              <span style={{ fontWeight: '600', color: '#4ade80' }}>{calmZones.length}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Stress Zones Identified</span>
              <span style={{ fontWeight: '600', color: '#ef4444' }}>{stressZones.length}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Total Mood Entries</span>
              <span style={{ fontWeight: '600', color: '#6b7280' }}>
                {sessions.reduce((sum, session) => sum + session.moodEntries.length, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="card">
          <h2 className="card-title">Privacy & Security</h2>
          
          <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Data Storage:</strong> All data is stored locally on your device and never sent to external servers.
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Sharing:</strong> Only share reports with trusted individuals. Reports contain location and mood data.
            </p>
            <p>
              <strong>Export:</strong> Downloaded files contain sensitive information. Store them securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportData;
