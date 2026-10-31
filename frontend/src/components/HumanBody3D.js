'use client';
import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, ContactShadows, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Suppress known harmless THREE.js warnings
const _origWarn = console.warn;
console.warn = (...args) => {
  const msg = args.map(a => String(a)).join(' ');
  const suppressedKeywords = [
    'THREE.Clock',
    'X4122',
    'THREE.THREE.Clock',
    'WebGLProgram',
    'accurate in double precision',
    'auto-scroll'
  ];
  if (suppressedKeywords.some(kw => msg.includes(kw))) return;
  _origWarn.apply(console, args);
};

/* ——————————————————————————————————————————————————————————————————————————
   BULLETPROOF ERROR BOUNDARY FOR 3D ASSETS
   Prevents any 3D asset/loader error from bubbling up and crashing the page.
   —————————————————————————————————————————————————————————————————————————— */
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('3D Model loader fallback activated:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

/* ——————————————————————————————————————————————————————————————————————————
   HIGH-DEFINITION REALISTIC 3D HUMAN BODY MESH
   Renders the authentic continuous 3D anatomical mesh with a vibrant,
   high-visibility medical bioluminescent physical shader so it stands out
   crisply and beautifully against the light background.
   —————————————————————————————————————————————————————————————————————————— */
function RealisticHumanModel({ gender = 'female' }) {
  const modelUrl = gender === 'male' ? '/models/body-male.glb' : '/models/body-female.glb';
  const gltf = useGLTF(modelUrl);

  const model = useMemo(() => {
    if (!gltf || !gltf.scene) return null;
    const cloned = gltf.scene.clone(true);

    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#3b82f6'), // High-visibility royal medical blue
      emissive: new THREE.Color('#1e2d6b'), // Deep internal glow
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.85,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
    });

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = bodyMat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return cloned;
  }, [gltf]);

  if (!model) return null;

  // Model height is 1.66m; scale 2.53 grounds the feet at y = -2.35
  return (
    <group position={[0, -2.35, 0]} scale={[2.53, 2.53, 2.53]}>
      <primitive object={model} />
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   ELEGANT ANATOMICAL SILHOUETTE (FALLBACK & LOADING STATE)
   Clean, contoured silhouette that ensures the scene is never blank.
   —————————————————————————————————————————————————————————————————————————— */
function FallbackAnatomicalFigure({ gender = 'female' }) {
  const isMale = gender === 'male';
  return (
    <group position={[0, -0.2, 0]}>
      {/* Head */}
      <mesh position={[0, 1.55, 0]} scale={[0.85, 1.05, 0.95]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshPhysicalMaterial
          color="#3b82f6"
          emissive="#1e2d6b"
          emissiveIntensity={0.3}
          roughness={0.25}
          metalness={0.15}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.25, 20]} />
        <meshPhysicalMaterial color="#3b82f6" transparent opacity={0.65} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.65, 0]} scale={[isMale ? 1.15 : 0.95, 1, 0.85]}>
        <capsuleGeometry args={[0.38, 0.65, 16, 24]} />
        <meshPhysicalMaterial color="#3b82f6" transparent opacity={0.7} />
      </mesh>
      {/* Pelvis */}
      <mesh position={[0, -0.15, 0]} scale={[isMale ? 0.9 : 1.1, 0.85, 0.85]}>
        <capsuleGeometry args={[0.34, 0.35, 16, 24]} />
        <meshPhysicalMaterial color="#3b82f6" transparent opacity={0.7} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, -1.15, 0]}>
        <capsuleGeometry args={[0.13, 1.25, 12, 20]} />
        <meshPhysicalMaterial color="#3b82f6" transparent opacity={0.65} />
      </mesh>
      <mesh position={[0.2, -1.15, 0]}>
        <capsuleGeometry args={[0.13, 1.25, 12, 20]} />
        <meshPhysicalMaterial color="#3b82f6" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   DETAILED INTERNAL ORGANS
   - Brain: Left & right cerebral hemispheres, gyri/sulci, cerebellum, brainstem,
     and dynamic synaptic firing sparks.
   - Heart: Muscular ventricles, atria, ascending aorta arch with 3 arteries,
     pulmonary trunk, and realistic double-beat (lub-dub) cardiac cycle!
   - Lungs & Bronchial Tree: Trachea, primary bronchi bifurcation, secondary
     branching arborization, 3-lobed right lung, 2-lobed left lung with cardiac notch.
   —————————————————————————————————————————————————————————————————————————— */
