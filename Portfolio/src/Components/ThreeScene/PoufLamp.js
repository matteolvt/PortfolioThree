import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export function createPoufLamp({
  height = 0.65,           // lampe plus grande (~65 cm)
  color = "#FF7A00",       // orange glossy
  intensity = 1.2,         // intensité lumière interne
  withLight = true,
} = {}) {
  const g = new THREE.Group();
  g.name = "PoufLamp";

  const H = height;
  const k = H / 0.5;

  // --- Dimensions ---
  const baseR = 0.14 * k;
  const baseT = 0.015 * k;
  const stemR = 0.012 * k;
  const stemH = 0.30 * k;
  const shadeR = 0.135 * k;
  const shadeY = 0.08 * k;
  const gap = 0.012 * k;
  const shadeT = 0.0028 * k;

  // --- Matériaux réalistes ---
const chrome = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.05,
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  envMapIntensity: 1.5,   // ✅ plus de reflets visibles sans HDRI
});


  const orangeGloss = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: 0.0,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    sheen: 0.5,
  });

  const innerWhite = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0,
    transmission: 0.55,
    thickness: 0.01 * k,
    emissive: new THREE.Color(0xfff2cc),
    emissiveIntensity: 0.1,
  });

  // --- Base chrome ---
  const base = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR, baseT, 64), chrome);
  base.position.y = baseT / 2;
  base.receiveShadow = true;
  base.castShadow = true;
  g.add(base);

  // --- Tige chrome (DROITE) ---
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(stemR, stemR, stemH, 48), chrome);
  stem.castShadow = true;
  stem.position.set(0, baseT + stemH / 2, 0);
  g.add(stem);

  // --- Position du bas des dômes ---
  const shadeBottomY = baseT + stemH;

  // --- Dômes "pouf" empilés ---
  const puffGeo = new THREE.SphereGeometry(shadeR, 96, 64);
  puffGeo.scale(1, shadeY / shadeR, 1);

  const puffBottom = new THREE.Mesh(puffGeo, orangeGloss);
  puffBottom.position.set(0, shadeBottomY + shadeY * 0.75, 0);
  puffBottom.castShadow = true;
  g.add(puffBottom);

  const puffTop = new THREE.Mesh(puffGeo, orangeGloss);
  puffTop.position.set(0, puffBottom.position.y + shadeY + gap, 0);
  puffTop.castShadow = true;
  g.add(puffTop);

  // --- Doublures internes ---
  const innerGeo = new THREE.SphereGeometry(shadeR - shadeT, 72, 48);
  innerGeo.scale(1, (shadeY - shadeT) / (shadeR - shadeT), 1);

  const innerBottom = new THREE.Mesh(innerGeo, innerWhite);
  innerBottom.position.copy(puffBottom.position);
  g.add(innerBottom);

  const innerTop = new THREE.Mesh(innerGeo, innerWhite);
  innerTop.position.copy(puffTop.position);
  g.add(innerTop);

  // --- Entretoise chrome ---
  const spacer = new THREE.Mesh(
    new THREE.CylinderGeometry(stemR * 1.8, stemR * 1.8, gap * 0.8, 48),
    chrome
  );
  spacer.position.y = (puffBottom.position.y + puffTop.position.y) / 2;
  spacer.castShadow = true;
  g.add(spacer);

  // --- Lumière interne douce ---
  if (withLight) {
    const warm = new THREE.PointLight(0xffe6b0, intensity, shadeR * 3.6);
    warm.position.set(0, puffBottom.position.y + (puffTop.position.y - puffBottom.position.y) * 0.5, 0);
    warm.castShadow = false; // pas d’ombre inutile
    g.add(warm);
  }

  g.position.y = 0;

  g.userData = {
    type: "desk_lamp_pouf",
    height_m: H,
  };

  return g;
}

// --- Export optionnel (.glb) ---
export function exportGLB(object3d, filename = "pouf_lamp.glb") {
  const exporter = new GLTFExporter();
  exporter.parse(
    object3d,
    (bin) => {
      const blob = new Blob([bin], { type: "model/gltf-binary" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    { binary: true, onlyVisible: true, embedImages: true }
  );
}
