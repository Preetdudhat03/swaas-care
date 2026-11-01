'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import AnimatedBackground from '@/components/AnimatedBackground';
import styles from './page.module.css';

const HumanBody3D = dynamic(() => import('@/components/HumanBody3D'), {
  ssr: false,
  loading: () => (
    <div className={styles.modelLoader}>
      <div className={styles.loaderRing} />
    </div>
  ),
});

const CONDITIONS = {
  asthma:         { label: 'Asthma',                 icon: '🫁', desc: 'Respiratory monitoring via breath patterns and wheeze detection' },
  cardiovascular: { label: 'Cardiovascular',         icon: '❤️', desc: 'Heart health tracking through vocal tremor and fatigue analysis' },
  neurological:   { label: 'Neurological Disorders', icon: '🧠', desc: 'Neural assessment via speech clarity and articulation patterns' },
  'post-stroke':  { label: 'Post-Stroke',            icon: '⚡', desc: 'Recovery tracking through voice strength and fluency metrics' },
  parkinsons:     { label: "Parkinson's Disease",    icon: '🔬', desc: 'Tremor progression via micro-tremor and voice stability analysis' },
  depression:     { label: 'Depression',             icon: '🌊', desc: 'Mood tracking via tonal variation and speech pace patterns' },
};

const FEATURES = [
  { icon: '🎙️', label: 'Voice Biomarkers' },
  { icon: '🤖', label: 'AI Analysis' },
  { icon: '📊', label: 'Daily Tracking' },
  { icon: '🩺', label: 'Non-Invasive' },
];

/* ——— Motion variants ——— */
const textMask = {
  hidden: { y: '110%', opacity: 0 },
  visible: (i) => ({
    y: '0%',
    opacity: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.15 },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.1 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 },
  },
};

const cardSlide = {
  hidden: { opacity: 0, x: 30, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 + i * 0.07 },
  }),
};

