<template>
  <Tips :tips="tips" ref="tipsRef" />
</template>

<script lang="ts" setup>
import {
  Scene,
  Group,
  ShapeGeometry,
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Mesh,
  ExtrudeGeometry,
  WebGLRenderer,
  AxesHelper,
  MeshStandardMaterial,
  MeshLambertMaterial,
  Color,
  Shape,
  Vector3,
  Box3,
  Raycaster,
  Vector2,
  SpotLight,
  SpotLightHelper,
  Object3D,
  TextureLoader,
  DoubleSide,
  PlaneGeometry,
  PCFSoftShadowMap,
  PointLight,
  Path,
  BoxGeometry,
  PointLightHelper
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { MapControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { data as cq_land } from "@/assets/map/cq";
import { data as cq_build } from "@/assets/map/cq_build";
import { data as yangtzeRiver } from "@/assets/map/river/yangtzeRiver";
import { data as test } from "@/assets/map/test";
import { data as road_yuzhong } from "@/assets/map/road/yuzhong";
import {throttle, randomColor, drawLine, createText, offset} from "@/utils/dpm";
import {onMounted, ref, reactive} from "vue";
import Tips from '@/components/Tips.vue';
import {createSpotLight, ZoomToZ, ZtoZoom, loadTexture} from "@/utils/tools";
import buildMap from "@/assets/images/build.jpg";

const scene:any = new Scene();
const group:any = new Group();
const mapGroup:any = new Group();
mapGroup.receiveShaow = true;
const mapLineGroup:any = new Group();
const buildGroup:any = new Group();
buildGroup.visible = false;
const riverGroup:any = new Group();
riverGroup.visible = false;
const roadGroup:any = new Group();
group.add(mapGroup, buildGroup, riverGroup, roadGroup, mapLineGroup);
scene.add(group);
scene.background = new Color( 0x111111 );
let camera:any = null;
let renderer:any = null;
let controls:any = null;
let raycaster:any = null;
let mouse:any = null;
let interSected:any = null;
let zoom:number = 2.5;
let animateFlag:boolean = false;
let tipsRef:any = ref();
let tips = ref<string>('');
let mousePosition:any = {x: 0, y: 0};

const load = new TextureLoader();
const texture = load.load(buildMap);

// 鼠标控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new Vector3(-1200,-620,0);
  controls.addEventListener('change',throttle(() => {
    zoom = ZoomToZ(camera.position.z);
    if (!animateFlag){
      // mapLineGroup.visible = zoom < 12;
      buildGroup.visible = zoom < 5;
      riverGroup.visible = zoom < 14;
    }
  }, 300))
};

// 相机
const initCamera = () => {
  camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.set(-1200, -620, 500);
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
  light.position.set( 0, 1, 1 );
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
    const geometry = new ShapeGeometry(shape);
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
      array.push(t[0] * 1000, t[1] *1000, 0.1)
    })
    array.push(arrayList[0][0] * 1000,arrayList[0][1] * 1000,0.1)
    const mesh = drawLine(array, color);
    mesh.userData = it.properties;
    mapLineGroup.add(mesh)
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
    // const material = loadTexture(buildMap);
    const material = new MeshLambertMaterial({color, map: texture});
    const mesh = new Mesh(geometry,material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = it.properties;
    buildGroup.add(mesh)
  })
}

// 绘制河流湖泊
const drawRiver = (data, color) => {
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
    const depth = Number(Math.random().toFixed(2));
    const geometry = new ExtrudeGeometry(shape, {depth: 0.01, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.userData = it.properties;
    riverGroup.add(mesh);
  })
}

// 绘制道路
const drawRoadLine = (data, color) => {
  data.features.forEach(it => {
    const arrayList = it.geometry.coordinates[0];
    const array:number[] = [];
    arrayList.forEach((t, i) => {
      array.push(t[0] * 1000, t[1] *1000, 0.02)
    })
    const mesh = drawLine(array, color);
    mesh.userData = it.properties;
    roadGroup.add(mesh)
  })
}

