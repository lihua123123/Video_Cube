import axiosInstance from './axiosInstance';

// 定义AI分析结果的具体类型
export interface AiAnalysisResult {
  summaries: {
    brief: string;
    normal: string;
    detailed: string;
  };
  confidence: number;
  processing_time: number;
  timestamps?: {
    start: number;
    end: number;
  }[];
  metadata?: {
    model_version: string;
    analysis_type: string;
    language: string;
  };
}

// AI分析任务数据类型定义
export interface AiAnalysisTask {
  id?: number;
  video_id: number;
  task_type: string;
  status: string;
  progress: number;
  result_data?: AiAnalysisResult;  // ✅ 使用具体类型
  error_message?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// AI分析服务类
class AiAnalysisService {
  // 获取AI分析任务列表
  async getAiAnalysisTasks(params?: {
    currentPage?: number;
    pageSize?: number;
    status?: string;
    task_type?: string;
    video_id?: number;
  }): Promise<{ tasks: AiAnalysisTask[] }> {
    const response = await axiosInstance.get('/admin/ai_analysis_tasks', { params });
    return {
      tasks: response.data.tasks.map((task: Record<string, unknown>) => this.parseTaskData(task))
    };
  }

  // 获取单个AI分析任务详情
  async getAiAnalysisTask(id: number): Promise<{ task: AiAnalysisTask }> {
    const response = await axiosInstance.get(`/admin/ai_analysis_tasks/${id}`);
    return {
      task: this.parseTaskData(response.data.task)
    };
  }

  // 创建AI分析任务
  async createAiAnalysisTask(taskData: Omit<AiAnalysisTask, 'id' | 'created_at' | 'updated_at'>): Promise<{ task: AiAnalysisTask }> {
    const response = await axiosInstance.post('/admin/ai_analysis_tasks', {
      ...taskData,
      result_data: taskData.result_data ? JSON.stringify(taskData.result_data) : null
    });
    return {
      task: this.parseTaskData(response.data.task)
    };
  }

  // 更新AI分析任务
  async updateAiAnalysisTask(id: number, taskData: Partial<AiAnalysisTask>): Promise<{ task: AiAnalysisTask }> {
    const dataToSend: Record<string, unknown> = { ...taskData };
    
    if (taskData.result_data) {
      dataToSend.result_data = JSON.stringify(taskData.result_data);
    }
    
    const response = await axiosInstance.put(`/admin/ai_analysis_tasks/${id}`, dataToSend);
    return {
      task: this.parseTaskData(response.data.task)
    };
  }

  // 删除AI分析任务
  async deleteAiAnalysisTask(id: number): Promise<{ success: boolean }> {
    const response = await axiosInstance.delete(`/admin/ai_analysis_tasks/${id}`);
    return response.data;
  }

  // 执行AI分析（用于触发分析过程）
  async executeAiAnalysis(videoId: number, analysisType: string): Promise<{ task: AiAnalysisTask }> {
    return await this.createAiAnalysisTask({
      video_id: videoId,
      task_type: analysisType,
      status: 'pending',
      progress: 0
    });
  }

  // 检查分析任务状态
  async checkAnalysisStatus(taskId: number): Promise<{ task: AiAnalysisTask }> {
    return await this.getAiAnalysisTask(taskId);
  }
  
  // 获取AI分析结果
  async getAiAnalysisResult(taskId: number): Promise<AiAnalysisResult | null> {
    try {
      const response = await this.getAiAnalysisTask(taskId);
      return response.task.result_data || null;
    } catch (error) {
      console.error('获取AI分析结果失败:', error);
      throw error;
    }
  }

  // 解析任务数据 - 处理result_data的序列化和反序列化
  private parseTaskData(task: Record<string, unknown>): AiAnalysisTask {
    // ✅ 修复：将null转换为undefined
    let parsedResultData: AiAnalysisResult | undefined;
    
    if (task.result_data) {
      if (typeof task.result_data === 'string') {
        const result = this.parseResultData(task.result_data);
        parsedResultData = result !== null ? result : undefined; // ✅ 修复：将null转为undefined
      } else if (typeof task.result_data === 'object') {
        parsedResultData = task.result_data as AiAnalysisResult;
      }
    }
    
    return {
      id: task.id as number,
      video_id: task.video_id as number,
      task_type: task.task_type as string,
      status: task.status as string,
      progress: task.progress as number,
      result_data: parsedResultData, // ✅ 现在类型匹配：AiAnalysisResult | undefined
      error_message: task.error_message as string,
      completed_at: task.completed_at as string,
      created_at: task.created_at as string,
      updated_at: task.updated_at as string
    };
  }

  // 解析结果数据 - 处理TEXT到JSON的转换
  private parseResultData(resultData: string): AiAnalysisResult | null {
    try {
      const parsed = JSON.parse(resultData);
      
      // 验证解析后的数据结构
      if (this.isValidAiAnalysisResult(parsed)) {
        return parsed;
      } else {
        console.warn('解析的AI分析结果格式不正确:', parsed);
        return null;
      }
    } catch (error) {
      console.error('解析AI分析结果数据失败:', error, resultData);
      return null;
    }
  }

  // 验证AI分析结果数据结构
  private isValidAiAnalysisResult(data: unknown): data is AiAnalysisResult {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    const result = data as Record<string, unknown>;
    return (
      typeof result.summaries === 'object' &&
      typeof result.confidence === 'number' &&
      typeof result.processing_time === 'number'
    );
  }
}

export default new AiAnalysisService();