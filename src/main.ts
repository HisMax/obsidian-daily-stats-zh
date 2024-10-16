import {
  TFile,
  Plugin,
  MarkdownView,
  debounce,
  Debouncer,
  WorkspaceLeaf,
  addIcon,
} from "obsidian";
import StatsTrackerView from "./view";
const VIEW_TYPE_STATS_TRACKER = "统计追踪器";
interface WordCount {
  initial: number;
  current: number;
}

interface DailyStatsSettings {
  dayCounts: Record<string, number>;
  todaysWordCount: Record<string, WordCount>;
}

const DEFAULT_SETTINGS: DailyStatsSettings = {
  dayCounts: {},
  todaysWordCount: {},
};

export default class DailyStats extends Plugin {
  settings: DailyStatsSettings;
  statusBarEl: HTMLElement;
  currentWordCount: number;
  today: string;
  debouncedUpdate: Debouncer<[contents: string, filepath: string], void>;

  private view: StatsTrackerView;

  async onload() {
    await this.loadSettings();
    this.statusBarEl = this.addStatusBarItem();
    this.updateDate();
    if (this.settings.dayCounts.hasOwnProperty(this.today)) {
      this.updateCounts();
    } else {
      this.currentWordCount = 0;
    }

    this.debouncedUpdate = debounce(
      (contents: string, filepath: string) => {
        this.updateWordCount(contents, filepath);
      },
      400,
      false
    );

    this.registerView(
      VIEW_TYPE_STATS_TRACKER,
      (leaf: WorkspaceLeaf) =>
        (this.view = new StatsTrackerView(leaf, this.settings.dayCounts))
    );

    this.addCommand({
      id: "show-daily-stats-tracker-view",
      name: "Open tracker view",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return (
            this.app.workspace.getLeavesOfType(VIEW_TYPE_STATS_TRACKER)
              .length === 0
          );
        }
        this.initLeaf();
      },
    });

    this.registerEvent(
      this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this))
    );

    this.registerInterval(
      window.setInterval(() => {
        //分段提示
        const wordCount = this.currentWordCount;
        if (wordCount < 100) {
          //如果是周日
          if (new Date().getDay() === 0) {
            this.statusBarEl.setText(
              `今日字数: ${wordCount}, 星期天就摆烂了？`
            );
          } else if (new Date().getDay() === 1) {
            this.statusBarEl.setText(
              `今日字数: ${wordCount}, 这星期刚开始就这样？`
            );
          } else {
            this.statusBarEl.setText(
              `今日字数: ${wordCount}, 摆烂太久的话，天赋真的会被收走哦！`
            );
          }
        } else if (wordCount < 750) {
          this.statusBarEl.setText(`今日字数: ${wordCount}, 马马虎虎！`);
        } else if (wordCount < 1500) {
          this.statusBarEl.setText(`今日字数: ${wordCount}, 这才像话嘛！`);
        } else if (wordCount < 3000) {
          this.statusBarEl.setText(
            `今日字数: ${wordCount}, 今天可以稍微放松一下了！`
          );
        } else if (wordCount < 8000) {
          // 如果时间是凌晨0点-6点
          if (new Date().getHours() < 6) {
            this.statusBarEl.setText(
              `今日字数: ${wordCount}, 通宵码字这么狠？`
            );
          } else {
            this.statusBarEl.setText(
              `今日字数: ${wordCount}, 我去，今天超神了！`
            );
          }
        }
      }, 200)
    );

    addIcon(
      "nine-grid",
      `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100" height="100">
		  <!-- 第一行 -->
		  <rect x="10" y="10" width="50" height="50" rx="10" ry="10" fill="#273451" />
		  <rect x="70" y="10" width="50" height="50" rx="10" ry="10" fill="#a0a6b1" />
		  <rect x="130" y="10" width="50" height="50" rx="10" ry="10" fill="#273451" />
		  
		  <!-- 第二行 -->
		  <rect x="10" y="70" width="50" height="50" rx="10" ry="10" fill="#a0a6b1" />
		  <rect x="70" y="70" width="50" height="50" rx="10" ry="10" fill="#273451" />
		  <rect x="130" y="70" width="50" height="50" rx="10" ry="10" fill="#a0a6b1" />
		  
		  <!-- 第三行 -->
		  <rect x="10" y="130" width="50" height="50" rx="10" ry="10" fill="#273451" />
		  <rect x="70" y="130" width="50" height="50" rx="10" ry="10" fill="#a0a6b1" />
		  <rect x="130" y="130" width="50" height="50" rx="10" ry="10" fill="#273451" />
		</svg>
		`
    );

    this.registerInterval(
      window.setInterval(() => {
        this.updateDate();
        this.saveSettings();
      }, 100)
    );

    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.registerEvent(this.app.workspace.layoutReady);
    }
  }

  initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_STATS_TRACKER).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_STATS_TRACKER,
    });
  }

  onQuickPreview(file: TFile, contents: string) {
    if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
      this.debouncedUpdate(contents, file.path);
    }
  }

  //Credit: better-word-count by Luke Leppan (https://github.com/lukeleppan/better-word-count)
  getWordCount(text: string) {
    let words: number = 0;

    const matches = text.match(
      /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/gm
    );

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        if (matches[i].charCodeAt(0) > 19968) {
          words += matches[i].length;
        } else {
          words += 1;
        }
      }
    }

    return words;
  }

  updateWordCount(contents: string, filepath: string) {
    const curr = this.getWordCount(contents);
    if (this.settings.dayCounts.hasOwnProperty(this.today)) {
      if (this.settings.todaysWordCount.hasOwnProperty(filepath)) {
        //updating existing file
        this.settings.todaysWordCount[filepath].current = curr;
      } else {
        //created new file during session
        this.settings.todaysWordCount[filepath] = {
          initial: curr,
          current: curr,
        };
      }
    } else {
      //new day, flush the cache
      this.settings.todaysWordCount = {};
      this.settings.todaysWordCount[filepath] = {
        initial: curr,
        current: curr,
      };
    }
    this.updateCounts();
  }

  updateDate() {
    const d = new Date();
    this.today = d.getFullYear() + "/" + d.getMonth() + "/" + d.getDate();
  }

  updateCounts() {
    this.currentWordCount = Object.values(this.settings.todaysWordCount)
      .map((wordCount) => Math.max(0, wordCount.current - wordCount.initial))
      .reduce((a, b) => a + b, 0);
    this.settings.dayCounts[this.today] = this.currentWordCount;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    if (Object.keys(this.settings.dayCounts).length > 0) {
      //ensuring we never reset the data by accident
      await this.saveData(this.settings);
    }
  }
}
