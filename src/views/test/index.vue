<template>
</template>

<script lang="ts" setup>
import {
  Scene, SphereGeometry, Group, Mesh, AmbientLight, DirectionalLight, PerspectiveCamera, Clock, DoubleSide, PlaneGeometry,
  MeshStandardMaterial,BoxGeometry,OrthographicCamera,PointLight,PointLightHelper,Shape,ShapeGeometry,Box3, Vector3,
  WebGLRenderer, AxesHelper, MeshLambertMaterial, Color, KeyframeTrack, AnimationClip, AnimationMixer, Object3D, SpotLight, SpotLightHelper, MeshPhongMaterial, DirectionalLightHelper
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { drawLine, offset, a2r, r2a, l2a } from "@/utils/dpm";
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
  camera.position.set(10, 5, 100);
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
  renderer.shadowMap.enabled = true
  renderer.setSize(window.innerWidth, window.innerHeight);
  let canvas = document.getElementsByTagName('canvas');
  if (canvas.length) document.body.removeChild(canvas[0]);
  document.body.appendChild(renderer.domElement);
}


const drawLines = () => {
  const arrayList = [ [ 106.6574131, 29.6109968 ], [ 106.6582647, 29.6116778 ], [ 106.6583254, 29.6117141 ], [ 106.6583481, 29.611719 ], [ 106.6584183, 29.6117338 ], [ 106.6584657, 29.6117174 ], [ 106.658534, 29.611686 ], [ 106.6586288, 29.6116596 ], [ 106.6586744, 29.611658 ], [ 106.6587199, 29.6116728 ], [ 106.6589645, 29.6119894 ], [ 106.6589854, 29.6120356 ], [ 106.6589702, 29.6120735 ], [ 106.6583633, 29.612428 ], [ 106.6579731, 29.6126941 ], [ 106.6576794, 29.6128944 ], [ 106.6575801, 29.6129433 ], [ 106.657505, 29.612948 ], [ 106.6573979, 29.6129104 ], [ 106.6564431, 29.6118471 ], [ 106.6558693, 29.6111023 ], [ 106.6552194, 29.6103919 ], [ 106.6540215, 29.6094772 ], [ 106.6527518, 29.6085077 ], [ 106.6510679, 29.6070992 ], [ 106.650252, 29.6066794 ], [ 106.6497799, 29.6066794 ], [ 106.6494795, 29.6067074 ], [ 106.6491904, 29.606894 ], [ 106.6492011, 29.6070619 ], [ 106.6500165, 29.6074443 ], [ 106.6502122, 29.607614 ], [ 106.6503843, 29.6079578 ], [ 106.6505739, 29.6082035 ], [ 106.6508338, 29.6084591 ], [ 106.6511752, 29.6089059 ], [ 106.6513591, 29.6090247 ], [ 106.6521007, 29.6093627 ], [ 106.6521936, 29.6094814 ], [ 106.6523454, 29.6097106 ], [ 106.6524156, 29.6097535 ], [ 106.6524933, 29.6097716 ], [ 106.6525768, 29.6097667 ], [ 106.6527152, 29.6097419 ], [ 106.6528176, 29.6097436 ], [ 106.6529466, 29.6097898 ], [ 106.6531647, 29.6100305 ], [ 106.6533923, 29.6103108 ], [ 106.6534795, 29.6103834 ], [ 106.6535877, 29.6104526 ], [ 106.6536844, 29.6104939 ], [ 106.6537489, 29.6105615 ], [ 106.6537925, 29.6106274 ], [ 106.6539822, 29.6109341 ], [ 106.654077, 29.6110199 ], [ 106.654168, 29.6111139 ], [ 106.6542932, 29.6112491 ], [ 106.6546567, 29.6117236 ], [ 106.6549134, 29.6120587 ], [ 106.6553003, 29.6124462 ], [ 106.6558522, 29.6131436 ], [ 106.6560798, 29.6134256 ], [ 106.6562296, 29.6135592 ], [ 106.6565122, 29.6137323 ], [ 106.6566791, 29.6138494 ], [ 106.6569864, 29.6141857 ], [ 106.6574643, 29.6147331 ], [ 106.6578209, 29.615119 ], [ 106.6578835, 29.6152426 ], [ 106.6579214, 29.6153762 ], [ 106.6580238, 29.6155839 ], [ 106.6580864, 29.6156433 ], [ 106.6582723, 29.6158544 ], [ 106.6582931, 29.6159121 ], [ 106.6583026, 29.615978 ], [ 106.6583178, 29.6160522 ], [ 106.6582988, 29.6161149 ], [ 106.65824, 29.6162831 ], [ 106.6582287, 29.6163523 ], [ 106.6582438, 29.6164595 ], [ 106.6583709, 29.616659 ], [ 106.6584961, 29.6168981 ], [ 106.6586664, 29.6172502 ], [ 106.6586933, 29.6173696 ], [ 106.6586383, 29.6174224 ], [ 106.6585814, 29.6174488 ], [ 106.6583804, 29.617462 ], [ 106.6582552, 29.6174174 ], [ 106.6580276, 29.6172756 ], [ 106.6578778, 29.6172179 ], [ 106.6575174, 29.6171652 ], [ 106.6572557, 29.6171272 ], [ 106.6571931, 29.6170827 ], [ 106.6571305, 29.6170184 ], [ 106.6570717, 29.6169228 ], [ 106.6570395, 29.616781 ], [ 106.6569921, 29.6167117 ], [ 106.6569124, 29.6166623 ], [ 106.6566905, 29.6165386 ], [ 106.6565217, 29.6163589 ], [ 106.6562827, 29.6161215 ], [ 106.6559926, 29.616039 ], [ 106.6558579, 29.6159335 ], [ 106.6558351, 29.6158675 ], [ 106.6556284, 29.6153416 ], [ 106.655545, 29.6152261 ], [ 106.6552946, 29.6148799 ] ];

  const array:number[] = [];
  arrayList.forEach((t, i) => {
    if (i < 300) array.push(t[0] * 1000, t[1] *1000, 0)
  })
  const mesh = drawLine(array, {color:'#ffffff'});
  box.add(mesh)
}
// drawLines()

