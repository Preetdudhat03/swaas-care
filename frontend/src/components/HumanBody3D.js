'use client';
import { useRef, useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Suppress known harmless THREE.js library warnings (deprecated Clock, shader precision)
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
   PREMIUM BIOLUMINESCENT MATERIALS
   Medical-grade physical shaders with depth, transmission, and rim radiance
   —————————————————————————————————————————————————————————————————————————— */
function BodyMaterial({ color = '#b2c8f8', opacity = 0.82, roughness = 0.16, transmission = 0.82 }) {
  return (
    <meshPhysicalMaterial
      color={color}
      emissive="#122044"
      emissiveIntensity={0.15}
      roughness={roughness}
      metalness={0.1}
      transmission={transmission}
      thickness={1.6}
      ior={1.46}
      clearcoat={0.9}
      clearcoatRoughness={0.12}
      transparent
      opacity={opacity}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}

function BoneMaterial({ color = '#dce6ff', opacity = 0.55 }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive="#3b568c"
      emissiveIntensity={0.2}
      roughness={0.35}
      metalness={0.15}
      transparent
      opacity={opacity}
      depthWrite={false}
    />
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   DETAILED ANATOMICAL HEAD & NECK
   Featuring realistic facial contours (brow ridge, nose bridge, jawline, chin,
   cheekbones, ears) and contoured neck with sternocleidomastoid muscles.
   —————————————————————————————————————————————————————————————————————————— */
function DetailedHead({ color }) {
  return (
    <group position={[0, 1.55, 0]}>
      {/* 1. Cranium (Neurocranium) - anatomically elongated with occipital curve */}
      <mesh position={[0, 0.05, -0.03]} scale={[0.88, 1.04, 1.08]}>
        <sphereGeometry args={[0.33, 48, 48]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* 2. Forehead & Supraorbital Brow Ridge */}
      <mesh position={[0, 0.12, 0.16]} scale={[1.05, 0.5, 0.55]}>
        <sphereGeometry args={[0.18, 32, 24]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* 3. Orbit Cavities / Eye sockets */}
      <mesh position={[0.11, 0.05, 0.20]} scale={[0.07, 0.05, 0.04]} rotation={[0, 0.15, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} opacity={0.65} />
      </mesh>
      <mesh position={[-0.11, 0.05, 0.20]} scale={[0.07, 0.05, 0.04]} rotation={[0, -0.15, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} opacity={0.65} />
      </mesh>

      {/* 4. Zygomatic Arches (Cheekbones) */}
      <mesh position={[0.20, -0.02, 0.14]} scale={[0.09, 0.07, 0.09]} rotation={[0.2, 0.3, -0.2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[-0.20, -0.02, 0.14]} scale={[0.09, 0.07, 0.09]} rotation={[0.2, -0.3, 0.2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* 5. Nose (Bridge, Dorsum, and Nasal Lobule) */}
      <mesh position={[0, 0.02, 0.26]} rotation={[0.38, 0, 0]} scale={[0.045, 0.13, 0.06]}>
        <cylinderGeometry args={[0.4, 0.9, 1, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.04, 0.29]} scale={[0.045, 0.038, 0.045]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* 6. Lips & Philtrum */}
      <mesh position={[0, -0.11, 0.24]} scale={[0.075, 0.025, 0.035]}>
        <capsuleGeometry args={[0.7, 0.6, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.145, 0.23]} scale={[0.065, 0.022, 0.032]}>
        <capsuleGeometry args={[0.7, 0.6, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* 7. Mandible (Jawline) & Mental Protuberance (Chin) */}
      <mesh position={[0, -0.19, 0.16]} scale={[0.55, 0.35, 0.58]} rotation={[-0.1, 0, 0]}>
        <sphereGeometry args={[0.30, 32, 32]} />
        <BodyMaterial color={color} />
      </mesh>
      {/* Defined Chin apex */}
      <mesh position={[0, -0.24, 0.22]} scale={[0.07, 0.065, 0.07]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      {/* Jaw ramus (left & right jaw edges) */}
      <mesh position={[0.18, -0.12, 0.02]} rotation={[0.6, 0.2, -0.5]} scale={[0.05, 0.18, 0.05]}>
        <capsuleGeometry args={[0.7, 1.2, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[-0.18, -0.12, 0.02]} rotation={[0.6, -0.2, 0.5]} scale={[0.05, 0.18, 0.05]}>
        <capsuleGeometry args={[0.7, 1.2, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* 8. Anatomical Ears with helix contour */}
      <mesh position={[0.31, 0.01, -0.02]} rotation={[0.1, 0.2, 0.1]} scale={[0.045, 0.13, 0.08]}>
        <capsuleGeometry args={[0.8, 1.0, 12, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[-0.31, 0.01, -0.02]} rotation={[0.1, -0.2, -0.1]} scale={[0.045, 0.13, 0.08]}>
        <capsuleGeometry args={[0.8, 1.0, 12, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* 9. Neck: Cylindrical cervical spine column */}
      <mesh position={[0, -0.42, -0.02]} scale={[0.85, 1, 0.9]}>
        <cylinderGeometry args={[0.13, 0.16, 0.30, 24]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* 10. Neck Muscles (Sternocleidomastoid bands & Laryngeal prominence) */}
      <mesh position={[0.09, -0.42, 0.04]} rotation={[0.2, 0.1, -0.3]} scale={[0.04, 0.28, 0.04]}>
        <cylinderGeometry args={[0.8, 0.9, 1, 12]} />
        <BodyMaterial color={color} opacity={0.65} />
      </mesh>
      <mesh position={[-0.09, -0.42, 0.04]} rotation={[0.2, -0.1, 0.3]} scale={[0.04, 0.28, 0.04]}>
        <cylinderGeometry args={[0.8, 0.9, 1, 12]} />
        <BodyMaterial color={color} opacity={0.65} />
      </mesh>
      {/* Thyroid prominence (Adam's apple) */}
      <mesh position={[0, -0.38, 0.12]} scale={[0.03, 0.04, 0.03]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} />
      </mesh>
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   DETAILED SKELETAL CAGE & SPINE
   Vertebral column, cervical/thoracic curve, and curved ribcage arches.
   —————————————————————————————————————————————————————————————————————————— */
function SkeletalCage({ isExplore }) {
  // Vertebrae discs along spine
  const vertebrae = useMemo(() => {
    const list = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const frac = i / (count - 1);
      // S-curve of natural human spine
      const y = 1.15 - frac * 1.5;
      const z = -0.04 + Math.sin(frac * Math.PI * 1.5) * 0.05;
      const radius = 0.055 - frac * 0.01;
      list.push({ y, z, radius, key: i });
    }
    return list;
  }, []);

  // Rib pairs
  const ribs = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const y = 0.72 - i * 0.075;
      const width = 0.32 + Math.sin((i / 6) * Math.PI) * 0.12;
      const depth = 0.24 + Math.sin((i / 6) * Math.PI) * 0.07;
      list.push({ y, width, depth, key: i });
    }
    return list;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Vertebrae column */}
      {vertebrae.map((v) => (
        <mesh key={`vert-${v.key}`} position={[0, v.y, v.z]}>
          <cylinderGeometry args={[v.radius, v.radius * 1.05, 0.04, 16]} />
          <BoneMaterial opacity={isExplore ? 0.65 : 0.45} />
        </mesh>
      ))}

      {/* Sternum / Breastbone */}
      <mesh position={[0, 0.52, 0.28]} scale={[0.05, 0.34, 0.025]}>
        <capsuleGeometry args={[0.5, 0.8, 8, 16]} />
        <BoneMaterial opacity={isExplore ? 0.6 : 0.4} />
      </mesh>

      {/* Ribs (curved thoracic hoops) */}
      {ribs.map((rib) => (
        <group key={`rib-${rib.key}`} position={[0, rib.y, 0.03]}>
          {/* Right rib arc */}
          <mesh position={[rib.width * 0.5, 0, 0]} rotation={[0.1, 0, -0.08]} scale={[rib.width * 0.52, 0.015, rib.depth]}>
            <torusGeometry args={[0.9, 0.18, 8, 24, Math.PI * 0.9]} />
            <BoneMaterial opacity={isExplore ? 0.45 : 0.3} />
          </mesh>
          {/* Left rib arc */}
          <mesh position={[-rib.width * 0.5, 0, 0]} rotation={[0.1, 0, 0.08]} scale={[rib.width * 0.52, 0.015, rib.depth]}>
            <torusGeometry args={[0.9, 0.18, 8, 24, Math.PI * 0.9]} />
            <BoneMaterial opacity={isExplore ? 0.45 : 0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   DETAILED ANATOMICAL TORSO
   Pectoralis major, clavicles, rectus abdominis, obliques, latissimus dorsi,
   iliac crest, and smooth gender morphing between male and female proportions.
   —————————————————————————————————————————————————————————————————————————— */
function DetailedTorso({ color, gender, isExplore }) {
  const chestRef = useRef();
  const leftShoulderRef = useRef();
  const rightShoulderRef = useRef();
  const femaleBustRef = useRef();
  const malePecsRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Natural human thoracic breathing motion (subtle expansion & elevation)
    const breathScaleZ = 1 + Math.sin(t * 1.5) * 0.025;
    const breathScaleX = 1 + Math.sin(t * 1.5) * 0.012;

    if (chestRef.current) {
      chestRef.current.scale.z = breathScaleZ;
      const targetBaseX = gender === 'male' ? 1.14 : 0.96;
      chestRef.current.scale.x = THREE.MathUtils.lerp(chestRef.current.scale.x, targetBaseX * breathScaleX, 0.06);
    }

    // Dynamic shoulder width morphing
    const targetShoulderX = gender === 'male' ? 0.56 : 0.44;
    if (leftShoulderRef.current && rightShoulderRef.current) {
      leftShoulderRef.current.position.x = THREE.MathUtils.lerp(leftShoulderRef.current.position.x, -targetShoulderX, 0.06);
      rightShoulderRef.current.position.x = THREE.MathUtils.lerp(rightShoulderRef.current.position.x, targetShoulderX, 0.06);
    }

    // Gender specific chest morphing
    if (femaleBustRef.current) {
      const targetBustScale = gender === 'female' ? 1 : 0.001;
      femaleBustRef.current.scale.setScalar(THREE.MathUtils.lerp(femaleBustRef.current.scale.x, targetBustScale, 0.08));
    }
    if (malePecsRef.current) {
      const targetPecScale = gender === 'male' ? 1 : 0.001;
      malePecsRef.current.scale.setScalar(THREE.MathUtils.lerp(malePecsRef.current.scale.x, targetPecScale, 0.08));
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Internal skeleton structure (spine, ribs, sternum) */}
      <SkeletalCage isExplore={isExplore} />

      {/* Clavicles (Left & Right S-curved Collarbones) */}
      <mesh position={[0.26, 0.90, 0.12]} rotation={[0.08, 0.25, -0.15]} scale={[0.24, 0.03, 0.03]}>
        <capsuleGeometry args={[0.5, 1.2, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[-0.26, 0.90, 0.12]} rotation={[0.08, -0.25, 0.15]} scale={[0.24, 0.03, 0.03]}>
        <capsuleGeometry args={[0.5, 1.2, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Upper Torso Core / Thorax */}
      <mesh ref={chestRef} position={[0, 0.52, 0]}>
        <capsuleGeometry args={[0.36, 0.48, 16, 32]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Latissimus Dorsi & Trapezius Flank Wings (Back & side V-taper) */}
      <mesh position={[0.34, 0.58, -0.06]} rotation={[0, 0, -0.25]} scale={[0.16, 0.44, 0.20]}>
        <capsuleGeometry args={[0.6, 1, 8, 16]} />
        <BodyMaterial color={color} opacity={0.7} />
      </mesh>
      <mesh position={[-0.34, 0.58, -0.06]} rotation={[0, 0, 0.25]} scale={[0.16, 0.44, 0.20]}>
        <capsuleGeometry args={[0.6, 1, 8, 16]} />
        <BodyMaterial color={color} opacity={0.7} />
      </mesh>

      {/* MALE PECTORAL PLATES (Athletic chest definition) */}
      <group ref={malePecsRef}>
        <mesh position={[0.18, 0.62, 0.20]} rotation={[0.12, 0.18, -0.08]} scale={[0.17, 0.13, 0.10]}>
          <capsuleGeometry args={[0.8, 0.8, 8, 16]} />
          <BodyMaterial color={color} />
        </mesh>
        <mesh position={[-0.18, 0.62, 0.20]} rotation={[0.12, -0.18, 0.08]} scale={[0.17, 0.13, 0.10]}>
          <capsuleGeometry args={[0.8, 0.8, 8, 16]} />
          <BodyMaterial color={color} />
        </mesh>
      </group>

      {/* FEMALE BUST CURVATURE (Anatomical soft contours) */}
      <group ref={femaleBustRef} scale={[0.001, 0.001, 0.001]}>
        <mesh position={[0.17, 0.58, 0.23]} rotation={[0.15, 0.1, -0.05]} scale={[0.18, 0.17, 0.18]}>
          <sphereGeometry args={[1, 32, 32]} />
          <BodyMaterial color={color} />
        </mesh>
        <mesh position={[-0.17, 0.58, 0.23]} rotation={[0.15, -0.1, 0.05]} scale={[0.18, 0.17, 0.18]}>
          <sphereGeometry args={[1, 32, 32]} />
          <BodyMaterial color={color} />
        </mesh>
      </group>

      {/* Midsection & Abdominal Wall (Rectus Abdominis / 6-pack contours) */}
      <mesh position={[0, 0.12, 0]} scale={[0.86, 0.9, 0.82]}>
        <capsuleGeometry args={[0.33, 0.40, 16, 32]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Sculpted Abdominal Segments (Upper, Mid, Lower) */}
      <group position={[0, 0.16, 0.24]}>
        {/* Upper abs */}
        <mesh position={[0.08, 0.12, 0]} scale={[0.07, 0.06, 0.035]}>
          <capsuleGeometry args={[0.7, 0.8, 8, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>
        <mesh position={[-0.08, 0.12, 0]} scale={[0.07, 0.06, 0.035]}>
          <capsuleGeometry args={[0.7, 0.8, 8, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>
        {/* Middle abs */}
        <mesh position={[0.08, -0.03, 0]} scale={[0.075, 0.065, 0.035]}>
          <capsuleGeometry args={[0.7, 0.8, 8, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>
        <mesh position={[-0.08, -0.03, 0]} scale={[0.075, 0.065, 0.035]}>
          <capsuleGeometry args={[0.7, 0.8, 8, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>
        {/* Lower abs */}
        <mesh position={[0.08, -0.18, -0.01]} scale={[0.07, 0.065, 0.03]}>
          <capsuleGeometry args={[0.7, 0.8, 8, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>
        <mesh position={[-0.08, -0.18, -0.01]} scale={[0.07, 0.065, 0.03]}>
          <capsuleGeometry args={[0.7, 0.8, 8, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>
      </group>

      {/* External Obliques (Waist Flank Curves) */}
      <mesh position={[0.27, 0.08, 0.04]} rotation={[0, 0, -0.15]} scale={[0.10, 0.32, 0.14]}>
        <capsuleGeometry args={[0.7, 0.9, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[-0.27, 0.08, 0.04]} rotation={[0, 0, 0.15]} scale={[0.10, 0.32, 0.14]}>
        <capsuleGeometry args={[0.7, 0.9, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Pelvis, Iliac Crest & Hips */}
      <mesh position={[0, -0.28, 0]} scale={[gender === 'female' ? 1.08 : 0.92, 0.82, 0.85]}>
        <capsuleGeometry args={[0.34, 0.28, 16, 24]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Iliac Crest Hip Ridges */}
      <mesh position={[0.29, -0.22, 0.05]} rotation={[0.2, 0, -0.3]} scale={[0.09, 0.24, 0.10]}>
        <capsuleGeometry args={[0.6, 0.8, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[-0.29, -0.22, 0.05]} rotation={[0.2, 0, 0.3]} scale={[0.09, 0.24, 0.10]}>
        <capsuleGeometry args={[0.6, 0.8, 8, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Gluteal Contours (Posterior) */}
      <mesh position={[0.14, -0.32, -0.15]} scale={[0.16, 0.19, 0.17]}>
        <sphereGeometry args={[1, 24, 24]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[-0.14, -0.32, -0.15]} scale={[0.16, 0.19, 0.17]}>
        <sphereGeometry args={[1, 24, 24]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Deltoid Shoulders Caps (Anterior, Lateral, Posterior 3-part cap) */}
      <mesh ref={rightShoulderRef} position={[0.48, 0.82, 0]} rotation={[0, 0, -0.2]} scale={[0.18, 0.15, 0.17]}>
        <sphereGeometry args={[1, 24, 24]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh ref={leftShoulderRef} position={[-0.48, 0.82, 0]} rotation={[0, 0, 0.2]} scale={[0.18, 0.15, 0.17]}>
        <sphereGeometry args={[1, 24, 24]} />
        <BodyMaterial color={color} />
      </mesh>
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   DETAILED ANATOMICAL ARMS & ARTICULATED HANDS
   Deltoid muscle, bicep/tricep curvature, elbow olecranon, contoured forearm,
   anatomical wrist, palm with thenar pad, and curled relaxed articulated fingers.
   —————————————————————————————————————————————————————————————————————————— */
function DetailedArm({ side, color, gender }) {
  const groupRef = useRef();
  const isLeft = side === 'left';
  const sign = isLeft ? -1 : 1;

  useFrame(() => {
    const targetX = gender === 'male' ? sign * 0.58 : sign * 0.48;
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.06);
    }
  });

  const initialX = isLeft ? -0.48 : 0.48;
  const rotZ = sign * -0.12;

  return (
    <group ref={groupRef} position={[initialX, 0.82, 0]} rotation={[0, 0, rotZ]}>
      {/* Upper Arm: Brachium with Biceps anterior & Triceps posterior bulge */}
      <mesh position={[0, -0.28, 0]} scale={[0.85, 1, 0.88]}>
        <capsuleGeometry args={[0.09, 0.38, 12, 24]} />
        <BodyMaterial color={color} />
      </mesh>
      {/* Biceps contour */}
      <mesh position={[sign * 0.015, -0.24, 0.04]} scale={[0.07, 0.16, 0.08]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} opacity={0.65} />
      </mesh>
      {/* Triceps contour */}
      <mesh position={[0, -0.26, -0.04]} scale={[0.07, 0.18, 0.07]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} opacity={0.65} />
      </mesh>

      {/* Elbow Joint (Olecranon bone on posterior, crease on anterior) */}
      <mesh position={[0, -0.52, 0]} scale={[0.085, 0.085, 0.085]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.52, -0.04]} scale={[0.035, 0.04, 0.03]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Forearm (Antebrachium): Brachioradialis taper into slender wrist */}
      <group position={[0, -0.54, 0]} rotation={[0.05, 0, sign * -0.05]}>
        <mesh position={[0, -0.24, 0]} scale={[1.0, 1, 0.85]}>
          <cylinderGeometry args={[0.08, 0.055, 0.42, 16]} />
          <BodyMaterial color={color} />
        </mesh>
        {/* Brachioradialis muscular curvature */}
        <mesh position={[sign * 0.035, -0.14, 0.02]} rotation={[0, 0, sign * -0.1]} scale={[0.055, 0.16, 0.06]}>
          <sphereGeometry args={[1, 16, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>

        {/* Wrist (Carpus): radius & ulna styloid notches */}
        <mesh position={[0, -0.48, 0]} scale={[0.058, 0.035, 0.042]}>
          <boxGeometry args={[1, 1, 1]} />
          <BodyMaterial color={color} />
        </mesh>

        {/* DETAILED ARTICULATED HAND (Palm, Thenar Pad, Thumb, and 4 Curled Fingers) */}
        <group position={[0, -0.53, 0]} rotation={[0.1, sign * 0.25, sign * 0.05]}>
          {/* Palm / Metacarpal core */}
          <mesh position={[0, -0.06, 0]} scale={[0.065, 0.09, 0.032]}>
            <capsuleGeometry args={[0.6, 0.8, 8, 16]} />
            <BodyMaterial color={color} />
          </mesh>

          {/* Thenar pad (Thumb muscle base) */}
          <mesh position={[sign * -0.028, -0.04, 0.015]} scale={[0.026, 0.045, 0.025]}>
            <sphereGeometry args={[1, 12, 12]} />
            <BodyMaterial color={color} />
          </mesh>

          {/* Thumb (2 segments angled in natural resting opposition) */}
          <group position={[sign * -0.038, -0.04, 0.015]} rotation={[0.2, sign * -0.4, sign * 0.35]}>
            <mesh position={[0, -0.025, 0]} scale={[0.018, 0.05, 0.018]}>
              <capsuleGeometry args={[0.6, 0.8, 8, 12]} />
              <BodyMaterial color={color} />
            </mesh>
            <mesh position={[0, -0.06, 0.008]} rotation={[0.3, 0, 0]} scale={[0.015, 0.04, 0.015]}>
              <capsuleGeometry args={[0.6, 0.8, 8, 12]} />
              <BodyMaterial color={color} />
            </mesh>
          </group>

          {/* 4 Articulated Fingers (Natural relaxed inward curl) */}
          {[
            { x: sign * -0.022, len: 0.080, rotX: 0.18, name: 'index' },
            { x: sign * -0.007, len: 0.088, rotX: 0.22, name: 'middle' },
            { x: sign * 0.008,  len: 0.082, rotX: 0.26, name: 'ring' },
            { x: sign * 0.022,  len: 0.068, rotX: 0.32, name: 'pinky' },
          ].map((f) => (
            <group key={f.name} position={[f.x, -0.11, 0]} rotation={[f.rotX, 0, sign * 0.04]}>
              {/* Proximal phalanx */}
              <mesh position={[0, -f.len * 0.3, 0]} scale={[0.014, f.len * 0.6, 0.014]}>
                <capsuleGeometry args={[0.6, 0.8, 6, 10]} />
                <BodyMaterial color={color} />
              </mesh>
              {/* Distal phalanx (curled inwards) */}
              <mesh position={[0, -f.len * 0.72, 0.01]} rotation={[0.35, 0, 0]} scale={[0.012, f.len * 0.5, 0.012]}>
                <capsuleGeometry args={[0.6, 0.8, 6, 10]} />
                <BodyMaterial color={color} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   DETAILED ANATOMICAL LEGS & FEET
   Muscular thighs (quadriceps with teardrop vastus medialis), defined patella
   kneecap, gastrocnemius (twin-bellied calves), shin crest, malleoli ankle
   bones, and grounded anatomical feet with heel, arch, instep, and toes.
   —————————————————————————————————————————————————————————————————————————— */
function DetailedLeg({ side, color, gender }) {
  const isLeft = side === 'left';
  const sign = isLeft ? -1 : 1;
  const legX = sign * (gender === 'female' ? 0.22 : 0.20);

  return (
    <group position={[legX, -0.45, 0]}>
      {/* Greater Trochanter Hip Transition */}
      <mesh position={[sign * 0.08, 0, 0]} scale={[0.13, 0.16, 0.14]}>
        <sphereGeometry args={[1, 16, 16]} />
        <BodyMaterial color={color} />
      </mesh>

      {/* Thigh (Femur): Quadriceps Musculature */}
      <group position={[0, -0.32, 0]}>
        {/* Core thigh column */}
        <mesh scale={[0.9, 1, 0.95]}>
          <capsuleGeometry args={[0.145, 0.44, 16, 24]} />
          <BodyMaterial color={color} />
        </mesh>
        {/* Vastus Lateralis (Outer thigh muscular sweep) */}
        <mesh position={[sign * 0.07, 0.04, 0.02]} rotation={[0, 0, sign * -0.1]} scale={[0.09, 0.24, 0.10]}>
          <capsuleGeometry args={[0.7, 0.8, 8, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>
        {/* Vastus Medialis (Inner teardrop muscle above knee) */}
        <mesh position={[sign * -0.06, -0.16, 0.05]} rotation={[0, 0, sign * 0.12]} scale={[0.085, 0.14, 0.09]}>
          <sphereGeometry args={[1, 16, 16]} />
          <BodyMaterial color={color} />
        </mesh>
        {/* Rectus Femoris (Anterior center crest) */}
        <mesh position={[0, 0.02, 0.07]} scale={[0.08, 0.26, 0.06]}>
          <capsuleGeometry args={[0.7, 0.9, 8, 16]} />
          <BodyMaterial color={color} opacity={0.65} />
        </mesh>
        {/* Hamstrings (Posterior muscle mass) */}
        <mesh position={[0, 0, -0.06]} scale={[0.11, 0.26, 0.09]}>
          <capsuleGeometry args={[0.8, 0.8, 8, 16]} />
          <BodyMaterial color={color} opacity={0.7} />
        </mesh>
      </group>

      {/* Knee Joint: Patella (Kneecap), Tendon, & Condyles */}
      <group position={[0, -0.72, 0]}>
        {/* Knee joint core */}
        <mesh scale={[0.11, 0.10, 0.11]}>
          <sphereGeometry args={[1, 16, 16]} />
          <BodyMaterial color={color} />
        </mesh>
        {/* Sculpted Patella kneecap */}
        <mesh position={[0, 0.01, 0.08]} scale={[0.062, 0.075, 0.035]}>
          <sphereGeometry args={[1, 16, 16]} />
          <BodyMaterial color={color} />
        </mesh>
        {/* Patellar tendon band down to tibia */}
        <mesh position={[0, -0.08, 0.07]} scale={[0.03, 0.09, 0.02]}>
          <boxGeometry args={[1, 1, 1]} />
          <BodyMaterial color={color} />
        </mesh>
      </group>

      {/* Lower Leg (Crus): Gastrocnemius Calves, Tibial Shin Crest, & Achilles */}
      <group position={[0, -1.18, 0]}>
        {/* Shin core column */}
        <mesh scale={[0.85, 1, 0.85]}>
          <cylinderGeometry args={[0.095, 0.065, 0.58, 16]} />
          <BodyMaterial color={color} />
        </mesh>
        {/* Tibial crest (sharp anterior shin ridge) */}
        <mesh position={[0, 0.04, 0.06]} scale={[0.022, 0.44, 0.025]}>
          <capsuleGeometry args={[0.6, 0.8, 6, 12]} />
          <BodyMaterial color={color} />
        </mesh>
        {/* Gastrocnemius Calf Muscles (Medial and Lateral twin bellies) */}
        <mesh position={[sign * -0.035, 0.12, -0.05]} scale={[0.065, 0.18, 0.075]}>
          <sphereGeometry args={[1, 16, 16]} />
          <BodyMaterial color={color} />
        </mesh>
        <mesh position={[sign * 0.035, 0.14, -0.05]} scale={[0.065, 0.18, 0.075]}>
          <sphereGeometry args={[1, 16, 16]} />
          <BodyMaterial color={color} />
        </mesh>
        {/* Achilles Tendon tapering into heel */}
        <mesh position={[0, -0.16, -0.045]} scale={[0.028, 0.22, 0.032]}>
          <cylinderGeometry args={[0.7, 0.9, 1, 12]} />
          <BodyMaterial color={color} />
        </mesh>

        {/* Ankle Joint & Malleoli (Inner malleolus higher, outer lower) */}
        <group position={[0, -0.32, 0]}>
          <mesh scale={[0.065, 0.045, 0.06]}>
            <sphereGeometry args={[1, 16, 16]} />
            <BodyMaterial color={color} />
          </mesh>
          {/* Medial Malleolus (inner ankle bone, slightly higher) */}
          <mesh position={[sign * -0.055, 0.015, 0]} scale={[0.025, 0.03, 0.025]}>
            <sphereGeometry args={[1, 12, 12]} />
            <BodyMaterial color={color} />
          </mesh>
          {/* Lateral Malleolus (outer ankle bone, slightly lower) */}
          <mesh position={[sign * 0.055, -0.015, 0]} scale={[0.025, 0.03, 0.025]}>
            <sphereGeometry args={[1, 12, 12]} />
            <BodyMaterial color={color} />
          </mesh>
        </group>

        {/* DETAILED GROUNDED FOOT (Heel, Arch, Instep, and Toes) */}
        <group position={[0, -0.36, 0.05]}>
          {/* Calcaneus (Heel bone) */}
          <mesh position={[0, 0, -0.08]} scale={[0.052, 0.055, 0.08]}>
            <sphereGeometry args={[1, 16, 16]} />
            <BodyMaterial color={color} />
          </mesh>
          {/* Medial Plantar Arch & Instep (Midfoot) */}
          <mesh position={[0, 0.01, 0.03]} rotation={[-0.2, 0, 0]} scale={[0.062, 0.048, 0.14]}>
            <boxGeometry args={[1, 1, 1]} />
            <BodyMaterial color={color} />
          </mesh>
          {/* Forefoot Ball / Metatarsal Pad */}
          <mesh position={[0, -0.015, 0.12]} scale={[0.075, 0.035, 0.07]}>
            <boxGeometry args={[1, 1, 1]} />
            <BodyMaterial color={color} />
          </mesh>
          {/* Great Toe (Hallux) */}
          <mesh position={[sign * -0.024, -0.018, 0.18]} scale={[0.018, 0.022, 0.042]}>
            <capsuleGeometry args={[0.7, 0.8, 6, 12]} />
            <BodyMaterial color={color} />
          </mesh>
          {/* Lesser Toes bundle */}
          <mesh position={[sign * 0.015, -0.018, 0.17]} scale={[0.044, 0.020, 0.038]}>
            <capsuleGeometry args={[0.7, 0.8, 6, 12]} />
            <BodyMaterial color={color} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   DETAILED ANATOMICAL ORGANS
   - Brain: Left & right cerebral hemispheres, gyri/sulci convolutions,
     cerebellum, brainstem, and synaptic firing nodes.
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
      // Cluster around the cerebral cortex
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.65;
      const r = 0.22 + Math.random() * 0.04;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = 1.56 + r * Math.cos(phi) * 0.8;
      pos[i * 3 + 2] = -0.02 + r * Math.sin(phi) * Math.sin(theta);
    }
    return { synapsePositions: pos };
  }, []);

  // Airway tree branching segments
  const airwayBranches = useMemo(() => {
    return [
      // Primary bronchi
      { start: [0, 0.62, 0.08], end: [0.09, 0.54, 0.06], r: 0.016 },
      { start: [0, 0.62, 0.08], end: [-0.09, 0.54, 0.06], r: 0.016 },
      // Secondary lobar branches
      { start: [0.09, 0.54, 0.06], end: [0.16, 0.58, 0.04], r: 0.011 },
      { start: [0.09, 0.54, 0.06], end: [0.18, 0.48, 0.05], r: 0.011 },
      { start: [0.09, 0.54, 0.06], end: [0.14, 0.38, 0.03], r: 0.010 },
      { start: [-0.09, 0.54, 0.06], end: [-0.16, 0.56, 0.04], r: 0.011 },
      { start: [-0.09, 0.54, 0.06], end: [-0.17, 0.42, 0.04], r: 0.011 },
    ];
  }, []);

  const materials = useMemo(() => ({
    brain: new THREE.MeshPhysicalMaterial({
      color: '#ff2d87',
      emissive: '#d60062',
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.1,
      transmission: 0.6,
      thickness: 1.2,
      transparent: true,
      opacity: 0,
    }),
    cerebellum: new THREE.MeshStandardMaterial({
      color: '#e62e78',
      emissive: '#b0004e',
      emissiveIntensity: 0.35,
      roughness: 0.35,
      transparent: true,
      opacity: 0,
    }),
    heart: new THREE.MeshPhysicalMaterial({
      color: '#ff1447',
      emissive: '#c7002e',
      emissiveIntensity: 0.55,
      roughness: 0.22,
      metalness: 0.15,
      transmission: 0.5,
      thickness: 1.4,
      transparent: true,
      opacity: 0,
    }),
    aorta: new THREE.MeshStandardMaterial({
      color: '#ff3366',
      emissive: '#d10038',
      emissiveIntensity: 0.5,
      roughness: 0.3,
      transparent: true,
      opacity: 0,
    }),
    lungs: new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.1,
      transmission: 0.65,
      thickness: 1.5,
      transparent: true,
      opacity: 0,
    }),
    bronchi: new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      emissive: '#38bdf8',
      emissiveIntensity: 0.6,
      roughness: 0.2,
      transparent: true,
      opacity: 0,
    }),
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Smooth organ opacity transitions
    const targetBrainOp = isBrain ? 0.92 : 0.08;
    const targetHeartOp = isHeart ? 0.95 : 0.12;
    const targetLungsOp = isLungs ? 0.88 : 0.10;

    materials.brain.opacity = THREE.MathUtils.lerp(materials.brain.opacity, targetBrainOp, 0.06);
    materials.cerebellum.opacity = THREE.MathUtils.lerp(materials.cerebellum.opacity, targetBrainOp * 0.9, 0.06);
    materials.heart.opacity = THREE.MathUtils.lerp(materials.heart.opacity, targetHeartOp, 0.06);
    materials.aorta.opacity = THREE.MathUtils.lerp(materials.aorta.opacity, targetHeartOp, 0.06);
    materials.lungs.opacity = THREE.MathUtils.lerp(materials.lungs.opacity, targetLungsOp, 0.06);
    materials.bronchi.opacity = THREE.MathUtils.lerp(materials.bronchi.opacity, targetLungsOp, 0.06);

    // Realistic cardiac cycle: "lub-dub" double pump rhythm (~72 bpm)
    if (heartGroupRef.current) {
      const beatCycle = (t * 1.25) % 1.0;
      let pulse = 0;
      if (beatCycle < 0.15) {
        pulse = Math.sin((beatCycle / 0.15) * Math.PI) * 0.08; // Atrial systole (lub)
      } else if (beatCycle >= 0.22 && beatCycle < 0.42) {
        pulse = Math.sin(((beatCycle - 0.22) / 0.20) * Math.PI) * 0.14; // Ventricular systole (dub)
      }
      heartGroupRef.current.scale.setScalar(1 + pulse);
      materials.heart.emissiveIntensity = 0.4 + pulse * 1.5;
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
      {/* ================================================================
          1. DETAILED ANATOMICAL BRAIN & CEREBRAL CORTEX
          ================================================================ */}
      <group
        ref={brainGroupRef}
        position={[0, 1.56, -0.02]}
        onClick={(e) => {
          e.stopPropagation();
          onHotspotClick?.('neurological');
        }}
      >
        {/* Left Cerebral Hemisphere */}
        <mesh material={materials.brain} position={[-0.085, 0.02, 0]} scale={[0.78, 0.95, 1.1]}>
          <sphereGeometry args={[0.22, 32, 32]} />
        </mesh>
        {/* Right Cerebral Hemisphere */}
        <mesh material={materials.brain} position={[0.085, 0.02, 0]} scale={[0.78, 0.95, 1.1]}>
          <sphereGeometry args={[0.22, 32, 32]} />
        </mesh>

        {/* Cortical Gyri Fold Accents (Frontal, Parietal, Temporal lobes) */}
        <mesh material={materials.brain} position={[-0.10, 0.08, 0.10]} scale={[0.08, 0.06, 0.08]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>
        <mesh material={materials.brain} position={[0.10, 0.08, 0.10]} scale={[0.08, 0.06, 0.08]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>
        <mesh material={materials.brain} position={[-0.14, -0.04, 0.02]} scale={[0.07, 0.08, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>
        <mesh material={materials.brain} position={[0.14, -0.04, 0.02]} scale={[0.07, 0.08, 0.12]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>

        {/* Cerebellum (Horizontal striation lobes at posterior skull base) */}
        <mesh material={materials.cerebellum} position={[-0.07, -0.12, -0.11]} scale={[0.10, 0.08, 0.09]}>
          <sphereGeometry args={[1, 24, 24]} />
        </mesh>
        <mesh material={materials.cerebellum} position={[0.07, -0.12, -0.11]} scale={[0.10, 0.08, 0.09]}>
          <sphereGeometry args={[1, 24, 24]} />
        </mesh>

        {/* Brainstem (Pons & Medulla Oblongata) */}
        <mesh material={materials.cerebellum} position={[0, -0.18, -0.04]} scale={[0.05, 0.14, 0.05]}>
          <cylinderGeometry args={[0.7, 0.9, 1, 16]} />
        </mesh>

        {/* Parkinson's Substantia Nigra Core Highlight */}
        {activeCondition === 'parkinsons' && (
          <mesh position={[0, -0.06, -0.02]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={1.2}
              transparent
              opacity={0.85}
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
            opacity={isBrain ? 0.9 : 0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* ================================================================
          2. DETAILED ANATOMICAL HEART & ASCENDING AORTA
          ================================================================ */}
      <group
        ref={heartGroupRef}
        position={[0.07, 0.54, 0.08]}
        rotation={[0.18, 0.15, -0.32]}
        onClick={(e) => {
          e.stopPropagation();
          onHotspotClick?.('cardiovascular');
        }}
      >
        {/* Left Ventricle (apex pointing downward & forward) */}
        <mesh material={materials.heart} position={[-0.04, -0.06, 0.02]} rotation={[0, 0, 0.25]} scale={[0.11, 0.18, 0.12]}>
          <capsuleGeometry args={[0.6, 0.7, 12, 16]} />
        </mesh>
        {/* Right Ventricle */}
        <mesh material={materials.heart} position={[0.05, -0.03, 0.03]} scale={[0.095, 0.15, 0.10]}>
          <capsuleGeometry args={[0.6, 0.7, 12, 16]} />
        </mesh>
        {/* Left & Right Atria */}
        <mesh material={materials.heart} position={[-0.03, 0.07, -0.02]} scale={[0.09, 0.09, 0.09]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>
        <mesh material={materials.heart} position={[0.06, 0.06, -0.01]} scale={[0.085, 0.085, 0.085]}>
          <sphereGeometry args={[1, 16, 16]} />
        </mesh>

        {/* Ascending Aorta Arch */}
        <mesh
          material={materials.aorta}
          position={[0.02, 0.13, 0]}
          rotation={[0, 0, Math.PI * 0.45]}
          scale={[0.10, 0.038, 0.038]}
        >
          <torusGeometry args={[0.8, 0.35, 12, 24, Math.PI * 0.85]} />
        </mesh>
        {/* 3 Brachiocephalic / Carotid Arterial Branches */}
        <mesh material={materials.aorta} position={[0.04, 0.21, 0]} scale={[0.012, 0.06, 0.012]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
        </mesh>
        <mesh material={materials.aorta} position={[0.01, 0.22, 0]} scale={[0.011, 0.065, 0.011]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
        </mesh>
        <mesh material={materials.aorta} position={[-0.02, 0.21, 0]} scale={[0.011, 0.06, 0.011]}>
          <cylinderGeometry args={[1, 1, 1, 8]} />
        </mesh>

        {/* Pulmonary Trunk */}
        <mesh material={materials.aorta} position={[0.01, 0.08, 0.07]} rotation={[0.4, 0, -0.2]} scale={[0.035, 0.08, 0.035]}>
          <cylinderGeometry args={[0.9, 1, 1, 12]} />
        </mesh>
      </group>

      {/* ================================================================
          3. DETAILED ANATOMICAL LUNGS & BRONCHIAL TREE
          ================================================================ */}
      <group
        ref={lungsGroupRef}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onHotspotClick?.('asthma');
        }}
      >
        {/* Trachea with cartilage ring texture */}
        <mesh material={materials.bronchi} position={[0, 0.78, 0.08]} scale={[0.032, 0.24, 0.032]}>
          <cylinderGeometry args={[0.9, 0.9, 1, 16]} />
        </mesh>

        {/* Bronchial Tree Branches */}
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
                emissiveIntensity={isLungs ? 0.9 : 0.4}
                transparent
                opacity={isLungs ? 0.85 : 0.2}
              />
            </mesh>
          );
        })}

        {/* RIGHT LUNG (3 Anatomical Lobes: Superior, Middle, Inferior) */}
        <group position={[0.19, 0.50, 0.02]}>
          {/* Superior lobe */}
          <mesh material={materials.lungs} position={[0, 0.12, 0]} scale={[0.11, 0.16, 0.14]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
          {/* Middle lobe */}
          <mesh material={materials.lungs} position={[0.02, 0.0, 0.02]} scale={[0.10, 0.12, 0.13]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
          {/* Inferior / Diaphragmatic lobe */}
          <mesh material={materials.lungs} position={[0, -0.12, -0.01]} scale={[0.11, 0.16, 0.15]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
        </group>

        {/* LEFT LUNG (2 Anatomical Lobes with Cardiac Notch for the heart) */}
        <group position={[-0.19, 0.50, 0.02]}>
          {/* Superior lobe */}
          <mesh material={materials.lungs} position={[0, 0.11, 0]} scale={[0.10, 0.18, 0.13]}>
            <capsuleGeometry args={[0.6, 0.7, 12, 20]} />
          </mesh>
          {/* Inferior lobe (indented for cardiac notch) */}
          <mesh material={materials.lungs} position={[-0.01, -0.11, -0.01]} scale={[0.10, 0.17, 0.14]}>
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
    { id: 'neurological', pos: [0, 1.56, 0.28], label: 'Brain / Cortex' },
    { id: 'cardiovascular', pos: [0.10, 0.54, 0.28], label: 'Cardiovascular' },
    { id: 'asthma', pos: [-0.18, 0.50, 0.26], label: 'Respiratory / Lungs' },
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
            {/* Outer pulsating ring */}
            <mesh>
              <ringGeometry args={[0.045, 0.055, 32]} />
              <meshBasicMaterial
                color={isActive ? '#38bdf8' : '#a4b8f7'}
                transparent
                opacity={isActive ? 0.9 : 0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Center glowing bead */}
            <mesh>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshStandardMaterial
                color={isActive ? '#38bdf8' : '#ffffff'}
                emissive={isActive ? '#0284c7' : '#4A6CF7'}
                emissiveIntensity={1.2}
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
   Soft bio-atmospheric particles floating around the scene.
   —————————————————————————————————————————————————————————————————————————— */
function AmbientParticles({ count = 100 }) {
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
        color="#a4b8f7"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ——————————————————————————————————————————————————————————————————————————
   SMOOTH CINEMATIC CAMERA FLIGHT RIG
   Responsive interpolation to focus accurately on organs or full figure overview.
   —————————————————————————————————————————————————————————————————————————— */
function CameraRig({ activeCondition, isExplore }) {
  const { camera, size } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const lookAtTarget = useRef(new THREE.Vector3(0, -0.2, 0));
  const posTarget = useRef(new THREE.Vector3(0, -0.2, 7.8));

  const CONDITION_VIEWS = {
    hero: { target: [0, -0.2, 0], pos: [0, -0.2, 7.8] },
    explore: { target: [-0.35, -0.2, 0], pos: [-0.35, -0.2, 7.2] },
    asthma: { target: [0, 0.45, 0.1], pos: [-0.2, 0.45, 2.0] },
    cardiovascular: { target: [0.18, 0.55, 0.1], pos: [0.1, 0.55, 1.8] },
    neurological: { target: [0, 1.55, 0.1], pos: [0, 1.55, 1.5] },
    'post-stroke': { target: [0.22, 1.42, 0.1], pos: [0.1, 1.42, 1.5] },
    parkinsons: { target: [-0.18, 1.48, 0.1], pos: [-0.1, 1.48, 1.5] },
    depression: { target: [0, 1.7, 0.1], pos: [0, 1.7, 1.5] },
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
   MAIN 3D HUMAN SCENE
   Lighting, studio environment, floating figure with detailed anatomy,
   ground contact shadow, and subtle breathing rotation.
   —————————————————————————————————————————————————————————————————————————— */
function HumanBodyScene({ activeCondition, onHotspotClick, gender, isExplore }) {
  const bodyColor = '#b8ccff';
  const groupRef = useRef();

  // Subtle ambient posture sway
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.07;
    }
  });

  return (
    <>
      {/* Studio medical illumination */}
      <ambientLight intensity={0.5} color="#e6edff" />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#f0f4ff" castShadow />
      <directionalLight position={[-5, 4, 3]} intensity={0.7} color="#a5b4fc" />
      <pointLight position={[0, 2, 4]} intensity={0.8} color="#818cf8" distance={10} />
      <pointLight position={[2, -1, 3]} intensity={0.4} color="#c084fc" distance={8} />

      {/* Rim backlight for muscle silhouette edge radiance */}
      <spotLight
        position={[0, 4, -3]}
        angle={0.6}
        penumbra={0.9}
        intensity={1.1}
        color="#38bdf8"
      />
      {/* Internal thoracic glow for organ transparency */}
      <pointLight position={[0, 0.5, 0]} intensity={isExplore ? 0.6 : 0.25} color="#60a5fa" distance={3} />

      <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.22}>
        <group ref={groupRef} position={[0, 0, 0]}>
          {/* Anatomical Head with facial features & neck tendons */}
          <DetailedHead color={bodyColor} />

          {/* Anatomical Torso with clavicles, ribcage, abs, & gender contours */}
          <DetailedTorso color={bodyColor} gender={gender} isExplore={isExplore} />

          {/* Articulated Arms & Hands with fingers */}
          <DetailedArm side="left" color={bodyColor} gender={gender} />
          <DetailedArm side="right" color={bodyColor} gender={gender} />

          {/* Muscular Legs & Grounded Feet */}
          <DetailedLeg side="left" color={bodyColor} gender={gender} />
          <DetailedLeg side="right" color={bodyColor} gender={gender} />

          {/* Detailed Internal Organs (Brain, Heart, Lungs, Bronchi) */}
          <DetailedInternalOrgans activeCondition={activeCondition} onHotspotClick={onHotspotClick} />

          {/* Interactive Hotspot Targets */}
          <InteractiveHotspots
            activeCondition={activeCondition}
            onHotspotClick={onHotspotClick}
            isExplore={isExplore}
          />
        </group>
      </Float>

      {/* Realistic contact shadow beneath feet */}
      <ContactShadows
        position={[0, -2.35, 0]}
        opacity={0.32}
        scale={6.5}
        blur={2.4}
        far={4.5}
        color="#3b82f6"
      />

      <AmbientParticles count={90} />
      <CameraRig activeCondition={activeCondition} isExplore={isExplore} />
      <Environment preset="city" environmentIntensity={0.7} />
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
      {/* Radial bioluminescent glow backdrop */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '72%',
          height: '72%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(74,108,247,0.16) 0%, rgba(139,92,246,0.08) 42%, transparent 70%)',
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
            transition: 'opacity 1s cubic-bezier(0.4,0,0.2,1)',
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
        /* Fallback silhouette if WebGL is unavailable */
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
