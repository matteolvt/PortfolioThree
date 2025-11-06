import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export async function createPlantMonstera(options = {}) {
  const {
    scale = 0.4,
    position = [-2.2, 0, -3.5],
    rotationY = Math.PI / 8,
  } = options;

  const gltfLoader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();

  // Chargement des textures plante
  const [
    plantColor,
    plantRoughness,
    plantNormal,
    plantSSS,
  ] = await Promise.all([
    textureLoader.loadAsync("/assets/textures/PlantMonstera/PlantMonstera001_COL_4K_METALNESS.jpg"),
    textureLoader.loadAsync("/assets/textures/PlantMonstera/PlantMonstera001_ROUGHNESS_4K_METALNESS.jpg"),
    textureLoader.loadAsync("/assets/textures/PlantMonstera/PlantMonstera001_NRM_4K_METALNESS.jpg"),
    textureLoader.loadAsync("/assets/textures/PlantMonstera/PlantMonstera001_SSS_4K_METALNESS.jpg"),
  ]);

  // Chargement des textures du pot
  const [
    vaseColor,
    vaseNormal,
  ] = await Promise.all([
    textureLoader.loadAsync("/assets/textures/PlantMonstera/PlantMonsteraVase001_COL_4K_METALNESS.jpg"),
    textureLoader.loadAsync("/assets/textures/PlantMonstera/PlantMonsteraVase001_NRM_4K_METALNESS.png"),
  ]);

  // Chargement du modèle GLB
  const gltf = await gltfLoader.loadAsync("/assets/models/PlantMonstera.glb");
  const plant = gltf.scene;

  plant.scale.set(scale, scale, scale);
  plant.position.set(...position);
  plant.rotation.y = rotationY;

  // Applique les bons matériaux selon le nom du mesh
  plant.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // On distingue les parties de la plante et du pot
      const name = child.name.toLowerCase();

      if (name.includes("leaf") || name.includes("plant")) {
        child.material = new THREE.MeshStandardMaterial({
          map: plantColor,
          roughnessMap: plantRoughness,
          normalMap: plantNormal,
          aoMap: plantSSS,
          metalness: 0.05,
          roughness: 0.85,
          color: new THREE.Color("#7a9e72"),
        });
      } else if (name.includes("vase") || name.includes("pot")) {
        child.material = new THREE.MeshStandardMaterial({
          map: vaseColor,
          normalMap: vaseNormal,
          roughness: 0.6,
          metalness: 0.1,
          color: new THREE.Color("#e6e3de"), // pot beige clair mat
        });
      }
    }
  });

  return plant;
}
