import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, Stats } from "@react-three/drei";
import { InstancedD20 } from "./InstancedD20";

export const DiceScene: React.FC = () => {
  return (
    // The CSS class strictly controls the bounds of the WebGL context
    // e.g., max-width: 600px; aspect-ratio: 1/1; margin: 0 auto;
    <div
      className="dice-tray-container"
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas shadows="percentage" dpr={[1, 2]}>
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
          <InstancedD20 />
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
