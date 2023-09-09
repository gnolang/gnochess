// @ts-nocheck
import { Component } from "sevejs";
import { gsap } from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const Webgl = class extends Component {
  constructor(opts: any) {
    super(opts);
  }

  init() {
    // // automatically called at start
    // console.log("Webgl component init");
    // /**
    //  * Scene
    //  */
    // // Sizes
    // const sizes = {
    //   width: window.innerWidth,
    //   height: window.innerHeight,
    // };
    // // Canvas
    // const canvas = this.DOM.el.querySelector("#webgl-bg");
    // // Scene
    // const scene = new THREE.Scene();
    // // Start of the code
    // THREE.ColorManagement.enabled = false;
    // /**
    //  * Camera
    //  */
    // // Base camera
    // const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100);
    // camera.position.z = 3;
    // camera.position.y = 1;
    // scene.add(camera);
    // // Controls
    // const controls = new OrbitControls(camera, canvas);
    // controls.enableDamping = true;
    // /**
    //  * Renderer
    //  */
    // const renderer = new THREE.WebGLRenderer({
    //   canvas: canvas,
    //   alpha: true,
    // });
    // renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    // renderer.setSize(sizes.width, sizes.height);
    // renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // /**
    //  * Models
    //  */
    // const dracoLoader = new DRACOLoader();
    // dracoLoader.setDecoderPath("/models/dracos/");
    // const gltfLoader = new GLTFLoader();
    // gltfLoader.setDRACOLoader(dracoLoader);
    // gltfLoader.load("/models/gnochess-7.gltf", (gltf) => {
    //   gltf.scene.scale.set(0.38, 0.38, 0.38);
    //   gltf.scene.position.set(1.3, -1.6, 0);
    //   gltf.scene.rotation.y = Math.PI * 1.65;
    //   scene.add(gltf.scene);
    // });
    // /**
    //  * Lights
    //  */
    // const ambientLight = new THREE.AmbientLight(0xffffff, 3);
    // scene.add(ambientLight);
    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    // directionalLight.castShadow = true;
    // directionalLight.shadow.mapSize.set(1024, 1024);
    // directionalLight.shadow.camera.far = 15;
    // directionalLight.shadow.camera.left = -7;
    // directionalLight.shadow.camera.top = 7;
    // directionalLight.shadow.camera.right = 7;
    // directionalLight.shadow.camera.bottom = -7;
    // directionalLight.position.set(-3, 6, 0);
    // scene.add(directionalLight);
    // /**
    //  * Animate
    //  */
    // const clock = new THREE.Clock();
    // const tick = () => {
    //   const elapsedTime = clock.getElapsedTime();
    //   // Update controls
    //   controls.update();
    //   // Render
    //   renderer.render(scene, camera);
    //   // Call tick again on the next frame
    //   window.requestAnimationFrame(tick);
    // };
    // tick();
  }

  appear() {}
  disappear() {}

  destroy() {}
};

export { Webgl };
