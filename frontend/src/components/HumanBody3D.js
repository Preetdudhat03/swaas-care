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
      emissiveIntensity: 0.35,
      roughness: 0.22,
      metalness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.72,
      depthWrite: true, // Front surface writes to depth to cleanly occlude internal mouth/head cavities
      depthTest: true,
      side: THREE.FrontSide,
    });

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = bodyMat;
        child.renderOrder = 10; // Renders translucent outer shell over internal organs
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
   REALISTIC ANATOMICAL BRAIN COMPONENT
   Loads authentic BodyParts3D neuroanatomy model with 65 segmented brain structures
   (cerebral cortex, gyri/sulci, cerebellum, brainstem, hippocampus, ventricles)
   fitted snugly inside the cranium with reactive synaptic neural firing.
   —————————————————————————————————————————————————————————————————————————— */
function RealisticBrain({ activeCondition, onHotspotClick }) {
  const gltf = useGLTF('/models/brain.glb');
  const matRef = useRef();
  const synapsePointsRef = useRef();

  const isBrain = ['neurological', 'post-stroke', 'depression', 'parkinsons'].includes(activeCondition);

  // Synaptic sparks around the cerebral cortex
  const { synapsePositions } = useMemo(() => {
    const count = 50;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.7;
      const r = 0.12 + Math.random() * 0.025;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.85;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return { synapsePositions: pos };
  }, []);

  const brainModel = useMemo(() => {
    if (!gltf || !gltf.scene) return null;
    const cloned = gltf.scene.clone(true);

    // Center the brain mesh to local (0,0,0)
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.position.sub(center);

    // Rotate so brainstem points down into spine (-Y) and frontal lobe faces forward (+Z)
    cloned.rotation.x = -Math.PI / 2;

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f43f5e'), // Luminous anatomical rose
      emissive: new THREE.Color('#db2777'),
      emissiveIntensity: 0.55,
      roughness: 0.32,
      metalness: 0.12,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      transparent: true,
      opacity: 0.85,
      depthWrite: true,
      depthTest: true,
    });
    matRef.current = mat;

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
        child.renderOrder = 1;
        child.castShadow = true;
      }
    });

    const wrapper = new THREE.Group();
    wrapper.add(cloned);
    return wrapper;
  }, [gltf]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (matRef.current) {
      const targetOp = isBrain ? 0.98 : 0.65;
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOp, 0.08);

      const targetEmissive = isBrain ? 1.1 + Math.sin(t * 3.5) * 0.35 : 0.5;
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity,
        targetEmissive,
        0.08
      );

      if (activeCondition === 'parkinsons') {
        matRef.current.emissive.set('#f59e0b');
      } else if (activeCondition === 'depression') {
        matRef.current.emissive.set('#3b82f6');
      } else {
        matRef.current.emissive.set('#db2777');
      }
    }

    if (synapsePointsRef.current) {
      synapsePointsRef.current.rotation.y = t * 0.12;
    }
  });

  if (!brainModel) return null;

  return (
    <group
      position={[0, 1.625, 0.075]}
      scale={[0.10, 0.10, 0.10]}
      onClick={(e) => {
        e.stopPropagation();
        onHotspotClick?.('neurological');
      }}
    >
      <primitive object={brainModel} />

      {/* Synaptic neural firing particles */}
      <points ref={synapsePointsRef} position={[0, 0, 0]} scale={[12, 12, 12]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={synapsePositions.length / 3}
            array={synapsePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.016}
          color={
            activeCondition === 'depression'
              ? '#60a5fa'
              : activeCondition === 'parkinsons'
              ? '#fbbf24'
              : '#f43f5e'
          }
          transparent
          opacity={isBrain ? 0.95 : 0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   REALISTIC ANATOMICAL HEART COMPONENT
   Loads authentic NIH Visible Human heart model featuring ventricles, atria,
   interventricular septum, and cardiac valves, with dynamic "lub-dub" double pulse.
   —————————————————————————————————————————————————————————————————————————— */
function RealisticHeart({ activeCondition, onHotspotClick }) {
  const gltf = useGLTF('/models/heart.glb');
  const groupRef = useRef();
  const matRef = useRef();

  const isHeart = activeCondition === 'cardiovascular';

  const heartModel = useMemo(() => {
    if (!gltf || !gltf.scene) return null;
    const cloned = gltf.scene.clone(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.position.sub(center);

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ef4444'), // Anatomical crimson
      emissive: new THREE.Color('#b91c1c'),
      emissiveIntensity: 0.65,
      roughness: 0.22,
      metalness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.9,
      depthWrite: true,
      depthTest: true,
    });
    matRef.current = mat;

    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
        child.renderOrder = 1;
        child.castShadow = true;
      }
    });

    const wrapper = new THREE.Group();
    wrapper.add(cloned);
    return wrapper;
  }, [gltf]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Realistic cardiac cycle: "lub-dub" double pump (~72 bpm = 1.25 Hz)
    const beatCycle = (t * 1.25) % 1.0;
    let pulse = 0;
    if (beatCycle < 0.14) {
      pulse = Math.sin((beatCycle / 0.14) * Math.PI) * 0.08;
    } else if (beatCycle >= 0.20 && beatCycle < 0.38) {
      pulse = Math.sin(((beatCycle - 0.20) / 0.18) * Math.PI) * 0.13;
    }

    if (groupRef.current) {
      const baseScale = 2.05;
      groupRef.current.scale.setScalar(baseScale * (1 + pulse));
    }

    if (matRef.current) {
      const targetOp = isHeart ? 1.0 : 0.75;
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOp, 0.08);

      const targetEmissive = isHeart ? 0.9 + pulse * 2.2 : 0.55 + pulse * 1.2;
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity,
        targetEmissive,
        0.15
      );
    }
  });

  if (!heartModel) return null;

  return (
    <group
      ref={groupRef}
      position={[-0.035, 0.50, 0.09]}
      rotation={[0.12, 0.15, -0.25]}
      scale={[2.05, 2.05, 2.05]}
      onClick={(e) => {
        e.stopPropagation();
        onHotspotClick?.('cardiovascular');
      }}
    >
      <primitive object={heartModel} />
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   REALISTIC ANATOMICAL LUNGS COMPONENT
   Loads authentic OrganUI / BodyParts3D lungs model featuring full trachea,
   bronchial tree, right and left lung lobes, and tidal respiration expansion.
   —————————————————————————————————————————————————————————————————————————— */
function RealisticLungs({ activeCondition, onHotspotClick }) {
  const gltf = useGLTF('/models/lungs.glb');
  const groupRef = useRef();
  const lungMatRef = useRef();
  const airwayMatRef = useRef();

  const isLungs = activeCondition === 'asthma';

  const lungsModel = useMemo(() => {
    if (!gltf || !gltf.scene) return null;
    const cloned = gltf.scene.clone(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cloned.position.sub(center);

    const lungMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#38bdf8'), // Clean respiratory cyan
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.55,
      roughness: 0.28,
      metalness: 0.12,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: 0.85,
      depthWrite: true,
      depthTest: true,
    });
    lungMatRef.current = lungMat;

    const airwayMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#bae6fd'),
      emissive: new THREE.Color('#38bdf8'),
      emissiveIntensity: 0.75,
      roughness: 0.2,
      transparent: true,
      opacity: 0.92,
      depthWrite: true,
      depthTest: true,
    });
    airwayMatRef.current = airwayMat;

    cloned.traverse((child) => {
      if (child.isMesh) {
        // FMA7394 is the trachea/windpipe structure
        child.material = child.name === 'FMA7394' ? airwayMat : lungMat;
        child.renderOrder = 1;
        child.castShadow = true;
      }
    });

    const wrapper = new THREE.Group();
    wrapper.add(cloned);
    return wrapper;
  }, [gltf]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Respiratory rhythm expansion & contraction (breathing)
    const breath = Math.sin(t * 1.35) * 0.045;

    if (groupRef.current) {
      const baseScale = 0.13;
      groupRef.current.scale.set(
        baseScale * (1 + breath * 0.75),
        baseScale * (1 + breath * 0.45),
        baseScale * (1 + breath * 1.1)
      );
    }

    if (lungMatRef.current) {
      const targetOp = isLungs ? 0.98 : 0.65;
      lungMatRef.current.opacity = THREE.MathUtils.lerp(lungMatRef.current.opacity, targetOp, 0.08);

      const targetEmissive = isLungs ? 1.05 + breath * 0.6 : 0.5 + breath * 0.25;
      lungMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        lungMatRef.current.emissiveIntensity,
        targetEmissive,
        0.08
      );
    }
  });

  if (!lungsModel) return null;

  return (
    <group
      ref={groupRef}
      position={[0, 0.525, 0.05]}
      scale={[0.13, 0.13, 0.13]}
      onClick={(e) => {
        e.stopPropagation();
        onHotspotClick?.('asthma');
      }}
    >
      <primitive object={lungsModel} />
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   AUTHENTIC INTERNAL ORGANS CONTAINER
   Encapsulates Brain, Heart, and Lungs with error boundaries and suspense.
   —————————————————————————————————————————————————————————————————————————— */
function DetailedInternalOrgans({ activeCondition, onHotspotClick }) {
  return (
    <group>
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <RealisticBrain activeCondition={activeCondition} onHotspotClick={onHotspotClick} />
        </Suspense>
      </ModelErrorBoundary>

      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <RealisticLungs activeCondition={activeCondition} onHotspotClick={onHotspotClick} />
        </Suspense>
      </ModelErrorBoundary>

      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <RealisticHeart activeCondition={activeCondition} onHotspotClick={onHotspotClick} />
        </Suspense>
      </ModelErrorBoundary>
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
    { id: 'neurological', pos: [0, 1.63, 0.32] },
    { id: 'cardiovascular', pos: [-0.035, 0.50, 0.24] },
    { id: 'asthma', pos: [0.16, 0.52, 0.24] },
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
    asthma: { target: [0.12, 0.52, 0.1], pos: [-0.10, 0.52, 2.0] },
    cardiovascular: { target: [-0.035, 0.50, 0.1], pos: [-0.035, 0.50, 1.9] },
    neurological: { target: [0, 1.63, 0.1], pos: [0, 1.63, 1.5] },
    'post-stroke': { target: [0.08, 1.60, 0.1], pos: [0.08, 1.60, 1.5] },
    parkinsons: { target: [-0.08, 1.60, 0.1], pos: [-0.08, 1.60, 1.5] },
    depression: { target: [0, 1.66, 0.1], pos: [0, 1.66, 1.5] },
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
            <Suspense fallback={null}>
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
