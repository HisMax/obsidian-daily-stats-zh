// 导入 React 框架及其相关模块，用于创建组件
import * as React from "react";
// 从 'react-heat-map' 库中导入 HeatMap 组件，用于生成热力图
import HeatMap from 'react-heat-map';

// 定义 Heatmap 组件的属性接口。data 是一个数组，代表热力图的数据。
interface HeatmapProps {
    data: any[]; // 定义传入的数据类型为任意数组
}

// 定义一个 Heatmap 类组件，继承自 React.Component，接受 HeatmapProps 类型的属性
class Heatmap extends React.Component<HeatmapProps> {
    // 渲染组件方法
    render() {
        return (
            <div>
                {/* HeatMap 组件，配置多个属性，用于展示热力图 */}
                <HeatMap
                    // 设置热力图的起始日期，从今天起往前推80天
                    startDate={new Date(new Date().setDate(new Date().getDate() - 80))}
                    // 设置热力图的结束日期为今天
                    endDate={new Date()}
                    // 传入数据，使用父组件传递的数据进行热力图渲染
                    value={this.props.data}
                    // 设置一周的标签，用中文表示星期几
                    weekLabels={["日","一","二","三","四","五","六"]}
                    // 设置一年的月份标签，用中文数字表示月份
                    monthLabels={["一","二","三","四","五","六","七","八","九","十","十一","十二"]}
                    // 定义面板的颜色映射，数值越大，颜色越深，表示该天的活动/数据量
                    panelColors={{
                        0: '#AFF0B5',   // 活动为0时的颜色，淡绿色
                        100: '#7BE188', // 活动值为100时的颜色
                        750: '#4CD263', // 活动值为750时的颜色
                        1500: '#23C343', // 活动值为1500时的颜色
                        3000: '#00B42A', // 活动值为3000时的颜色，深绿色
                        8000: '#009A29', // 活动值为8000时的颜色，最深绿色
                    }}
                    // 是否为垂直布局，设置为 false 表示水平布局
                    isVertical={false}
                    //TODO:目前垂直布局还没有实现，所以这里设置为 false，需要调整修改heatmap的源码
                />
                {/* 用于放置颜色渐变元素的 div，可能后续用于热力图颜色展示 */}
                <div id="color-elem" />
            </div>
        );
    }
}

// 导出 Heatmap 组件，供外部文件引用和使用
export default Heatmap;
