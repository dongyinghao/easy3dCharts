<template>
  <div id="container"></div>
</template>

<script lang="ts" setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const data = [
  {
    value: 2,
    label: '小明'
  },
  {
    value: 7,
    label: '小李'
  },
  {
    value: 5,
    label: '小张莫阿紫'
  },
  {
    value: 9,
    label: '小兰'
  },
  {
    value: 10,
    label: '小毛子'
  }
]
const barWidth = 3;
const barDepth = 3;
const axisWidth = 10;
const axisDepth = 0.4;
const axisLengthX = 100;
const axisLengthY = 50;
const axisPadding = 5;
const clock = new THREE.Clock();
let t = 0;
let scene:any = null;
const initScene = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x111111 );
};

let camera:any = null;
const initCamera = () => {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(4, 35, 60);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
};

const axisHelper = () => {
  scene.add(new THREE.AxesHelper(5000));
};

const initLight = () => {
  const light = new THREE.DirectionalLight( 0xffffff);
  light.position.set( 0, 0, 1 );
  // light.angle = Math.PI / 4;
  light.castShadow = true;
  scene.add(new THREE.AmbientLight( 0xdddddd ), light);
};

let renderer:any = null;
const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  let canvas = document.getElementsByTagName('canvas');
  if (canvas.length) document.body.removeChild(canvas[0]);
  document.body.appendChild(renderer.domElement);
};

const createText = (data={
  font: '无',
  size: 1,
  height: 2,
  color: '#ffffff',
  y: 0,
  x: 0,
  z: 0,
  rotate: 0,
}) => {
  const loader = new FontLoader();
  loader.load( '/fonts/FangSong_Regular.json', fonts => {
    const {font, size, height, x, y, z, rotate, color} = data;
    const textGeo:any = new TextGeometry( font, {
      font: fonts,
      size,
      height,
      curveSegments: 1,
      bevelThickness: 1,
    } );
    textGeo.computeBoundingBox();
    const textMaterial = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh( textGeo, textMaterial );
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    mesh.rotateX(rotate);
    // 获取字体的外轮廓，从而得到字体的长度
    let box= new THREE.Box3().setFromObject(mesh);
    // 字体对齐方式默认为左对齐，此处设为中心对齐
    mesh.translateX(-(box.max.x - box.min.x) / 2);
    scene.add( mesh );
  });
}

let cube:any = null;
const initBar = () => {
  const material = new THREE.MeshLambertMaterial({ color: '#1495a1' });
  data.forEach((it, i) => {
    const geometry = new THREE.BoxGeometry(barWidth, it.value, barDepth);
    cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    // cube.receiveShadow = true;
    cube.position.x = (axisLengthX - 2 * axisPadding) / (data.length - 1) * i + axisPadding - 50;
    cube.translateY(it.value / 2);
    scene.add(cube);
    //  X轴文字
    createText({
      font: it.label,
      size: 1.5,
      height: 0.1,
      x: cube.position.x,
      y: 1,
      z: 5,
      color: '#ffffff',
      rotate: -Math.PI / 2
    })
    //  柱顶文字
    createText({
      font: it.value.toString(),
      size: 2,
      height: 0.3,
      x: cube.position.x,
      y: it.value + 1,
      z: 0,
      color: '#ff0000',
      rotate: 0
    })
  });
};

// 绘制x轴
const initaxisX = () => {
  const geometry = new THREE.BoxGeometry(axisLengthX, axisDepth, axisWidth);
  const material = new THREE.MeshLambertMaterial({ color: 0x999999 });
  cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
};

// 绘制x轴
const initaxisY = () => {
  const geometry = new THREE.BoxGeometry(axisDepth, axisLengthY, axisWidth);
  const material = new THREE.MeshLambertMaterial({ color: 0x999999 });
  cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  cube.position.x = -50;
  cube.position.y = 24.8;
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
  initLight();
  initCamera();
  // axisHelper();
  initControls();
};

init();
// initaxisX();
// initaxisY();
initBar();
animate();
</script>

<style lang="less">

</style>
