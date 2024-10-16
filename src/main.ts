// 从 Obsidian 框架中导入所需的类和函数
import {
  TFile,               // 文件类，代表一个 Obsidian 文件
  Plugin,              // 插件基类，所有插件都继承自此类
  MarkdownView,        // Markdown 视图类，用于处理 Markdown 文件的视图
  debounce,            // 防抖函数，用于限制函数的调用频率
  Debouncer,           // 防抖类，用于创建防抖操作
  WorkspaceLeaf,       // 工作区叶子类，代表 Obsidian 窗口的一部分
  addIcon,             // 添加自定义图标的函数
} from "obsidian";

// 导入自定义的视图类，用于显示统计追踪器的界面
import StatsTrackerView from "./view";

// 定义视图类型的常量，用于标识该视图
const VIEW_TYPE_STATS_TRACKER = "统计追踪器";

// 定义一个接口，用于表示单个文件的字数统计
interface WordCount {
  initial: number;   // 初始字数（文件首次加载时的字数）
  current: number;   // 当前字数（文件当前的字数）
}

// 定义一个接口，用于表示每日的统计设置信息
interface DailyStatsSettings {
  dayCounts: Record<string, number>;          // 每天的总字数记录（以日期为键）
  todaysWordCount: Record<string, WordCount>; // 每天每个文件的字数统计
}

// 定义默认的统计设置
const DEFAULT_SETTINGS: DailyStatsSettings = {
  dayCounts: {},            // 默认每天的总字数为空
  todaysWordCount: {},      // 默认每天的文件字数统计为空
};

// 创建并导出一个类，继承自 Obsidian 的插件基类
export default class DailyStats extends Plugin {
  settings: DailyStatsSettings;            // 存储插件的设置信息
  statusBarEl: HTMLElement;                // 状态栏元素，用于显示实时字数
  currentWordCount: number;                // 当前总字数
  today: string;                           // 当前日期
  debouncedUpdate: Debouncer<[contents: string, filepath: string], void>;  // 防抖更新函数

  private view: StatsTrackerView;          // 自定义视图对象

