import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { BufferGeometry, Line, LineBasicMaterial, BufferAttribute, MeshLambertMaterial, Mesh, Box3 } from 'three';
import { Text, ChartConfig } from './type';

type ChartType = 'bar' | 'line';

// 文字创建
export const createText = (data:Text, callback:any) => {
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
    const textMaterial = new MeshLambertMaterial({ color });
    const mesh = new Mesh( textGeo, textMaterial );
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    mesh.rotateX(rotate);
    // 获取字体的外轮廓，从而得到字体的长度
    let box= new Box3().setFromObject(mesh);
    // 字体对齐方式默认为左对齐，此处设为中心对齐
    mesh.translateX(-(box.max.x - box.min.x) / 2);
    mesh.translateY(-(box.max.y - box.min.y) / 2);
    mesh.translateZ(-(box.max.z - box.min.z) / 2);
    callback(mesh);
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

// 绘制Z轴标签
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
    }, (text:any) => {
      mesh.add(text);
    });
  })
}

// 绘制X轴标签
export const initLabelX = (data:any, mesh:any) => {
  const {cellPaddingZ = 10, cellPaddingX = 10, series, cellDepth = 5, cellWidth = 5} = data;
  const itemData = series[0].data
  itemData.forEach((it:any, i:number) => {
    let x = (cellPaddingX + cellWidth) * i + cellPaddingX + cellWidth / 2;
    createText({
      font: it.label,
      size: 3,
      height: 0.3,
      x,
      z: (cellPaddingZ + cellDepth) * series.length + cellPaddingZ + 5,
      color: '#1495a1',
      rotate: -Math.PI / 2
    }, (text:any) => {
      mesh.add(text);
    })
  })
}

// 绘制网格
// 网格宽、高、X轴线条数、Y轴线条数、X轴首末线条宽度、Y轴首末条线宽度
export const drawGridBySize = (color:string, w:number, h:number, countX:number, countY:number, indentX:number, indentY:number) => {
  const stepX = Math.floor(w - 2 * indentX) / Math.floor(countX - 3);
  const stepY = Math.floor(h - 2 * indentY) / Math.floor(countY - 3);
  indentX = Math.min(stepX, indentX);
  indentY = Math.min(stepY, indentY);
  for(let i = 0; i< countX; i++) {
    let x = 0;
    if(i === 0) {
      x = 0;
    } else if (i === countX - 1) {
      x = w
    } else {
      x = stepX * (i - 1) + indentX
    }
    const line = drawLine([x, 0, 0, x, h, 0], color)
    // scene.add(line);
  }
  for(let i = 0; i< countY; i++) {
    let y = 0;
    if(i === 0) {
      y = 0;
    } else if (i === countY - 1) {
      y = h
    } else {
      y = stepY * (i - 1) + indentY
    }
    const line = drawLine([0, y, 0, w, y, 0], color)
    // scene.add(line);
  }
};

// 绘制一条直线
export const drawLine = (array:any, color?:string) => {
  const material = new LineBasicMaterial( {color: color || '#ffffff'} );
  const geometry = new BufferGeometry();
  const vertice = new Float32Array( array );
  geometry.setAttribute( 'position', new BufferAttribute( vertice, 3 ) );
  return new Line( geometry, material );
}