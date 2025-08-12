import GameRecord from '../database/models/GameRecord';
import DeviceStats from '../database/models/DeviceStats';
import { IDeviceStats } from '../types/database';
import { GameRecordSubmission, GameSubmissionResponse } from '../types/game';
import { GameApiError, ErrorCodes } from '../utils/response';

export class GameService {
  /**
   * 提交游戏成绩 - 只保留最高分数
   */
  async submitGameRecord(submission: GameRecordSubmission): Promise<GameSubmissionResponse> {
    const { deviceId, score } = submission;

    // 1. 更新设备统计（只保留最高分）
    const deviceStats = await this.updateDeviceStats(deviceId, score);
    
    // 2. 只有当分数更高时才保存记录
    let recordId = '';
    let isNewBest = false;
    
    if (score >= deviceStats.bestScore) {
      // 删除该设备的所有旧记录
      await GameRecord.deleteMany({ deviceId });
      
      // 保存新的最高分记录
      const gameRecord = new GameRecord({
        deviceId,
        score,
      });
      
      const savedRecord = await gameRecord.save();
      recordId = String(savedRecord._id);
      isNewBest = true;
    }

    const response: GameSubmissionResponse = {
      recordId,
      deviceId,
      score,
      bestScore: deviceStats.bestScore,
      isNewBest,
      submittedAt: new Date(),
    };

    return response;
  }

  /**
   * 获取设备统计信息
   */
  async getDeviceStats(deviceId: string): Promise<IDeviceStats | null> {
    try {
      const stats = await DeviceStats.findById(deviceId).lean();
      return stats as IDeviceStats | null;

    } catch (error) {
      throw new GameApiError(
        ErrorCodes.DATABASE_ERROR,
        '获取设备统计失败',
        500,
        error
      );
    }
  }

  /**
   * 更新设备统计信息
   */
  private async updateDeviceStats(deviceId: string, score: number): Promise<IDeviceStats> {
    const existingStats = await DeviceStats.findById(deviceId);

    if (existingStats) {
      // 只有当新分数更高时才更新
      if (score > existingStats.bestScore) {
        existingStats.bestScore = score;
        await existingStats.save();
      }
      return existingStats;
    } else {
      // 创建新的设备统计
      const newStats = new DeviceStats({
        _id: deviceId,
        deviceId,
        bestScore: score,
      });
      
      await newStats.save();
      return newStats;
    }
  }
}