  // 插件加载时的初始化操作
  async onload() {
    // 加载插件的设置
    await this.loadSettings();
    
    // 添加一个状态栏元素，用于显示字数统计
    this.statusBarEl = this.addStatusBarItem();
    
    // 更新当前日期
    this.updateDate();
    
    // 如果设置中存在当天的统计数据，则更新字数统计
    if (this.settings.dayCounts.hasOwnProperty(this.today)) {
      this.updateCounts();
    } else {
      this.currentWordCount = 0;  // 如果当天没有统计数据，则字数初始化为 0
    }

    // 创建防抖函数，防止频繁更新字数
    this.debouncedUpdate = debounce(
      (contents: string, filepath: string) => {
        this.updateWordCount(contents, filepath);  // 更新字数统计
      },
      400,  // 防抖时间为 400 毫秒
      false
    );

    // 注册自定义视图类型，用于显示统计追踪器
    this.registerView(
      VIEW_TYPE_STATS_TRACKER,
      (leaf: WorkspaceLeaf) =>
        (this.view = new StatsTrackerView(leaf, this.settings.dayCounts))
    );

    // 添加命令，用于打开统计追踪器视图
    this.addCommand({
      id: "open-stats-tracker",
      name: "打开统计追踪器",
      callback: () => {
        // 获取右侧面板
        this.app.workspace.getRightLeaf(false).setViewState({
          type: VIEW_TYPE_STATS_TRACKER,
        });
      },
    });

    // 注册事件监听器，监听快速预览事件
    this.registerEvent(
      this.app.workspace.on("quick-preview", this.onQuickPreview.bind(this))
    );

    // 每隔 200 毫秒更新状态栏信息
    this.registerInterval(
      window.setInterval(() => {
        // 获取当前的字数统计
        const wordCount = this.currentWordCount;
        
        // 根据字数和日期，显示不同的提示语
        if (wordCount < 100) {
          if (new Date().getDay() === 0) {  // 如果是星期天
            this.statusBarEl.setText(`今日字数: ${wordCount}, 星期天就摆烂了？`);
          } else if (new Date().getDay() === 1) {  // 如果是星期一
            this.statusBarEl.setText(`今日字数: ${wordCount}, 这星期刚开始就这样？`);
          } else {
            this.statusBarEl.setText(`今日字数: ${wordCount}, 摆烂太久的话，天赋真的会被收走哦！`);
          }
        } else if (wordCount < 750) {
          this.statusBarEl.setText(`今日字数: ${wordCount}, 马马虎虎！`);
        } else if (wordCount < 1500) {
          this.statusBarEl.setText(`今日字数: ${wordCount}, 这才像话嘛！`);
        } else if (wordCount < 3000) {
          this.statusBarEl.setText(`今日字数: ${wordCount}, 今天可以稍微放松一下了！`);
        } else if (wordCount < 8000) {
          if (new Date().getHours() < 6) {  // 如果是凌晨 0 点到 6 点
            this.statusBarEl.setText(`今日字数: ${wordCount}, 通宵码字这么狠？`);
          } else {
            this.statusBarEl.setText(`今日字数: ${wordCount}, 我去，今天超神了！`);
          }
        }
      }, 200)
    );

    // 添加自定义图标
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

    // 每隔 100 毫秒保存设置
    this.registerInterval(
      window.setInterval(() => {
        this.updateDate();
        this.saveSettings();
      }, 100)
    );

    // 如果布局已经准备好，则初始化视图
    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.registerEvent(this.app.workspace.layoutReady);
    }
  }

  // 初始化视图叶子
  initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_STATS_TRACKER).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_STATS_TRACKER,
    });
  }

  // 快速预览时触发的事件
  onQuickPreview(file: TFile, contents: string) {
    if (this.app.workspace.getActiveViewOfType(MarkdownView)) {
      this.debouncedUpdate(contents, file.path);  // 使用防抖函数更新字数统计
    }
  }

  // 计算文件中的字数
  getWordCount(text: string) {
    let words: number = 0;

    // 使用正则表达式匹配中英文单词
    const matches = text.match(
      /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/gm
    );

    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        if (matches[i].charCodeAt(0) > 19968) {  // 如果是中文字符
          words += matches[i].length;  // 中文字符按字数计算
        } else {
          words += 1;  // 英文单词按单词计算
        }
      }
    }

    return words;  // 返回总字数
  }

  // 更新文件的字数统计
  updateWordCount(contents: string, filepath: string) {
    const curr = this.getWordCount(contents);  // 获取当前字数
    if (this.settings.dayCounts.hasOwnProperty(this.today)) {
      if (this.settings.todaysWordCount.hasOwnProperty(filepath)) {
        // 如果文件已经存在，更新当前字数
        this.settings.todaysWordCount[filepath].current = curr;
      } else {
        // 如果是新文件，初始化字数统计
        this.settings.todaysWordCount[filepath] = {
          initial: curr,
          current: curr,
        };
      }
    } else {
      // 如果是新的一天，清空缓存并重新记录
      this.settings.todaysWordCount = {};
      this.settings.todaysWordCount[filepath] = {
        initial: curr,
        current: curr,
      };
    }
    this.updateCounts();  // 更新总字数
  }

  // 更新当前日期
  updateDate() {
    const d = new Date();
    this.today = d.getFullYear() + "/" + d.getMonth() + "/" + d.getDate();  // 格式化日期
  }

  // 更新当天的总字数统计
  updateCounts() {
    this.currentWordCount = Object.values(this.settings.todaysWordCount)
      .map((wordCount) => Math.max(0, wordCount.current - wordCount.initial))  // 计算每个文件的实际新增字数
      .reduce((a, b) => a + b, 0);  // 累加所有文件的字数
    this.settings.dayCounts[this.today] = this.currentWordCount;  // 更新设置中的总字数
  }

  // 加载插件设置
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());  // 合并默认设置和已保存的数据
  }

  // 保存插件设置
  async saveSettings() {
    if (Object.keys(this.settings.dayCounts).length > 0) {
      await this.saveData(this.settings);  // 保存统计数据
    }
  }
}
