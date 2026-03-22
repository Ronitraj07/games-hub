import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface ThreeCharacter {
  name: string;
  position: { x: number; y: number; z: number };
  color: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'suspicious';
}

export interface ThreeSceneProps {
  sceneType: 'office' | 'mansion' | 'street' | 'museum' | 'laboratory';
  characters: ThreeCharacter[];
  lighting?: 'day' | 'night' | 'dim';
  onCharacterClick?: (characterName: string) => void;
  className?: string;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  sceneType,
  characters,
  lighting = 'day',
  onCharacterClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set background based on lighting
    const bgColors = {
      day: 0x87ceeb,
      night: 0x0a0a2e,
      dim: 0x4a4a4a,
    };
    scene.background = new THREE.Color(bgColors[lighting]);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(
      lighting === 'day' ? 0xffffff : lighting === 'night' ? 0x404040 : 0x808080,
      lighting === 'day' ? 0.6 : lighting === 'night' ? 0.3 : 0.4
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, lighting === 'day' ? 0.8 : 0.5);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Point lights for ambiance
    const pointLight1 = new THREE.PointLight(0xffa500, 0.5, 20);
    pointLight1.position.set(-5, 4, -5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00ffff, 0.3, 15);
    pointLight2.position.set(5, 3, 5);
    scene.add(pointLight2);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: sceneType === 'mansion' ? 0x8b4513 : sceneType === 'museum' ? 0xaaaaaa : 0x555555,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Create environment based on scene type
    createEnvironment(scene, sceneType);

    // Create character meshes
    const characterMeshes = new Map<string, THREE.Group>();
    characters.forEach((char) => {
      const characterGroup = createCharacterMesh(char);
      characterGroup.userData = { name: char.name };
      scene.add(characterGroup);
      characterMeshes.set(char.name, characterGroup);
    });
    characterMeshesRef.current = characterMeshes;

    // Mouse click handler
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        Array.from(characterMeshes.values()).flatMap((group) => group.children),
        true
      );

      if (intersects.length > 0) {
        let currentObj = intersects[0].object;
        while (currentObj.parent && !(currentObj.parent instanceof THREE.Scene)) {
          currentObj = currentObj.parent;
        }
        const characterName = currentObj.userData?.name;
        if (characterName && onCharacterClick) {
          onCharacterClick(characterName);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    let animationId: number;
    let time = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;

      // Animate characters (slight bobbing)
      characterMeshes.forEach((group, name) => {
        const char = characters.find((c) => c.name === name);
        if (char) {
          group.position.y = char.position.y + Math.sin(time * 2) * 0.05;
        }
      });

      // Gentle camera sway
      if (cameraRef.current) {
        cameraRef.current.position.x = Math.sin(time * 0.2) * 0.5;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      characterMeshes.forEach((group) => {
        group.children.forEach((mesh) => {
          if (mesh instanceof THREE.Mesh) {
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
      });
    };
  }, [sceneType, characters, lighting, onCharacterClick]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full rounded-xl overflow-hidden shadow-2xl ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
};

// Helper function to create a 3D character mesh
function createCharacterMesh(char: ThreeCharacter): THREE.Group {
  const group = new THREE.Group();
  group.position.set(char.position.x, char.position.y, char.position.z);

  // Body (capsule-like shape)
  const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: char.color,
    roughness: 0.5,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Head (sphere)
  const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdbac,
    roughness: 0.6,
    metalness: 0.05,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 2.4;
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  // Face features based on emotion
  const emotionColor = getEmotionColor(char.emotion);
  const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: emotionColor });

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.12, 2.5, 0.3);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.12, 2.5, 0.3);
  group.add(rightEye);

  // Arms (simple cylinders)
  const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
  const armMaterial = new THREE.MeshStandardMaterial({ color: char.color });

  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.5, 1.2, 0);
  leftArm.rotation.z = Math.PI / 6;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.5, 1.2, 0);
  rightArm.rotation.z = -Math.PI / 6;
  rightArm.castShadow = true;
  group.add(rightArm);

  return group;
}

// Helper function to get emotion color
function getEmotionColor(emotion?: string): number {
  switch (emotion) {
    case 'happy':
      return 0x00ff00;
    case 'sad':
      return 0x0000ff;
    case 'angry':
      return 0xff0000;
    case 'suspicious':
      return 0xffff00;
    default:
      return 0x000000;
  }
}

// Helper function to create environment objects
function createEnvironment(scene: THREE.Scene, sceneType: string) {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: sceneType === 'mansion' ? 0x8b0000 : sceneType === 'office' ? 0xcccccc : 0x666666,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Back wall
  const wallGeometry = new THREE.BoxGeometry(40, 10, 0.5);
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 5, -10);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Side walls
  const sideWallGeometry = new THREE.BoxGeometry(0.5, 10, 20);
  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.position.set(-20, 5, 0);
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  rightWall.position.set(20, 5, 0);
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // Add scene-specific furniture
  if (sceneType === 'office') {
    // Desk
    const deskGeometry = new THREE.BoxGeometry(3, 0.2, 1.5);
    const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(0, 1, -5);
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);
  } else if (sceneType === 'mansion') {
    // Chandelier (simplified)
    const chandelierGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const chandelierMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
    });
    const chandelier = new THREE.Mesh(chandelierGeometry, chandelierMaterial);
    chandelier.position.set(0, 8, 0);
    scene.add(chandelier);
  } else if (sceneType === 'museum') {
    // Pedestals
    const pedestalGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 16);
    const pedestalMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

    const pedestal1 = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal1.position.set(-4, 0.75, -3);
    pedestal1.castShadow = true;
    pedestal1.receiveShadow = true;
    scene.add(pedestal1);

    const pedestal2 = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal2.position.set(4, 0.75, -3);
    pedestal2.castShadow = true;
    pedestal2.receiveShadow = true;
    scene.add(pedestal2);
  }
}
