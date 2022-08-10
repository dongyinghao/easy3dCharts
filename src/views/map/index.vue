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
import {throttle, randomColor, drawLine, createText, offset} from "@/utils/dpm";
import {onMounted, ref, reactive, transformVNodeArgs} from "vue";
import Tips from '@/components/Tips.vue';
import {createSpotLight, ZoomToZ, ZtoZoom, loadTexture} from "@/utils/tools";
import buildMap from "@/assets/images/build.jpg";
import buildMap1 from "@/assets/images/build1.webp";
import buildMap2 from "@/assets/images/build2.webp";
import {Coordinate} from "@/utils/type";

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
areaNameGroup.name = 'areaNameGroup';
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
  light.position.set( 0, -1, 1 );
  light.castShadow = true;
  scene.add(light, new AmbientLight(0X666666));

  // const light = new PointLight( 0xffffff);
  // light.position.set( -1400, -450, 200 );
  // scene.add(light, new AmbientLight(0X222222), new PointLightHelper(light));
}

// 绘制地图
const drawMap = (data, color) => {
  data.features.forEach(it => {
    if (!it.properties.name) return;
    const array = it.geometry.coordinates[0][0];
    const shape = new Shape();
    shape.autoClose = true;
    array.forEach((t, i) => {
      if (!i) {
        shape.moveTo(t[0] * 1000,t[1] * 1000);
      } else {
        shape.lineTo(t[0] * 1000,t[1] * 1000);
      }
    })
    const geometry = new ExtrudeGeometry(shape, {depth: landDepth, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.receiveShadow = true;
    mesh.userData = it.properties;
    mapGroup.add(mesh);
  })
}

// 绘制地图轮廓线
const drawMapLine = (data, color) => {
  data.features.forEach(it => {
    if (!it.properties.name) return;
    const arrayList = it.geometry.coordinates[0][0];
    const array:number[] = [];
    arrayList.forEach((t, i) => {
      array.push(t[0] * 1000, t[1] *1000, landDepth + 0.1)
    })
    array.push(arrayList[0][0] * 1000,arrayList[0][1] * 1000,landDepth + 0.1)
    const mesh = drawLine(array, {color, type: 'dashed'});
    mesh.userData = it.properties;
    if (it.properties.name) {
      createText({
        font: it.properties.name,
        size: 12,
        height: 0.3,
        x: it.properties.centroid[0] * 1000,
        y: it.properties.centroid[1] * 1000,
        z: landDepth + 0.2,
        color: '#2d2d2d',
      }, text => {
        areaNameGroup.add(text);
      });
    }
    mapLineGroup.add(mesh);
  })
}

// 绘制地图区域名称
const drawMapName = (data, fs, color?) => {
  const names = group.getObjectByName('areaNameGroup');
  if (names && names.children.length) {
    names.children = [];
  }
  data.features.forEach(it => {
    if (!it.properties.name) return;
    createText({
      font: it.properties.name,
      size: fs,
      height: 0.3,
      x: it.properties.centroid[0] * 1000,
      y: it.properties.centroid[1] * 1000,
      z: landDepth + 0.2,
      color,
    }, text => {
      areaNameGroup.currentValue = fs;
      areaNameGroup.add(text);
    });
  })
}

// 绘制建筑物
const drawBuild = (data, color) => {
  data.features.forEach(it => {
    const array = it.geometry.coordinates[0][0];
    const shape = new Shape();
    shape.autoClose = true;
    array.forEach((t, i) => {
      if (!i) {
        shape.moveTo(t[0] * 1000,t[1] * 1000);
      } else {
        shape.lineTo(t[0] * 1000,t[1] * 1000);
      }
    })
    const depth = Math.max(0.3,Number(Math.random().toFixed(2)));
    const geometry = new ExtrudeGeometry(shape, {depth, bevelEnabled: false});
    // const material = new MeshLambertMaterial({color,map: texture});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = it.properties;
    buildGroup.add(mesh);
    buildGroup.position.z = landDepth;
  })
}

// 绘制河流湖泊
const drawRiver = (data, color, group) => {
  data.features.forEach(it => {
    const shape = new Shape();
    shape.autoClose = true;
    it.geometry.coordinates[0].forEach((item, idx) => {
      if (!idx) {
        item.forEach((t, i) => {
          if (!i) {
            shape.moveTo(t[0] * 1000,t[1] * 1000);
          } else {
            shape.lineTo(t[0] * 1000,t[1] * 1000);
          }
        })
      } else { // 内轮廓
        const hole = new Path();
        item.forEach((t, i) => {
          if (!i) {
            hole.moveTo(t[0] * 1000,t[1] * 1000);
          } else {
            hole.lineTo(t[0] * 1000,t[1] * 1000);
          }
        })
        shape.holes.push(hole);
      }
    })
    const geometry = new ShapeGeometry(shape);
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.userData = it.properties;
    group.add(mesh);
    group.position.z = 100.01
  })
}

// 绘制道路中线
const drawRoadLine = (data, color) => {
  data.features.forEach(it => {
    const arrayList = it.geometry.coordinates[0];
    const array:number[] = [];
    arrayList.forEach((t, i) => {
      array.push(t[0] * 1000, t[1] *1000, landDepth + 0.02)
    })
    const mesh = drawLine(array, {color});
    mesh.userData = it.properties;
    roadGroup.add(mesh)
  })
}

// 绘制道路
const drawRoad = (data, color) => {
  data.features.forEach(it => {
    const arrayList = it.geometry.coordinates[0];
    const leftArray:number[][] = [];
    const rightArray:number[][] = [];
    let prevPoint:number[] = [];
    arrayList.forEach(it => {
      if (prevPoint.length) {
        const p1 = offset( prevPoint, it, 0.00005, 1);
        const p2 = offset( prevPoint, it, 0.00005, 0);
        leftArray.push(p1[0], p1[1]);
        rightArray.push(p2[0], p2[1]);
      }
      prevPoint = it;
    });
    rightArray.reverse();
    rightArray.forEach(it => {
      leftArray.push(it);
    })
    var shape = new Shape();
    shape.autoClose = true;
    leftArray.forEach((t, i) => {
      if (!i) {
        shape.moveTo(t[0] * 1000,t[1] * 1000);
      } else {
        shape.lineTo(t[0] * 1000,t[1] * 1000);
      }
    })
    const geometry = new ShapeGeometry(shape);
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.position.z = landDepth + 0.015;
    roadGroup.add( mesh );
  })
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
    if (intersects[0].object.userData.adcode) {
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
      // controls.target.z = camera.position.z;
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
  let intersects = raycaster.intersectObject(buildGroup);
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

// 绘制道路
const drawRoads = (color) => {
  drawRoad(yuzhongRoad, color);
  drawRoad(nananRoad, color);
  drawRoad(jiangbeiRoad, color);
  drawRoad(yubeiRoad, color);
}

// 绘制道路
const drawRoadLines = (color) => {
  drawRoadLine(yuzhongRoad, color);
  drawRoadLine(nananRoad, color);
  drawRoadLine(jiangbeiRoad, color);
  drawRoadLine(yubeiRoad, color);
}

// 绘制河流
const drawRivers = (color) => {
  drawRiver(yangtzeRiver, color, yangtzeRiverGroup);
  drawRiver(jiangjinRiver, color, riverGroup);
  drawRiver(hechuanRiver, color, riverGroup);
  drawRiver(yubeiRiver, color, riverGroup);
  drawRiver(nananRiver, color, riverGroup);
  drawRiver(bananRiver, color, riverGroup);
  drawRiver(shapingbaRiver, color, riverGroup);
}

onMounted(() => {
  initCamera();
  initRenderer();
  initLight();
  initControls();
  initEvent();
  // 绘制平面地图
  drawMap(cq_land, 0x999999);
  // 绘制地图轮廓线
  drawMapLine(cq_land, '#000000');
  // 绘制地图轮廓线
  drawMapName(cq_land, 12, '#2d2d2d');
  // 绘制建筑物
  drawBuild(cq_build, '#cccccc');
  // 绘制道路
  drawRoads('#777777');
  // 绘制道路中线
  drawRoadLines('#bbbbbb');
  // 绘制河流
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
  document.body.addEventListener('mousewheel',  (event:any) =>{
    const factor = camera.position.z / 20;
    const x = ( event.clientX / window.innerWidth ) * 2 - 1;
    const y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    // 这里定义深度值为0.5，深度值越大，意味着精度越高
    var vector = new Vector3(x, y, 0.5 );
    // 转换为3D空间坐标
    vector.unproject(camera);
    // 获得从相机指向鼠标所对应的3D空间点的射线
    vector.sub( camera.position ).normalize();
    camera.position.x += vector.x * factor * (event.deltaY / -100);
    camera.position.y += vector.y * factor * (event.deltaY / -100);
    controls.target.x += vector.x * factor * (event.deltaY / -100);
    controls.target.y += vector.y * factor * (event.deltaY / -100);
    controls.update();
  });
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
