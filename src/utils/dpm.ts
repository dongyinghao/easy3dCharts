import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import * as THREE from 'three';
import { Text, ChartConfig } from './type';

type ChartType = 'bar' | 'line';

// 文字创建
export const createText = (data:Text, group?:any) => {
  const loader = new FontLoader();
  loader.load( '/fonts/FangSong_Regular.json', fonts => {
    const {font, size=3, height=0.5, x=0, y=0, z=0, rotate=0, color='#ffffff'} = data;
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
    mesh.translateY(-(box.max.y - box.min.y) / 2);
    mesh.translateZ(-(box.max.z - box.min.z) / 2);
    group.add( mesh );
  });
}

// 找到合适的纵轴步距
export const findStepY = (data:any) => {
  const { min, max } = data;
  const diff = Math.ceil(max - min);
  let step = 1;
  if (diff > 100) {
    step = 100;
  } else if (diff > 10) {
    step = 10;
  } else if (diff % 5 === 0) {
    step = 5;
  } else if (diff % 3 === 0) {
    step = 3;
  } else if (diff % 2 === 0) {
    step = 2;
  }
  return step
}

// 找到最大值和最小值
export const findRange = (data:any) => {
  let min = Infinity;
  let max = -Infinity;
  data.forEach((item:any) => {
    if (item.data) {
      item.data.forEach((it:any) => {
        if (it.value > max) max = it.value;
        if (it.value < min) min = it.value;
      })
    } else {
      if (item > max) max = item;
      if (item < min) min = item;
    }
  });
  return {max, min}
}

// 绘制X轴标签
export const initLabelZ = (data:ChartConfig, mesh:any) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, series, cellDepth = 5, cellWidth = 5} = data;
  series.forEach((it:any, i:number) => {
    let z = 0;
    if (i === data.series.length) {
      z = (cellPaddingZ + cellDepth) * i + cellPaddingZ;
    } else {
      z = (cellPaddingZ + cellDepth) * i + cellPaddingZ + cellDepth / 2
    }
    createText({
      font: it.name,
      size: 3,
      height: 0.3,
      x: (cellWidth + cellPaddingX) * series[0].data.length + cellPaddingX + 7,
      z: z,
      color: '#1495a1',
      rotate: -Math.PI / 2
    }, mesh)
  })
}