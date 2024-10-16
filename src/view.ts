import { ItemView, WorkspaceLeaf } from "obsidian";
import * as ReactDOM from "react-dom";
import * as React from "react";
import Calendar from "./calendar";
import '../styles.css';

export default class StatsTrackerView extends ItemView {
    private dayCounts: Record<string, number>;

    constructor(leaf: WorkspaceLeaf, dayCounts: Record<string, number>) {
        super(leaf);
        this.dayCounts = dayCounts;

        this.registerInterval(
            window.setInterval(() => {
                ReactDOM.render(React.createElement(Calendar, {
                    data: Object.keys(this.dayCounts).map(day => {
                        return { "date": new Date(new Date(day).setMonth(new Date(day).getMonth() + 1)), "count": this.dayCounts[day] }
                    }),
                }), (this as any).contentEl);
            }, 200)
        );
    }

    getDisplayText() {
        return "字数统计日历";
    }

    getIcon() {
        return "bar-graph";
    }

    getViewType() {
        return "统计追踪器";
    }

    async onOpen() {
        ReactDOM.render(React.createElement(Calendar, {
            data: Object.keys(this.dayCounts).map(day => {
                return { "date": new Date(new Date(day).setMonth(new Date(day).getMonth() + 1)), "count": this.dayCounts[day] }
            }),
        }), (this as any).contentEl);
    }
}
