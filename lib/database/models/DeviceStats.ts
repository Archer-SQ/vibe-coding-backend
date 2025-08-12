import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceStats extends Document {
  _id: string; // 使用deviceId作为主键
  deviceId: string;
  bestScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceStatsSchema: Schema = new Schema({
  _id: { 
    type: String, 
    required: true 
  },
  deviceId: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: (v: string) => /^[a-f0-9]{32}$/.test(v),
      message: '设备ID格式不正确'
    }
  },
  bestScore: { 
    type: Number, 
    default: 0,
    min: 0,
    index: true
  }
}, {
  timestamps: true,
  collection: 'deviceStats',
  _id: false // 使用自定义_id
});

// 索引配置
DeviceStatsSchema.index({ bestScore: -1 });
DeviceStatsSchema.index({ createdAt: -1 });

export default mongoose.model<IDeviceStats>('DeviceStats', DeviceStatsSchema);