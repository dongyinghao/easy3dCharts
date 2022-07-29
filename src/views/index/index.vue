<template>
  <div class="container" ref="containerRef"></div>
  <Tips :tips="tips" ref="tipsRef" />
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import {
  Group, Scene, Color, PerspectiveCamera, AxesHelper, Raycaster, MeshLambertMaterial, Mesh, Box3, DirectionalLight,
  AmbientLight, WebGLRenderer, Vector3, Vector2, BoxGeometry, SphereGeometry
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createText, initLabelZ, drawLine, initLabelX, throttle, generateParams } from '@/utils/dpm';
import {ChartConfig, ChartParams, spaceConfig} from '@/utils/type.d';
import Tips from '@/components/Tips.vue';

const options = {
  title: '初三2班期末考试成绩表',
  titleColor: '#00a6ff',
  titleSize: 4,
  titlePosition: 'center',
  config: {
    cellPaddingX: 10, // 单元X方向两边空隙
    cellPaddingZ: 6, // 单元Z方向两边空隙
    cellWidth: 5, // 柱子X轴长度
    cellDepth: 5, // 柱子Z轴长度
  },
  series: [
    {
      name: '陈紫烟',
      type: 'line',
      cellColor: '#7b00ff',
      data: [
        {
          value: 62,
          label: '语文'
        },
        {
          value: 97,
          label: '数学'
        },
        {
          value: 40,
          label: '英语'
        },
        {
          value: 79,
          label: '物理'
        },
        {
          value: 84,
          label: '化学'
        }
      ]
    },
    {
      name: '李阿铭',
      type: 'bar',
      cellColor: '#1495a1',
      data: [
        {
          value: 87,
          label: '语文'
        },
        {
          value: 81,
          label: '数学'
        },
        {
          value: 95,
          label: '英语'
        },
        {
          value: 65,
          label: '物理'
        },
        {
          value: 77,
          label: '化学'
        }
      ]
    },
    {
      name: '马冬梅',
      type: 'line',
      cellColor: '#66ff00',
      data: [
        {
          value: 54,
          label: '语文'
        },
        {
          value: 67,
          label: '数学'
        },
        {
          value: 45,
          label: '英语'
        },
        {
          value: 61,
          label: '物理'
        },
        {
          value: 37,
          label: '化学'
        }
      ]
    },
  ]
}
// 鼠标相交的物体
let interSected:any = null;
// 提示框
let tipsRef:any = ref()
// 表格框
let containerRef:any = ref()
// 提示文案
let tips = ref<string>('')
// X轴显示位置
let sideFlagX = ref<boolean>(false);
// Y轴显示位置
let sideFlagY = ref<boolean>(false);
// Z轴显示位置
let sideFlagZ = ref<boolean>(false);
// 绘图参数
let c:ChartParams;
// 鼠标移入时的水平提示线
let planTip:any = new Group();

// 全局变量
let scene:any = null;
let charts:any = new Group();
charts.add(planTip);
let camera:any = null;
let renderer:any = null;
let controls:any = null;
let raycaster:any = null;
let mouse:any = null;

// 场景
const initScene = () => {
  scene = new Scene();
  scene.background = new Color( 0x111111 );
  scene.add(charts);
};

// 相机
const initCamera = () => {
  camera = new PerspectiveCamera(75, containerRef.value.clientWidth / containerRef.value.clientHeight, 1, 900);
  camera.position.set(40, 50, 100);
};

// 坐标辅助线
const axisHelper = () => {
  scene.add(new AxesHelper(5000));
};

// 灯光
const initLight = () => {
  const light = new DirectionalLight( 0xffffff);
  light.position.set( 0, 0, 1 );
  light.castShadow = true;
  scene.add(new AmbientLight( 0xdddddd ), light);
};

