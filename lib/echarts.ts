import {init,use} from 'echarts/core';
import {LineChart,PieChart,RadarChart,GraphChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,RadarComponent,AriaComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
use([LineChart,PieChart,RadarChart,GraphChart,GridComponent,TooltipComponent,RadarComponent,AriaComponent,SVGRenderer]);
export {init};
