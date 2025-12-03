const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class UploadService {
  constructor() {
    // 配置上传目录
    this.uploadDir = path.join(__dirname, '../public/uploads');
    this.videoDir = path.join(this.uploadDir, 'videos');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    this.imageDir = path.join(this.uploadDir, 'images');
    
    // 确保目录存在
    this.ensureDirectoriesExist();
  }

  /**
   * 确保上传目录存在
   */
  ensureDirectoriesExist() {
    const directories = [this.uploadDir, this.videoDir, this.thumbnailDir, this.imageDir];
    
    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`创建目录: ${dir}`);
      }
    });
  }

  /**
   * 生成唯一的文件名
   * @param {string} originalName - 原始文件名
   * @returns {string} 唯一的文件名
   */
  generateUniqueFileName(originalName) {
    const extension = path.extname(originalName);
    // 使用完整的UUID作为文件名主体，避免中文字符导致的编码问题
    const uniqueId = uuidv4();
    // 只保留扩展名，不使用包含中文的原始文件名
    return `${uniqueId}${extension}`;
  }

  /**
   * 视频文件存储配置
   */
  getVideoStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.videoDir);
      },
      filename: (req, file, cb) => {
        const uniqueFileName = this.generateUniqueFileName(file.originalname);
        cb(null, uniqueFileName);
      }
    });
  }

  /**
   * 视频文件过滤器
   * @param {Object} req - Express请求对象
   * @param {Object} file - 文件对象
   * @param {Function} cb - 回调函数
   */
  videoFileFilter(req, file, cb) {
    // 允许的视频MIME类型
    const allowedMimeTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/mpg',
      'video/webm',
      'video/3gp'
    ];

    // 允许的文件扩展名
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mpg', '.webm', '.3gp'];
    const extension = path.extname(file.originalname).toLowerCase();

    // 检查MIME类型和文件扩展名
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的视频格式。支持的格式: mp4, avi, mov, wmv, flv, mpg, webm, 3gp'));
    }
  }

  /**
   * 创建视频上传中间件
   * @param {Object} options - 上传选项
   * @returns {Function} multer中间件
   */
  createVideoUploadMiddleware(options = {}) {
    const {
      fieldName = 'video',
      limits = {
        fileSize: 500 * 1024 * 1024, // 500MB
        files: 1
      }
    } = options;

    const upload = multer({
      storage: this.getVideoStorage(),
      fileFilter: this.videoFileFilter,
      limits: limits
    });

    return upload.single(fieldName);
  }

  /**
   * 缩略图文件存储配置
   */
  getThumbnailStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.thumbnailDir);
      },
      filename: (req, file, cb) => {
        const uniqueFileName = this.generateUniqueFileName(file.originalname);
        cb(null, uniqueFileName);
      }
    });
  }

  /**
   * 缩略图文件过滤器
   * @param {Object} req - Express请求对象
   * @param {Object} file - 文件对象
   * @param {Function} cb - 回调函数
   */
  thumbnailFileFilter(req, file, cb) {
    // 允许的图片MIME类型
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    // 允许的文件扩展名
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = path.extname(file.originalname).toLowerCase();

    // 检查MIME类型和文件扩展名
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图片格式。支持的格式: JPG, PNG, GIF, WebP'));
    }
  }

  /**
   * 创建缩略图上传中间件
   * @param {Object} options - 上传选项
   * @returns {Function} multer中间件
   */
  createThumbnailUploadMiddleware(options = {}) {
    const {
      fieldName = 'thumbnail',
      limits = {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1
      }
    } = options;

    const upload = multer({
      storage: this.getThumbnailStorage(),
      fileFilter: this.thumbnailFileFilter,
      limits: limits
    });

    return upload.single(fieldName);
  }

  /**
   * 获取文件的公共访问URL路径
   * @param {string} fileName - 文件名
   * @param {string} type - 文件类型 ('video' 或 'thumbnail')
   * @returns {string} 相对URL路径
   */
  getPublicFilePath(fileName, type = 'video') {
    const basePath = type === 'video' ? '/uploads/videos/' : '/uploads/thumbnails/';
    return basePath + fileName;
  }

  /**
   * 获取文件的完整本地路径
   * @param {string} fileName - 文件名
   * @param {string} type - 文件类型 ('video' 或 'thumbnail')
   * @returns {string} 完整本地路径
   */
  getLocalFilePath(fileName, type = 'video') {
    const dir = type === 'video' ? this.videoDir : this.thumbnailDir;
    return path.join(dir, fileName);
  }

  /**
   * 删除文件
   * @param {string} fileName - 文件名
   * @param {string} type - 文件类型 ('video' 或 'thumbnail')
   * @returns {Promise<void>}
   */
  deleteFile(fileName, type = 'video') {
    return new Promise((resolve, reject) => {
      const filePath = this.getLocalFilePath(fileName, type);
      
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`已删除文件: ${filePath}`);
            resolve();
          }
        });
      } else {
        console.log(`文件不存在: ${filePath}`);
        resolve(); // 文件不存在也算成功
      }
    });
  }

  /**
   * 清理临时文件
   * @param {Array<string>} filePaths - 文件路径数组
   */
  async cleanTempFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`已清理临时文件: ${filePath}`);
        }
      } catch (error) {
        console.error(`清理临时文件失败: ${filePath}`, error);
      }
    }
  }

  /**
   * 图片文件存储配置
   */
  getImageStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.imageDir);
      },
      filename: (req, file, cb) => {
        const uniqueFileName = this.generateUniqueFileName(file.originalname);
        cb(null, uniqueFileName);
      }
    });
  }

  /**
   * 图片文件过滤器
   * @param {Object} req - Express请求对象
   * @param {Object} file - 文件对象
   * @param {Function} cb - 回调函数
   */
  imageFileFilter(req, file, cb) {
    // 允许的图片MIME类型
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    // 允许的文件扩展名
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const extension = path.extname(file.originalname).toLowerCase();

    // 检查MIME类型和文件扩展名
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图片格式。支持的格式: JPG, PNG, GIF, WebP, SVG'));
    }
  }

  /**
   * 创建图片上传中间件
   * @param {Object} options - 上传选项
   * @returns {Function} multer中间件
   */
  createImageUploadMiddleware(options = {}) {
    const {
      fieldName = 'image',
      limits = {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
      }
    } = options;

    const upload = multer({
      storage: this.getImageStorage(),
      fileFilter: this.imageFileFilter,
      limits: limits
    });

    return upload.single(fieldName);
  }
}

module.exports = new UploadService();