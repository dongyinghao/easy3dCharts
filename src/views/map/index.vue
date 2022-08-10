<template>
  <Tips :tips="tips" ref="tipsRef" />
  <div class="cityBox" ref="cityListRef">
    <div v-for="it in cq_land.features" :key="it.properties.adcode" @click="handleClick(it.properties)">{{it.properties.name}}</div>
  </div>
</template>

<script lang="ts" setup>
import {
  AmbientLight,
  AxesHelper,
  Box3,
  BoxGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  Raycaster,
  Scene,
  Shape,
  ShapeGeometry,
  SpotLight,
  SpotLightHelper,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  Vector2,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { data as cq_land } from "@/assets/map/cq";
import { data as cq_build } from "@/assets/map/cq_build";
import { data as yangtzeRiver } from "@/assets/map/river/yangtzeRiver";
import { data as hechuanRiver } from "@/assets/map/river/hechuan";
import { data as jiangjinRiver } from "@/assets/map/river/jiangjin";
import { data as nananRiver } from "@/assets/map/river/nanan";
import { data as bananRiver } from "@/assets/map/river/banan";
import { data as shapingbaRiver } from "@/assets/map/river/shapingba";
import { data as yubeiRiver } from "@/assets/map/river/yubei";
import { data as yuzhongRoad } from "@/assets/map/road/yuzhong";
import { data as nananRoad } from "@/assets/map/road/nanan";
import { data as jiangbeiRoad } from "@/assets/map/road/jiangbei";
import { data as yubeiRoad } from "@/assets/map/road/yubei";
import { throttle } from "@/utils/dpm";
import { onMounted, ref, reactive, transformVNodeArgs } from "vue";
import Tips from '@/components/Tips.vue';
import { ZtoZoom, zoomByMouse, drawRoadPlane, drawRoadLine, drawRiver, drawBuild, drawMapLine, drawMapPlane, drawAreaName } from "@/utils/tools";
import buildMap from "@/assets/images/build.jpg";
import buildMap1 from "@/assets/images/build1.webp";
import buildMap2 from "@/assets/images/build2.webp";

const scene:any = new Scene();
const group:any = new Group();
const mapGroup:any = new Group();
mapGroup.receiveShaow = true;
const mapLineGroup:any = new Group();
const buildGroup:any = new Group();
buildGroup.visible = false;
const yangtzeRiverGroup:any = new Group();
const riverGroup:any = new Group();
riverGroup.visible = false;
const roadGroup:any = new Group();
let areaNameGroup:any = new Group();
group.add(mapGroup, buildGroup, riverGroup, roadGroup, mapLineGroup, yangtzeRiverGroup, areaNameGroup);
scene.add(group);
scene.background = new Color( 0x111111 );
let camera:any = null;
let renderer:any = null;
let controls:any = null;
let raycaster:any = null;
let mouse:any = null;
let interSected:any = null;
let landDepth:number = 100;
let transformX:number = 0;
let transformY:number = 0;
let zoom:number = 2.5;
let animateFlag:boolean = false;
let targetPosition:any = new Vector3(0,0,0);
let tipsRef:any = ref();
let cityListRef:any = ref();
let tips = ref<string>('');
let mousePosition:any = {x: 0, y: 0};

const load = new TextureLoader();
const texture = load.load(buildMap1);

const handleClick = data => {
  targetPosition.set(data.centroid[0] * 1000 - transformX, data.centroid[1] * 1000 - transformY, 100);
  animateFlag = true;
  controls.enabled = false;
}

// 相机
const initCamera = () => {
  camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 50000);
  camera.position.set(0, 0, 500);
  scene.add(new AxesHelper(5000));
}
initCamera();

// 渲染器
const initRenderer = () => {
  renderer = new WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.setSize(window.innerWidth, window.innerHeight);
  let canvas = document.getElementsByTagName('canvas');
  if (canvas.length) document.body.removeChild(canvas[0]);
  document.body.appendChild(renderer.domElement);
}

// 初始化灯光
const initLight = () => {
  const light = new DirectionalLight( 0xffffff);
  light.position.set( 0, 1, 1 );
  light.castShadow = true;
  scene.add(light, new AmbientLight(0X555555));

  // const light = new PointLight( 0xffffff);
  // light.position.set( -1500, -450, 300 );
  // scene.add(light, new PointLightHelper(light));
}