const drawLines0 = () => {
  const arrayList = [ [ 106.6574131, 29.6109968 ], [ 106.6582647, 29.6116778 ], [ 106.6583254, 29.6117141 ], [ 106.6583481, 29.611719 ], [ 106.6584183, 29.6117338 ], [ 106.6584657, 29.6117174 ], [ 106.658534, 29.611686 ], [ 106.6586288, 29.6116596 ], [ 106.6586744, 29.611658 ], [ 106.6587199, 29.6116728 ], [ 106.6589645, 29.6119894 ], [ 106.6589854, 29.6120356 ], [ 106.6589702, 29.6120735 ], [ 106.6583633, 29.612428 ], [ 106.6579731, 29.6126941 ], [ 106.6576794, 29.6128944 ], [ 106.6575801, 29.6129433 ], [ 106.657505, 29.612948 ], [ 106.6573979, 29.6129104 ], [ 106.6564431, 29.6118471 ], [ 106.6558693, 29.6111023 ], [ 106.6552194, 29.6103919 ], [ 106.6540215, 29.6094772 ], [ 106.6527518, 29.6085077 ], [ 106.6510679, 29.6070992 ], [ 106.650252, 29.6066794 ], [ 106.6497799, 29.6066794 ], [ 106.6494795, 29.6067074 ], [ 106.6491904, 29.606894 ], [ 106.6492011, 29.6070619 ], [ 106.6500165, 29.6074443 ], [ 106.6502122, 29.607614 ], [ 106.6503843, 29.6079578 ], [ 106.6505739, 29.6082035 ], [ 106.6508338, 29.6084591 ], [ 106.6511752, 29.6089059 ], [ 106.6513591, 29.6090247 ], [ 106.6521007, 29.6093627 ], [ 106.6521936, 29.6094814 ], [ 106.6523454, 29.6097106 ], [ 106.6524156, 29.6097535 ], [ 106.6524933, 29.6097716 ], [ 106.6525768, 29.6097667 ], [ 106.6527152, 29.6097419 ], [ 106.6528176, 29.6097436 ], [ 106.6529466, 29.6097898 ], [ 106.6531647, 29.6100305 ], [ 106.6533923, 29.6103108 ], [ 106.6534795, 29.6103834 ], [ 106.6535877, 29.6104526 ], [ 106.6536844, 29.6104939 ], [ 106.6537489, 29.6105615 ], [ 106.6537925, 29.6106274 ], [ 106.6539822, 29.6109341 ], [ 106.654077, 29.6110199 ], [ 106.654168, 29.6111139 ], [ 106.6542932, 29.6112491 ], [ 106.6546567, 29.6117236 ], [ 106.6549134, 29.6120587 ], [ 106.6553003, 29.6124462 ], [ 106.6558522, 29.6131436 ], [ 106.6560798, 29.6134256 ], [ 106.6562296, 29.6135592 ], [ 106.6565122, 29.6137323 ], [ 106.6566791, 29.6138494 ], [ 106.6569864, 29.6141857 ], [ 106.6574643, 29.6147331 ], [ 106.6578209, 29.615119 ], [ 106.6578835, 29.6152426 ], [ 106.6579214, 29.6153762 ], [ 106.6580238, 29.6155839 ], [ 106.6580864, 29.6156433 ], [ 106.6582723, 29.6158544 ], [ 106.6582931, 29.6159121 ], [ 106.6583026, 29.615978 ], [ 106.6583178, 29.6160522 ], [ 106.6582988, 29.6161149 ], [ 106.65824, 29.6162831 ], [ 106.6582287, 29.6163523 ], [ 106.6582438, 29.6164595 ], [ 106.6583709, 29.616659 ], [ 106.6584961, 29.6168981 ], [ 106.6586664, 29.6172502 ], [ 106.6586933, 29.6173696 ], [ 106.6586383, 29.6174224 ], [ 106.6585814, 29.6174488 ], [ 106.6583804, 29.617462 ], [ 106.6582552, 29.6174174 ], [ 106.6580276, 29.6172756 ], [ 106.6578778, 29.6172179 ], [ 106.6575174, 29.6171652 ], [ 106.6572557, 29.6171272 ], [ 106.6571931, 29.6170827 ], [ 106.6571305, 29.6170184 ], [ 106.6570717, 29.6169228 ], [ 106.6570395, 29.616781 ], [ 106.6569921, 29.6167117 ], [ 106.6569124, 29.6166623 ], [ 106.6566905, 29.6165386 ], [ 106.6565217, 29.6163589 ], [ 106.6562827, 29.6161215 ], [ 106.6559926, 29.616039 ], [ 106.6558579, 29.6159335 ], [ 106.6558351, 29.6158675 ], [ 106.6556284, 29.6153416 ], [ 106.655545, 29.6152261 ], [ 106.6552946, 29.6148799 ] ];
  const leftArray:number[][] = [];
  const rightArray:number[][] = [];
  let prevPoint:number[] = [];
  arrayList.forEach(it => {
    if (prevPoint.length) {
      const p1 = offset( prevPoint, it, 0.0001, 1);
      const p2 = offset( prevPoint, it, 0.0001, 0);
      leftArray.push(p1[0], p1[1]);
      rightArray.push(p2[0], p2[1]);
    }
    prevPoint = it;
  });
  rightArray.reverse();
  rightArray.forEach(it => {
    leftArray.push(it);
  })
  const shape = new Shape();
  shape.autoClose = true;
  leftArray.forEach((t, i) => {
    if (!i) {
      shape.moveTo(t[0] * 1000,t[1] * 1000);
    } else {
      shape.lineTo(t[0] * 1000,t[1] * 1000);
    }
  })
  const geometry = new ShapeGeometry(shape);
  const material = new MeshLambertMaterial({color: 0xff00ff});
  const mesh = new Mesh(geometry,material);
  box.add( mesh );
  let boxInfo = new Box3().setFromObject(box);
  box.translateX(-(boxInfo.min.x + boxInfo.max.x) / 2);
  box.translateY(-(boxInfo.min.y + boxInfo.max.y) / 2);
}
// drawLines0()

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
  controls.update();
  renderer.render(scene, camera);
  // 更新混合器相关的时间
  // mixer.update(clock.getDelta());
}

