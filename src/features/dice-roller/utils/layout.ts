import * as THREE from 'three';

// The Golden Angle in radians (~137.5 degrees)
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Base scaling factor. You may need to tweak this based on the physical 
// scale of your D20.glb model. 2.5 is a safe default for a 1-unit radius mesh.
const DEFAULT_SPACING = 2.5;

/**
 * Calculates a collision-free target position using Vogel's model of a Fermat spiral.
 * This guarantees an even, dense distribution radiating from the center (0,0).
 * 
 * @param index - The index of the current die in the array
 * @param spacingConstant - Multiplier for distance between dice
 * @returns A Vector3 representing the (x, 0, z) resting coordinates
 */
export const calculateFermatDistribution = (
  index: number,
  spacingConstant: number = DEFAULT_SPACING
): THREE.Vector3 => {
  // Center the first die perfectly at the origin
  if (index === 0) return new THREE.Vector3(0, 0, 0);

  const theta = index * GOLDEN_ANGLE;
  const radius = spacingConstant * Math.sqrt(index);

  // Return as a Vector3 on the XZ plane (Y is 0, representing the floor)
  // This allows direct application to the dummy Object3D's position in WebGL
  return new THREE.Vector3(
    radius * Math.cos(theta),
    0,
    radius * Math.sin(theta)
  );
};