// 移入、点击事件
const initEvent = () => {
  raycaster = new Raycaster();
  mouse = new Vector2();
  const onDocumnetMouseMove = (event:MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mousePosition = {x: event.clientX, y:event.clientY}
  }
  document.addEventListener('mousemove', onDocumnetMouseMove, false)
  cityListRef.value.addEventListener('mousemove', (e) => {e.stopPropagation()}, false)
};

// 选中元素的处理
const selectedProcess = (intersects) => {
  const tipsEl = tipsRef.value ? tipsRef.value.$el : null
  if (intersects.length) {
    // 如果选择的是行政区块
    if (intersects[0].object.userData.adcode && buildGroup.visible) {
      if(interSected) interSected.material.color.setHex(interSected.currentHex);
      return;
    }
    if(interSected){
      if(interSected != intersects[0].object){
        // 原选择物颜色恢复
        interSected.material.color.setHex(interSected.currentHex);
        // 重新定义选择物
        interSected = intersects[0].object;
        const {name} = interSected.userData;
        tips.value = name || '';
        interSected.currentHex = interSected.material.color.getHex();
        interSected.material.color.set('#00c4ff');
      } else {
        const {name} = interSected.userData;
        if (name && tipsEl) {
          tipsEl.style.left = mousePosition.x + 12 + 'px';
          tipsEl.style.top = mousePosition.y + 12 + 'px';
        } else {
          if (tipsEl) tipsEl.style.display = 'none'
        }
      }
    } else {
      interSected = intersects[0].object;
      const {name} = interSected.userData;
      if (name && tipsEl) {
        tipsEl.style.display = 'block'
        tipsEl.style.left = mousePosition.x + 12 + 'px';
        tipsEl.style.top = mousePosition.y + 12 + 'px';
        tips.value = name
      }
      interSected.currentHex = interSected.material.color.getHex();
      interSected.material.color.set('#00c4ff');
    }
  } else {
    if(interSected){
      interSected.material.color.set(interSected.currentHex);
    }
    if (tipsEl) tipsEl.style.display = 'none'
    interSected = null;
  }
}

const animate = (event?) => {
  requestAnimationFrame(animate);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  // 地图动画
  if (animateFlag) {
    if (targetPosition.distanceTo(new Vector3(camera.position.x,camera.position.y, 100)) > 10) {
      console.log('动画中');
      camera.position.x -= (camera.position.x - targetPosition.x) / 30;
      camera.position.y -= (camera.position.y - targetPosition.y) / 30;
      camera.position.z -= (camera.position.z - targetPosition.z) / 5;
      controls.target.x = camera.position.x;
      controls.target.y = camera.position.y;
    } else {
      console.log('动画完成');
      animateFlag = false;
      controls.enabled = true;
      // if (zoom < 12 ) {
      //   mapLineGroup.visible = true;
      //   if (!mapLineGroup.children.length) drawMapLine(cq_land, '#666666');
      // }
      // if (zoom < 8 ) {
      //   buildGroup.visible = true;
      //   if (!buildGroup.children.length) if (!buildGroup.children.length) drawBuild(cq_build, '#666666');
      // }
      // if (zoom < 7 ) {
      //   drawRoads('#777777');
      //   drawRivers('#075272');
      // }
      // if (zoom < 5 ) {
      //   drawBuild(cq_build, '#cccccc');
      // }
      // initControls(camera.position.x, camera.position.y, camera.position.z);
    }
  }
  // 初始化时，不应该触发选中效果
  if (mouse.x === 0 && mouse.y === 0) return;
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObject(group);
  selectedProcess(intersects);
}

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new Vector3(0,0,0);
  controls.update();
  controls.addEventListener('change',throttle(() => {
    zoom = ZtoZoom(camera.position.z);
    console.log('当前缩放比例',zoom);
    // if (!animateFlag){
    buildGroup.visible = zoom < 5;
    areaNameGroup.visible = zoom > 5;
    roadGroup.visible = zoom < 7;
    riverGroup.visible = zoom < 9;
    // if (zoom > 9 && areaNameGroup.currentValue === 3) {
    //   drawMapName(cq_land, 12, '#2d2d2d');
    // }
    // if (zoom <= 9 && areaNameGroup.currentValue === 12) {
    //   drawMapName(cq_land, 3, '#2d2d2d');
    // }
    // }
  }, 500))
};

