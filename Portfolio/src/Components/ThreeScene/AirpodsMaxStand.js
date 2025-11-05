// AirpodsMaxStand.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

/* =========================================================================
   📦 Rappel: mets ton fichier ici -> /public/assets/models/model.glb
   Et référence-le avec un chemin ABSOLU qui commence par "/"
   Exemple: "/assets/models/model.glb"
   ========================================================================= */

const DEFAULT_PARAMS = {
  path: "/assets/models/model.glb",
  scale: 1.0,
  rotationY: -Math.PI / 10,
  variant: "starlight",
  metalness: 1.0,
  roughness: 0.3,
};

// Normalise un chemin pour qu’il commence toujours par "/"
function normalizePublicPath(p) {
  if (!p) return "/assets/models/model.glb";
  return p.startsWith("/") ? p : `/${p}`;
}

export async function loadAirpodsMax(path = DEFAULT_PARAMS.path, opts = {}) {
  const {
    scale = DEFAULT_PARAMS.scale,
    variant = DEFAULT_PARAMS.variant,
    rotationY = DEFAULT_PARAMS.rotationY,
    metalness = DEFAULT_PARAMS.metalness,
    roughness = DEFAULT_PARAMS.roughness,
  } = opts;

  const finalPath = normalizePublicPath(path);
  console.log("📦 Chargement GLB depuis :", finalPath);

  // --- Loaders
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  // 🔒 Pas d’URL spéciale: on charge simplement depuis /public
  const gltf = await loader.loadAsync(finalPath);
  const model = gltf.scene;

  // Matériaux de base
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material?.isMeshStandardMaterial) {
        obj.material.metalness = metalness;
        obj.material.roughness = roughness;
      }
    }
  });

  // Palette Apple
  const palette =
    {
      silver: { alu: 0xDADDE1, mesh: 0xEFEFEF, cushion: 0xE5E5E5 },
      spacegray: { alu: 0x9EA3A8, mesh: 0xB8BCC2, cushion: 0xC4C7CB },
      green: { alu: 0xC9D3C9, mesh: 0xE3E9E3, cushion: 0xDDE4DD },
      pink: { alu: 0xF0C9CC, mesh: 0xF6E4E6, cushion: 0xF0D9DC },
      skyblue: { alu: 0xC9D7E8, mesh: 0xE6EEF8, cushion: 0xDEE9F5 },
      starlight: { alu: 0xE6DEC7, mesh: 0xF2ECDC, cushion: 0xEDE6D5 },
    }[variant] || {};

  // Coloration automatique
  model.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      const name = obj.name.toLowerCase();
      if (name.includes("cup") || name.includes("shell")) obj.material.color.set(palette.alu || 0xdddddd);
      else if (name.includes("mesh") || name.includes("band")) obj.material.color.set(palette.mesh || 0xf5f5f5);
      else if (name.includes("cushion") || name.includes("ear") || name.includes("pad")) obj.material.color.set(palette.cushion || 0xeeeeee);
    }
  });

  // Transforms
  model.scale.setScalar(scale);
  model.rotation.y = rotationY;

  // Centre l’origine du modèle (pratique si export SketchUp/Blender)
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  box.getCenter(center);
  model.position.sub(center);

  return model;
}
