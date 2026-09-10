import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './user.model.js';

class File extends Model {}

File.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    s3Key: { type: DataTypes.STRING(255), allowNull: false },
    s3Url: { type: DataTypes.TEXT, allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    fileSize: { type: DataTypes.INTEGER, allowNull: false },
    mimeType: { type: DataTypes.STRING(100), allowNull: false },
    encryptionKey: { type: DataTypes.STRING(255), allowNull: true },
    encryptionIv: { type: DataTypes.STRING(255), allowNull: true },
    encryptionAuthTag: { type: DataTypes.STRING(255), allowNull: true },
    sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'files',
    timestamps: true,
  }
);

// Association mapping
User.hasMany(File, { foreignKey: 'senderId', as: 'sentFiles' });
File.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

File.belongsToMany(User, { through: 'file_recipients', as: 'recipients', foreignKey: 'fileId' });
User.belongsToMany(File, { through: 'file_recipients', as: 'receivedFiles', foreignKey: 'userId' });

File.belongsToMany(User, { through: 'file_hidden_by', as: 'hiddenBy', foreignKey: 'fileId' });
User.belongsToMany(File, { through: 'file_hidden_by', as: 'hiddenFiles', foreignKey: 'userId' });

export default File;
