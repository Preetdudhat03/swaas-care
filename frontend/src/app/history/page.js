'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import styles from './page.module.css';
import { ensureDemoUser, fetchVoiceLogs } from '@/lib/supabase';

const TIMEFRAMES = ['7 Days', '30 Days', '90 Days'];

const DIARY_ENTRIES = [
  { date: 'Apr 11', score: 78, tremor: 23, breath: 41, pitch: 67, speech: 142, status: 'good', recorded: true },
  { date: 'Apr 10', score: 76, tremor: 24, breath: 39, pitch: 66, speech: 141, status: 'good', recorded: true },
  { date: 'Apr 9', score: 74, tremor: 25, breath: 40, pitch: 69, speech: 144, status: 'good', recorded: true },
  { date: 'Apr 8', score: 73, tremor: 27, breath: 38, pitch: 67, speech: 142, status: 'good', recorded: true },
  { date: 'Apr 7', score: 0, tremor: 0, breath: 0, pitch: 0, speech: 0, status: 'missed', recorded: false },
  { date: 'Apr 6', score: 75, tremor: 28, breath: 36, pitch: 68, speech: 143, status: 'good', recorded: true },
  { date: 'Apr 5', score: 72, tremor: 30, breath: 35, pitch: 65, speech: 140, status: 'warning', recorded: true },
];

const TREND_DATA = {
  tremor: { label: 'Voice Tremor', data: [30, 28, 25, 27, 0, 24, 23], color: '#4A6CF7', unit: '/100' },
  breath: { label: 'Breathlessness', data: [35, 33, 36, 38, 0, 40, 41], color: '#fbbf24', unit: '/100' },
  pitch: { label: 'Pitch Variation', data: [65, 68, 66, 67, 0, 66, 67], color: '#8b5cf6', unit: 'Hz ╧â' },
  speech: { label: 'Speech Rate', data: [140, 143, 141, 142, 0, 141, 142], color: '#22c55e', unit: 'wpm' },
};

