'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import MedicationModal from '@/components/MedicationModal';
import { ensureDemoUser, fetchVoiceLogs } from '@/lib/supabase';
import styles from './page.module.css';

// Generate last 7 day labels dynamically
const TREND_LABELS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return d.toLocaleDateString('en-US', { weekday: 'short' });
});
function SparkLine({ data, color = '#4A6CF7', width = 120, height = 36 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className={styles.sparkline}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  
  // Computed values
  const [healthScore, setHealthScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [biomarkers, setBiomarkers] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState(Array(7).fill(0));
  const [alert, setAlert] = useState(null);
  
  // New features
  const [aiFeedback, setAiFeedback] = useState(null);
  const [meds, setMeds] = useState([]);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = await ensureDemoUser();
      const { data, error } = await fetchVoiceLogs(userId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setLogs(data);
        computeDashboardMetrics(data);
      } else {
        // Empty state defaults
        setBiomarkers([
          { id: 'tremor', label: 'Voice Tremor', value: 0, unit: '/100', trend: 'stable', status: 'good', icon: '〰️', desc: 'No data', history: Array(7).fill(0) },
          { id: 'breath', label: 'Breathlessness', value: 0, unit: '/100', trend: 'stable', status: 'good', icon: '💨', desc: '', history: Array(7).fill(0) },
          { id: 'pitch', label: 'Pitch Variation', value: 0, unit: 'Hz σ', trend: 'stable', status: 'good', icon: '🎵', desc: '', history: Array(7).fill(0) }
        ]);
        setConditions([
          { id: 'asthma', label: 'Asthma', icon: '🫁', active: false },
          { id: 'depression', label: 'Depression', icon: '🌧️', active: false }
        ]);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const computeDashboardMetrics = (records) => {
    const latest = records[records.length - 1];
    setHealthScore(latest.health_score || 0);

    // Simplified streak (total records for MVP Demo)
    setStreak(records.length); 

    const tremorHist = records.map(r => r.extracted_features?.voice_tremor || 20);
    const breathHist = records.map(r => r.extracted_features?.breathiness || 30);
    const pitchHist = records.map(r => r.extracted_features?.pitch_variation || 50);
    const healthHist = records.map(r => r.health_score || 0);

    const pad = (arr) => {
      const padded = [...arr];
      while(padded.length < 7) padded.unshift(0);
      return padded.slice(-7); 
    };

    const determineTrend = (arr) => {
      if (arr.length < 2) return 'stable';
      const last = arr[arr.length - 1];
      const prev = arr[arr.length - 2];
      if (last > prev + 2) return 'up';
      if (last < prev - 2) return 'down';
      return 'stable';
    };

    setBiomarkers([
      {
        id: 'tremor', label: 'Voice Tremor', 
        value: tremorHist[tremorHist.length - 1], unit: '/100', 
        trend: determineTrend(tremorHist), status: latest.system_insights?.neurological?.status || 'good', 
        icon: '〰️', desc: 'Neuromuscular Proxy', history: pad(tremorHist)
      },
      {
        id: 'breath', label: 'Breathlessness', 
        value: breathHist[breathHist.length - 1], unit: '/100', 
        trend: determineTrend(breathHist), status: latest.system_insights?.respiratory?.status || 'good', 
        icon: '💨', desc: latest.system_insights?.respiratory?.insight || 'Normal breathing', history: pad(breathHist)
      },
      {
        id: 'pitch', label: 'Pitch Variation', 
        value: pitchHist[pitchHist.length - 1], unit: '/100', 
        trend: determineTrend(pitchHist), status: 'good', 
        icon: '🎵', desc: 'Average pitch elasticity', history: pad(pitchHist)
      }
    ]);

    setWeeklyTrend(pad(healthHist));

    const predictions = latest.system_insights?.predictions || {};
    const hasAsthmaWarning = latest.system_insights?.respiratory?.status === 'warning' || predictions.asthma?.prediction === 'Asthma';
    const hasDepWarning = latest.system_insights?.emotional?.status === 'warning' || predictions.depression?.prediction === 'Depression';
    const hasParkinsonsWarning = latest.system_insights?.neurological?.status === 'warning' || predictions.parkinsons?.prediction === 'Parkinsons';

    setConditions([
      { id: 'asthma', label: 'Asthma Analysis', icon: '🫁', active: hasAsthmaWarning, severity: predictions.asthma?.severity },
      { id: 'depression', label: 'Depression Analysis', icon: '🌧️', active: hasDepWarning, severity: predictions.depression?.severity },
      { id: 'parkinsons', label: 'Parkinson\'s Analysis', icon: '🧠', active: hasParkinsonsWarning, severity: predictions.parkinsons?.severity }
    ]);

    if (hasAsthmaWarning || hasDepWarning || hasParkinsonsWarning) {
      let alertTitle = "Physiological patterns detected";
      if (hasParkinsonsWarning) alertTitle = "Neurological patterns detected";
      else if (hasAsthmaWarning) alertTitle = "Respiratory patterns detected";
      else if (hasDepWarning) alertTitle = "Emotional energy patterns detected";
      
      setAlert({
        title: alertTitle,
        msg: `The AI system detected a high correlation (${Math.round(latest.health_score)}% stability) with specific vocal biomarkers. Detailed report is available in History.`
      });
    } else {
      setAlert(null);
    }

    // Smart AI Feedback Engine (Refined with specific disease knowledge)
    if (records.length >= 2) {
      const prev = records[records.length - 2];
      const cur = latest;
      
      let insights = [];
      if (cur.health_score > prev.health_score + 5) insights.push("Impressive! Your vocal stability improved significantly today.");
      else if (cur.health_score < prev.health_score - 5) insights.push("Vocal baseline is lower than usual. Monitor for fatigue or environmental triggers.");

      if (hasAsthmaWarning) insights.push("⚠️ Higher friction in vocal onset detected. If you have an inhaler, please monitor your peak flow.");
      if (hasDepWarning) insights.push("⚠️ Low vocal energy detected. Consider tracking your sleep and mood patterns alongside these recordings.");
      if (hasParkinsonsWarning) insights.push("⚠️ Micro-tremors in vocal cord control detected. Daily recording is essential to track neurological stability.");
      
      // Correlation logic
      if (hasAsthmaWarning && cur.extracted_features?.breathiness > 60) {
        insights.push("💡 Breathiness is correlating with respiratory friction. This is a strong indicator of reduced lung airflow.");
      }

      setAiFeedback({
        title: "Clinical AI Insights",
        insights: insights.slice(0, 3) // Keep it concise
      });
    } else {
      setAiFeedback({
        title: "Welcome to SwaasCare",
        insights: ["Record your voice daily to unlock deep longitudinal trends and disease-specific risk tracking."]
      });
    }
  };

  const trendIcon = (trend) => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const statusColor = (status) => {
    if (status === 'good') return '#22c55e';
    if (status === 'warning') return '#fbbf24';
    return '#ef4444';
  };

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <div className={`${styles.page} ${mounted ? styles.mounted : ''}`}>
        <div className={styles.content}>
          {/* Header */}
          <motion.header
            className={styles.header}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.greeting}>
              <h1 className={styles.greetTitle}>Good Afternoon 👋</h1>
              <p className={styles.greetDate}>{today}</p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.streakBadge}>
                <span className={styles.streakFire}>🔥</span>
                <span className={styles.streakNum}>{streak}</span>
                <span className={styles.streakLabel}>Day Streak</span>
              </div>
            </div>
          </motion.header>

          {/* Zero Data Banner */}
          {!loading && logs.length === 0 && (
            <div className={`${styles.alertBanner} glass-panel`} style={{ marginBottom: '2rem', borderColor: '#4A6CF7', backgroundColor: 'rgba(74, 108, 247, 0.1)' }}>
              <span className={styles.alertIcon}>👋</span>
              <div className={styles.alertText}>
                <strong>Welcome to SwaasCare</strong>
                <p>You have no voice records yet. Click 'Record Voice Diary' on the right to start tracking your health.</p>
              </div>
            </div>
          )}

          {/* Smart AI Feedback Engine Banner */}
          {!loading && aiFeedback && (
            <div className={`${styles.alertBanner} ${styles.feedbackEngine} glass-panel`} style={{ marginBottom: '2rem' }}>
              <span className={`${styles.alertIcon} ${styles.feedbackIcon}`}>🤖</span>
              <div className={`${styles.alertText} ${styles.feedbackInsights}`}>
                <strong>{aiFeedback.title}</strong>
                <ul>
                  {aiFeedback.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Top row: Health Score + Quick Record */}
          <div className={styles.topRow}>
            {/* Health Score */}
            <div className={`${styles.scoreCard} glass-panel`}>
              <div className={styles.scoreRing}>
                <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(74,108,247,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(healthScore / 100) * 327} 327`}
                    transform="rotate(-90 60 60)"
                    className={styles.scoreArc}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4A6CF7" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.scoreValue}>
                  <span className={styles.scoreNum}>{healthScore}</span>
                  <span className={styles.scoreUnit}>/ 100</span>
                </div>
              </div>
              <div className={styles.scoreInfo}>
                <h3 className={styles.scoreTitle}>Overall Health Score</h3>
                <p className={styles.scoreDesc}>
                  {logs.length === 0 ? "Record your voice to generate your first score" : "Based on your latest voice analysis"}
                </p>
                {logs.length > 0 && <span className="badge badge-success">● Normal Range</span>}
              </div>
            </div>

            {/* Quick Record */}
            <Link href="/record" className={`${styles.recordCard} glass-panel`}>
              <div className={styles.recordIcon}>
                <div className={styles.recordPulse} />
                <div className={styles.recordDot}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
              </div>
              <h3 className={styles.recordTitle}>Record Voice Diary</h3>
              <p className={styles.recordDesc}>15-second daily voice sample</p>
              <span className={styles.recordCta}>Start Recording →</span>
            </Link>
          </div>

          {/* Biomarker Cards Grid */}
          <section className={styles.biomarkers}>
            <h2 className={styles.sectionTitle}>Voice Biomarkers</h2>
            <div className={styles.bioGrid}>
              {biomarkers.map((bm, i) => (
                <div
                  key={bm.id}
                  className={`${styles.bioCard} glass-panel`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={styles.bioHeader}>
                    <span className={styles.bioIcon}>{bm.icon}</span>
                    <span
                      className={styles.bioTrend}
                      style={{ color: statusColor(bm.status) }}
                    >
                      {trendIcon(bm.trend)}
                    </span>
                  </div>
                  <div className={styles.bioValue}>
                    {bm.value}
                    <span className={styles.bioUnit}>{bm.unit}</span>
                  </div>
                  <div className={styles.bioLabel}>{bm.label}</div>
                  <div className={styles.bioDesc}>{bm.desc}</div>
                  <div className={styles.bioChart}>
                    <SparkLine
                      data={bm.history}
                      color={statusColor(bm.status)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom: Weekly Overview + Conditions */}
          <div className={styles.bottomRow}>
            {/* Weekly Overview */}
            <div className={`${styles.weeklyCard} glass-panel`}>
              <h3 className={styles.weeklyTitle}>7-Day Trend</h3>
              <div className={styles.weeklyChart}>
                {weeklyTrend.map((val, i) => {
                  const hasData = val > 0;
                  return (
                    <div key={i} className={styles.weeklyBar} style={{ position: 'relative' }}>
                      <div
                        className={styles.weeklyBarFill}
                        style={{
                          height: hasData ? `${val}%` : '6%',
                          background: hasData
                            ? 'linear-gradient(to top, #4A6CF7, #6d8dff)'
                            : 'rgba(148, 163, 184, 0.15)',
                          animationDelay: `${i * 0.08}s`,
                          borderRadius: '4px 4px 0 0',
                          ...(hasData ? {} : { borderTop: '2px dashed rgba(148, 163, 184, 0.3)' }),
                        }}
                      />
                      {hasData && (
                        <span style={{
                          position: 'absolute', top: `${Math.max(5, 100 - val - 8)}%`, left: '50%', transform: 'translateX(-50%)',
                          fontSize: '0.6rem', color: '#cbd5e1', fontWeight: 600
                        }}>{val}</span>
                      )}
                      <span className={styles.weeklyBarLabel}>{TREND_LABELS[i]}</span>
                    </div>
                  );
                })}
              </div>
              {logs.length === 0 && (
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Record daily to fill your trend
                </p>
              )}
            </div>

            {/* Active Conditions */}
            <div className={`${styles.conditionsCard} glass-panel`}>
              <h3 className={styles.conditionsTitle}>Tracked Conditions</h3>
              <div className={styles.conditionsList}>
                {conditions.map((c) => (
                  <div key={c.id} className={styles.conditionItem}>
                    <span className={styles.conditionIcon}>{c.icon}</span>
                    <span className={styles.conditionLabel}>{c.label}</span>
                    <span
                      className={`${styles.conditionStatus} ${
                        c.active ? styles.conditionActive : ''
                      }`}
                    >
                      {c.active ? `Flagged (${c.severity}%)` : 'Normal'}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/conditions" className={styles.conditionsLink}>
                Manage Conditions →
              </Link>
            </div>
          </div>

          {/* Alert Banner */}
          {alert && (
            <div className={`${styles.alertBanner} glass-panel`}>
              <span className={styles.alertIcon}>⚠️</span>
              <div className={styles.alertText}>
                <strong>{alert.title}</strong>
                <p>{alert.msg}</p>
              </div>
              <button className={styles.alertDismiss} onClick={() => setAlert(null)}>Dismiss</button>
            </div>
          )}

          {/* Third Row: Tracker & Emergency */}
          <div className={styles.thirdRow} style={{ marginTop: '24px' }}>
            {/* Medication Tracker */}
            <div className={`${styles.medCard} glass-panel`}>
              <div className={styles.medHeader}>
                <h3 className={styles.conditionsTitle} style={{marginBottom: 0}}>Medication Tracker</h3>
                <button className={styles.addMedBtn} onClick={() => setIsMedModalOpen(true)}>+ Log Med</button>
              </div>
              <div className={styles.medList}>
                {meds.length === 0 ? (
                  <div className={styles.medEmpty}>No medications logged today.</div>
                ) : meds.map(m => (
                  <div key={m.id} className={styles.medItem}>
                    <div className={styles.medInfo}>
                      <span className={styles.medIcon}>💊</span>
                      <div>
                        <div className={styles.medName}>{m.name} {m.dosage && `(${m.dosage})`}</div>
                        <div className={styles.medTime}>Taken at {m.time}</div>
                      </div>
                    </div>
                    <span className={styles.medStatus}>Logged</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency SOS */}
            <div className={`${styles.sosCard} glass-panel ${healthScore > 0 && healthScore <= 60 ? styles.emergency : ''}`}>
              <div className={styles.sosPulse} />
              <button 
                className={`${styles.sosBtn} ${healthScore > 0 && healthScore <= 60 ? styles.emergencyBtn : ''} ${sosActive ? styles.sosBtnActive : ''}`}
                onClick={() => setSosActive(true)}
              >
                {sosActive ? "✅ Doctor Notified!" : "🚨 Alert Doctor / SOS"}
              </button>
              <p className={styles.sosDesc}>
                {sosActive ? "An emergency SMS has been dispatched to your doctor with your voice biomarkers." : "Directly notify your physician if you feel symptoms worsening."}
              </p>
            </div>
          </div>

        </div>
      </div>
      
      <MedicationModal 
        isOpen={isMedModalOpen} 
        onClose={() => setIsMedModalOpen(false)} 
        onAdd={(newMed) => setMeds(prev => [newMed, ...prev])} 
      />
    </>
  );
}
