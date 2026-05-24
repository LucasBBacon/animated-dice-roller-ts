import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Maps the face value (e.g., 20) to its localized outward normal vector
export type FaceNormals = Record<number, THREE.Vector3>;

/**
 * Extracts targeting normals dynamically from empty child objects within a GLTF file.
 * Expects empties to follow the naming convention "value_X" (e.g., "value_20")
 * and be positioned at the center of their respective faces.
 * 
 * @param modelPath - The public URL path to the .glb file
 * @returns A dictionary mapping integer face values to normalized Vector3 directional vectors
 */
export const useDiceNormals = (modelPath: string): FaceNormals => {
  // useGLTF inherently caches the loaded asset. Multiple calls with the same path share one instance.
  const { nodes } = useGLTF(modelPath);

  const normals = useMemo(() => {
    const extractedNormals: FaceNormals = {};
    const faceNamePrefix = 'value_';

    Object.entries(nodes).forEach(([nodeName, node]) => {
      if (nodeName.startsWith(faceNamePrefix)) {
        // Extract the integer from the node name (e.g., "value_20" -> 20)
        const faceString = nodeName.substring(faceNamePrefix.length);
        const faceValue = parseInt(faceString, 10);

        // Fail softly if a node is misnamed (e.g., "value_front")
        if (!isNaN(faceValue)) {
          // Normalizing the local position vector yields the perfect outward directional normal
          // We clone to strictly avoid mutating the cached GLTF scene graph
          extractedNormals[faceValue] = node.position.clone().normalize();
        } else {
          console.warn(`[useDiceNormals] Invalid face value parsed from node: ${nodeName}`);
        }
      }
    });

    if (Object.keys(extractedNormals).length === 0) {
      console.warn(`[useDiceNormals] No valid normals found in ${modelPath}. Ensure empties are named 'value_X'.`);
    }

    return extractedNormals;
  }, [nodes, modelPath]);

  return normals;
};

// Pre-load the asset immediately on module parse so it is ready before the first render
useGLTF.preload('/models/D20.glb');