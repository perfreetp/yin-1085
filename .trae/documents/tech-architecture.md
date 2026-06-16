## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React 18 + TypeScript"]
        B["Tailwind CSS"]
        C["Zustand 状态管理"]
        D["React Router DOM"]
    end
    subgraph "数据层"
        E["localStorage 持久化"]
        F["Zustand Store"]
    end
    subgraph "功能模块"
        G["今日安排"]
        H["睡眠记录"]
        I["家属协助"]
        J["放松练习"]
        K["阶段回顾"]
    end
    A --> D
    A --> B
    A --> C
    C --> F
    F --> E
    D --> G
    D --> H
    D --> I
    D --> J
    D --> K
```

本产品为纯前端应用，不依赖后端服务。所有数据存储在浏览器 localStorage 中，确保离线可用，降低中老年人的使用门槛。

## 2. 技术说明

- **前端框架**：React 18 + TypeScript + Vite
- **样式方案**：Tailwind CSS 3
- **状态管理**：Zustand（含 persist 中间件，自动持久化到 localStorage）
- **路由方案**：React Router DOM v6
- **图标库**：lucide-react
- **音频处理**：Web Audio API（呼吸音效、轻音乐）
- **语音播报**：Web Speech API（SpeechSynthesis）
- **打印功能**：window.print() + CSS @media print
- **数据存储**：localStorage（Zustand persist 中间件自动管理）
- **无后端/无数据库**：纯客户端应用

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 首次使用问答引导页面 |
| `/today` | 今日安排主页面 |
| `/sleep-log` | 睡眠记录页面 |
| `/family` | 家属协助页面（需密码验证） |
| `/relax` | 放松练习页面 |
| `/review` | 阶段回顾页面 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    UserProfile ||--o{ SleepRecord : has
    UserProfile {
        string id PK
        string name
        string wakeUpTime "固定起床时间 HH:mm"
        string bedtime "目标上床时间 HH:mm"
        number timeInBed "在床时长(分钟)"
        boolean onboardingDone "是否完成引导"
        string familyPin "家属协助4位密码"
        string createdAt
    }
    SleepRecord {
        string id PK
        string date "YYYY-MM-DD"
        string sleepTime "昨晚入睡时间 HH:mm"
        number awakenings "醒来次数 0-5"
        number sleepiness "犯困程度 1-3"
        string medicationNote "服药备注"
        boolean filledByFamily "是否家属代填"
        string notes "备注"
        string createdAt
    }
    DailySchedule {
        string id PK
        string date "YYYY-MM-DD"
        string napReminder "午睡提醒时段"
        string walkReminder "散步提示时间"
        string bedtimeRoutine "睡前流程状态"
        boolean outOfBedTriggered "是否触发离床建议"
    }
    RelaxSession {
        string id PK
        string type "breathing|muscle|music"
        number duration "时长(秒)"
        string completedAt "完成时间"
    }
    WeeklyReview {
        string id PK
        string weekStart "周一日期 YYYY-MM-DD"
        number avgSleepiness "平均犯困程度"
        number avgAwakenings "平均觉醒次数"
        string moodEmoji "周情绪表情"
        string trend "improving|stable|declining"
        boolean alertTriggered "是否触发专业提醒"
    }
```

### 4.2 数据定义

所有数据通过 Zustand persist 中间件自动序列化到 localStorage，无需 DDL 语句。数据结构以 TypeScript 接口定义：

```typescript
interface UserProfile {
  id: string;
  name: string;
  wakeUpTime: string;
  bedtime: string;
  timeInBed: number;
  onboardingDone: boolean;
  familyPin: string;
  createdAt: string;
}

interface SleepRecord {
  id: string;
  date: string;
  sleepTime: string;
  awakenings: number;
  sleepiness: number;
  medicationNote: string;
  filledByFamily: boolean;
  notes: string;
  createdAt: string;
}

interface DailySchedule {
  id: string;
  date: string;
  napReminder: string;
  walkReminder: string;
  bedtimeRoutine: string;
  outOfBedTriggered: boolean;
}

interface RelaxSession {
  id: string;
  type: 'breathing' | 'muscle' | 'music';
  duration: number;
  completedAt: string;
}
```
