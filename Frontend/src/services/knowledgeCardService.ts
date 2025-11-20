import axiosInstance from './axiosInstance';

// 知识卡片数据类型定义
export interface KnowledgeCard {
  id?: number;
  video_id: number;
  start_time: number;
  end_time: number;
  title: string;
  content: string;
  content_type?: string;
  display_style?: string;
  is_ai_generated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 知识卡片服务类
class KnowledgeCardService {
  // 获取知识卡片列表
  async getKnowledgeCards(params?: {
    currentPage?: number;
    pageSize?: number;
    title?: string;
    video_id?: number;
  }): Promise<{ knowledgeCards: KnowledgeCard[] }> {
    return await axiosInstance.get('/admin/knowledge_cards', { params });
  }

  // 获取单个知识卡片详情
  async getKnowledgeCard(id: number): Promise<{ knowledgeCard: KnowledgeCard }> {
    return await axiosInstance.get(`/admin/knowledge_cards/${id}`);
  }

  // 创建新知识卡片
  async createKnowledgeCard(cardData: Omit<KnowledgeCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ knowledgeCard: KnowledgeCard }> {
    return await axiosInstance.post('/admin/knowledge_cards', cardData);
  }

  // 更新知识卡片
  async updateKnowledgeCard(id: number, cardData: Partial<KnowledgeCard>): Promise<{ knowledgeCard: KnowledgeCard }> {
    return await axiosInstance.put(`/admin/knowledge_cards/${id}`, cardData);
  }

  // 删除知识卡片
  async deleteKnowledgeCard(id: number): Promise<{ success: boolean }> {
    return await axiosInstance.delete(`/admin/knowledge_cards/${id}`);
  }

  // 批量删除知识卡片
  async batchDeleteKnowledgeCards(ids: number[]): Promise<{ success: boolean }> {
    return await axiosInstance.post('/admin/knowledge_cards/batch-delete', { ids });
  }
}

export default new KnowledgeCardService();