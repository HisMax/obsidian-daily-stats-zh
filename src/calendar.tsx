import * as React from "react";
import HeatMap from '@histonemax/react-heat-map';
import styled from 'styled-components';

interface HeatmapProps {
    data: Array<{ date: Date; count: number }>;
}

interface HeatmapState {
    hoverInfo: { date: string; count: number | null } | null;
}

// 定义一个 Heatmap 类组件，继承自 React.Component，接受 HeatmapProps 类型的属性
class Heatmap extends React.Component<HeatmapProps, HeatmapState> {
    mouseX: number = 0;
    mouseY: number = 0;

    constructor(props: HeatmapProps) {
        super(props);
        this.state = {
            hoverInfo: null, // 用于存储悬停时显示的信息
        };
    }

    // 鼠标悬停时更新 hoverInfo 状态
    handleMouseEnter = (value: { date: string; count: number | null }) => {
        this.setState({
            hoverInfo: value,
        });
    };

    // 鼠标离开时清空 hoverInfo 状态
    handleMouseLeave = () => {
        this.setState({
            hoverInfo: null,
        });
    };

    handleMouseMove = (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    // 获取鼠标的位置
    componentDidMount() {
        document.addEventListener('mousemove', this.handleMouseMove);
    }

    // 渲染组件方法
    render() {
        const formattedData = this.props.data.map(item => ({
            date: item.date instanceof Date ?item.date.toISOString().split('T')[0] : item.date, // 转换为 YYYY-MM-DD 格式
            count: item.count
        }));
        const { hoverInfo } = this.state;

        return (
            <div style={{ position: 'relative' }} >
                {/* HeatMap 组件，配置多个属性，用于展示热力图 */}
                <HeatMap 
                    // 设置热力图的起始日期，从今天起往前推80天
                    startDate={new Date(new Date().setDate(new Date().getDate() - 180))}
                    // 设置热力图的结束日期为今天
                    endDate={new Date()}
                    // 传入数据，使用父组件传递的数据进行热力图渲染
                    value={formattedData}
                    // 设置一周的标签，用中文表示星期几
                    weekLabels={["日", "一", "二", "三", "四", "五", "六"]}
                    // 设置一年的月份标签，用中文数字表示月份
                    monthLabels={["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"]}
                    // 定义面板的颜色映射，数值越大，颜色越深，表示该天的活动/数据量
                    panelColors={{
                        0: '#AFF0B5',   // 活动为0时的颜色，淡绿色
                        100: '#7BE188', // 活动值为100时的颜色
                        750: '#4CD263', // 活动值为750时的颜色
                        1500: '#23C343', // 活动值为1500时的颜色
                        3000: '#00B42A', // 活动值为3000时的颜色，深绿色
                        8000: '#009A29', // 活动值为8000时的颜色，最深绿色
                    }}
                    rectSize={20} // 设置每个矩形的大小
                    space={3} // 设置矩形之间的间距
                    isVertical={true}
                    rectRender={(rectProps, valueItem) => (
                        <rect
                            {...rectProps}
                            onMouseEnter={() => this.handleMouseEnter(valueItem)}
                            onMouseLeave={this.handleMouseLeave}
                        />
                    )}
                />
                {hoverInfo && (
                    <div
                        style={{
                            position: 'absolute',
                            top: this.mouseY + 40, // 调整 tooltip 的垂直位置
                            left: this.mouseX + 10, // 调整 tooltip 的水平位置
                            padding: '5px',
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                            pointerEvents: 'none',
                            zIndex: 10,
                        }}
                    >
                        <div>{hoverInfo.date}</div>
                        <div>{hoverInfo.count !== null ? `字数: ${hoverInfo.count}` : '当日无记录'}</div>
                    </div>
                )}
            </div>
        );
    }
}

// 导出 Heatmap 组件，供外部文件引用和使用
export default Heatmap;
