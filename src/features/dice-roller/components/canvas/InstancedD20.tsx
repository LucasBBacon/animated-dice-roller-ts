import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useDiceStore } from "../../store/useDiceStore";
import { useDiceNormals } from "../../hooks/useDiceNormals";
import { calculateFermatDistribution } from "../../utils/layout";

interface DieAnimationState {
  startQuat: THREE.Quaternion;
  targetQuat: THREE.Quaternion;
  targetPos: THREE.Vector3;
  initialSpin: THREE.Vector3;
  startTime: number;
}

const ANIMATION_DURATION = 1.5; // Seconds
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export const InstancedD20: React.FC = () => {
  const currentRolls = useDiceStore((state) => state.currentRolls);
  const completeRoll = useDiceStore((state) => state.completeRoll);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const animationData = useRef<DieAnimationState[]>([]);
  const isAnimating = useRef(false);

  // 1. Asset Extraction
  const { nodes, materials } = useGLTF("/models/D20.glb");
  const normals = useDiceNormals("/models/D20.glb");

  // Safely extract the raw geometry and material buffers
  const geometry = (nodes.DieMesh as THREE.Mesh)?.geometry;
  const material = materials.DieMat as THREE.Material;
  const dieMaterial = useMemo(
    () => (material ? material.clone() : null),
    [material],
  );

  useEffect(() => {
    return () => {
      dieMaterial?.dispose();
    };
  }, [dieMaterial]);

  // 2. Trajectory Initialization
  useEffect(() => {
    if (currentRolls.length === 0) return;

    const now = performance.now();
    isAnimating.current = true;

    animationData.current = currentRolls.map((rollValue, index) => {
      // Calculate target orientation based on extracted normals
      const targetNormal = normals[rollValue] || WORLD_UP;
      const baseAlignment = new THREE.Quaternion().setFromUnitVectors(
        targetNormal,
        WORLD_UP,
      );

      // Apply random Y-axis yaw so the "20" doesn't always face the exact same direction
      const randomYaw = new THREE.Quaternion().setFromAxisAngle(
        WORLD_UP,
        Math.random() * Math.PI * 2,
      );
      const targetQuat = randomYaw.multiply(baseAlignment);

      return {
        targetQuat,
        targetPos: calculateFermatDistribution(index),
        // Stagger the drops by 50ms per die
        startTime: now + index * 50,
        // Start completely randomized
        startQuat: new THREE.Quaternion().random(),
        // Massive initial spin that will zero out to identity (0,0,0)
        initialSpin: new THREE.Vector3(
          (Math.random() * 4 + 4) * Math.PI * 2,
          (Math.random() * 4 + 4) * Math.PI * 2,
          (Math.random() * 4 + 4) * Math.PI * 2,
        ),
      };
    });
  }, [currentRolls, normals]);

  // 3. Matrix Composition Loop
  useFrame(() => {
    if (
      !isAnimating.current ||
      !meshRef.current ||
      animationData.current.length === 0
    )
      return;

    let allFinished = true;
    let needsMatrixUpdate = false;
    const now = performance.now();

    for (let i = 0; i < currentRolls.length; i++) {
      const data = animationData.current[i];
      const elapsed = (now - data.startTime) / 1000;

      // Skip this frame if the stagger delay hasn't finished
      if (elapsed < 0) {
        allFinished = false;
        continue;
      }

      const t = Math.min(elapsed / ANIMATION_DURATION, 1.0);
      if (t < 1.0) {
        allFinished = false;
        needsMatrixUpdate = true;
      }

      // Cubic ease out (1 - (1 - t)^3)
      const easeOut = 1 - Math.pow(1 - t, 3);

      // --- Position Calculation ---
      // Start slightly elevated and drop into their layout positions
      const startHeight = 10;
      const currentY = THREE.MathUtils.lerp(
        startHeight,
        data.targetPos.y,
        easeOut,
      );
      // Optional: add a sine wave bounce
      const bounce = Math.sin(easeOut * Math.PI) * 3;

      dummy.position.set(
        THREE.MathUtils.lerp(0, data.targetPos.x, easeOut),
        currentY + bounce,
        THREE.MathUtils.lerp(0, data.targetPos.z, easeOut),
      );

      // --- Rotation Calculation ---
      // 1. Tumble: Chaos resolving to Identity
      const tumbleEuler = new THREE.Euler(
        THREE.MathUtils.lerp(data.initialSpin.x, 0, easeOut),
        THREE.MathUtils.lerp(data.initialSpin.y, 0, easeOut),
        THREE.MathUtils.lerp(data.initialSpin.z, 0, easeOut),
      );
      const tumbleQuat = new THREE.Quaternion().setFromEuler(tumbleEuler);

      // 2. Alignment: Start resolving to Target Face
      const alignmentQuat = new THREE.Quaternion().copy(data.startQuat);
      alignmentQuat.slerp(data.targetQuat, easeOut);

      // 3. Composite
      dummy.quaternion.copy(tumbleQuat).multiply(alignmentQuat);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    if (needsMatrixUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (allFinished) {
      isAnimating.current = false;
      completeRoll();
    }
  });

  // Guard clause against missing assets
  if (!geometry || !material || !dieMaterial) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, dieMaterial, currentRolls.length]}
      // Set the count dynamically so Three.js ignores any unused buffer slots
      count={currentRolls.length}
      castShadow
      receiveShadow
    />
  );
};