export default function HomePage() {
  const router = useRouter();
  const [activeCondition, setActiveCondition] = useState(null);
  const [entered, setEntered] = useState(false);
  const [isIntro, setIsIntro] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [gender, setGender] = useState('male');

  useEffect(() => {
    // 2.5s intro sequence
    const timer = setTimeout(() => setIsIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const conditionKeys = Object.keys(CONDITIONS);
  const activeIndex = activeCondition ? conditionKeys.indexOf(activeCondition) : -1;

  const handleNext = () => {
    if (activeIndex === -1) return setActiveCondition(conditionKeys[0]);
    setActiveCondition(conditionKeys[(activeIndex + 1) % conditionKeys.length]);
  };

  const handlePrev = () => {
    if (activeIndex === -1) return setActiveCondition(conditionKeys[conditionKeys.length - 1]);
    setActiveCondition(conditionKeys[(activeIndex - 1 + conditionKeys.length) % conditionKeys.length]);
  };

  const handleCategoryClick = (id) => {
    setActiveCondition(id === activeCondition ? null : id);
  };

  return (
    <main className={styles.page}>
      {/* Intro Sequence (0:00 - 0:02) */}
      <AnimatePresence>
        {isIntro && (
          <motion.div
            className={styles.introState}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <div className={styles.introPulseCore} />
            <div className={styles.introRing1} />
            <div className={styles.introRing2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic mesh gradient background */}
      <AnimatedBackground activeCondition={entered ? activeCondition : null} />

      {/* Base gradient layer */}
      <div className={styles.baseGradient} />

      {/* GLOBAL 3D CANVAS — Never unmounts */}
      {!isIntro && (
        <motion.div
          className={styles.globalModel}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.5 }}
        >
          <HumanBody3D 
            activeCondition={activeCondition} 
            onHotspotClick={handleCategoryClick} 
            gender={gender} 
            isExplore={entered}
          />
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {/* ===== HERO STATE ===== */}
        {!entered && !isIntro && (
          <motion.div
            key="hero"
            className={styles.heroState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Top Bar with Logo & Controls */}
            <motion.div
              className={styles.topBar}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className={styles.logo}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={styles.logoSvg}>
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 20 C12 12, 14 22, 16 16 C18 10, 20 20, 22 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
                <span className={styles.logoName}>Swaas<strong>Care</strong></span>
              </div>

              <div className={styles.topBarActions}>
                <div className={styles.heroGenderToggle} role="group" aria-label="Select Anatomical Model">
                  <button
                    type="button"
                    className={gender === 'female' ? styles.heroGenderActive : styles.heroGenderInactive}
                    onClick={() => setGender('female')}
                  >
                    ♀ FEMALE
                  </button>
                  <button
                    type="button"
                    className={gender === 'male' ? styles.heroGenderActive : styles.heroGenderInactive}
                    onClick={() => setGender('male')}
                  >
                    ♂ MALE
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.topSoundToggle}
                  onClick={() => setSoundOn(!soundOn)}
                  aria-label={soundOn ? 'Sound is on, click to mute' : 'Sound is off, click to unmute'}
                >
                  {soundOn ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                  <span className={styles.soundLabel}>{soundOn ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </motion.div>

            {/* Headline — masked reveal */}
            <div className={styles.heroLeft}>
              <div className={styles.headlineWrapper}>
                <div className={styles.headlineLine}>
                  <motion.span
                    className={styles.headlineWord}
                    variants={textMask}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                  >
                    Your Voice.
                  </motion.span>
                </div>
                <div className={styles.headlineLine}>
                  <motion.span
                    className={styles.headlineWord}
                    variants={textMask}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    Your Health.
                  </motion.span>
                </div>
              </div>
              <motion.p
                className={styles.heroSubtitle}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
              >
                AI-powered voice biomarker analysis for continuous, non-invasive health monitoring.
              </motion.p>
            </div>

            {/* Feature pills — staggered */}
            <div className={styles.heroRight}>
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  className={styles.featurePill}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i + 2}
                >
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <span className={styles.featureLabel}>{f.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Removed internal heroModel to prevent canvas remounting */}

            {/* Start button */}
            <motion.button
              className={styles.startBtn}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              onClick={() => setEntered(true)}
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Experience
            </motion.button>
          </motion.div>
        )}

        {/* ===== EXPLORE STATE ===== */}
        {entered && (
          <motion.div
            key="explore"
            className={styles.exploreState}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Top bar */}
            <motion.div
              className={styles.exploreTop}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.button
                className={styles.backBtn}
                onClick={() => setEntered(false)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Back to home overview"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>

              <div className={styles.genderToggle} role="group" aria-label="Select Anatomical Model">
                <button
                  type="button"
                  className={gender === 'female' ? styles.genderActive : styles.genderInactive}
                  onClick={() => setGender('female')}
                >
                  FEMALE ♀
                </button>
                <button
                  type="button"
                  className={gender === 'male' ? styles.genderActive : styles.genderInactive}
                  onClick={() => setGender('male')}
                >
                  MALE ♂
                </button>
              </div>

              <span className={styles.exploreLogo}>Swaas<strong>Care</strong></span>
            </motion.div>

            {/* Removed internal exploreModel to prevent canvas remounting */}

            {/* Category panel — glass sidebar */}
            <motion.div
              className={`${styles.categoryPanel} ${activeCondition ? styles.categoryPanelHiddenOnMobile : ''}`}
              variants={slideRight}
              initial="hidden"
              animate="visible"
            >
              <div className={styles.sheetHandle} />
              <p className={styles.categoryTitle}>EXPLORE CONDITIONS</p>

              {Object.entries(CONDITIONS).map(([id, cond], i) => (
                <motion.button
                  key={id}
                  className={`${styles.categoryCard} ${activeCondition === id ? styles.categoryActive : ''}`}
                  variants={cardSlide}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  onClick={() => handleCategoryClick(id)}
                  whileHover={{ x: -5, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <span className={styles.categoryIcon}>{cond.icon}</span>
                  <span className={styles.categoryLabel}>{cond.label}</span>
                  <svg className={styles.categoryChevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {/* Animated active indicator — slides to active card */}
                  {activeCondition === id && (
                    <motion.div
                      className={styles.activeIndicator}
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}

              <motion.button
                className={styles.exploreCta}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard →
              </motion.button>
            </motion.div>

            {/* Condition detail overlay */}
            <AnimatePresence>
              {activeCondition && CONDITIONS[activeCondition] && (
                <motion.div
                  className={styles.conditionDetail}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  key={activeCondition}
                >
                  <button 
                    className={styles.detailCloseBtn} 
                    onClick={() => setActiveCondition(null)}
                    aria-label="Close condition details"
                  >
                    ✕
                  </button>
                  <span className={styles.detailIcon}>{CONDITIONS[activeCondition].icon}</span>
                  <h3 className={styles.detailTitle}>{CONDITIONS[activeCondition].label}</h3>
                  <p className={styles.detailDesc}>{CONDITIONS[activeCondition].desc}</p>
                  
                  {/* Linear Tour Navigation */}
                  <div className={styles.tourNav}>
                    <button className={styles.tourBtn} onClick={handlePrev}>← Prev</button>
                    <div className={styles.tourIndicators}>
                      {conditionKeys.map((k, i) => (
                        <span key={k} className={`${styles.tourDot} ${i === activeIndex ? styles.tourDotActive : ''}`} />
                      ))}
                    </div>
                    <button className={styles.tourBtn} onClick={handleNext}>Next →</button>
                  </div>

                  <button
                    className={styles.backToListBtn}
                    onClick={() => setActiveCondition(null)}
                  >
                    View All Conditions
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
