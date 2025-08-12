import { Document } from 'mongoose';

// MongoDB文档接口
export interface IGameRecord extends Document {
  deviceId: string;
  score: number;
  createdAt: Date;
}

export interface IDeviceStats extends Document {
  _id: string; // 使用deviceId作为主键
  deviceId: string;
  bestScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// 数据库连接配置
export interface DatabaseConfig {
  uri: string;
  dbName: string;
  options: {
    maxPoolSize?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    bufferCommands?: boolean;
  };
}

// 缓存配置
export interface CacheConfig {
  redis: {
    url: string;
    restUrl?: string;
    restToken?: string;
  };
  ttl: {
    ranking: number;
    deviceStats: number;
    deviceRank: number;
    rateLimit: number;
  };
}