import mongoose, { ConnectOptions } from 'mongoose';

// 使用MongoDB原生的ConnectOptions类型

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const options: ConnectOptions = {
        // 性能优化
        bufferCommands: false, // 禁用命令缓冲
        // retryWrites 应该在 URI 中设置，不在连接选项中
      };

      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI环境变量未设置');
      }

      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      console.log('✅ MongoDB连接成功');
      
      // 监听连接事件
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB连接错误:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB连接断开');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ MongoDB连接失败:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await mongoose.disconnect();
    this.isConnected = false;
    console.log('✅ MongoDB连接已关闭');
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export default DatabaseConnection;

// 使用示例
export const connectDatabase = async () => {
  const db = DatabaseConnection.getInstance();
  await db.connect();
};

export const disconnectDatabase = async () => {
  const db = DatabaseConnection.getInstance();
  await db.disconnect();
};