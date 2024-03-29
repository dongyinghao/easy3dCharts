import { ChartConfig, ChartParams, Nb,  } from './type.d';
import { createText, drawLine } from './tools';

// 找到合适的纵轴步距
export const findStepY = (data) => {
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
export const findRange = (data) => {
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
export const initLabelZ = (data:ChartConfig, c:ChartParams, mesh) => {
  const {series} = data;
  const {cellPaddingZ, cellDepth } = c;
  series.forEach((it:any, i:number) => {
    let z;
    if (i === data.series.length) {
      z = c.bz;
    } else {
      z = (cellPaddingZ + cellDepth) * i + cellPaddingZ + cellDepth / 2
    }
    createText({
      font: it.name,
      size: 3,
      height: 0.3,
      x: c.bx + 7,
      z,
      color: '#1495a1',
      rotate: -Math.PI / 2
    }, (text:any) => {
      mesh.add(text);
    });
  })
}

// 绘制X轴标签
export const initLabelX = (data, c, mesh) => {
  const {series} = data;
  const {cellPaddingX, cellWidth} = c;
  const itemData = series[0].data
  itemData.forEach((it:any, i:number) => {
    let x = (cellPaddingX + cellWidth) * i + cellPaddingX + cellWidth / 2;
    createText({
      font: it.label,
      size: 3,
      height: 0.3,
      x,
      z: c.bz + 5,
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
    const line = drawLine([x, 0, 0, x, h, 0], {color})
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
    const line = drawLine([0, y, 0, w, y, 0], {color})
    // scene.add(line);
  }
};

// 节流
export const throttle = (fn:Function, time:number) => {
  let timeId:any = null;
  return function (this:any) {
    if (!timeId) {
      timeId = setTimeout(() => {
        fn.apply(this, arguments)
        timeId = null;
      }, time);
    }
  };
}

// 生成16进制颜色
export const randomColor = () => {
  const str = '0123456789abcdef';
  let col = '#';
  for (var i = 0; i < 6; i++){
    const index = Math.floor(Math.random() * 15);
    col += str[index];
  }
  return col;
}

// 根据配置获取相关参数，方便后续绘图使用
// {x、y、z的边界值，列表长度、列表子项长度}
export const generateParams = (data:ChartConfig):ChartParams => {
  const itemSize = data.series.length;
  const cellSize = data.series[0].data.length;
  const {cellWidth = 5, cellPaddingX = 10, cellPaddingZ = 10, cellDepth = 5} = data.config;
  const bx = (cellWidth + cellPaddingX) * cellSize + cellPaddingX;
  const range = findRange(data.series);
  const stepY = findStepY(range);
  let by = 0;
  for(let i = 0; i * stepY <= range.max; i++) {
    by = i * stepY + stepY;
  }
  const bz = (cellPaddingZ + cellDepth) * itemSize + cellPaddingZ;
  return {bx, by, bz, itemSize, cellSize, stepY, cellWidth, cellPaddingX, cellPaddingZ, cellDepth}
}

// 根据角度计算弧度
export const a2r = (a:number):number => Math.PI * a / 180;

// 根据弧度计算角度
export const r2a = (r:number):number => 180 * r / Math.PI;

// 计算线段(p1->p2)和x轴的夹角(得到弧度单位)
export const l2a = (p1:number[], p2:number[]):number => Math.atan2(p2[1]-p1[1], p2[0]-p1[0]);


// 根据相机高度获取当前的缩放因子
export const ZtoZoom = (n:number):number => {
  const zoomMap = {3: 1, 5: 2, 10: 3, 30: 4, 50: 5, 100: 6, 150: 7, 300: 8, 500: 9, 1000: 10, 1500: 11, 2000: 12, 2500: 13};
  let prev = 1;
  for(let key in zoomMap) {
    let zoom = Number(key);
    if (n <= zoom) {
      const step = zoom - prev;
      const diff = n - prev;
      return zoomMap[zoom] + Number((diff / step).toFixed(1));
    }
    prev = zoom;
  }
  return 14
}

// 根据缩放因子获取相机高度
export const ZoomToZ = (n:number):number => {
  const zoomMap = {3: 1, 5: 2, 10: 3, 30: 4, 50: 5, 100: 6, 150: 7, 300: 8, 500: 9, 1000: 10, 1500: 11, 2000: 12, 2500: 13};
  let prev = 1;
  for(let key in zoomMap) {
    let zoom = zoomMap[key];
    if (n <= zoom) {
      const step = zoom - n;
      const diff = Number(key) - prev;
      return Number(key) - Number((diff * step).toFixed(1));
    }
    prev = Number(key);
  }
  return 14
}

// 计算平面折线段的偏移坐标,d:偏移距离,t:偏移方向
export const offset = (p1:number[], p2:number[], d:number, t?:Nb):number[][] => {
  const ra = l2a(p1, p2);
  const diffX = Math.sin(ra) * d * (t ? -1 : 1);
  const diffY = Math.cos(ra) * d * (t ? -1 : 1);
  return [[p1[0] + diffX, p1[1] - diffY], [p2[0] + diffX, p2[1] - diffY]];
}