onMounted(() => {
  init();
  initControls();
  // initAnimat();
  animate();
  document.body.addEventListener('mousewheel', function ( event:any ){
    var factor = 1;
    //将鼠标的屏幕坐标转换为NDC坐标
    var mX = ( event.clientX / window.innerWidth ) * 2 - 1;
    var mY = - ( event.clientY / window.innerHeight ) * 2 + 1;

    //这里定义深度值为0.5，深度值越大，意味着精度越高
    var vector = new Vector3(mX, mY, 0.9 );
    //将鼠标坐标转换为3D空间坐标
    vector.unproject(camera);

    //获得从相机指向鼠标所对应的3D空间点的射线（归一化）
    vector.sub( camera.position ).normalize();
    if( event.deltaY < 0 ){
      camera.position.x += vector.x * factor;
      camera.position.y += vector.y * factor;
      camera.position.z += vector.z * factor;
      controls.target.x += vector.x * factor;
      controls.target.y += vector.y * factor;
      controls.target.z += vector.z * factor;
    } else{
      camera.position.x -= vector.x * factor;
      camera.position.y -= vector.y * factor;
      camera.position.z -= vector.z * factor;
      controls.target.x -= vector.x * factor;
      controls.target.y -= vector.y * factor;
      controls.target.z -= vector.z * factor;
    }
    // controls.update();
  });
})
</script>

<style lang="stylus" scoped>

</style>
