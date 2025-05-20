import * as THREE from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { Terrain } from './terrain';
import camera from './camera';
import container from './container';
import { generateNoiseTexture } from './noise';
import scene from './scene';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { VerticalTiltShiftShader } from 'three/examples/jsm/shaders/VerticalTiltShiftShader';
import { atmosphereVertexShader } from "../shaders/atmosphere.vert";
import { atmosphereFragmentShader } from "../shaders/atmosphere.frag";
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';


class App {
  constructor() {
    this.clock = new THREE.Clock();
    this.cameraPosition = {};
    this.mouse = { x: 0, y: 0 };
    this.smoothMouse = { x: 0, y: 0 };
    this.container = container;
    this.center = new THREE.Vector3(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    this.scene = scene;
    this.camera = camera;
    this.controls = null;
  }

  init() {
    this.terrain = new Terrain(generateNoiseTexture(), Math.pow(2, 16), 3, Math.pow(2, 8));
    scene.add(this.terrain);


    // Initialize FlyControls

    // Set up camera position and orientation 
    this.camera.position.set(350, 350, 800);

    this.camera.lookAt(this.center.x, this.center.y, this.center.z- 100);

    this.controls = new FirstPersonControls(this.camera, this.container);
    this.controls.movementSpeed = 3000;
    this.controls.lookSpeed = 0.01; // Adjusted for smoother rotation
    this.controls.lookVertical = true; // Ensure vertical rotation is enabled
    this.controls.activeLook = true; // Enable active look with the mouse
    this.controls.noFly = true; // Disable flying

    // Create a sphere to follow
    const sphereGeometry = new THREE.TorusGeometry(10.2, 3, 32);

    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xffffff, 
      emissiveIntensity: 0.9, 
      roughness: 0.9, 
      metalness: 0.1,
      wireframe: false,
    });

    sphereMaterial.color.set(0xff4500); // Outer ring color (reddish-orange)
    sphereMaterial.emissive.set(0xffffff); // Bright white for emissive parts
    sphereMaterial.emissiveIntensity = 0.05; // Adjust emissive intensity
    sphereMaterial.roughness = 0.5; // Moderate roughness for a slightly matte look
    sphereMaterial.metalness = 0.2; // Low metalness for a non-metallic appearance

    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    const strips = [
      {
        offsetX: 7,
        offsetY: 7,
        rotateX: 2,
        rotateY: 4,
        rotateZ: 2
      },
      {
        offsetX: -7,
        offsetY: 7,
        rotateX: 2,
        rotateY: -4,
        rotateZ: 2
      },
      {
        offsetX: 7,
        offsetY: -7,
        rotateX: 2,
        rotateY: -4,
        rotateZ: 2
      },
      {
        offsetX: -7,
        offsetY: -7,
        rotateX: 2,
        rotateY: 4,
        rotateZ: 2
      }
    ]

    for(const x of strips){ 
      // Add four white strips around the torus
      const stripMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8,
        roughness: 0.5,
        metalness: 0.1,
      });

      const stripGeometry = new THREE.TorusGeometry(3, 0.5, 32);

      // Create and position the strips
      const strip = new THREE.Mesh(stripGeometry, stripMaterial);

      strip.position.set(
        this.sphere.position.x + x.offsetX, // Radius of the torus
        this.sphere.position.y + x.offsetY,
        0
      );
      strip.rotation.x = (Math.PI) / 2;
      strip.rotation.y = (Math.PI) / x.rotateY;
      strip.rotation.z = (Math.PI) / 2;
      this.sphere.add(strip);
    }

    this.scene.add(this.sphere);


    // Add ambient light to brighten the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Add directional light for better texture visibility
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(100, 100, 100);
    this.scene.add(directionalLight);

    // Add a hemisphere light for more natural lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4); // Sky color, ground color, intensity
    hemisphereLight.position.set(0, 500, 100000); // Position the light above the scene
    this.scene.add(hemisphereLight);


    // Create a large sphere to act as the background
    const backgroundGeometry = new THREE.SphereGeometry(60000, 1024, 1024);

    // Create custom shaders for the background sphere
    const backgroundMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader.toString(),
      fragmentShader: atmosphereFragmentShader.toString(),
      side: THREE.BackSide, // Render the inside of the sphere
      blending: THREE.AdditiveBlending,
      transparent: true,
      uniforms: {
        uSkyColor: { value: new THREE.Color(0x0000FF) }, // Sky color
        uHorizonColor: { value: new THREE.Color(0xFFFFFF) }, // Horizon color
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
    });

    // Add the background sphere to the scene
    const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundSphere.material.needsUpdate = true; // Ensure the material updates with the new texture
    this.scene.add(backgroundSphere);

    // Set initial position of the sphere
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    this.sphere.position.copy(this.camera.position).add(cameraDirection.multiplyScalar(200));

    const backwardQuaternion = new THREE.Quaternion();
    backwardQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); // Rotate 90 degrees backward
    this.sphere.quaternion.copy(backwardQuaternion);

    const verticalTiltShiftPass = new ShaderPass(VerticalTiltShiftShader);
    verticalTiltShiftPass.uniforms['v'].value = 2.5 / window.innerHeight; // Increase vertical blur for better visibility
    verticalTiltShiftPass.uniforms['r'].value = 0.49; // Radius of the blur


    // Add Unreal Bloom Pass
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6, // Strength
      0.4, // Radius
      0.95 // Threshold
    );

    // Add to the effect composer
    this.composer = new EffectComposer(this.renderer);

    this.composer.addPass(bloomPass);
    this.composer.addPass(verticalTiltShiftPass);

    this.composer.addPass(new RenderPass(this.scene, this.camera));


  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 1 / 60); // Clamp delta to 30fps
    this.controls.update(delta);

    this.camera.up = new THREE.Vector3( 0, 0, 1 );

    this.camera.lookAt(this.center.x, this.center.y, -200);

    // Slowly spin the camera around the Z-axis
    this.camera.lookAt(new THREE.Vector3(this.center.x, this.center.y, -800));

    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    // Move the camera in a circular path around the center
    const radius = 7300; // Radius of the circular path
    const speed = 0.1; // Speed of the circular motion
    const elapsedTime = this.clock.getElapsedTime();

    this.camera.position.x = radius * Math.cos(elapsedTime * speed);
    this.camera.position.y = radius * Math.sin(elapsedTime * speed);

    this.terrain.updateUniforms(this.camera.position);

    this.sphere.position.copy(this.camera.position).add(cameraDirection.multiplyScalar(200));

    this.composer.render(this.scene, this.camera);
    
  }
}

export { App }
