<template>
</template>

<script lang="ts" setup>
import {
  Scene, SphereGeometry, Group, Mesh, AmbientLight, DirectionalLight, PerspectiveCamera, Clock, DoubleSide, PlaneGeometry,
  BoxGeometry,PointLight,PointLightHelper,Shape,ShapeGeometry,Box3, Vector3,EllipseCurve,LineBasicMaterial, Line,QuadraticBezierCurve3,CatmullRomCurve3,
  WebGLRenderer, AxesHelper, MeshLambertMaterial, Color, KeyframeTrack, AnimationClip, AnimationMixer, Object3D, SpotLight,
  SpotLightHelper, LineCurve3, DirectionalLightHelper, BufferGeometry,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import PoliceStation from '@/assets/models/PoliceStation.glb'
import { offset } from "@/utils/dpm";
import { drawLine, loadGlb } from "@/utils/tools";
import {onMounted} from "vue";

const scene:any = new Scene();
const box:any = new Group();
scene.add(box);
scene.background = new Color( 0x111111 );
let clock = new Clock();
let camera:any = null;
let renderer:any = null;
let controls:any = null;
let mixer:any = null;
let sphere:any = null;


// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  // controls.autoRotate = false;
  // controls.addEventListener('change',throttle(() => {
    // renderer.render(scene, camera);
    // console.log(333);
  // }, 300))
};

const init = () => {
  camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000)
  camera.position.set(0, 0, 100);
  const light = new PointLight( 0xffffff);
  light.position.set( 100, 100, 100 );
  light.castShadow = true;
  light.shadow.mapSize.width = 1024
  light.shadow.mapSize.height = 1024
  const p = new Object3D();
  p.position.set(0, 0, 0);
  // light.target = p;
  scene.add(light, new PointLightHelper(light));
  // scene.add(new AmbientLight(0XFFFFFF));
  scene.add(new AxesHelper(5000));
  renderer = new WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setViewport( 0, 0, window.innerWidth/2, window.innerHeight );
  renderer.setScissor( 0, 0, window.innerWidth/2, window.innerHeight );
  renderer.setScissorTest( true );
  camera.aspect = window.innerWidth / (window.innerHeight * 2);
  camera.updateProjectionMatrix();
  let canvas = document.getElementsByTagName('canvas');
  if (canvas.length) document.body.removeChild(canvas[0]);
  document.body.appendChild(renderer.domElement);
}


const drawPlan = () => {
  const geometry = new PlaneGeometry( 300, 300 );
  const material = new MeshLambertMaterial({color: 0Xdddddd});
  const plane = new Mesh( geometry, material );
  plane.rotateX(-Math.PI / 2);
  plane.position.set(0,0,0);
  plane.receiveShadow = true;
  scene.add( plane );
}
drawPlan();

const drawBox = () => {
  const geometry = new BoxGeometry( 20, 20, 20 );
  const material = new MeshLambertMaterial({color: 0Xff00ff});
  const plane = new Mesh( geometry, material );
  plane.position.set(-30,30,0);
  plane.castShadow = true;
  box.add( plane );
}
drawBox();

const drawSphere = () => {
  const geometry = new SphereGeometry( 20, 22, 16 );
  const material = new MeshLambertMaterial( { color: 0xdddddd } );
  sphere = new Mesh( geometry, material );
  sphere.position.set(30,20,0)
  sphere.castShadow = true;
  box.add( sphere );
}
drawSphere();

const initAnimat  = () => {
  // 创建名为Box对象的关键帧数据
  var times = [0, 5, 10]; //关键帧时间数组，离散的时间点序列
  var values = [0, 0, 0, 150, 0, 0]; //与时间点对应的值组成的数组
// 创建位置关键帧对象：0时刻对应位置0, 0, 0   10时刻对应位置150, 0, 0
//   var posTrack = new KeyframeTrack('Box.position', times, values);
// 创建颜色关键帧对象：10时刻对应颜色1, 0, 0   20时刻对应颜色0, 0, 1
//   var colorKF = new KeyframeTrack('Box.material.color', [10, 20], [1, 0, 0, 0, 0, 1]);
// 创建名为Sphere对象的关键帧数据  从0~20时间段，尺寸scale缩放3倍
  var scaleTrack = new KeyframeTrack('sphere.position', times, [1, 1, 1, 3, 3, 3, 1,1,1]);
// duration决定了默认的播放时间，一般取所有帧动画的最大时间
// duration偏小，帧动画数据无法播放完，偏大，播放完帧动画会继续空播放
  var duration = 10;
// 多个帧动画作为元素创建一个剪辑clip对象，命名"default"，持续时间20
  var clip = new AnimationClip("default", duration, [scaleTrack]);
  mixer = new AnimationMixer(box);
// 剪辑clip作为参数，通过混合器clipAction方法返回一个操作对象AnimationAction
  var AnimationAction = mixer.clipAction(clip);
//通过操作Action设置播放方式
  AnimationAction.timeScale = 1;//默认1，可以调节播放速度
// AnimationAction.loop = THREE.LoopOnce; //不循环播放
  AnimationAction.play();//开始播放
}

const animate = () => {
  requestAnimationFrame(animate);
  camera.updateProjectionMatrix();
  // controls.update();
  renderer.render(scene, camera);
  // 更新混合器相关的时间
  // mixer.update(clock.getDelta());
}

onMounted(() => {
  init();
  initControls();
  // loadGlbs1();
  // initAnimat();
  animate();

})
</script>

<style lang="stylus" scoped>

</style>