// 渲染器
const initRenderer = () => {
  renderer = new WebGLRenderer({ alpha: true, antialias:true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  let canvas = containerRef.value.getElementsByTagName('canvas');
  if (canvas.length) containerRef.value.removeChild(canvas[0]);
  containerRef.value.appendChild(renderer.domElement);
};

// 移入、点击事件
const initEvent = () => {
  raycaster = new Raycaster();
  mouse = new Vector2();
  const info = containerRef.value.getBoundingClientRect();
  const onDocumnetMouseMove = (event) => {
    if (containerRef.value) {
      mouse.x = ((event.clientX - info.x) / containerRef.value.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - info.y) / containerRef.value.clientHeight) * 2 + 1;
      animate(event);
    }
  }
  document.addEventListener('mousemove', onDocumnetMouseMove, false)
};

// 绘制柱子
const drawBarChart = (data, config, idx) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, cellDepth = 5, cellWidth = 5} = config;
  let mesh:any = null;
  data.data.forEach((it, i:number) =>{
    const material = new MeshLambertMaterial({ color: data.cellColor });
    const geometry = new BoxGeometry(cellWidth, it.value, cellDepth);
    mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.x = (cellPaddingX + cellWidth) * i + cellPaddingX + cellWidth / 2;
    mesh.position.z = (cellPaddingZ + cellDepth) * idx + cellPaddingZ + cellDepth / 2;
    mesh.position.y = (it.value / 2);
    mesh.userData.type = 'bar';
    mesh.userData.data = {...it, name: data.name};
    charts.add(mesh);
    //  柱顶文字
    createText({
      font: it.value.toString(),
      size: 2,
      height: 0.3,
      x: mesh.position.x,
      y: it.value + 1,
      z: mesh.position.z,
      color: '#ff0000',
    }, text => {
      charts.add(text);
    });
  })
}

// 绘制柱子
const drawLineChart = (data, config:spaceConfig, idx:number) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, cellDepth = 5, cellWidth = 5} = config;
  const array:number[] = [];
  const geometry = new SphereGeometry( 1, 10, 10 );
  data.data.forEach((it, i) => {
    // 收集折线数据
    let x:number = (cellPaddingX + cellWidth) * i + cellPaddingX + cellWidth / 2;
    const z = (cellPaddingZ + cellDepth) * idx + cellPaddingZ + cellDepth / 2;
    const y = it.value;
    array.push(x,y,z);
    // 绘制折线节点
    const material = new MeshLambertMaterial( { color: data.cellColor } );
    const sphere = new Mesh( geometry, material );
    sphere.position.x = x;
    sphere.position.y = y;
    sphere.position.z = z;
    sphere.userData.type = 'bar';
    sphere.userData.data = {...it,name: data.name};
    charts.add(sphere);
  })
  // 绘制折线
  const mesh = drawLine(array, data.cellColor);
  mesh.userData.type = 'line';
  mesh.userData.data = {name: data.name};
  charts.add(mesh);
}

// 绘制内容
const initContent = (data) => {
  const {series, config} = data;
  series.forEach((item, idx:number) => {
    if (item.type === 'line') {
      drawLineChart(item, config, idx);
    } else if (item.type === 'bar') {
      drawBarChart(item, config, idx);
    }
  });
};

// 绘制X轴网格,顺时针绘制
const initGridX = (c) => {
  const {cellPaddingZ, cellDepth, bx, by, bz, stepY, itemSize} = c;
  const len = Math.floor(by / stepY);
  const gridX_left = new Group();
  gridX_left.name = 'gridX_left';
  const gridX_right = new Group();
  gridX_right.name = 'gridX_right';
  charts.add(gridX_left, gridX_right)
  for(let i = 0;i <= len;i++) {
    const y = stepY * i;
    const lineHX_left = drawLine([0, y, bz, 0, y, 0]);
    const lineHX_right = drawLine([bx, y, bz, bx, y, 0]);
    lineHX_left.userData.type = 'lineHX'
    lineHX_right.userData.type = 'lineHX'
    gridX_left.add(lineHX_left);
    gridX_right.add(lineHX_right);
    // 绘制左侧y轴坐标值
    createText({
      font: (stepY * i).toString(),
      size: 3,
      height: 0.3,
      color: '#1495a1',
      x: -3,
      y: stepY * i - 1,
      z: bz + 1,
    },(mesh:any) => {
      gridX_left.add(mesh);
    });
    // 绘制右侧y轴坐标值
    createText({
      font: (stepY * i).toString(),
      size: 3,
      height: 0.3,
      color: '#1495a1',
      x: bx + 2,
      y: stepY * i - 1,
      z: bz + 1,
    },(mesh:any) => {
      gridX_right.add(mesh);
    });
  }
  for(let i = 0; i <= itemSize + 1; i++) {
    let z = 0;
    if (i === 0) {
      z = 0;
    } else if (i === itemSize + 1) {
      z = bz;
    } else {
      z = (cellPaddingZ + cellDepth) * (i - 1) + cellPaddingZ + cellDepth / 2
    }
    const lineVX_left = drawLine([0, by, z, 0, 0, z]);
    const lineVX_right = drawLine([bx, by, z, bx, 0, z]);
    lineVX_left.userData.type = 'lineVX'
    lineVX_right.userData.type = 'lineVX'
    gridX_left.add(lineVX_left);
    gridX_right.add(lineVX_right);
  }
  gridX_right.visible = false;
}