// 绘制道路
const drawRoad = (data, color) => {
  data.features.forEach(it => {
    const arrayList = it.geometry.coordinates[0];
    var shape = new Shape();
    shape.autoClose = true;
    const newArray:number[][] = [];
    let prevPoint:number[] = [];
    arrayList.forEach((it, i) => {
      if (prevPoint.length) {
        const p = offset( prevPoint, it, 0.0001);
        newArray.push(p[0], p[1]);
      }
      prevPoint = it;
    });
    newArray.reverse();
    newArray.forEach(it => {
      arrayList.push(it);
    })
    arrayList.forEach((t, i) => {
      if (!i) {
        shape.moveTo(t[0] * 1000,t[1] * 1000);
      } else {
        shape.lineTo(t[0] * 1000,t[1] * 1000);
      }
    })
    const geometry = new ShapeGeometry(shape);
    // const geometry = new ExtrudeGeometry(shape, {depth: 0.001, bevelEnabled: false});
    const material = new MeshLambertMaterial({color});
    const mesh = new Mesh(geometry,material);
    mesh.position.z = 0.01;
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
  controls.update();
  renderer.render(scene, camera);
  const z = ZtoZoom(2.5);
  // 地图动画
  // if (animateFlag) {
  //   if (camera.position.z - z > 3) {
  //     camera.position.z -= (camera.position.z - z) / 30;
  //   } else if (camera.position.z > z) {
  //     camera.position.z -= 0.5;
  //   } else {
  //     animateFlag = false;
  //     if (zoom < 12 ) {
  //       mapLineGroup.visible = true;
  //       if (!mapLineGroup.children.length) drawMapLine(cq_land, '#666666');
  //     }
  //     if (zoom < 8 ) {
  //       buildGroup.visible = true;
  //       if (!buildGroup.children.length) if (!buildGroup.children.length) drawBuild(cq_build, '#666666');
  //     }
  //   }
  // }
  // 初始化时，不应该触发选中效果
  if (mouse.x === 0 && mouse.y === 0) return;
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObject(group);
  selectedProcess(intersects);
}

const drawPlan = () => {
  const coordinates = [ [108.103863, 30.573382],  [108.12645, 30.564], [108.143587, 30.566215], [108.153063, 30.545879], [108.152523, 30.535931], [108.163374, 30.540805], [108.171378, 30.539314], [108.165633, 30.524411], [108.175552, 30.510633], [108.184537, 30.518167], [108.195045, 30.514501], [108.207811, 30.49766], [108.230496, 30.476705], [108.232755, 30.45502], [108.241937, 30.443773], [108.223622, 30.421274], [108.236732, 30.409216], [108.254261, 30.403529], [108.261479, 30.388605], [108.275031, 30.405546], [108.296538, 30.401109], [108.298944, 30.407562], [108.315835, 30.425387], [108.317062, 30.433129], [108.33248, 30.449336], [108.338814, 30.470337], [108.344657, 30.476987], [108.378734, 30.534884], [108.394593, 30.536737], [108.404315, 30.548295], [108.410404, 30.543261], [108.409717, 30.532749], [108.402253, 30.529688], [108.399553, 30.520504], [108.409962, 30.517563], [108.412368, 30.503059], [108.427786, 30.512567], [108.42101, 30.497176], [108.424054, 30.488956], [108.440994, 30.491011], [108.45268, 30.495968], [108.455086, 30.489319], [108.479146, 30.488956], [108.491765, 30.501488], [108.513124, 30.501407], [108.528297, 30.487505], [108.639904, 30.574751], [108.654487, 30.585017], [108.666223, 30.5886], [108.690479, 30.586708], [108.700004, 30.561786],  [108.726176, 30.515548], [108.723966, 30.507572], [108.744196, 30.494799], [108.761529, 30.505315], [108.77292, 30.503502], [108.788534, 30.51293], [108.799239, 30.50592], [108.806948, 30.491414], [108.839011, 30.50318], [108.853005, 30.514984], [108.854429, 30.521913], [108.871663, 30.532749], [108.893121, 30.557799], [108.894643, 30.56702], [108.90952, 30.581273], [108.869896, 30.610979], [108.871565, 30.618103], [108.901713, 30.646792], [108.899946, 30.676438], [108.896312, 30.684039], [108.884331, 30.687337], [108.883546, 30.695661], [108.872007, 30.690112], [108.836016, 30.678449], [108.828699, 30.679414], [108.823347, 30.69168], [108.818094, 30.693771], [108.785883, 30.683516], [108.779254, 30.685125], [108.781022, 30.697028], [108.79261, 30.706558], [108.789762, 30.714277], [108.763444, 30.713031], [108.766586, 30.720548], [108.762609, 30.728106], [108.76639, 30.74141], [108.754998, 30.740044], [108.749842, 30.74555], [108.740169, 30.775527], [108.74724, 30.782116], [108.740808, 30.787259], [108.738549, 30.808026], [108.733393, 30.81405], [108.715177, 30.815094], [108.699955, 30.811841], [108.698482, 30.822885], [108.685127, 30.835976], [108.685078, 30.845773], [108.671968, 30.852116], [108.665977, 30.867972], [108.653014, 30.89105], [108.634798, 30.885271], [108.625419, 30.875358], [108.621589, 30.888561], [108.623013, 30.912837], [108.628169, 30.918253], [108.619233, 30.926999], [108.61884, 30.934741], [108.608578, 30.93807], [108.593307, 30.920259], [108.566448, 30.912396], [108.552602, 30.915405], [108.537577, 30.958123], [108.523632, 30.973159], [108.531243, 30.978051], [108.533894, 30.996251], [108.51666, 30.990559], [108.506643, 30.992604], [108.501094, 30.98651], [108.50409, 30.977289], [108.496626, 30.972839], [108.486413, 30.977008], [108.460537, 30.967426], [108.454743, 30.970232], [108.45327, 30.988755], [108.455626, 30.994728], [108.440356, 31.002545], [108.426509, 30.998216], [108.41497, 30.998897], [108.395674, 30.991641], [108.372792, 30.969791], [108.355214, 30.960408], [108.339649, 30.963135], [108.349027, 30.939153], [108.360861, 30.932976], [108.346277, 30.921222], [108.300269, 30.901041], [108.29202, 30.892976], [108.268402, 30.881659], [108.260055, 30.872789], [108.243803, 30.882261], [108.244294, 30.89113], [108.228237, 30.881298], [108.231184, 30.87612], [108.225488, 30.860908], [108.229956, 30.856171], [108.218417, 30.852839], [108.200102, 30.839188], [108.197254, 30.833647], [108.18218, 30.824211], [108.167106, 30.827182], [108.157482, 30.834771], [108.152179, 30.831278], [108.131704, 30.832001], [108.126057, 30.840875], [108.122866, 30.833487], [108.109608, 30.82931], [108.105287, 30.841356], [108.096646, 30.84782], [108.090115, 30.871545], [108.101654, 30.878007], [108.081817, 30.885712], [108.071751, 30.892695], [108.069149, 30.888281], [108.041112, 30.876522], [108.0363, 30.8701], [108.029426, 30.884508], [108.009392, 30.907662], [108.000849, 30.911915], [107.994711, 30.908665], [107.986953, 30.901924], [107.95597, 30.882983], [107.954202, 30.872428], [107.929504, 30.859342], [107.896508, 30.834932], [107.876131, 30.813287], [107.88492, 30.806138], [107.905592, 30.77601], [107.908243, 30.762911], [107.918653, 30.75829], [107.959112, 30.719262], [108.011405, 30.709814], [108.03517, 30.715362], [108.047544, 30.723684], [108.074894, 30.723121], [108.086678, 30.713714], [108.074844, 30.696304], [108.082259, 30.677926], [108.079558, 30.664532], [108.0554, 30.660027], [108.042585, 30.662481], [108.025645, 30.648844], [108.023091, 30.63617], [108.016954, 30.629571], [108.025252, 30.60289], [108.033697, 30.592424], [108.028051, 30.587432], [108.034778, 30.574187]]
  const shape = new Shape();
  coordinates.forEach((t, i) => {
    if (!i) {
      shape.moveTo(t[0] * 1000,t[1] * 1000);
    } else {
      shape.lineTo(t[0] * 1000,t[1] * 1000);
    }
  })
  const geometry = new ShapeGeometry(shape);
  const material = new MeshLambertMaterial({color: 0xffffff});
  const plane = new Mesh( geometry, material );

  // const geometry = new PlaneGeometry( 10000, 10000 );
  // const material = new MeshStandardMaterial();
  // const plane = new Mesh( geometry, material );
  // plane.rotateX(-Math.PI / 2);
  // plane.position.z = 5;
  // plane.position.x = -1000;
  // plane.position.y = -500;
  plane.castShadow = true;
  plane.receiveShadow = true;
  group.add( plane );
}
// drawPlan();

onMounted(() => {
  initCamera();
  initRenderer();
  initLight();
  initControls();
  initEvent();
  // 绘制平面地图
  drawMap(cq_land, 0x999999);
  // 绘制长江
  // drawRiver(test, '#075272');
  drawRiver(yangtzeRiver, '#075272');
  // 绘制地图轮廓线
  drawMapLine(cq_land, '#000000');
  // 绘制建筑物
  drawBuild(cq_build, '#cccccc');
  // 绘制道路
  drawRoad(road_yuzhong, '#777777');
  // drawRoadLine(cq_road, '#ffffff');
  // 将物体移动到中标中心
  let boxInfo = new Box3().setFromObject(group);
  // group.rotateX(-Math.PI / 2);
  group.translateX(-(boxInfo.min.x + boxInfo.max.x) / 2);
  group.translateY(-(boxInfo.min.y + boxInfo.max.y) / 2);
  animate();
})
</script>
