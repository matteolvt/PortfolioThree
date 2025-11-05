import * as THREE from "three";

export function createPortfolioBook({
  width = 0.8,
  height = 0.09,
  depth = 1.0,
  color = "#39E136",
  pageColor = "#f8f4e8",
  withText = true,
  title = "MATTEO LIVROZET —",
  subtitle = "PORTFOLIO VOL.01",
} = {}) {
  const group = new THREE.Group();
  group.name = "PortfolioBook";

  // --- Texture canvas avec texte ---
  const coverTexture = withText ? createCoverTexture(color, title, subtitle) : null;

  // --- Matériau principal (couverture + tranche) ---
  const coverMat = new THREE.MeshPhysicalMaterial({
    map: coverTexture,
    color: coverTexture ? null : new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.05,
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
    sheen: 0.4,
  });

  // --- Papier ---
  const pageMat = new THREE.MeshStandardMaterial({
    color: pageColor,
    roughness: 0.95,
    metalness: 0,
  });

  // --- Bloc des pages ---
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.9, height * 0.7, depth * 0.9),
    pageMat
  );
  pages.position.set(width * 0.02, height / 2, 0);
  pages.castShadow = true;
  pages.receiveShadow = true;
  group.add(pages);

  // --- Couvertures ---
  const coverTop = new THREE.Mesh(
    new THREE.BoxGeometry(width, height * 0.12, depth),
    coverMat
  );
  coverTop.position.y = height - height * 0.06;
  coverTop.castShadow = true;
  coverTop.receiveShadow = true;
  group.add(coverTop);

  const coverBottom = new THREE.Mesh(
    new THREE.BoxGeometry(width, height * 0.12, depth),
    coverMat
  );
  coverBottom.position.y = height * 0.06;
  coverBottom.castShadow = true;
  coverBottom.receiveShadow = true;
  group.add(coverBottom);

  // --- ✅ Tranche réaliste corrigée ---
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.03, height * 1.02, depth * 1.0),
    coverMat // même matériau que la couverture pour garder la couleur uniforme
  );
  spine.position.set(-width * 0.485, height / 2, 0);
  spine.castShadow = true;
  spine.receiveShadow = true;
  group.add(spine);

  // --- ✅ Ombre interne finale (collée + plus douce) ---
  const shadowGeo = new THREE.PlaneGeometry(depth * 1.02, height * 1.05);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.05, // plus subtile
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.y = Math.PI / 2;
  shadow.rotation.z = Math.PI / 180 * 2; // légère inclinaison vers la tranche
  shadow.position.set(-width * 0.47, height / 2, 0.002); // collée à la tranche
  shadow.renderOrder = -1;
  shadow.castShadow = false;
  shadow.receiveShadow = false;
  group.add(shadow);

  // --- Orientation et position ---
  group.rotation.y = 0;
  group.rotation.x = 0;
  group.position.set(0, 1.065, -4.25);

  group.userData = {
    type: "portfolio_book",
    width,
    height,
    depth,
    color,
    withText,
  };

  return group;
}

/* --- Fonction pour générer la texture imprimée --- */
function createCoverTexture(color, title, subtitle) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Fond vert
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // Texte principal
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.font = "bold 90px Helvetica";
  ctx.fillText(title, size / 2, size * 0.42);
  ctx.font = "bold 80px Helvetica";
  ctx.fillText(subtitle, size / 2, size * 0.53);


  // Texte vertical sur la tranche
//   ctx.save();
//   ctx.translate(size * 0.1, size * 0.9);
//   ctx.rotate(-Math.PI / 2);
//   ctx.font = "bold 60px Helvetica";
//   ctx.fillText(`${title} ${subtitle}`, 0, 0);
//   ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