// 绘制Y轴网格
const initGridY = (c) => {
  const {cellPaddingZ, cellDepth, cellWidth, cellPaddingX, bx, by, bz, itemSize, cellSize} = c;
  const gridY_bottom = new Group();
  gridY_bottom.name = 'gridY_bottom';
  const gridY_top = new Group();
  gridY_top.name = 'gridY_top';
  gridY_top.visible = false;
  charts.add(gridY_bottom, gridY_top)
  for(let i = 0; i <= itemSize + 1; i++) {
    let z:number;
    if (i === 0) {
      z = 0;
    } else if (i === itemSize + 1){
      z = bz;
    } else {
      z = (cellPaddingZ + cellDepth) * (i - 1) + cellPaddingZ + cellDepth / 2
    }
    const lineVY_bottom = drawLine([0, 0, z, bx, 0, z]);
    const lineVY_top = drawLine([0, by, z, bx, by, z]);
    lineVY_bottom.userData.type = 'lineVY'
    lineVY_top.userData.type = 'lineVY'
    gridY_bottom.add(lineVY_bottom);
    gridY_top.add(lineVY_top);
  }
  for(let i = 0; i <= cellSize + 1; i++) {
    let x:number;
    if (i === 0) {
      x = 0;
    } else if (i === cellSize + 1){
      x = bx;
    } else {
      x = (cellPaddingX + cellWidth) * (i - 1) + cellPaddingX + cellWidth / 2
    }
    const lineHY_bottom = drawLine([x, 0, bz, x, 0, 0]);
    lineHY_bottom.userData.type = 'lineHY'
    gridY_bottom.add(lineHY_bottom);
    const lineHY_top = drawLine([x, by, bz, x, by, 0]);
    lineHY_top.userData.type = 'lineHY'
    gridY_top.add(lineHY_top);
  }
}

// 绘制Z轴网格
const initGridZ = (c) => {
  const {cellPaddingX, cellWidth, bx, by, bz, stepY, cellSize} = c;
  const len = Math.floor(by / stepY);
  const gridZ_front = new Group();
  gridZ_front.name = 'gridZ_front';
  gridZ_front.visible = false;
  const gridZ_back = new Group();
  gridZ_back.name = 'gridZ_back';
  charts.add(gridZ_front, gridZ_back)
  for(let i = 0; i<= cellSize + 1; i++) {
    let x:number;
    if (i === 0) {
      x = 0;
    } else if (i === cellSize + 1) {
      x = bx;
    } else {
      x = (cellPaddingX + cellWidth) * (i - 1) + cellPaddingX + cellWidth / 2
    }
    const lineVZ_front = drawLine([x, 0, bz, x, by, bz]);
    lineVZ_front.userData.type = 'lineVZ'
    gridZ_front.add(lineVZ_front);

    const lineVZ_back = drawLine([x, 0, 0, x, by, 0]);
    lineVZ_back.userData.type = 'lineVZ'
    gridZ_back.add(lineVZ_back);
  }
  for(let i = 0;i <= len;i++) {
    const x = bx;
    const y = stepY * i;
    const lineHZ_back = drawLine([0,y,0, x,y,0]);
    lineHZ_back.userData.type = 'lineHZ'
    gridZ_back.add(lineHZ_back);
    const lineHZ_front = drawLine([0,y, bz, x, y, bz]);
    lineHZ_front.userData.type = 'lineHZ'
    gridZ_front.add(lineHZ_front);
  }
}

// 绘制图表标题
const initTitle = (data, c:ChartParams) => {
  createText({
    font: data.title,
    size: data.titleSize,
    height: 1,
    x: data.titlePosition === 'center' ? c.bx / 2 : 0,
    y: c.by + 6,
    color: data.titleColor,
  }, (mesh:any) => {
    charts.add(mesh);
  })
}

