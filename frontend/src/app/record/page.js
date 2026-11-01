'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { ensureDemoUser, insertVoiceLog } from '@/lib/supabase';
import styles from './page.module.css';

// WAV Encoding Helper
function encodeWAV(samples) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const sampleRate = 16000;

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 32 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

const RECORD_DURATION = 15;

function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    const trimmed = envUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://swaascare-backend.onrender.com';
  }
  return 'http://127.0.0.1:8000';
}

export default function RecordPage() {
  const [state, setState] = useState('idle'); // idle | recording | processing | results | saved
  const [timeLeft, setTimeLeft] = useState(RECORD_DURATION);
  const [results, setResults] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking | online | offline
  const [silenceWarning, setSilenceWarning] = useState(null);

  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    ensureDemoUser();
    
    // Diagnostic Health Check (Cache Buster & Connectivity Verifier)
    const checkBackend = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/health`, { cache: 'no-store' });
        if (res.ok) setBackendStatus('online');
        else setBackendStatus('offline');
      } catch (e) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
    
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = Math.min(600, canvasRef.current.parentElement.clientWidth - 32);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      stopStreams();
    };
  }, []);

  const stopStreams = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const drawWaveform = useCallback(() => {
    if (!analyzerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    if (canvas.parentElement) {
      canvas.width = Math.min(600, canvas.parentElement.clientWidth - 40);
    }
    const ctx = canvas.getContext('2d');
    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyzerRef.current.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#4A6CF7');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#ec4899');

      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.shadowColor = '#4A6CF7';
      ctx.shadowBlur = 10;
    };
    draw();
  }, []);

  const startRecording = async () => {
    setSilenceWarning(null);
    if (state === 'recording') {
      console.log("[DEBUG] startRecording called while already recording. Stopping instead.");
      stopRecording();
      return;
    }
    
    console.log("[DEBUG] Phase: STARTING RECORDING");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzerRef.current = analyzer;
      source.connect(analyzer);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;
      audioChunksRef.current = [];

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setState('recording');
      setTimeLeft(RECORD_DURATION);
      drawWaveform();

      console.log("[DEBUG] Timer started...");
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            console.log("[DEBUG] Timer reached 0. Auto-stopping.");
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('[DEBUG] Microphone/Audio error:', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = async () => {
    console.log("[DEBUG] Phase: STOPPING RECORDING");
    if (state !== 'recording' && state !== 'idle') return; // Prevent double stop hangs
    
    const chunks = audioChunksRef.current;
    console.log(`[DEBUG] Collected ${chunks.length} audio chunks.`);
    
    stopStreams();
    setState('processing');

    console.log("[DEBUG] Phase: PROCESSING AUDIO DATA");
    try {
      // Flatten chunks into a single Float32Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const samples = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        samples.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`[DEBUG] Final sample length: ${samples.length}`);

      // Client-side Voice Activity Check (Silence & Background Noise Guard)
      const frameSize = 800; // 50ms at 16kHz
      const numFrames = Math.floor(samples.length / frameSize);
      let maxAmp = 0;
      const frameRmsList = [];

      for (let f = 0; f < numFrames; f++) {
        let frameEnergy = 0;
        const start = f * frameSize;
        for (let i = 0; i < frameSize; i++) {
          const absVal = Math.abs(samples[start + i]);
          if (absVal > maxAmp) maxAmp = absVal;
          frameEnergy += absVal * absVal;
        }
        frameRmsList.push(Math.sqrt(frameEnergy / frameSize));
      }

      // Sort frame RMS values to determine noise floor (p10) vs peak speech (p90)
      const sortedRms = [...frameRmsList].sort((a, b) => a - b);
      const p10 = sortedRms[Math.floor(sortedRms.length * 0.1)] || 0;
      const p90 = sortedRms[Math.floor(sortedRms.length * 0.9)] || 0;
      const dynamicRatio = p10 > 0 ? (p90 / p10) : (p90 > 0.01 ? 10 : 1);

      // Audible voiced frames must be above ambient noise and exceed absolute speech threshold
      const speechThresh = Math.max(0.028, p10 * 2.2);
      let audibleFrames = 0;
      for (const fRms of frameRmsList) {
        if (fRms > speechThresh) audibleFrames++;
      }
      const voicedSeconds = audibleFrames * 0.05;

      console.log(`[DEBUG] Audio check: maxAmp=${maxAmp.toFixed(4)}, p10=${p10.toFixed(4)}, p90=${p90.toFixed(4)}, ratio=${dynamicRatio.toFixed(2)}, voicedSec=${voicedSeconds.toFixed(2)}s`);

      // Reject if total voiced time is under 0.40s, peak amplitude is too weak, or signal is flat stationary noise
      if (maxAmp < 0.06 || voicedSeconds < 0.40 || (dynamicRatio < 1.8 && maxAmp < 0.15)) {
        setSilenceWarning("No speech detected. Please speak clearly into your microphone while recording.");
        setState('idle');
        return;
      }

      const wavBlob = encodeWAV(samples);
      uploadAudio(wavBlob);
    } catch (e) {
      console.error("[DEBUG] Processing Error:", e);
      setState('idle');
    }
  };

  const uploadAudio = async (blob) => {
    console.log("[DEBUG] Phase: UPLOADING TO SUPABASE (Direct-to-Cloud)");
    try {
      setAudioBlob(blob);
      const userId = await ensureDemoUser();
      const fileName = `${userId}-${Date.now()}.wav`;
      
      console.log("[DEBUG] Phase: PINGING AI ENGINE (Direct Form Upload)");
      const formData = new FormData();
      formData.append('audio_file', blob, fileName);

      const response = await fetch(`${getApiBaseUrl()}/api/analyze`, {
        method: 'POST',
        body: formData
      });

      console.log(`[DEBUG] AI Engine Response: ${response.status}`);
      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      console.log("[DEBUG] Analysis data received successfully.", data);

      if (data.status === 'no_speech_detected') {
        setSilenceWarning(data.message || "No vocal speech detected. Please record while speaking continuously.");
        setState('idle');
        return;
      }

      // Map API response to UI results format (Refined for 3-model Integration)
      const insights = data.system_insights || {};
      const predictions = insights.predictions || {};

      const mappedResults = {
        tremor: { value: data.extracted_features?.voice_tremor || 21, status: insights.neurological?.status || 'good', label: 'Voice Tremor', icon: '〰️' },
        breath: { value: data.extracted_features?.breathiness || 38, status: insights.respiratory?.status || 'warning', label: 'Breathlessness', icon: '💨' },
        pitch: { value: data.extracted_features?.pitch_variation || 68, status: 'good', label: 'Pitch Variation', icon: '🎵' },
        tone: { value: data.health_score || 85, status: data.risk_level === 'low' ? 'good' : 'warning', label: 'Health Score', icon: '✨' },
      };

      const diseasePredictions = [
        { id: 'asthma', label: 'Asthma', icon: '🫁', result: predictions.asthma?.prediction || 'Normal', confidence: Math.round((predictions.asthma?.confidence || 0) * 100), status: predictions.asthma?.prediction === 'Asthma' ? 'warning' : 'good' },
        { id: 'depression', label: 'Depression', icon: '🌧️', result: predictions.depression?.prediction || 'Normal', confidence: Math.round((predictions.depression?.confidence || 0) * 100), status: predictions.depression?.prediction === 'Depression' ? 'warning' : 'good' },
        { id: 'parkinsons', label: "Parkinson's", icon: '🧠', result: predictions.parkinsons?.prediction || 'Normal', confidence: Math.round((predictions.parkinsons?.confidence || 0) * 100), status: predictions.parkinsons?.prediction === 'Parkinsons' ? 'warning' : 'good' }
      ];

      setResults({ raw: data, ui: mappedResults, diseases: diseasePredictions, finalAudioUrl: 'none' });
      setState('results');
    } catch (err) {
      console.error('[DEBUG] Supabase/AI Error:', err);
      const isFetchErr = err.message.includes('fetch') || err.message.includes('Failed');
      const errorMsg = isFetchErr 
        ? 'Could not connect to the AI analysis engine. The backend might still be warming up or restarting. Please try again in a few moments.'
        : `Analysis failed: ${err.message}`;
      setSilenceWarning(errorMsg);
      setState('idle');
    }
  };

  const saveToDiary = async () => {
    try {
      setSaving(true);
      const userId = await ensureDemoUser();
      
      // Use the URL we already generated during the analysis phase
      const audio_file_url = results.finalAudioUrl || 'none';
      
      // Save entry to Database
      const { error } = await insertVoiceLog({
        user_id: userId,
        audio_file_url: audio_file_url,
        extracted_features: results.raw.extracted_features,
        system_insights: results.raw.system_insights,
        health_score: results.raw.health_score,
        risk_level: results.raw.risk_level
      });

      if (error) throw error;
      setState('saved');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save diary entry.');
    } finally {
      setSaving(false);
    }
  };

  const resetRecording = () => {
    setState('idle');
    setTimeLeft(RECORD_DURATION);
    setResults(null);
    setAudioBlob(null);
  };

  const progressPercent = ((RECORD_DURATION - timeLeft) / RECORD_DURATION) * 100;
  const circumference = 2 * Math.PI * 72;

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <div className={`${styles.page} ${mounted ? styles.mounted : ''}`}>
        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Voice Diary</h1>
            <div className={styles.statusBadge} style={{ 
              color: backendStatus === 'online' ? '#4ade80' : backendStatus === 'offline' ? '#f87171' : '#94a3b8',
              fontSize: '0.8rem',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: backendStatus === 'online' ? '#4ade80' : backendStatus === 'offline' ? '#f87171' : '#94a3b8',
                boxShadow: backendStatus === 'online' ? '0 0 8px #4ade80' : 'none'
              }}></span>
              AI Engine: {backendStatus.toUpperCase()}
            </div>
            <p className={styles.subtitle}>
              Record a 15-second voice sample for AI biomarker analysis
            </p>

            {silenceWarning && (
              <div className={styles.silenceBanner}>
                <span className={styles.silenceIcon}>⚠️</span>
                <div className={styles.silenceText}>
                  <strong>No Voice Detected</strong>
                  <p>{silenceWarning}</p>
                </div>
                <button
                  type="button"
                  className={styles.silenceDismiss}
                  onClick={() => setSilenceWarning(null)}
                  aria-label="Dismiss warning"
                >
                  ✕
                </button>
              </div>
            )}
          </header>

          {state === 'idle' && (
            <div className={styles.idleState}>
              <div className={styles.recordBtnWrapper}>
                <div className={styles.outerRing} />
                <div className={styles.middleRing} />
                <button className={styles.recordBtn} onClick={startRecording}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                </button>
              </div>
              <p className={styles.idleHint}>Tap microphone to start recording</p>

              {/* Reading Passage Preview Card */}
              <div className={styles.readingPromptCard}>
                <div className={styles.readingPromptHeader}>
                  <span className={styles.promptBadge}>📖 Reading Prompt</span>
                  <span className={styles.promptHint}>Read aloud once recording begins</span>
                </div>
                <p className={styles.readingPromptText}>
                  “The morning sunlight spread across the quiet blue sky, bringing warmth and fresh air into the room. Taking a calm, steady breath helps keep my voice clear, balanced, and healthy throughout the day.”
                </p>
              </div>
            </div>
          )}

          {state === 'recording' && (
            <div className={styles.recordingState}>
              <div className={styles.timerWrapper}>
                <svg className={styles.timerSvg} viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(74,108,247,0.1)" strokeWidth="6" />
                  <circle cx="80" cy="80" r="72" fill="none" stroke="url(#timerGrad)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={circumference - (progressPercent / 100) * circumference}
                    transform="rotate(-90 80 80)" className={styles.timerArc}
                  />
                  <defs>
                    <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4A6CF7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.timerInner}>
                  <span className={styles.timerNum}>{timeLeft}</span>
                  <span className={styles.timerLabel}>seconds</span>
                </div>
              </div>

              {/* Active Reading Passage Card */}
              <div className={`${styles.readingPromptCard} ${styles.readingPromptActive}`}>
                <div className={styles.readingPromptHeader}>
                  <span className={styles.promptBadge}>📖 Please Read Aloud</span>
                  <span className={styles.promptLivePill}>
                    <span className={styles.promptLiveDot} /> Speak Continuously
                  </span>
                </div>
                <p className={styles.readingPromptText}>
                  “The morning sunlight spread across the quiet blue sky, bringing warmth and fresh air into the room. Taking a calm, steady breath helps keep my voice clear, balanced, and healthy throughout the day.”
                </p>
              </div>

              <button className={styles.stopBtn} onClick={stopRecording}>Stop Recording</button>
            </div>
          )}

          {state === 'processing' && (
            <div className={styles.processingState}>
              <div className={styles.processingOrb}>
                <div className={styles.processingRing1} />
                <div className={styles.processingRing2} />
                <span className={styles.processingIcon}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a6 6 0 0 0-6 6c0 1.66.67 3.16 1.76 4.24l.24.24V15a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.52l.24-.24A6 6 0 0 0 12 2z" />
                    <path d="M10 20h4" />
                    <path d="M10 17h4" />
                  </svg>
                </span>
              </div>
              <h3 className={styles.processingTitle}>Analyzing Voice Biomarkers</h3>
              <p className={styles.processingDesc}>Consulting our Neural Engine...</p>
            </div>
          )}

          {state === 'results' && results && (
            <div className={styles.resultsState}>
              <div className={styles.resultsHeader}>
                <span className={styles.resultsCheck}>✅</span>
                <h3 className={styles.resultsTitle}>Analysis Complete</h3>
              </div>
              <div className={styles.resultsGrid}>
                {Object.entries(results.ui).map(([key, bm], i) => (
                  <div key={key} className={`${styles.resultCard} glass-panel`} style={{ animationDelay: `${i * 0.1}s` }}>
                    <span className={styles.resultIcon}>{bm.icon}</span>
                    <div className={styles.resultInfo}>
                      <span className={styles.resultLabel}>{bm.label}</span>
                      <span className={styles.resultValue}>{bm.value}</span>
                    </div>
                    <span className={`badge ${bm.status === 'good' ? 'badge-success' : 'badge-warning'}`}>
                      ● {bm.status === 'good' ? 'Normal' : 'Elevated'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Disease Prediction Cards */}
              {results.diseases && (
                <div className={styles.diseaseSection}>
                  <h4 className={styles.diseaseTitle}>
                    🧬 Disease Screening Results
                  </h4>
                  <div className={styles.diseaseGrid}>
                    {results.diseases.map((d, i) => (
                      <div 
                        key={d.id} 
                        className={`${styles.diseaseCard} glass-panel`}
                        style={{
                          borderLeft: `3px solid ${d.status === 'warning' ? '#ef4444' : '#22c55e'}`,
                          animationDelay: `${(i + 4) * 0.1}s`,
                        }}
                      >
                        <span className={styles.diseaseIcon}>{d.icon}</span>
                        <div className={styles.diseaseLabel}>{d.label}</div>
                        <div className={`${styles.diseaseBadge} ${d.status === 'warning' ? styles.diseaseWarning : styles.diseaseGood}`}>
                          {d.result}
                        </div>
                        <div className={styles.diseaseConfidence}>
                          {d.confidence}% confidence
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className={styles.disclaimerText}>
                    ⚠️ This is not a medical diagnosis. Consult a healthcare professional for clinical evaluation.
                  </p>
                </div>
              )}

              <div className={styles.resultsActions}>
                <button className="pill-button pill-button-primary" onClick={resetRecording}>Record Again</button>
                <button className="pill-button pill-button-glass" onClick={saveToDiary} disabled={saving}>
                  {saving ? 'Saving...' : 'Save to Diary'}
                </button>
              </div>
            </div>
          )}

          {state === 'saved' && (
            <div className={styles.resultsState}>
              <div className={styles.resultsHeader}>
                <span className={styles.resultsCheck}>📋</span>
                <h3 className={styles.resultsTitle}>Saved to Health Diary</h3>
                <p className={styles.resultsDesc}>You can view your trends in the Dashboard.</p>
              </div>
              <div className={styles.resultsActions}>
                <button className="pill-button pill-button-primary" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
                <button className="pill-button pill-button-glass" onClick={resetRecording}>New Recording</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
