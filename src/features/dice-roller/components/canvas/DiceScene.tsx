import React, { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, Stats } from "@react-three/drei";
import { useDiceStore, type DieType } from "../../store/useDiceStore";
import { InstancedPolyhedron } from "./InstancedPolyhedron";

const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];

const RollLifecycleWatcher: React.FC = () => {
  const currentRolls = useDiceStore((state) => state.currentRolls);
  const completeRoll = useDiceStore((state) => state.completeRoll);
  const isRolling = useDiceStore((state) => state.isRolling);

  useEffect(() => {
    if (isRolling && currentRolls.length > 0) {
      // calculate how long the entire set should take to animate
      // base duration (1500ms) + (max global index * 50ms stagger)
      const maxStagger = (currentRolls.length - 1) * 50;
      const totalDuration = 1500 + maxStagger;

      const timer = setTimeout(() => {
        completeRoll();
      }, totalDuration);

      return () => clearTimeout(timer);
    }
  }, [isRolling, currentRolls, completeRoll]);

  return null;
};

export const DiceScene: React.FC = () => {
  return (
    // The CSS class strictly controls the bounds of the WebGL context
    // e.g., max-width: 600px; aspect-ratio: 1/1; margin: 0 auto;
    <div
      className="dice-tray-container"
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas shadows="percentage" dpr={[1, 2]}>
        <RollLifecycleWatcher />
        <Stats />

        {/* 
          Orthographic camera positioned high on the Y axis, looking straight down.
          The zoom prop dictates how much of the logical scene fits in the CSS container.
        */}
        <OrthographicCamera
          makeDefault
          position={[0, 50, 0]}
          zoom={40}
          rotation={[-Math.PI / 2, 0, 0]}
          near={0.1}
          far={100}
        />

        {/* 
          Lighting Setup: 
          Ambient provides the base fill, Directional acts as the "sun" casting shadows.
        */}
        <hemisphereLight
          color="#f4efe6"
          groundColor="#1e1b28"
          intensity={0.7}
        />
        <ambientLight intensity={0.25} />
        <directionalLight
          castShadow
          position={[12, 22, 8]}
          intensity={1.8}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.04}
        >
          {/* Tightly bound the shadow camera to the tray size to maximize shadow resolution */}
          <orthographicCamera
            attach="shadow-camera"
            args={[-15, 15, 15, -15, 0.1, 50]}
          />
        </directionalLight>

        <Suspense fallback={null}>
          {DIE_TYPES.map((type) => (
            <InstancedPolyhedron key={type} type={type} />
          ))}
        </Suspense>

        {/* 
          The Tray Floor: 
          An invisible plane that only renders shadows. This allows your app's CSS background 
          (like a wood texture or dark mode slate) to act as the tray background.
        */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, 0]}
          receiveShadow
        >
          <planeGeometry args={[100, 100]} />
          <shadowMaterial transparent opacity={0.4} />
        </mesh>
      </Canvas>
    </div>
  );
};