function TrendChart({ data, color, labels }) {
  const max = Math.max(...data.filter(d => d > 0));
  const min = Math.min(...data.filter(d => d > 0));
  const range = max - min || 1;
  const w = 500;
  const h = 140;
  const padding = 10;

  const points = data
    .map((v, i) => {
      if (v === 0) return null;
      const x = padding + (i / (data.length - 1)) * (w - padding * 2);
      const y = padding + (1 - (v - min) / range) * (h - padding * 2);
      return { x, y };
    });

  const validPoints = points.filter(Boolean);
  const pathD = validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${validPoints[validPoints.length - 1].x},${h} L${validPoints[0].x},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} className={styles.trendSvg}>
      <defs>
        <linearGradient id={`area-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <line
          key={pct}
          x1={padding}
          y1={padding + pct * (h - padding * 2)}
          x2={w - padding}
          y2={padding + pct * (h - padding * 2)}
          stroke="rgba(148,163,184,0.15)"
          strokeWidth="1"
        />
      ))}
      {/* Area */}
      <path d={areaD} fill={`url(#area-${color.replace('#', '')})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {validPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="2" />
      ))}
      {/* Labels */}
      {labels.map((label, i) => {
        const x = padding + (i / (labels.length - 1)) * (w - padding * 2);
        return (
          <text
            key={i}
            x={x}
            y={h + 20}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState('7 Days');
  const [activeBiomarker, setActiveBiomarker] = useState('tremor');

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState(DIARY_ENTRIES);
  const [trendData, setTrendData] = useState(TREND_DATA);

  useEffect(() => { 
    setMounted(true); 
    fetchHistoryData();
  }, []);

  const labels = diaryEntries
    .filter(e => e.recorded)
    .map(e => e.date)
    .reverse();

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const userId = await ensureDemoUser();
      const { data, error } = await fetchVoiceLogs(userId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const entries = data.map(r => {
          const d = new Date(r.created_at);
          const preds = r.system_insights?.predictions || {};
          return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: r.health_score || 0,
            tremor: r.extracted_features?.voice_tremor || 20,
            breath: r.extracted_features?.breathiness || 30,
            pitch: r.extracted_features?.pitch_variation || 50,
            speech: r.extracted_features?.speech_energy || 40,
            // New disease metrics
            asthma: preds.asthma?.severity || 0,
            depression: preds.depression?.severity || 0,
            parkinsons: preds.parkinsons?.severity || 0,
            status: (r.system_insights?.respiratory?.status === 'warning' || r.system_insights?.neurological?.status === 'warning' || r.system_insights?.emotional?.status === 'warning') ? 'warning' : 'good',
            recorded: true
          };
        });

        setDiaryEntries(entries);
        
        const ascEntries = [...entries].reverse();
        
        setTrendData({
          tremor: { label: 'Voice Tremor', data: ascEntries.map(e => e.tremor), color: '#4A6CF7', unit: '/100' },
          breath: { label: 'Breathlessness', data: ascEntries.map(e => e.breath), color: '#fbbf24', unit: '/100' },
          asthma: { label: 'Asthma Risk', data: ascEntries.map(e => e.asthma), color: '#ef4444', unit: '%' },
          depression: { label: 'Depression Risk', data: ascEntries.map(e => e.depression), color: '#ec4899', unit: '%' },
          parkinsons: { label: "Parkinson's Risk", data: ascEntries.map(e => e.parkinsons), color: '#8b5cf6', unit: '%' }
        });
      } else {
        setDiaryEntries([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <div className={`${styles.page} ${mounted ? styles.mounted : ''}`}>
        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Voice Diary History</h1>
            <div className={styles.timeframeToggle}>
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  className={`${styles.timeframeBtn} ${activeTimeframe === tf ? styles.timeframeActive : ''}`}
                  onClick={() => setActiveTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </header>

          {/* Calendar Heatmap */}
          <section className={`${styles.calendarSection} glass-panel`}>
            <h3 className={styles.sectionTitle}>Recording Calendar</h3>
            <div className={styles.calendarGrid}>
              {diaryEntries.map((entry, i) => (
                <div
                  key={i}
                  className={`${styles.calendarDay} ${
                    entry.recorded ? styles.calendarRecorded : styles.calendarMissed
                  }`}
                  title={`${entry.date}: ${entry.recorded ? `Score ${entry.score}` : 'Missed'}`}
                >
                  <span className={styles.calendarDate}>{entry.date.split(' ')[1]}</span>
                  <span className={styles.calendarDot} />
                </div>
              ))}
            </div>
            <div className={styles.calendarLegend}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.legendRecorded}`} /> Recorded
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.legendMissed}`} /> Missed
              </span>
            </div>
          </section>

          {/* Trend Chart */}
          <section className={`${styles.trendSection} glass-panel`}>
            <div className={styles.trendHeader}>
              <h3 className={styles.sectionTitle}>Biomarker Trends</h3>
              <div className={styles.biomarkerTabs}>
                {Object.entries(TREND_DATA).map(([key, bm]) => (
                  <button
                    key={key}
                    className={`${styles.biomarkerTab} ${activeBiomarker === key ? styles.biomarkerTabActive : ''}`}
                    onClick={() => setActiveBiomarker(key)}
                    style={activeBiomarker === key ? { borderColor: bm.color, color: bm.color } : {}}
                  >
                    {bm.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.trendChart}>
              <TrendChart
                data={trendData[activeBiomarker].data}
                color={trendData[activeBiomarker].color}
                labels={labels}
              />
            </div>
          </section>

          {/* Diary Entries */}
          <section className={styles.entriesSection}>
            <h3 className={styles.sectionTitle}>Diary Entries</h3>
            <div className={styles.entriesList}>
              {diaryEntries.map((entry, i) => (
                <div
                  key={i}
                  className={`${styles.entryCard} glass-panel`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className={styles.entryDate}>
                    <span className={styles.entryDay}>{entry.date.split(' ')[1]}</span>
                    <span className={styles.entryMonth}>{entry.date.split(' ')[0]}</span>
                  </div>

                  {entry.recorded ? (
                    <>
                      <div className={styles.entryScore}>
                        <span className={styles.entryScoreNum}>{entry.score}</span>
                        <span className={styles.entryScoreLabel}>Score</span>
                      </div>
                      <div className={styles.entryMetrics}>
                        <span>Tremor: {entry.tremor}</span>
                        <span>Breath: {entry.breath}</span>
                        <span>Pitch: {entry.pitch}</span>
                        <span>Rate: {entry.speech}</span>
                      </div>
                      <span className={`badge ${entry.status === 'good' ? 'badge-success' : 'badge-warning'}`}>
                        ΓùÅ {entry.status === 'good' ? 'Normal' : 'Elevated'}
                      </span>
                    </>
                  ) : (
                    <div className={styles.entryMissed}>
                      <span>Recording missed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
