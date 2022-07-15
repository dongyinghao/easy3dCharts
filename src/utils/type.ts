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

interface cellConfig {
  value: number,
  label: string,
}

interface itemConfig {
  name: string,
  type: string,
  cellColor?: string,
  data: cellConfig[]
}

// 图表配置文件
export interface ChartConfig {
  title: string, // 标题
  titleColor?: string, // 标题颜色
  titleSize?: number, // 标题字号
  titlePosition?: string, // 标题对齐方式
  cellPaddingX?: number, // 单元X方向两边空隙
  cellPaddingZ?: number, // 单元Z方向两边空隙
  cellWidth?: number, // 柱子X轴长度
  cellDepth?: number, // 柱子Z轴长度
  series: Array<itemConfig>
}