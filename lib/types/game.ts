// 游戏数据类型定义
export interface GameRecord {
  _id: string;
  deviceId: string;
  score: number;
  createdAt: Date;
}

// 游戏记录提交数据
export interface GameRecordSubmission {
  deviceId: string;
  score: number;
}

// 排行榜项目类型
export interface RankingItem {
  deviceId: string;
  score: number;
  rank: number;
  updatedAt: Date; // 数据更新时间
}

// 设备统计类型
export interface DeviceStatistics {
  deviceId: string;
  bestScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// 排行榜查询参数
export interface RankingQuery {
  limit?: number;
  timeRange?: 'all' | 'weekly';
}

// 游戏提交响应
export interface GameSubmissionResponse {
  recordId: string;
  deviceId: string;
  score: number;
  isNewBest: boolean;
  bestScore: number;
  submittedAt: Date;
}