import * as React from "react";
import HeatMap from '@uiw/react-heat-map';

interface HeatmapProps {
    data: any[];
}

class Heatmap extends React.Component<HeatmapProps> {
    render() {
        return <div>
            <HeatMap
                startDate={new Date(new Date().setDate(new Date().getDate() - 15))}
                endDate={new Date()}
                value={this.props.data}
                weekLabels={["日","一","二","三","四","五","六"]}
                monthLabels = {["一","二","三","四","五","六","七","八","九","十","十一","十二"]}
                panelColors={{
                    0: '#f4decd',
                    2: '#e4b293',
                    4: '#d48462',
                    10: '#c2533a',
                    20: '#ad001d',
                    30: '#000',
                  }}
            />
            <div id="color-elem" />
        </div>
    }

}

export default Heatmap;
