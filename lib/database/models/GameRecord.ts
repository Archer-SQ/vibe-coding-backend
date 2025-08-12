import mongoose, { Schema, Document } from 'mongoose';

export interface IGameRecord extends Document {
  deviceId: string;
  score: number;
  createdAt: Date;
}

const GameRecordSchema: Schema = new Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: (v: string) => /^[a-f0-9]{32}$/.test(v),
      message: '设备ID格式不正确'
    }
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 999999,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'gameRecords'
});

// 复合索引
GameRecordSchema.index({ deviceId: 1, score: -1 });
GameRecordSchema.index({ score: -1, createdAt: -1 });

export default mongoose.model<IGameRecord>('GameRecord', GameRecordSchema);