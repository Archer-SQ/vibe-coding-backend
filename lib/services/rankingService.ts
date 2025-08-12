import DeviceStats from '../database/models/DeviceStats';
import GameRecord from '../database/models/GameRecord';
import { RankingItem, RankingQuery } from '../types/game';
import { GameApiError, ErrorCodes } from '../utils/response';

export class RankingService {
  /**
   * 获取总榜前十（基于最高分）
   */
  async getAllTimeRanking(): Promise<RankingItem[]> {
    try {
      const rankings = await DeviceStats.find({})
        .sort({ bestScore: -1, createdAt: 1 })
        .limit(10)
        .lean();

      const rankingItems: RankingItem[] = rankings.map((stats: any, index: number) => ({
        deviceId: stats.deviceId,
        score: stats.bestScore,
        rank: index + 1,
        createdAt: stats.createdAt,
      }));

      return rankingItems;

    } catch (error) {
      throw new GameApiError(
        ErrorCodes.DATABASE_ERROR,
        '获取总榜失败',
        500,
        error
      );
    }
  }

  /**
   * 获取周榜前十（基于本周最高分）
   */
  async getWeeklyRanking(): Promise<RankingItem[]> {
    try {
      // 计算本周开始时间（周一00:00:00）
      const now = new Date();
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(now.getDate() - daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      // 获取本周的游戏记录，按设备ID分组取最高分
      const weeklyRecords = await GameRecord.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek }
          }
        },
        {
          $group: {
            _id: '$deviceId',
            bestScore: { $max: '$score' },
            createdAt: { $first: '$createdAt' }
          }
        },
        {
          $sort: { bestScore: -1, createdAt: 1 }
        },
        {
          $limit: 10
        }
      ]);

      const rankingItems: RankingItem[] = weeklyRecords.map((record: any, index: number) => ({
        deviceId: record._id,
        score: record.bestScore,
        rank: index + 1,
        createdAt: record.createdAt,
      }));

      return rankingItems;

    } catch (error) {
      throw new GameApiError(
        ErrorCodes.DATABASE_ERROR,
        '获取周榜失败',
        500,
        error
      );
    }
  }

  /**
   * 获取排行榜（根据查询参数返回总榜或周榜）
   */
  async getRanking(query: RankingQuery = {}): Promise<RankingItem[]> {
    const { timeRange = 'all' } = query;

    if (timeRange === 'weekly') {
      return this.getWeeklyRanking();
    } else {
      return this.getAllTimeRanking();
    }
  }
}