<template>
  <div id="container"></div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const clock = new THREE.Clock();
let t = 0;
let scene:any = null;
const initScene = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x333333 );
};

let camera:any = null;
const initCamera = () => {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(10, 55, 100);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
};

const axisHelper = () => {
  scene.add(new THREE.AxesHelper(5000));
};

let renderer:any = null;
const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  let canvas = document.getElementsByTagName('canvas');
  if (canvas.length) document.body.removeChild(canvas[0]);
  document.body.appendChild(renderer.domElement);
};

const createText = (text:string) => {
  const loader = new FontLoader();
  loader.load( '/fonts/FangSong_Regular.json', font => {
    const textGeo:any = new TextGeometry( text, {
      font: font,
      size: 14,
      height: 5,
      curveSegments: 1,
      bevelThickness: 1,
    } );
    textGeo.computeBoundingBox();
    const centerOffset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );
    const textMaterial = new THREE.MeshNormalMaterial( { flatShading: THREE.FlatShading} );
    const mesh = new THREE.Mesh( textGeo, textMaterial );
    mesh.position.x = centerOffset;
    mesh.position.y = 20;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add( mesh );
  });
}

let cube:any = null;
const initCube = () => {
  const geometry = new THREE.BoxGeometry(5, 5, 5);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  const morphPositions = (geometry.attributes.position.array as []).map(it => it * 0.5);
  const morphAttribute = new THREE.Float32BufferAttribute(morphPositions, 3);
  morphAttribute.name = 'halfBox';
  geometry.morphAttributes.position = [morphAttribute];
  geometry.morphTargetsRelative = true;
  geometry.computeBoundingSphere();
  cube = new THREE.Mesh(geometry, material);
  // let grid:any = new THREE.GridHelper( 50, 10, 0x000000, 0xffffff );
  // grid.position.y = 5;
  // grid.material.opacity = 0.9;
  // grid.material.transparent = true;
  // scene.add(cube, grid);
  scene.add(cube);
};
const initaxisX = () => {
  const geometry = new THREE.BoxGeometry(100, 1, 5);
  const material = new THREE.MeshBasicMaterial({ color: 0x999999 });
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
};
  const initaxisY = () => {
  const geometry = new THREE.BoxGeometry(1, 50, 5);
  const material = new THREE.MeshBasicMaterial({ color: 0x999999 });
  cube = new THREE.Mesh(geometry, material);
  cube.position
  scene.add(cube);
};

const animate = () => {
  requestAnimationFrame(animate);
  // this.cube.rotation.x += 0.001;
  // this.cube.rotation.y += 0.002;
  // this.cube.rotation.z += 0.003;
  camera.updateProjectionMatrix();
  controls.update();
  const delta = clock.getDelta();
  t += delta * 0.5;
  // cube.morphTargetInfluences[0] = Math.abs( Math.sin( t ) );
  // const elapsedTime = clock.getElapsedTime();
  // scene.rotation.y = elapsedTime * 0.5;
  renderer.render(scene, camera);
}

let controls:any = null;
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = false;
};

const init = () => {
  initScene();
  initRenderer();
  initCamera();
  axisHelper();
  initControls();
};

init();
initaxisX();
initaxisY();
initCube();
createText('柱状图');
animate();
</script>

<style lang="less">

</style>
