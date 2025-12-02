import axiosInstance from './axiosInstance';

// 视频数据类型定义
export interface Video {
  id?: number;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 视频服务类
class VideoService {
  // 获取视频列表
  async getVideos(params?: {
    currentPage?: number;
    pageSize?: number;
    title?: string;
  }): Promise<{ videos: Video[] }> {
    return await axiosInstance.get('/admin/videos', { params });
  }

  // 获取单个视频详情
  async getVideo(id: number): Promise<{ video: Video }> {
    return await axiosInstance.get(`/admin/videos/${id}`);
  }

  // 创建新视频
  async createVideo(videoData: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ video: Video }> {
    return await axiosInstance.post('/admin/videos', videoData);
  }

  // 更新视频
  async updateVideo(id: number, videoData: Partial<Video>): Promise<{ video: Video }> {
    return await axiosInstance.put(`/admin/videos/${id}`, videoData);
  }

  // 删除视频
  async deleteVideo(id: number): Promise<{ success: boolean }> {
    return await axiosInstance.delete(`/admin/videos/${id}`);
  }
}

export default new VideoService();