// 道路渲染
const drawRoads = (color) => {
  const yuzhong:any = drawRoadPlane(yuzhongRoad, color);
  yuzhong.position.z = landDepth + 0.015;
  const nanan:any = drawRoadPlane(nananRoad, color);
  nanan.position.z = landDepth + 0.015;
  const jiangbei:any = drawRoadPlane(jiangbeiRoad, color);
  jiangbei.position.z = landDepth + 0.015;
  const yubei:any = drawRoadPlane(yubeiRoad, color);
  yubei.position.z = landDepth + 0.015;
  roadGroup.add( yuzhong, nanan, jiangbei, yubei );
}

// 道路中线渲染
const drawRoadLines = (color) => {
  const yuzhong:any = drawRoadLine(yuzhongRoad, color);
  yuzhong.position.z = landDepth;
  const nanan:any = drawRoadLine(nananRoad, color);
  nanan.position.z = landDepth;
  const jiangbei:any = drawRoadLine(jiangbeiRoad, color);
  jiangbei.position.z = landDepth;
  const yubei:any = drawRoadLine(yubeiRoad, color);
  yubei.position.z = landDepth;
  roadGroup.add( yuzhong, nanan, jiangbei, yubei );
}

// 河流渲染
const drawRivers = (color) => {
  // 长江
  const yangtze:any = drawRiver(yangtzeRiver, color);
  yangtze.position.z = landDepth + 0.01;
  yangtzeRiverGroup.add(yangtze);
  // 江津
  const jiangjin:any = drawRiver(jiangjinRiver, color);
  jiangjin.position.z = landDepth + 0.01;
  // 合川
  const hechuan:any = drawRiver(hechuanRiver, color);
  hechuan.position.z = landDepth + 0.01;
  // 渝北
  const yubei:any = drawRiver(yubeiRiver, color);
  yubei.position.z = landDepth + 0.01;
  // 南岸
  const nanan:any = drawRiver(nananRiver, color);
  nanan.position.z = landDepth + 0.01;
  // 巴南
  const banan:any = drawRiver(bananRiver, color);
  banan.position.z = landDepth + 0.01;
  // 沙坪坝
  const shapingba:any = drawRiver(shapingbaRiver, color);
  shapingba.position.z = landDepth + 0.01;
  riverGroup.add(shapingba, banan, nanan, jiangjin, yubei, hechuan);
}

onMounted(() => {
  initRenderer();
  initLight();
  initControls();
  initEvent();
  // 地图渲染
  const mapPlane = drawMapPlane(cq_land, 0x999999, landDepth);
  // 地图轮廓线渲染
  const mapLine = drawMapLine(cq_land, '#000000');
  mapLine.position.z = landDepth;
  mapGroup.add(mapLine, mapPlane);
  // 地区名称渲染
  const areaName = drawAreaName(cq_land, 10, '#2d2d2d');
  areaName.position.z = landDepth;
  areaNameGroup.add(areaName);
  // 建筑物渲染
  const builds = drawBuild(cq_build, '#cccccc');
  builds.position.z = landDepth;
  buildGroup.add(builds);
  // 道路渲染
  drawRoads('#777777');
  // 道路中线渲染
  drawRoadLines('#bbbbbb');
  // 河流渲染
  drawRivers('#075272');
  // 将物体移动到中标中心
  let boxInfo = new Box3().setFromObject(group);
  // group.rotateX(-Math.PI / 4);
  transformX = (boxInfo.min.x + boxInfo.max.x) / 2;
  transformY = (boxInfo.min.y + boxInfo.max.y) / 2;
  group.translateX(-transformX);
  group.translateY(-transformY);
  group.translateZ(-landDepth);
  animate();
  zoomByMouse(camera, controls);
})
</script>
<style lang="less">
.cityBox {
  position: fixed;
  right: 10px;
  top: 10px;
  border: 1px solid #e3e1e1;
  font-size: 14px;
  background-color: rgba(#b7b5b5, 0.7);
  div {
    padding: 2px 10px;
    text-align: center;
    cursor: pointer;
    border-bottom: 1px solid #e3e1e1;
    transition: all 0.1s linear;
    &:hover {
      background-color: rgba(100,100,100, 0.3);
    }
  }
}
</style>