function DetailedInternalOrgans({ activeCondition, onHotspotClick }) {
  const heartGroupRef = useRef();
  const lungsGroupRef = useRef();
  const brainGroupRef = useRef();
  const synapsePointsRef = useRef();

  const isBrain = ['neurological', 'post-stroke', 'depression', 'parkinsons'].includes(activeCondition);
  const isHeart = activeCondition === 'cardiovascular';
  const isLungs = activeCondition === 'asthma';

  // Synaptic sparks for the brain
  const { synapsePositions } = useMemo(() => {
    const count = 48;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.65;
      const r = 0.19 + Math.random() * 0.04;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = 1.48 + r * Math.cos(phi) * 0.8;
      pos[i * 3 + 2] = -0.01 + r * Math.sin(phi) * Math.sin(theta);
    }
    return { synapsePositions: pos };
  }, []);

  // Airway tree branching segments
  const airwayBranches = useMemo(() => {
    return [
      { start: [0, 0.60, 0.08], end: [0.09, 0.52, 0.06], r: 0.016 },
      { start: [0, 0.60, 0.08], end: [-0.09, 0.52, 0.06], r: 0.016 },
      { start: [0.09, 0.52, 0.06], end: [0.16, 0.56, 0.04], r: 0.011 },
      { start: [0.09, 0.52, 0.06], end: [0.18, 0.46, 0.05], r: 0.011 },
      { start: [0.09, 0.52, 0.06], end: [0.14, 0.36, 0.03], r: 0.010 },
      { start: [-0.09, 0.52, 0.06], end: [-0.16, 0.54, 0.04], r: 0.011 },
      { start: [-0.09, 0.52, 0.06], end: [-0.17, 0.40, 0.04], r: 0.011 },
    ];
  }, []);

  const materials = useMemo(() => ({
    brain: new THREE.MeshPhysicalMaterial({
      color: '#ff2d87',
      emissive: '#d60062',
      emissiveIntensity: 0.5,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    }),
    cerebellum: new THREE.MeshStandardMaterial({
      color: '#e62e78',
      emissive: '#b0004e',
      emissiveIntensity: 0.45,
      roughness: 0.35,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    }),
    heart: new THREE.MeshPhysicalMaterial({
      color: '#ff1447',
      emissive: '#c7002e',
      emissiveIntensity: 0.65,
      roughness: 0.22,
      metalness: 0.15,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
    aorta: new THREE.MeshStandardMaterial({
      color: '#ff3366',
      emissive: '#d10038',
      emissiveIntensity: 0.55,
      roughness: 0.3,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
    lungs: new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.55,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    }),
    bronchi: new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      emissive: '#38bdf8',
      emissiveIntensity: 0.7,
      roughness: 0.2,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    const targetBrainOp = isBrain ? 0.95 : 0.18;
    const targetHeartOp = isHeart ? 0.98 : 0.22;
    const targetLungsOp = isLungs ? 0.92 : 0.18;

    materials.brain.opacity = THREE.MathUtils.lerp(materials.brain.opacity, targetBrainOp, 0.08);
    materials.cerebellum.opacity = THREE.MathUtils.lerp(materials.cerebellum.opacity, targetBrainOp * 0.9, 0.08);
    materials.heart.opacity = THREE.MathUtils.lerp(materials.heart.opacity, targetHeartOp, 0.08);
    materials.aorta.opacity = THREE.MathUtils.lerp(materials.aorta.opacity, targetHeartOp, 0.08);
    materials.lungs.opacity = THREE.MathUtils.lerp(materials.lungs.opacity, targetLungsOp, 0.08);
    materials.bronchi.opacity = THREE.MathUtils.lerp(materials.bronchi.opacity, targetLungsOp, 0.08);

    // Realistic cardiac cycle: "lub-dub" double pump rhythm (~72 bpm)
    if (heartGroupRef.current) {
      const beatCycle = (t * 1.25) % 1.0;
      let pulse = 0;
      if (beatCycle < 0.15) {
        pulse = Math.sin((beatCycle / 0.15) * Math.PI) * 0.08;
      } else if (beatCycle >= 0.22 && beatCycle < 0.42) {
        pulse = Math.sin(((beatCycle - 0.22) / 0.20) * Math.PI) * 0.14;
      }
      heartGroupRef.current.scale.setScalar(1 + pulse);
      materials.heart.emissiveIntensity = 0.5 + pulse * 1.8;
    }

    // Respiratory rhythm expansion
    if (lungsGroupRef.current) {
      const breath = Math.sin(t * 1.5) * 0.04;
      lungsGroupRef.current.scale.set(1 + breath * 0.8, 1 + breath * 0.5, 1 + breath * 1.2);
    }

    // Brain synaptic flicker
    if (synapsePointsRef.current) {
      synapsePointsRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <group>
      {/* 1. ANATOMICAL BRAIN & CEREBRAL CORTEX */}
      <group
        ref={brainGroupRef}
        position={[0, 1.48, -0.01]}
        onClick={(e) => {
          e.stopPropagation();
          onHotspotClick?.('neurological');
        }}
      >
        <mesh material={materials.brain} position={[-0.075, 0.02, 0]} scale={[0.75, 0.92, 1.05]}>
          <sphereGeometry args={[0.19, 32, 32]} />
        </mesh>
        <mesh material={materials.brain} position={[0.075, 0.02, 0]} scale={[0.75, 0.92, 1.05]}>
          <sphereGeometry args={[0.19, 32, 32]} />
        </mesh>

        {/* Cortical Gyri Lobe Accents */}
        <mesh material={materials.brain} position={[-0.085, 0.07, 0.08]} scale={[0.065, 0.05, 0.065]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>
        <mesh material={materials.brain} position={[0.085, 0.07, 0.08]} scale={[0.065, 0.05, 0.065]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>

        {/* Cerebellum */}
        <mesh material={materials.cerebellum} position={[-0.06, -0.10, -0.09]} scale={[0.085, 0.065, 0.075]}>
          <sphereGeometry args={[1, 24, 24]} />
        </mesh>
        <mesh material={materials.cerebellum} position={[0.06, -0.10, -0.09]} scale={[0.085, 0.065, 0.075]}>
          <sphereGeometry args={[1, 24, 24]} />
        </mesh>

        {/* Brainstem */}
        <mesh material={materials.cerebellum} position={[0, -0.15, -0.03]} scale={[0.04, 0.12, 0.04]}>
          <cylinderGeometry args={[0.7, 0.9, 1, 16]} />
        </mesh>

        {/* Parkinson's Substantia Nigra Core Highlight */}
        {activeCondition === 'parkinsons' && (
          <mesh position={[0, -0.05, -0.02]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={1.4}
              transparent
              opacity={0.9}
            />
          </mesh>
        )}

        {/* Synaptic Neural Firing Particles */}
        <points ref={synapsePointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={synapsePositions.length / 3}
              array={synapsePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.022}
            color={activeCondition === 'depression' ? '#60a5fa' : activeCondition === 'parkinsons' ? '#fbbf24' : '#ec4899'}
            transparent
            opacity={isBrain ? 0.95 : 0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* 2. ANATOMICAL HEART & AORTA */}
      <group
        ref={heartGroupRef}
        position={[0.06, 0.52, 0.07]}
        rotation={[0.18, 0.15, -0.32]}
        onClick={(e) => {
          e.stopPropagation();
          onHotspotClick?.('cardiovascular');
        }}
      >
        <mesh material={materials.heart} position={[-0.04, -0.06, 0.02]} rotation={[0, 0, 0.25]} scale={[0.10, 0.17, 0.11]}>
          <capsuleGeometry args={[0.6, 0.7, 12, 16]} />
        </mesh>
        <mesh material={materials.heart} position={[0.05, -0.03, 0.03]} scale={[0.09, 0.14, 0.095]}>
          <capsuleGeometry args={[0.6, 0.7, 12, 16]} />
        </mesh>
        <mesh material={materials.heart} position={[-0.03, 0.07, -0.02]} scale={[0.085, 0.085, 0.085]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>
        <mesh material={materials.heart} position={[0.055, 0.06, -0.01]} scale={[0.08, 0.08, 0.08]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>

        {/* Ascending Aorta Arch */}
        <mesh
          material={materials.aorta}
          position={[0.02, 0.12, 0]}
          rotation={[0, 0, Math.PI * 0.45]}
          scale={[0.095, 0.036, 0.036]}
        >
          <torusGeometry args={[0.8, 0.35, 12, 24, Math.PI * 0.85]} />
        </mesh>
        {/* Carotid / Brachiocephalic Branch Arteries */}
        <mesh material={materials.aorta} position={[0.04, 0.20, 0]} scale={[0.011, 0.055, 0.011]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
        </mesh>
        <mesh material={materials.aorta} position={[0.01, 0.21, 0]} scale={[0.010, 0.06, 0.010]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
        </mesh>
        <mesh material={materials.aorta} position={[-0.02, 0.20, 0]} scale={[0.010, 0.055, 0.010]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
        </mesh>
      </group>

      {/* 3. ANATOMICAL LUNGS & BRONCHIAL ARBORIZATION */}
      <group
        ref={lungsGroupRef}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onHotspotClick?.('asthma');
        }}
      >
        {/* Trachea */}
        <mesh material={materials.bronchi} position={[0, 0.74, 0.08]} scale={[0.030, 0.22, 0.030]}>
          <cylinderGeometry args={[0.9, 0.9, 1, 16]} />
        </mesh>

        {/* Bronchial branches */}
        {airwayBranches.map((branch, idx) => {
          const vStart = new THREE.Vector3(...branch.start);
          const vEnd = new THREE.Vector3(...branch.end);
          const mid = vStart.clone().add(vEnd).multiplyScalar(0.5);
          const dist = vStart.distanceTo(vEnd);
          const dir = vEnd.clone().sub(vStart).normalize();
          const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

          return (
            <mesh key={`airway-${idx}`} position={mid} quaternion={quat}>
              <cylinderGeometry args={[branch.r * 0.8, branch.r, dist, 10]} />
              <meshStandardMaterial
                color="#7dd3fc"
                emissive="#0284c7"
                emissiveIntensity={isLungs ? 0.95 : 0.45}
                transparent
                opacity={isLungs ? 0.9 : 0.25}
              />
            </mesh>
          );
        })}

        {/* Right Lung (3 Anatomical Lobes) */}
        <group position={[0.18, 0.46, 0.02]}>
          <mesh material={materials.lungs} position={[0, 0.11, 0]} scale={[0.10, 0.15, 0.13]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
          <mesh material={materials.lungs} position={[0.02, 0.0, 0.02]} scale={[0.09, 0.11, 0.12]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
          <mesh material={materials.lungs} position={[0, -0.11, -0.01]} scale={[0.10, 0.15, 0.14]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
        </group>

        {/* Left Lung (2 Lobes with Cardiac Notch) */}
        <group position={[-0.18, 0.46, 0.02]}>
          <mesh material={materials.lungs} position={[0, 0.10, 0]} scale={[0.095, 0.17, 0.12]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
          <mesh material={materials.lungs} position={[-0.01, -0.10, -0.01]} scale={[0.095, 0.16, 0.13]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   INTERACTIVE 3D HOTSPOT PINS
   Pulsing holographic targets hovering near key organs in explore mode.
   —————————————————————————————————————————————————————————————————————————— */
function InteractiveHotspots({ activeCondition, onHotspotClick, isExplore }) {
  if (!isExplore) return null;

  const hotspots = [
    { id: 'neurological', pos: [0, 1.48, 0.28] },
    { id: 'cardiovascular', pos: [0.08, 0.52, 0.28] },
    { id: 'asthma', pos: [-0.18, 0.46, 0.26] },
  ];

  return (
    <group>
      {hotspots.map((spot) => {
        const isActive = activeCondition === spot.id;
        return (
          <group
            key={spot.id}
            position={spot.pos}
            onClick={(e) => {
              e.stopPropagation();
              onHotspotClick?.(spot.id);
            }}
          >
            <mesh>
              <ringGeometry args={[0.045, 0.055, 32]} />
              <meshBasicMaterial
                color={isActive ? '#38bdf8' : '#60a5fa'}
                transparent
                opacity={isActive ? 0.95 : 0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshStandardMaterial
                color={isActive ? '#38bdf8' : '#ffffff'}
                emissive={isActive ? '#0284c7' : '#4A6CF7'}
                emissiveIntensity={1.4}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   LUMINOUS AMBIENT PARTICLES
   —————————————————————————————————————————————————————————————————————————— */
function AmbientParticles({ count = 80 }) {
  const ref = useRef();
  const { positions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return { positions: pos };
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.012;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.008) * 0.04;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#818cf8"
        transparent
        opacity={0.35}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   SMOOTH CINEMATIC CAMERA FLIGHT RIG
   —————————————————————————————————————————————————————————————————————————— */
function CameraRig({ activeCondition, isExplore }) {
  const { camera, size } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const lookAtTarget = useRef(new THREE.Vector3(0, -0.2, 0));
  const posTarget = useRef(new THREE.Vector3(0, -0.2, 7.8));

  const CONDITION_VIEWS = {
    hero: { target: [0, -0.2, 0], pos: [0, -0.2, 7.8] },
    explore: { target: [-0.35, -0.2, 0], pos: [-0.35, -0.2, 7.2] },
    asthma: { target: [0, 0.46, 0.1], pos: [-0.2, 0.46, 2.0] },
    cardiovascular: { target: [0.12, 0.52, 0.1], pos: [0.08, 0.52, 1.8] },
    neurological: { target: [0, 1.48, 0.1], pos: [0, 1.48, 1.5] },
    'post-stroke': { target: [0.20, 1.40, 0.1], pos: [0.1, 1.40, 1.5] },
    parkinsons: { target: [-0.18, 1.44, 0.1], pos: [-0.1, 1.44, 1.5] },
    depression: { target: [0, 1.62, 0.1], pos: [0, 1.62, 1.5] },
  };

  useEffect(() => {
    const handleMouse = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  useFrame(() => {
    let viewKey = 'hero';
    if (isExplore) {
      viewKey = activeCondition || 'explore';
    }
    const view = CONDITION_VIEWS[viewKey] || CONDITION_VIEWS['explore'];

    const aspect = size.width / (size.height || 1);
    const isMobile = size.width < 768;

    let baseTargetX = view.target[0];
    let baseTargetY = view.target[1];
    let basePosX = view.pos[0];
    let basePosY = view.pos[1];
    let basePosZ = view.pos[2];

    if (isMobile) {
      if (viewKey === 'hero') {
        if (aspect < 0.65) {
          basePosZ = view.pos[2] * Math.min(1.35, 0.65 / aspect);
        }
      } else if (viewKey === 'explore') {
        baseTargetX = 0;
        basePosX = 0;
        baseTargetY = 0.2;
        basePosY = 0.2;
        if (aspect < 0.65) {
          basePosZ = 7.6 * Math.min(1.3, 0.65 / aspect);
        }
      } else {
        baseTargetX = 0;
        basePosX = 0;
        baseTargetY = view.target[1] - 0.25;
        basePosY = view.pos[1] - 0.25;
      }
    }

    const targetX = basePosX + mouse.current.x * 0.12;
    const targetY = basePosY - mouse.current.y * 0.12;
    const targetZ = basePosZ;

    posTarget.current.set(targetX, targetY, targetZ);
    camera.position.lerp(posTarget.current, 0.04);

    lookAtTarget.current.lerp(new THREE.Vector3(baseTargetX, baseTargetY, view.target[2] || 0), 0.04);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}

/* ——————————————————————————————————————————————————————————————————————————
   SCENE CONTAINER WITH HIGH-CONTRAST STUDIO LIGHTING
   —————————————————————————————————————————————————————————————————————————— */
function HumanBodyScene({ activeCondition, onHotspotClick, gender, isExplore }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.06;
    }
  });

  return (
    <>
      {/* Crisp studio lighting for high visibility against light background */}
      <ambientLight intensity={0.7} color="#f0f4ff" />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#ffffff" castShadow />
      <directionalLight position={[-4, 5, 4]} intensity={1.1} color="#93c5fd" />
      <directionalLight position={[0, -2, 4]} intensity={0.6} color="#c7d2fe" />

      {/* Front fill light */}
      <pointLight position={[0, 0.5, 3.5]} intensity={1.2} color="#60a5fa" distance={8} />

      {/* Rim light defining the authentic human silhouette */}
      <spotLight
        position={[0, 4, -3]}
        angle={0.65}
        penumbra={0.8}
        intensity={1.8}
        color="#38bdf8"
      />

      {/* Thoracic internal illumination */}
      <pointLight position={[0, 0.5, 0]} intensity={isExplore ? 0.8 : 0.4} color="#60a5fa" distance={3} />

      <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.20}>
        <group ref={groupRef} position={[0, 0, 0]}>
          {/* Authentic realistic 3D mesh model with ErrorBoundary & fallback */}
          <ModelErrorBoundary fallback={<FallbackAnatomicalFigure gender={gender} />}>
            <Suspense fallback={<FallbackAnatomicalFigure gender={gender} />}>
              <RealisticHumanModel gender={gender} />
            </Suspense>
          </ModelErrorBoundary>

          {/* Internal Organs (Brain, Heart, Lungs) */}
          <DetailedInternalOrgans activeCondition={activeCondition} onHotspotClick={onHotspotClick} />

          {/* Interactive Hotspot Targets */}
          <InteractiveHotspots
            activeCondition={activeCondition}
            onHotspotClick={onHotspotClick}
            isExplore={isExplore}
          />
        </group>
      </Float>

      <ContactShadows
        position={[0, -2.35, 0]}
        opacity={0.4}
        scale={6.5}
        blur={2.2}
        far={4.5}
        color="#2563eb"
      />

      <AmbientParticles count={80} />
      <CameraRig activeCondition={activeCondition} isExplore={isExplore} />
      <Environment preset="city" environmentIntensity={0.85} />
    </>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   EXPORTED COMPONENT
   —————————————————————————————————————————————————————————————————————————— */
export default function HumanBody3D({ activeCondition, onHotspotClick, style, gender = 'female', isExplore = false }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '75%',
          height: '75%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.09) 45%, transparent 70%)',
          filter: 'blur(55px)',
          pointerEvents: 'none',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />

      {!error ? (
        <Canvas
          camera={{ position: [0, -0.2, 7.8], fov: 38 }}
          onCreated={() => setReady(true)}
          onError={() => setError(true)}
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <HumanBodyScene
              activeCondition={activeCondition}
              onHotspotClick={onHotspotClick}
              gender={gender}
              isExplore={isExplore}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 200,
              height: 380,
              background:
                'linear-gradient(180deg, rgba(74,108,247,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 100%)',
              borderRadius: '50% 50% 45% 45% / 30% 30% 25% 25%',
              filter: 'blur(2px)',
              animation: 'float 4s ease-in-out infinite, pulse 3s ease-in-out infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
