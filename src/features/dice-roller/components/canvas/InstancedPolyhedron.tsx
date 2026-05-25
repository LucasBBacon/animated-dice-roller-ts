/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import * as THREE from "three";
import { useDiceStore, type DieType } from "../../store/useDiceStore";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useDiceNormals } from "../../hooks/useDiceNormals";
import { calculateFermatDistribution } from "../../utils/layout";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";

interface Props {
  type: DieType;
}

const ANIMATION_DURATION = 1.5; // Seconds

export const InstancedPolyhedron: React.FC<Props> = ({ type }) => {
  const rolls = useDiceStore(
    useShallow((state) => state.currentRolls.filter((r) => r.type === type)),
  );
  const completeRoll = useDiceStore((state) => state.completeRoll);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const animationData = useRef<any[]>([]);
  const isAnimating = useRef(false);

  const { timeScale } = useControls({
    timeScale: { value: 1.0, min: 0.1, max: 2.0 },
    showLayout: false,
  });

  // dynamically load the correct asset based on the type prop
  const modelPath = `/models/${type.toUpperCase()}.glb`;
  const { nodes, materials } = useGLTF(modelPath);
  const normals = useDiceNormals(modelPath);

  const geometry = (nodes.DieMesh as THREE.Mesh)?.geometry;
  const material = materials.DieMat as THREE.Material;
  const dieMaterial = useMemo(
    () => (material ? material.clone() : null),
    [material],
  );

  // 1. Log the payload when R3F receives it
  useEffect(() => {
    if (rolls.length > 0) {
      console.log(`[WebGL] Received new roll array: [${rolls.join(", ")}]`);
    }
  }, [rolls]);

  // 2. Log when the normal extraction runs (should only happen ONCE)
  useEffect(() => {
    console.log(
      `[WebGL] Loaded ${Object.keys(normals).length} face normals from GLTF.`,
    );
  }, [normals]);

  useEffect(() => {
    if (rolls.length === 0) return;

    const now = performance.now();
    isAnimating.current = true;

    animationData.current = rolls.map((roll) => {
      const targetNormal = normals[roll.value] || new THREE.Vector3(0, 1, 0);
      const baseAlignment = new THREE.Quaternion().setFromUnitVectors(
        targetNormal,
        new THREE.Vector3(0, 1, 0),
      );
      const targetQuat = new THREE.Quaternion()
        .setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          Math.random() * Math.PI * 2,
        )
        .multiply(baseAlignment);

      return {
        targetQuat,
        targetPos: calculateFermatDistribution(roll.globalIndex),
        startTime: now + roll.globalIndex * 50,
        startQuat: new THREE.Quaternion().random(),
        initialSpin: new THREE.Vector3(
          (Math.random() * 4 + 4) * Math.PI * 2,
          (Math.random() * 4 + 4) * Math.PI * 2,
          (Math.random() * 4 + 4) * Math.PI * 2,
        ),
      };
    });
  }, [rolls, normals]);

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

    for (let i = 0; i < rolls.length; i++) {
      const data = animationData.current[i];
      const elapsed = ((now - data.startTime) / 1000) * timeScale;

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
  if (!geometry || !material || !dieMaterial || rolls.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, dieMaterial, rolls.length]}
      // Set the count dynamically so Three.js ignores any unused buffer slots
      count={rolls.length}
      castShadow
      receiveShadow
    />
  );
};

["d4", "d6", "d8", "d10", "d12", "d20"].forEach((type) => {
  useGLTF.preload(`/models/${type.toUpperCase()}.glb`);
});