const animate = (event?) => {
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObject(charts);
  const tipsEl = tipsRef.value.$el
  if(intersects.length > 0){
    // 找到离相机最近的一个被选中的cell项
    const bar = intersects.find(it => it.object.userData.type === 'bar');
    if (bar) {
      if(interSected){
        if(interSected != bar.object){
          // 原选择物颜色恢复
          interSected.material.color.setHex(interSected.currentHex);
          // 重新定义选择物
          interSected = bar.object;
          const {label, name, value} = interSected.userData.data;
          tips.value = name + '<br>' + label + ':' + value
          interSected.currentHex = interSected.material.color.getHex();
          interSected.material.color.set(0xff0000);
        } else {
          // 绘制xz轴提示线
          drawXZTip(options, {x: interSected.position.x, y: bar.point.y, z: interSected.position.z}, c);
          tipsEl.style.left = event.clientX + 12 + 'px';
          tipsEl.style.top = event.clientY + 12 + 'px';
        }
      } else {
        tipsEl.style.display = 'block'
        tipsEl.style.left = event.clientX + 12 + 'px';
        tipsEl.style.top = event.clientY + 12 + 'px';
        interSected = bar.object;
        const {label, name, value} = interSected.userData.data;
        tips.value = name + '<br>' + label + ':' + value
        interSected.currentHex = interSected.material.color.getHex();
        interSected.material.color.set(0xff0000);
      }
    } else {
      if (interSected) {
        tipsEl.style.display = 'none'
        interSected.material.color.setHex(interSected.currentHex);
        interSected = null;
      }
      if (planTip) planTip.visible = false;
    }
  } else {
    tipsEl.style.display = 'none'
    if(interSected){
      interSected.material.color.set(interSected.currentHex);
    }
    interSected = null;
  }
}

// 鼠标控制器
const initControls = (c:ChartParams) => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new Vector3(40,45,0);
  controls.update();
  controls.autoRotate = false;
  controls.addEventListener('change',throttle(() => {
    let box = new Box3().setFromObject(charts);

    // x轴边界线
    const boundaryX = box.min.x + (sideFlagX.value ? c.bx : 0)
    if (sideFlagX.value !== camera.position.x < boundaryX) {
      charts.getObjectByName('gridX_right').visible = !sideFlagX.value
      charts.getObjectByName('gridX_left').visible = sideFlagX.value
    }
    sideFlagX.value = camera.position.x < boundaryX;

    // y轴边界线
    const boundaryY = box.min.y + (sideFlagY.value ? c.by : 0)
    if (sideFlagY.value !== camera.position.y < boundaryY) {
      charts.getObjectByName('gridY_top').visible = !sideFlagY.value
      charts.getObjectByName('gridY_bottom').visible = sideFlagY.value
    }
    sideFlagY.value = camera.position.y < boundaryY;

    // z轴边界线
    const boundaryZ = box.min.z + (sideFlagZ.value ? c.bz : 0)
    if (sideFlagZ.value !== camera.position.z < boundaryZ) {
      charts.getObjectByName('gridZ_front').visible = !sideFlagZ.value
      charts.getObjectByName('gridZ_back').visible = sideFlagZ.value
    }
    sideFlagZ.value = camera.position.z < boundaryZ;
  }, 300))
};

// 绘图
const drawChart = (options:ChartConfig) => {
  initContent(options);
  initTitle(options, c);
  initGridX(c);
  initGridY(c);
  initGridZ(c);
  initLabelX(options, c, charts);
  initLabelZ(options, c, charts);
};

// 绘制xz轴提示线
const drawXZTip = (data:ChartConfig, pointer, c:ChartParams) => {
  if (pointer && pointer.y) {
    const {x, y, z} = pointer;
    if (planTip.children.length) {
      planTip.visible = true;
      planTip.getObjectByName('lineTipH').position.y = y;
      planTip.getObjectByName('lineTipH').position.z = z;
      planTip.getObjectByName('lineTipV').position.x = x;
      planTip.getObjectByName('lineTipV').position.y = y;
    } else {
      // 绘制X轴
      const lineH = drawLine([-c.bx/2, 0, 0, c.bx/2, 0, 0], '#00ff00');
      lineH.position.x = c.bx / 2
      lineH.name = 'lineTipH';
      // 绘制Y轴
      const lineV = drawLine([0, 0, 0, 0, 0, c.bz], '#00ff00');
      lineV.name = 'lineTipV';
      planTip.add(lineH, lineV);
    }
  } else {
    if (planTip) planTip.visible = false;
  }
}

// 初始化
const init = () => {
  // 初始化场景
  initScene();
  initRenderer();
  initLight();
  initCamera();
  initEvent();
  axisHelper();
  c = generateParams(options);
  initControls(c);

  drawChart(options)
  renderer.render(scene, camera);
};

onMounted(() => {
  init();
})
</script>

<style lang="less">
.container {
  height: 500px;
  width: 700px;
  margin: 90px auto;
}
</style>
