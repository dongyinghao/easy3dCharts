// 创建文字
export interface Text {
  font: string,
  size?: number,
  height?: number,
  color?: string,
  y?: number,
  x?: number,
  z?: number,
  rotate?: number,
}

type ChartType = 'bar' | 'line';

interface Coordinate {
  x: number,
  y: number,
  z: number
}

interface CellConfig {
  value: number,
  label: string,
}

interface ItemConfig {
  name: string,
  type: string,
  cellColor?: string,
  data: CellConfig[]
}

export interface spaceConfig {
  cellPaddingX?: number, // 单元X方向两边空隙
  cellPaddingZ?: number, // 单元Z方向两边空隙
  cellWidth?: number, // 柱子X轴长度
  cellDepth?: number, // 柱子Z轴长度
}

// 图表配置文件
export interface ChartConfig {
  title: string, // 标题
  titleColor?: string, // 标题颜色
  titleSize?: number, // 标题字号
  titlePosition?: string, // 标题对齐方式
  config:spaceConfig,
  series: Array<ItemConfig>
}

// 图表配置文件
export interface ChartParams {
  bx: number, // x轴最大值
  by: number, // y轴最大值
  bz: number, // z轴最大值
  itemSize: number, // 子项个数
  cellSize: number, // 元素个数
  stepY: number, // y轴步距
  cellWidth: number, // 元素长度
  cellPaddingX: number, // 元素X轴间距
  cellPaddingZ: number, // 元素Z轴间距
  cellDepth: number, // 元素宽度
}