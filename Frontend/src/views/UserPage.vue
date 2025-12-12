<template>
  <div class="user-container">
    <!-- 顶部标题栏 - 应用玻璃态效果 -->
    <header class="premium-header glass-card">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="app-title">视频魔方</h1>
          <p class="subtitle">Premium Learning Platform</p>
        </div>
      </div>
    </header>

    <!-- 主内容区域 - 左右分栏布局 -->
    <div class="main-content-wrapper">
      <!-- 左侧：视频编辑区域（支持滚动） -->
      <main class="video-main">

      <!-- 上传状态提示 -->
      <div v-if="uploadStatus" class="upload-status">
        {{ uploadStatus }}
      </div>
      
      <!-- 视频URL输入区 - 应用现代设计 -->
      <div class="video-url-section premium-input-section">
        <div class="url-input-group glass-card">
          <div class="input-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="input-icon" style="vertical-align: middle;">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <h3 class="input-title">视频链接</h3>
          </div>
          <div class="input-wrapper premium-input-group">
            <input 
              type="text" 
              v-model="videoUrl" 
              placeholder="请输入视频URL链接..." 
              class="premium-url-input" 
            />
            <button @click="loadVideo" class="premium-load-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              加载视频
            </button>
          </div>
          <p class="input-hint">支持 YouTube、Bilibili 等主流视频平台链接</p>
        </div>
      </div>

      <!-- 视频播放区域 - 应用现代设计 -->
      <div class="video-player-container premium-video-container">
        <div v-if="!currentVideo" class="video-placeholder glass-card">
          <div class="placeholder-content">
            <div class="placeholder-icon premium-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M23 7l-7 5 7 5V7z"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <h3 class="placeholder-title">视频预览区域</h3>
            <p class="placeholder-description">加载视频后开始播放和编辑</p>
            <div v-if="isEncoding" class="encoding-status premium-status">
              <div class="loading-spinner"></div>
              <span>正在编码中请稍候...</span>
            </div>
          </div>
        </div>
        <div v-else class="video-wrapper" ref="videoWrapperRef" @click="handleVideoClick" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
          <video
            ref="videoPlayerRef"
            :src="currentVideo"
            class="video-player"
            @timeupdate="handleTimeUpdate"
            @loadedmetadata="handleVideoLoaded"
            @error="handleVideoError"
            @loadstart="handleVideoLoadStart"
            @canplay="handleVideoCanPlay"
            @seeked="handleSeeked"
            @dblclick="toggleFullscreen"
          ></video>
          
          <!-- 自定义视频控制UI - 应用现代设计 -->
          <transition name="fade-controls">
            <div v-show="showControls" class="custom-controls premium-controls">
              <!-- 顶部信息栏 -->
              <div class="controls-top glass-card">
                <div class="video-title premium-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="title-icon" style="vertical-align: middle;">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  {{ uploadVideoTitle || '视频播放中' }}
                </div>
              </div>
              
              <!-- 底部控制栏 -->
              <div class="controls-bottom glass-card">
                <!-- 进度条 -->
                <div 
                  class="progress-bar-container premium-progress" 
                  @click="handleProgressClick" 
                  @mousemove="handleProgressHover"
                  @mouseleave="handleProgressLeave"
                  ref="progressBarRef"
                >
                  <!-- 分段信息显示 -->
                  <div v-if="currentActiveSegment" class="segment-info-display">
                    <span class="segment-time-range">{{ formatTime(currentActiveSegment.start_time) }} - {{ formatTime(currentActiveSegment.end_time) }}</span>
                    <span class="segment-title-info">{{ currentActiveSegment.title }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-buffered" :style="{ width: bufferedPercent + '%' }"></div>
                    <div class="progress-bar-played premium-played" :style="{ width: playedPercent + '%' }">
                      <div class="progress-handle premium-handle"></div>
                    </div>
                    
                    <!-- 视频分段标记 -->
                    <div v-if="isSegmentMode && videoSegments.length > 0" class="segment-markers">
                      <div 
                        v-for="segment in videoSegments" 
                        :key="segment.id"
                      >
                        <!-- 分段间填充区域 -->
                        <div 
                          v-if="segment.end_time > segment.start_time"
                          class="segment-fill"
                          :class="{ 
                            'active': activeSegmentId === segment.id,
                            'hover': hoverSegment?.id === segment.id
                          }"
                          :style="{ 
                            left: (segment.start_time / duration * 100) + '%',
                            width: ((segment.end_time - segment.start_time) / duration * 100) + '%',
                            '--segment-color': getSegmentColor(segment)
                          }"
                          @mouseenter="hoverSegment = segment"
                          @mouseleave="hoverSegment = null"
                          @click="handleSegmentClick(segment, $event)"
                        >
                        </div>
                        
                        <!-- 开始时间标记点 -->
                        <div 
                          class="segment-marker start-marker"
                          :class="{ 
                            'active': activeSegmentId === segment.id,
                            'hover': hoverSegment?.id === segment.id
                          }"
                          :style="{ 
                            left: (segment.start_time / duration * 100) + '%',
                            '--segment-color': getSegmentColor(segment)
                          }"
                          @mouseenter="hoverSegment = segment"
                          @mouseleave="hoverSegment = null"
                          @click="seekToSegment(segment)"
                        >
                        </div>
                        <!-- 结束时间标记点 -->
                        <div 
                          v-if="segment.end_time > segment.start_time"
                          class="segment-marker end-marker"
                          :class="{ 
                            'active': activeSegmentId === segment.id,
                            'hover': hoverSegment?.id === segment.id
                          }"
                          :style="{ 
                            left: (segment.end_time / duration * 100) + '%',
                            '--segment-color': getSegmentColor(segment)
                          }"
                          @mouseenter="hoverSegment = segment"
                          @mouseleave="hoverSegment = null"
                          @click="seekToSegment(segment)"
                        >
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 时间提示 -->
                  <div v-if="hoverTime !== null" class="time-tooltip" :style="{ left: hoverPosition + '%' }">
                    {{ formatTime(hoverTime) }}
                  </div>
                </div>
                
                <!-- 控制按钮组 -->
                <div class="controls-buttons">
                  <!-- 左侧按钮组 -->
                  <div class="controls-left">
                    <!-- 播放/暂停 -->
                    <button @click="togglePlay" class="control-btn" title="播放/暂停 (空格)">
                      <svg v-if="!isPlaying" width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    </button>
                    
                    <!-- 音量 -->
                    <div class="volume-control" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
                      <button @click="toggleMute" class="control-btn" title="静音/取消静音 (M)">
                        <svg v-if="volume === 0 || isMuted" width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        </svg>
                        <svg v-else-if="volume < 0.5" width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                        </svg>
                        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                      </button>
                      <transition name="fade">
                        <div v-show="showVolumeSlider" class="volume-slider">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            :value="volume * 100"
                            @input="handleVolumeChange"
                            class="volume-input"
                          />
                        </div>
                      </transition>
                    </div>
                    
                    <!-- 时间显示 -->
                    <div class="time-display">
                      <span>{{ currentTimeDisplay }}</span>
                      <span class="time-separator">/</span>
                      <span>{{ durationDisplay }}</span>
                    </div>
                  </div>
                  
                  <!-- 右侧按钮组 -->
                  <div class="controls-right">
                    <!-- 倍速 -->
                    <div class="playback-rate" @mouseenter="showRateMenu = true" @mouseleave="showRateMenu = false">
                      <button class="control-btn rate-btn" title="播放速度">
                        <span>{{ playbackRate }}x</span>
                      </button>
                      <transition name="fade">
                        <div v-show="showRateMenu" class="rate-menu">
                          <div
                            v-for="rate in [0.5, 0.75, 1, 1.25, 1.5, 2]"
                            :key="rate"
                            @click="setPlaybackRate(rate)"
                            class="rate-option"
                            :class="{ active: playbackRate === rate }"
                          >
                            {{ rate }}x
                          </div>
                        </div>
                      </transition>
                    </div>
                    
                    <!-- 知识卡片显示/隐藏切换 -->
                    <button 
                      @click="showKnowledgeCards = !showKnowledgeCards" 
                      class="control-btn knowledge-cards-btn"
                      :class="{ active: showKnowledgeCards }"
                      :title="showKnowledgeCards ? '隐藏知识卡片' : '显示知识卡片'"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                    </button>
                    

                    
                    <!-- 全屏 -->
                    <button @click="toggleFullscreen" class="control-btn" :title="isFullscreen ? '退出全屏 (F/ESC)' : '全屏 (F/双击)'">
                      <svg v-if="!isFullscreen" width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </transition>
          
          <!-- 首次使用提示 - 引导用户使用全屏功能 -->
          <transition name="fade">
            <div v-if="showFullscreenTip && !isFullscreen" class="fullscreen-tip">
              <div class="tip-content">
                <div class="tip-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle;">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="tip-text">
                  <div class="tip-title">提示:多种方式进入全屏</div>
                  <div class="tip-methods">
                    <span>• 点击右下角"全屏"按钮</span>
                    <span>• 双击视频</span>
                    <span>• 按 F 键</span>
                  </div>
                </div>
                <button class="tip-close" @click="closeFullscreenTip">知道了</button>
              </div>
            </div>
          </transition>
          
          <!-- 视频时间显示 -->
          <div class="video-time-display">
            {{ currentTimeDisplay }} / {{ durationDisplay }}
          </div>
          
          <!-- 知识卡片弹窗 - 在video-wrapper内部,支持全屏显示 -->
          <KnowledgeCardPopup
            v-for="(popupCard, index) in visiblePopupCards"
            :key="popupCard.id"
            v-if="showKnowledgeCards"
            :card="popupCard"
            :visible="true"
            :position="'top-right'"
            :size="'medium'"
            :auto-close="true"
            :auto-close-delay="10"
            :draggable="true"
            :style="getPopupStyle(index)"
            @close="handlePopupClose(popupCard.id)"
            @card-link-click="handleCardLinkClick"
          />
          
          <!-- 文字进度条 -->
          <div 
            class="fullscreen-text-progress-bar"
            @click="handleFullscreenProgressClick" 
            @mousemove="handleFullscreenProgressHover"
            @mouseleave="handleFullscreenProgressLeave"
            ref="fullscreenProgressBarRef"
          >
            <!-- 进度条背景 - 连接视频边框 -->
            <div class="text-progress-bg">
              <!-- 播放进度条 -->
              <div class="text-progress-played" :style="{ width: playedPercent + '%' }"></div>
              
              <!-- 播放进度指示器 -->
              <div class="text-progress-indicator" :style="{ left: playedPercent + '%' }">
                <div class="progress-handle">▶</div>
              </div>
              
              <!-- 分段标记和信息区域 -->
              <div v-if="isSegmentMode && videoSegments.length > 0" class="text-segment-container">
                <!-- 分段间填充区域 -->
                <div 
                  v-for="(segment, index) in videoSegments" 
                  :key="'fill-' + segment.id"
                  class="text-segment-fill"
                  :class="{ 
                    'active': activeSegmentId === segment.id,
                    'hover': hoverFullscreenSegment?.id === segment.id
                  }"
                  :style="{ 
                    left: (segment.start_time / duration * 100) + '%',
                    width: ((segment.end_time - segment.start_time) / duration * 100) + '%',
                    '--segment-color': getSegmentColor(segment)
                  }"
                  @click="handleFullscreenSegmentClick(segment, $event)"
                >
                  <!-- 分段信息文字 -->
                  <div 
                    v-if="segment.title"
                    class="text-segment-info"
                    :class="{ 
                      'active': activeSegmentId === segment.id,
                      'hover': hoverFullscreenSegment?.id === segment.id
                    }"
                  >
                    <div class="segment-title">{{ segment.title }}</div>
                  </div>
                </div>
                
                <div 
                  v-for="segment in videoSegments" 
                  :key="segment.id"
                  class="text-segment-item"
                >
                  <!-- 分段开始标记 - 使用 | 符号 -->
                  <div 
                    class="text-segment-marker start-marker"
                    :class="{ 
                      'active': activeSegmentId === segment.id,
                      'hover': hoverFullscreenSegment?.id === segment.id
                    }"
                    :style="{ 
                      left: (segment.start_time / duration * 100) + '%',
                      '--segment-color': getSegmentColor(segment)
                    }"
                    @mouseenter="hoverFullscreenSegment = segment"
                    @mouseleave="hoverFullscreenSegment = null"
                    @click="handleFullscreenSegmentClick(segment, $event)"
                  >
                    |
                  </div>
                  
                  <!-- 分段结束标记 - 使用 | 符号 -->
                  <div 
                    v-if="segment.end_time > segment.start_time"
                    class="text-segment-marker end-marker"
                    :class="{ 
                      'active': activeSegmentId === segment.id,
                      'hover': hoverFullscreenSegment?.id === segment.id
                    }"
                    :style="{ 
                      left: (segment.end_time / duration * 100) + '%',
                      '--segment-color': getSegmentColor(segment)
                    }"
                    @mouseenter="hoverFullscreenSegment = segment"
                    @mouseleave="hoverFullscreenSegment = null"
                    @click="handleFullscreenSegmentClick(segment, $event)"
                  >
                    |
                  </div>
                  

                </div>
              </div>
            </div>
            
            <!-- 时间提示 -->
            <div v-if="hoverFullscreenTime !== null" class="text-time-tooltip" :style="{ left: hoverFullscreenPosition + '%' }">
              {{ formatTime(hoverFullscreenTime) }}
            </div>
            
            <!-- 分段详细信息显示 -->
            <div v-if="hoverFullscreenSegment" class="text-segment-detail">
              <div class="detail-content">
                <div class="detail-title">{{ hoverFullscreenSegment.title }}</div>
                <div class="detail-type">{{ getSegmentTypeText(hoverFullscreenSegment.segment_type) }}</div>
                <div class="detail-time">{{ formatTime(hoverFullscreenSegment.start_time) }} - {{ formatTime(hoverFullscreenSegment.end_time) }}</div>
              </div>
            </div>
          </div>
        </div>
    </div>
    
    <!-- 视频总结组件 (在视频播放器下方,可滚动查看) -->
    <div style="flex-shrink: 0; margin: 20px 0;">
      <VideoSummary
        v-if="currentVideo"
        :video-id="videoId ?? undefined"
        :video-title="uploadVideoTitle"
        :video-duration="duration"
        @generate="handleGenerateSummary"
        @export="handleExportSummary"
      />
    </div>
    
    <!-- 通知提示组件 -->
    <div class="notification" v-if="notification.show">
      {{ notification.message }}
    </div>
    

    
    <!-- 底部操作按钮 -->
    <div class="video-action-buttons premium-actions">
        <button @click="openVideoLibrary" class="premium-action-btn library-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 2px; vertical-align: middle;">
            <path d="M21 6H3v12h18V6zM3 4h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
            <path d="M8 8h8M8 12h8M8 16h5"/>
          </svg>视频库
        </button>
        <button @click="saveProject" class="premium-action-btn save-btn">保存项目</button>
        <button @click="exportProject" class="premium-action-btn export-btn">导出为可分享链接</button>
        <button @click="openUploadModal" class="premium-action-btn upload-btn">上传视频</button>
        <button @click="goToEditPage" class="premium-action-btn edit-cards-btn" :disabled="!currentVideo">编辑知识卡片</button>
      </div>
      </main>
      
      <!-- 右侧：知识卡片侧边栏 -->
      <aside v-if="showKnowledgeCards" class="knowledge-cards-sidebar">
        <div class="sidebar-header">
          <h2>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px; vertical-align: middle;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>相关知识 ({{ knowledgeCards.length }})
        </h2>
          <!-- 调试信息 -->
          <div class="debug-info" v-if="currentVideo" :title="`点击查看详细信息`" @click="showDebugInfo">
            <span class="debug-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="vertical-align: middle;">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <span class="debug-text">VideoID: {{ videoId || '未设置' }}</span>
          </div>
          <!-- 快速修复按钮 -->
          <button 
            v-if="currentVideo && (!videoId || knowledgeCards.length === 0)" 
            @click="quickFixVideoId"
            class="quick-fix-btn"
            title="尝试自动修复VideoID"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 6px; vertical-align: middle;">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>自动修复
          </button>
        </div>
        <div class="sidebar-content">
          <KnowledgeCardDisplay
            :cards="knowledgeCards"
            :current-time="currentTime"
            :video-duration="duration"
            :is-loading="isLoadingCards"
            @card-click="handleCardClick"
            @card-link-click="handleCardLinkClick"
            @seek-to-time="seekToTime"
          />
        </div>
      </aside>
    </div>
    
    <!-- 链接内容模态框 -->
    <LinkContentModal 
      :visible="showLinkModal" 
      :url="currentLinkUrl" 
      :title="currentLinkTitle"
      @close="closeLinkModal"
      @back="handleBackToCard"
      @external-open="handleExternalOpen"
    />
    
    <!-- 知识卡片详情模态框 -->
    <KnowledgeCardModal
      :is-visible="showCardModal"
      :cards="currentModalCard ? [currentModalCard] : []"
      @close="closeCardModal"
      @link-click="handleCardLinkClick"
    />
    
    <!-- 视频库模态框 -->
    <transition name="modal-zoom">
      <div v-if="showVideoLibrary" class="modal-overlay" @click.self="closeVideoLibrary">
        <div class="modal-content library-modal">
          <div class="modal-header">
            <h3>视频库</h3>
            <button class="close-btn" @click="closeVideoLibrary">×</button>
          </div>
          <div class="modal-body library-body">
            <VideoLibrary 
              ref="videoLibraryRef"
              @play="handleLibraryVideoPlay"
              @select="handleLibraryVideoSelect"
            />
          </div>
        </div>
      </div>
    </transition>

    <!-- 上传模态框 -->
    <transition name="modal-zoom">
      <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>上传视频</h3>
            <button class="close-btn" @click="closeUploadModal">×</button>
          </div>
          <div class="modal-body">
            <VideoUpload ref="videoUploadRef" @success="handleUploadSuccess" @progress="handleUploadProgress" @error="handleUploadError" />
            
            <div class="modal-actions">
              <button @click="closeUploadModal" class="btn-secondary">取消</button>
              <template v-if="videoUploadRef?.uploadMode === 'file'">
                <button @click="triggerFileSelection" class="btn-primary">选择视频文件</button>
                <button @click="confirmUpload" class="btn-primary" :disabled="!videoUploadRef?.hasFile()">
                  确认上传
                </button>
              </template>
              <template v-else>
                <button @click="confirmUrlUpload" class="btn-primary">
                  创建视频
                </button>
              </template>
            </div>
            
            <!-- 隐藏的文件输入 -->
            <input
              ref="hiddenFileInput"
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime"
              @change="handleHiddenFileChange"
              style="display: none"
            />
          </div>
        </div>
      </div>
    </transition>
  
  <!-- 通知提示组件 -->
  <div v-if="notification.show" :class="['notification', notification.type]" class="notification">
    {{ notification.message }}
  </div>
</div>
</template>

<style scoped>
.notification {
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background-color: #52c41a;
  color: white;
}

.notification.error {
  background-color: #dc3545;
  color: white;
}

.notification.info {
  background-color: #1890ff;
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 分段信息显示样式 */
.progress-bar-container {
  position: relative;
}

.segment-info-display {
  position: absolute;
  top: -30px;
  left: 0;
  right: auto;
  transform: translateX(0);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10010;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
  transition: all 0.3s ease;
  min-width: 100px;
  box-sizing: border-box;
}

.segment-info-display:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.9);
}

/* 底部操作按钮样式 - 与EditPage保持一致 */
.premium-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.premium-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 10px 20px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.premium-action-btn:hover {
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

/* 保持原有按钮颜色 */
.library-btn {
  background: #1b2a31;
  color: white;
}

.save-btn {
  background: #5399A0;
  color: white;
}

.export-btn {
  background: #98C3C7;
  color: white;
}

.upload-btn {
  background: #BE9F89;
  color: white;
}

.edit-cards-btn {
  background: #E0D7C7;
  color: white;
}

/* 按钮hover效果 */
.library-btn:hover {
  box-shadow: 0 6px 20px rgba(27, 42, 49, 0.4);
}

.save-btn:hover {
  box-shadow: 0 6px 20px rgba(83, 153, 160, 0.4);
}

.export-btn:hover {
  box-shadow: 0 6px 20px rgba(152, 195, 199, 0.4);
}

.upload-btn:hover {
  box-shadow: 0 6px 20px rgba(190, 159, 137, 0.4);
}

.edit-cards-btn:hover {
  box-shadow: 0 6px 20px rgba(224, 215, 199, 0.4);
}

.premium-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.segment-time-range {
  font-weight: 600;
  color: #4ecdc4;
}

.segment-title-info {
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import VideoUpload from '@/components/VideoUpload.vue'
import VideoLibrary from '@/components/VideoLibrary.vue'
import LinkContentModal from '@/components/LinkContentModal.vue'
import KnowledgeCardPopup from '@/components/KnowledgeCardPopup.vue'
import KnowledgeCardDisplay from '@/components/KnowledgeCardDisplay.vue'
import KnowledgeCardModal from '@/components/KnowledgeCardModal.vue'
import VideoSummary from '@/components/VideoSummary.vue'

const router = useRouter()

// 定义卡片类型
interface Card {
  id: number
  video_id: number
  startTime: number
  endTime: number
  title: string
  content: string
  content_type: string
  display_style: string
  is_ai_generated?: boolean
  created_at?: string
}

// 定义视频分段类型
interface VideoSegment {
  id: number
  video_id: number
  start_time: number
  end_time: number
  title: string
  description?: string
  segment_type: 'chapter' | 'highlight' | 'summary' | 'custom'
  color?: string
  created_at?: string
}

// 视频相关数据
const videoUrl = ref('')
const currentVideo = ref('')
const currentTime = ref(0)
const duration = ref(0)
const isEncoding = ref(false)
const videoUploadRef = ref()
const videoLibraryRef = ref()
const showUploadModal = ref(false)
const showVideoLibrary = ref(false)
const uploadVideoTitle = ref('')
const uploadVideoDescription = ref('')
const uploadStatus = ref('')
const hiddenFileInput = ref<HTMLInputElement>()

// 知识卡片相关数据
const knowledgeCards = ref<Card[]>([])
const currentCards = ref<Card[]>([])
const isLoadingCards = ref(false)
const videoId = ref<number | null>(null)
const selectedCardId = ref<string | number | null>(null)
// 弹窗相关变量
const currentPopupCard = ref<Card | null>(null)
const showCardPopup = ref(false)

// 视频分段相关数据
const videoSegments = ref<VideoSegment[]>([])
const isSegmentMode = ref(true) // 是否启用分段模式
const activeSegmentId = ref<number | null>(null)
const hoverSegment = ref<VideoSegment | null>(null)

// 知识卡片显示控制
const showKnowledgeCards = ref(true) // 是否显示知识卡片

// 通知提示相关状态
const notification = ref<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' })

// 显示通知的辅助函数
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 链接模态框相关状态
const showLinkModal = ref(false)
const currentLinkUrl = ref('')
const currentLinkTitle = ref('')

// 知识卡片详情模态框相关状态
const showCardModal = ref(false)
const currentModalCard = ref<Card | null>(null)

// 知识卡片弹窗相关状态
const visiblePopupCards = ref<Card[]>([])
const displayedCardIds = ref<Set<string | number>>(new Set())
const manuallyOpenedCards = ref<Card[]>([]) // 手动打开的卡片
let popupTimer: number | null = null

// 全屏相关状态和引用
const videoWrapperRef = ref<HTMLElement | null>(null)
const videoPlayerRef = ref<HTMLVideoElement | null>(null)
const isFullscreen = ref(false)
const showFullscreenTip = ref(false)

// 自定义控制UI状态
const showControls = ref(true)
const isPlaying = ref(false)
const volume = ref(1)
const isMuted = ref(false)
const playbackRate = ref(1)
const showVolumeSlider = ref(false)
const showRateMenu = ref(false)
const bufferedPercent = ref(0)
const playedPercent = ref(0)
const hoverTime = ref<number | null>(null)
const hoverPosition = ref(0)
const progressBarRef = ref<HTMLElement | null>(null)
let controlsTimer: number | null = null

// 全屏进度条相关状态
const showFullscreenProgressBar = ref(true)
const hoverFullscreenTime = ref<number | null>(null)
const hoverFullscreenPosition = ref(0)
const hoverFullscreenSegment = ref<VideoSegment | null>(null)
const fullscreenProgressBarRef = ref<HTMLElement | null>(null)
let fullscreenControlsTimer: number | null = null

// 关闭全屏提示
const closeFullscreenTip = () => {
  showFullscreenTip.value = false
  localStorage.setItem('fullscreenTipShown', 'true')
}

// 格式化时间
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 计算属性
const currentTimeDisplay = computed(() => {
  const minutes = Math.floor(currentTime.value / 60)
  const seconds = Math.floor(currentTime.value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const durationDisplay = computed(() => {
  const minutes = Math.floor(duration.value / 60)
  const seconds = Math.floor(duration.value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// 获取当前活跃的分段
const currentActiveSegment = computed(() => {
  if (!videoSegments.value.length || !duration.value) return null
  
  return videoSegments.value.find(segment => 
    currentTime.value >= segment.start_time && currentTime.value <= segment.end_time
  ) || null
})

// 检查URL参数，处理分享链接和恢复保存的视频状态
const checkShareLink = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const isShare = urlParams.get('share') === 'true'
    const sharedVideoUrl = urlParams.get('videoUrl')
    const returnFromEdit = urlParams.get('returnFromEdit') === 'true'
    const urlVideoId = urlParams.get('videoId')
    
    console.log('🔍 检查URL参数:', { isShare, returnFromEdit, urlVideoId })
    
    if (isShare && sharedVideoUrl) {
      // 如果是分享链接，自动加载视频
      videoUrl.value = sharedVideoUrl
      loadVideo()
    } else if (returnFromEdit && urlVideoId) {
      // ✅ 新增:如果是从 EditPage 返回,使用 URL 中的 videoId
      console.log('🔙 从 EditPage 返回,使用 videoId:', urlVideoId)
      restoreVideoFromStorage(parseInt(urlVideoId))
    } else {
      // 如果不是分享链接，尝试恢复保存的视频状态
      restoreVideoFromStorage()
    }
  } catch (error) {
    console.error('处理分享链接时出错:', error)
    // 即使出错也不应该导致页面空白
  }
}

// 自动保存视频状态到localStorage
const saveVideoToStorage = () => {
  try {
    if (currentVideo.value && videoUrl.value) {
      const videoState = {
        videoUrl: videoUrl.value,
        videoId: videoId.value,  // 🔧 修复: 保存 videoId
        videoName: uploadVideoTitle.value || '未命名视频',
        videoDescription: uploadVideoDescription.value,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem('lastVideoState', JSON.stringify(videoState))
      console.log('💾 已保存视频状态:', { videoUrl: videoUrl.value, videoId: videoId.value })
    }
  } catch (error) {
    console.error('保存视频状态时出错:', error)
  }
}

// 从localStorage恢复视频状态
const restoreVideoFromStorage = (overrideVideoId?: number) => {
  try {
    const savedState = localStorage.getItem('lastVideoState')
    if (savedState) {
      const videoState = JSON.parse(savedState)
      // 检查保存状态是否在合理的时间范围内（例如30分钟内）
      const savedTime = new Date(videoState.savedAt)
      const now = new Date()
      const timeDiff = now.getTime() - savedTime.getTime()
      const thirtyMinutes = 30 * 60 * 1000
      
      if (timeDiff < thirtyMinutes) {
        // ✅ 关键修复:先设置所有状态,再调用 loadVideo()
        // 这样 loadVideo() 就不会覆盖 videoId
        videoUrl.value = videoState.videoUrl
        // ✅ 优先使用传入的 videoId (从 EditPage 返回时),否则使用保存的 videoId
        videoId.value = overrideVideoId || videoState.videoId || 1
        uploadVideoDescription.value = videoState.videoDescription || ''
        uploadVideoTitle.value = videoState.videoName || '未命名视频'
        
        console.log('📂 准备恢复视频状态:', { 
          videoUrl: videoUrl.value, 
          videoId: videoId.value,
          来源: overrideVideoId ? 'URL参数(从EditPage返回)' : 'localStorage',
          overrideVideoId参数: overrideVideoId,
          localStorage中的videoId: videoState.videoId
        })
        
        // ✅ 加载视频 (loadVideo 现在不会修改 videoId)
        loadVideo()
        
        console.log('📂 已恢复保存的视频状态 (loadVideo后):', { 
          videoUrl: videoUrl.value, 
          videoId: videoId.value,
          来源: overrideVideoId ? 'URL参数(从EditPage返回)' : 'localStorage'
        })
        
        // 🔧 修复: 恢复视频后,加载对应的知识卡片
        if (videoId.value) {
          fetchKnowledgeCards()
        }
      }
    }
  } catch (error) {
    console.error('恢复视频状态时出错:', error)
  }
}

// 组件挂载后检查分享链接
// 处理全屏变化
const handleFullscreenChange = () => {
  // 检查是否处于全屏状态
  const fullscreenElement = document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  
  // 检查全屏元素是否是 video-wrapper (正确) 或 video (错误)
  const isVideoWrapperFullscreen = fullscreenElement === videoWrapperRef.value
  const isVideoFullscreen = fullscreenElement === videoPlayerRef.value
  
  isFullscreen.value = !!fullscreenElement
  
  console.log('═══════════════════════════════════════')
  console.log('🖥️ 全屏状态变化:', isFullscreen.value ? '进入全屏' : '退出全屏')
  console.log('   全屏元素:', fullscreenElement)
  console.log('   是否video-wrapper全屏:', isVideoWrapperFullscreen, '✅ (正确)')
  console.log('   是否video元素全屏:', isVideoFullscreen, isVideoFullscreen ? '⚠️ (知识卡片不会显示!)' : '')
  console.log('   当前弹窗状态:', visiblePopupCards.value.length > 0)
  console.log('   当前卡片数:', visiblePopupCards.value.length)
  console.log('   当前卡片:', visiblePopupCards.value.map(card => card.title))
  console.log('   当前时间范围内的卡片数:', currentCards.value.length)
  console.log('   已显示的卡片ID集合:', Array.from(displayedCardIds.value))
  
  // 如果是video元素全屏,给出警告
  if (isVideoFullscreen) {
    console.warn('⚠️ 警告: 当前是video元素全屏,知识卡片无法显示!')
    console.warn('   请使用右下角的自定义全屏按钮,而不是video自带的全屏按钮')
  }
  
  // 全屏进度条控制
  if (isFullscreen.value) {
    // 进入全屏时显示控制UI，但延迟显示全屏进度条
    showControls.value = true
    // 延迟500ms后显示全屏进度条，让原进度条先消失
    setTimeout(() => {
      showFullscreenProgressBar.value = true
      resetFullscreenControlsTimer()
    }, 500)
    resetControlsTimer()
  } else {
    // 退出全屏时确保显示控制UI，隐藏全屏进度条
    showControls.value = true
    showFullscreenProgressBar.value = false
  }
  
  // 检查 overlay 元素是否存在及其样式
  if (isFullscreen.value) {
    setTimeout(() => {
      const overlay = document.querySelector('.knowledge-card-popup-overlay')
      if (overlay) {
        const styles = window.getComputedStyle(overlay)
        console.log('   📦 弹窗overlay元素样式检查:')
        console.log('      position:', styles.position)
        console.log('      display:', styles.display)
        console.log('      z-index:', styles.zIndex)
        console.log('      top:', styles.top)
        console.log('      left:', styles.left)
        console.log('      width:', styles.width)
        console.log('      height:', styles.height)
      } else {
        console.log('   ⚠️ 未找到 .knowledge-card-popup-overlay 元素')
      }
    }, 100)
  }
  
  // 全屏时如果有卡片应该显示,确保它显示
  if (isFullscreen.value && currentCards.value.length > 0) {
    console.log('   🔔 全屏模式下重新检查是否需要显示卡片')
    checkAndShowPopup([])
  }
  console.log('═══════════════════════════════════════')
}

// 添加全屏事件监听
const setupFullscreenListeners = () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
}

// 移除全屏事件监听
const removeFullscreenListeners = () => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
}

// 键盘快捷键处理
const handleKeyPress = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement
  // 如果在输入框中,不处理快捷键
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return
  }
  
  // 空格键:播放/暂停
  if (event.code === 'Space') {
    event.preventDefault()
    togglePlay()
  }
  // F键:切换全屏
  else if (event.key === 'f' || event.key === 'F') {
    event.preventDefault()
    toggleFullscreen()
  }
  // M键:静音/取消静音
  else if (event.key === 'm' || event.key === 'M') {
    event.preventDefault()
    toggleMute()
  }
  // 左箭头:后退5秒
  else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    seekBy(-5)
  }
  // 右箭头:前进5秒
  else if (event.key === 'ArrowRight') {
    event.preventDefault()
    seekBy(5)
  }
  // 上箭头:增加音量
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    adjustVolume(0.1)
  }
  // 下箭头:减少音量
  else if (event.key === 'ArrowDown') {
    event.preventDefault()
    adjustVolume(-0.1)
  }
  // ESC键退出全屏(浏览器会自动处理)
}

// 控制UI交互方法
// 播放/暂停
const togglePlay = () => {
  const video = videoPlayerRef.value
  if (!video) return
  
  if (video.paused) {
    video.play()
    isPlaying.value = true
  } else {
    video.pause()
    isPlaying.value = false
  }
}

// 静音/取消静音
const toggleMute = () => {
  const video = videoPlayerRef.value
  if (!video) return
  
  video.muted = !video.muted
  isMuted.value = video.muted
}

// 调整音量
const handleVolumeChange = (event: Event) => {
  const video = videoPlayerRef.value
  if (!video) return
  
  const target = event.target as HTMLInputElement
  const newVolume = parseInt(target.value) / 100
  video.volume = newVolume
  volume.value = newVolume
  isMuted.value = newVolume === 0
}

// 音量增减
const adjustVolume = (delta: number) => {
  const video = videoPlayerRef.value
  if (!video) return
  
  let newVolume = volume.value + delta
  newVolume = Math.max(0, Math.min(1, newVolume))
  video.volume = newVolume
  volume.value = newVolume
  isMuted.value = newVolume === 0
}

// 设置播放速度
const setPlaybackRate = (rate: number) => {
  const video = videoPlayerRef.value
  if (!video) return
  
  video.playbackRate = rate
  playbackRate.value = rate
  showRateMenu.value = false
}

// 分段相关方法
// 获取分段颜色
const getSegmentColor = (segment: VideoSegment): string => {
  const colors = {
    chapter: '#ff6b6b',
    highlight: '#4ecdc4', 
    summary: '#45b7d1',
    custom: '#96ceb4'
  }
  return segment.color || colors[segment.segment_type] || colors.custom
}

// 获取分段类型文本描述
const getSegmentTypeText = (segmentType: string): string => {
  const typeMap: Record<string, string> = {
    'introduction': '开场介绍',
    'key-point': '核心概念',
    'example': '实例演示',
    'analysis': '深入分析',
    'summary': '总结回顾',
    'exercise': '练习环节',
    'highlight': '重点',
    'custom': '自定义'
  }
  return typeMap[segmentType] || '分段'
}

// 跳转到指定分段
const seekToSegment = (segment: VideoSegment) => {
  const video = videoPlayerRef.value
  if (!video || !duration.value) return
  
  // 跳转到分段开始时间
  video.currentTime = segment.start_time
  activeSegmentId.value = segment.id
  
  console.log(`🎯 跳转到分段: ${segment.title} (${formatTime(segment.start_time)})`)
}

// 处理分段点击事件 - 支持高亮显示和取消高亮
const handleSegmentClick = (segment: VideoSegment, event: Event) => {
  // 阻止事件冒泡，避免触发进度条点击事件
  event.stopPropagation()
  
  // 如果当前分段已经是高亮状态，则取消高亮
  if (activeSegmentId.value === segment.id) {
    activeSegmentId.value = null
    console.log(`🔘 取消分段高亮: ${segment.title}`)
  } else {
    // 否则跳转到该分段并高亮显示
    seekToSegment(segment)
  }
}

// 获取视频分段数据
const fetchVideoSegments = async () => {
  if (!videoId.value) return
  
  try {
    const response = await fetch(`/api/admin/video-segments?video_id=${videoId.value}`)
    if (response.ok) {
      const data = await response.json()
      videoSegments.value = data.data?.segments || []
      console.log(`📊 加载了 ${videoSegments.value.length} 个视频分段`)
    } else {
      console.warn('获取视频分段失败，尝试从知识卡片生成分段')
      // 如果后端没有分段数据，从知识卡片生成
      generateSegmentsFromCards()
    }
  } catch (error) {
    console.error('获取视频分段时出错:', error)
    // 出错时也从知识卡片生成
    generateSegmentsFromCards()
  }
  
  // 如果没有分段数据，生成测试数据
  if (!videoSegments.value.length && duration.value > 0) {
    generateTestSegments()
  }
}

// 从知识卡片生成分段
const generateSegmentsFromCards = () => {
  if (!knowledgeCards.value.length) return
  
  const segments: VideoSegment[] = []
  
  // 将知识卡片转换为分段，每个卡片生成一个分段
  knowledgeCards.value.forEach((card, index) => {
    if (card.startTime >= 0 && card.endTime > card.startTime) {
      segments.push({
        id: card.id,
        video_id: card.video_id,
        start_time: card.startTime,
        end_time: card.endTime,
        title: card.title,
        description: card.content,
        segment_type: 'custom',
        color: getSegmentColorByIndex(index)
      })
    }
  })
  
  videoSegments.value = segments
  console.log(`📝 从知识卡片生成了 ${segments.length} 个分段，每个卡片有开始和结束时间标记点`)
}

// 生成测试分段数据
const generateTestSegments = () => {
  if (!duration.value || duration.value <= 0) return
  
  const testSegments = [
    // 使用类型断言确保TypeScript正确识别segment_type
    {
      id: 1,
      video_id: videoId.value || 0,
      start_time: 0,
      end_time: Math.min(60, duration.value),
      title: '视频开场介绍',
      description: '视频的开头部分，介绍主题和内容概要',
      segment_type: 'chapter',
      color: '#4CAF50'
    },
    {
      id: 2,
      video_id: videoId.value || 0,
      start_time: Math.min(60, duration.value),
      end_time: Math.min(180, duration.value),
      title: '核心概念讲解',
      description: '详细讲解视频的核心概念和重点内容',
      segment_type: 'highlight',
      color: '#2196F3'
    },
    {
      id: 3,
      video_id: videoId.value || 0,
      start_time: Math.min(180, duration.value),
      end_time: Math.min(300, duration.value),
      title: '实例演示',
      description: '通过具体实例演示概念的应用',
      segment_type: 'custom',
      color: '#FF9800'
    },
    {
      id: 4,
      video_id: videoId.value || 0,
      start_time: Math.min(300, duration.value),
      end_time: Math.min(420, duration.value),
      title: '深入分析',
      description: '对关键内容进行深入分析和讨论',
      segment_type: 'custom',
      color: '#9C27B0'
    },
    {
      id: 5,
      video_id: videoId.value || 0,
      start_time: Math.min(420, duration.value),
      end_time: duration.value,
      title: '总结回顾',
      description: '总结视频内容，回顾重点知识点',
      segment_type: 'summary',
      color: '#F44336'
    }
  ].filter(segment => segment.start_time < segment.end_time) as VideoSegment[]
  
  videoSegments.value = testSegments
  console.log(`🧪 生成了 ${testSegments.length} 个测试分段，视频时长: ${duration.value}秒`)
}

// 根据索引获取分段颜色 - 为不同知识卡片提供丰富的颜色选择
const getSegmentColorByIndex = (index: number | undefined): string => {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
    '#ff9f43', '#10ac84', '#2e86de', '#a55eea', '#fd79a8', '#00d2d3', '#ff9ff3', '#54a0ff',
    '#5f27cd', '#c8d6e5', '#ff9ff3', '#54a0ff', '#5f27cd', '#ff9f43', '#10ac84', '#2e86de',
    '#a55eea', '#fd79a8', '#00d2d3', '#ff9ff3', '#54a0ff', '#5f27cd', '#c8d6e5', '#ff9ff3'
  ]
  const safeIndex = (index || 0) % colors.length
  return colors[safeIndex] as string
}

// 更新活跃分段
const updateActiveSegment = () => {
  if (!videoSegments.value.length || !duration.value) return
  
  const currentSegment = videoSegments.value.find(segment => 
    currentTime.value >= segment.start_time && currentTime.value <= segment.end_time
  )
  
  activeSegmentId.value = currentSegment?.id || null
}

// 进度条点击
const handleProgressClick = (event: MouseEvent) => {
  const video = videoPlayerRef.value
  const progressBar = progressBarRef.value
  if (!video || !progressBar) return
  
  const rect = progressBar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  video.currentTime = percent * video.duration
}

// 进度条悬浮 - 显示时间提示
const handleProgressHover = (event: MouseEvent) => {
  const video = videoPlayerRef.value
  const progressBar = progressBarRef.value
  if (!video || !progressBar || !video.duration) return
  
  const rect = progressBar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  hoverPosition.value = Math.max(0, Math.min(100, percent * 100))
  hoverTime.value = percent * video.duration
}

// 进度条鼠标离开
const handleProgressLeave = () => {
  hoverTime.value = null
}

// 快进/快退
const seekBy = (seconds: number) => {
  const video = videoPlayerRef.value
  if (!video) return
  
  video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
}

// 鼠标移动事件 - 显示控制UI
const handleMouseMove = () => {
  showControls.value = true
  resetControlsTimer()
  
  // 全屏时也显示全屏进度条
  if (isFullscreen.value) {
    showFullscreenProgressBar.value = true
    resetFullscreenControlsTimer()
  }
}

// 鼠标离开 - 隐藏控制UI(仅全屏时)
const handleMouseLeave = () => {
  if (isFullscreen.value && isPlaying.value) {
    showControls.value = false
    showFullscreenProgressBar.value = false
  }
}

// 点击视频区域 - 播放/暂停
const handleVideoClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  
  // 如果点击的是控制UI中的按钮，不处理视频点击（让按钮自己的事件处理）
  if (target.closest('.control-btn') || target.closest('.volume-slider') || target.closest('.rate-menu')) {
    return
  }
  
  // 如果点击的是控制UI的其他区域（非按钮），也不处理
  if (target.closest('.custom-controls')) {
    return
  }
  
  togglePlay()
}

// 重置控制UI隐藏计时器
const resetControlsTimer = () => {
  if (controlsTimer !== null) {
    clearTimeout(controlsTimer)
  }
  
  // 全屏且播放中时,3秒后隐藏控制UI
  if (isFullscreen.value && isPlaying.value) {
    controlsTimer = window.setTimeout(() => {
      showControls.value = false
      
      // 原进度条隐藏后，显示文字进度条
      showFullscreenProgressBar.value = true
    }, 3000)
  }
}

// 全屏进度条相关方法
const handleFullscreenProgressClick = (event: MouseEvent) => {
  const progressBar = fullscreenProgressBarRef.value
  if (!progressBar || !videoPlayerRef.value) return
  
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percent = clickX / rect.width
  
  videoPlayerRef.value.currentTime = percent * videoPlayerRef.value.duration
  
  // 重置全屏控制UI显示
  showFullscreenProgressBar.value = true
  resetFullscreenControlsTimer()
}

const handleFullscreenProgressHover = (event: MouseEvent) => {
  const progressBar = fullscreenProgressBarRef.value
  if (!progressBar || !videoPlayerRef.value) return
  
  const rect = progressBar.getBoundingClientRect()
  const hoverX = event.clientX - rect.left
  const percent = hoverX / rect.width
  
  hoverFullscreenTime.value = percent * videoPlayerRef.value.duration
  hoverFullscreenPosition.value = percent * 100
  
  // 查找悬停位置的分段
  hoverFullscreenSegment.value = videoSegments.value.find(segment => 
    hoverFullscreenTime.value! >= segment.start_time && 
    hoverFullscreenTime.value! <= segment.end_time
  ) || null
  
  // 显示全屏进度条
  showFullscreenProgressBar.value = true
  resetFullscreenControlsTimer()
}

const handleFullscreenProgressLeave = () => {
  hoverFullscreenTime.value = null
  hoverFullscreenSegment.value = null
}

const handleFullscreenSegmentClick = (segment: VideoSegment, event: MouseEvent) => {
  event.stopPropagation()
  if (videoPlayerRef.value) {
    videoPlayerRef.value.currentTime = segment.start_time
  }
  
  // 重置全屏控制UI显示
  showFullscreenProgressBar.value = true
  resetFullscreenControlsTimer()
}

// 重置全屏控制UI隐藏计时器
const resetFullscreenControlsTimer = () => {
  if (fullscreenControlsTimer !== null) {
    clearTimeout(fullscreenControlsTimer)
  }
  
  // 全屏且播放中时,3秒后隐藏全屏进度条
  if (isFullscreen.value && isPlaying.value) {
    fullscreenControlsTimer = window.setTimeout(() => {
      showFullscreenProgressBar.value = false
    }, 3000)
  }
}

// 全屏鼠标移动事件
const handleFullscreenMouseMove = () => {
  // 鼠标移动时隐藏文字进度条，显示原进度条
  showFullscreenProgressBar.value = false
  
  // 重置原进度条的隐藏计时器
  resetControlsTimer()
}

// 全屏鼠标离开事件
const handleFullscreenMouseLeave = () => {
  if (isFullscreen.value && isPlaying.value) {
    showFullscreenProgressBar.value = false
  }
}

// 切换全屏状态
const toggleFullscreen = () => {
  const wrapper = videoWrapperRef.value
  if (!wrapper) {
    console.error('⚠️ video-wrapper元素不存在')
    return
  }
  
  console.log('🎬 toggleFullscreen 调用, 当前全屏状态:', isFullscreen.value)
  
  if (!isFullscreen.value) {
    // 进入全屏
    if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen()
    } else if ((wrapper as any).webkitRequestFullscreen) {
      (wrapper as any).webkitRequestFullscreen()
    } else if ((wrapper as any).mozRequestFullScreen) {
      (wrapper as any).mozRequestFullScreen()
    } else if ((wrapper as any).msRequestFullscreen) {
      (wrapper as any).msRequestFullscreen()
    }
    console.log('✅ 请求进入全屏 (video-wrapper)')
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen()
    }
    console.log('✅ 请求退出全屏')
  }
}

onMounted(() => {
  checkShareLink()
  setupFullscreenListeners()
  // 添加键盘快捷键监听
  document.addEventListener('keydown', handleKeyPress)
})

// 组件卸载时清理
onUnmounted(() => {
  removeFullscreenListeners()
  // 移除键盘快捷键监听
  document.removeEventListener('keydown', handleKeyPress)
})

// 方法
const loadVideo = async () => {
  if (videoUrl.value.trim()) {
    isEncoding.value = true
    
    // 🔧 修复:确保视频URL有正确的/api前缀
    // videoUrl.value 可能是原始路径 /uploads/videos/xxx.mp4
    // currentVideo.value 需要是 /api/uploads/videos/xxx.mp4 才能通过Vite代理
    const fullUrl = videoUrl.value.startsWith('http') ? 
      videoUrl.value : 
      (videoUrl.value.startsWith('/api') ? videoUrl.value : `/api${videoUrl.value}`)
    
    console.log('🎬 loadVideo 被调用')
    console.log('   videoUrl.value:', videoUrl.value)
    console.log('   处理后的fullUrl:', fullUrl)
    
    currentVideo.value = fullUrl
    
    // 🆕 尝试从URL中查找对应的视频ID
    // 如果videoId已经设置(例如从localStorage恢复),保持不变
    // 如果videoId未设置,尝试从视频库中查找匹配的视频
    if (!videoId.value || videoId.value === 1) {
      console.log('   尝试从视频库查找匹配的视频ID...')
      try {
        // 提取视频文件路径(去掉/api前缀)
        const videoPath = videoUrl.value.replace(/^\/api/, '')
        console.log('   查找视频路径:', videoPath)
        
        // 查询视频库,找到匹配的视频
        const response = await fetch('/api/admin/videos')
        if (response.ok) {
          const data = await response.json()
          const videos = data.data?.videos || []
          
          console.log(`   📚 视频库共有 ${videos.length} 个视频`)
          console.log('   视频库URL列表:', videos.map((v: any) => ({ id: v.id, title: v.title, url: v.video_url })))
          
          // 提取文件名进行匹配
          const fileName = videoPath.split('/').pop() || ''
          console.log('   当前视频文件名:', fileName)
          
          // 多种匹配策略
          let matchedVideo = null
          
          // 策略1: 完全匹配video_url
          matchedVideo = videos.find((v: any) => v.video_url === videoPath)
          if (matchedVideo) {
            console.log('   ✅ 策略1成功: 完全匹配video_url')
          }
          
          // 策略2: 匹配去掉/api后的路径
          if (!matchedVideo) {
            matchedVideo = videos.find((v: any) => v.video_url === videoUrl.value.replace(/^\/api/, ''))
            if (matchedVideo) {
              console.log('   ✅ 策略2成功: 匹配去掉/api的路径')
            }
          }
          
          // 策略3: 通过文件名匹配
          if (!matchedVideo && fileName) {
            matchedVideo = videos.find((v: any) => v.video_url.includes(fileName))
            if (matchedVideo) {
              console.log('   ✅ 策略3成功: 文件名匹配')
            }
          }
          
          // 策略4: 反向匹配 - 视频URL包含在当前路径中
          if (!matchedVideo) {
            matchedVideo = videos.find((v: any) => videoPath.includes(v.video_url))
            if (matchedVideo) {
              console.log('   ✅ 策略4成功: 反向包含匹配')
            }
          }
          
          if (matchedVideo) {
            videoId.value = matchedVideo.id
            console.log('   🎉 找到匹配的视频!')
            console.log('      ID:', matchedVideo.id)
            console.log('      标题:', matchedVideo.title)
            console.log('      URL:', matchedVideo.video_url)
            uploadVideoTitle.value = matchedVideo.title
            uploadVideoDescription.value = matchedVideo.description || ''
            
            // 加载知识卡片
            await fetchKnowledgeCards()
          } else {
            console.log('   ❌ 未找到匹配的视频!')
            console.log('   当前视频路径:', videoPath)
            console.log('   视频库中的所有URL:')
            videos.forEach((v: any, index: number) => {
              console.log(`      [${index + 1}] ${v.video_url}`)
            })
            console.warn('   ⚠️ 该视频可能不在视频库中,请确认:')
            console.warn('      1. 该视频是否已上传到视频库')
            console.warn('      2. 视频URL路径是否正确')
            console.warn('   提示: 建议从"视频库"中选择视频,以确保正确匹配')
            
            videoId.value = null
            showNotification('该视频不在视频库中,无法加载知识卡片', 'error')
          }
        }
      } catch (err) {
        console.error('   查找视频ID时出错:', err)
        videoId.value = null
        showNotification('查找视频失败', 'error')
      }
    } else {
      console.log('   videoId已设置:', videoId.value)
      // 如果videoId已设置,直接加载知识卡片
      await fetchKnowledgeCards()
    }
    
    console.log('   最终 videoId:', videoId.value)
    
    // 保存状态
    saveVideoToStorage()
    
    setTimeout(() => {
      isEncoding.value = false
    }, 2000)
  }
}

// 保存项目
const saveProject = () => {
  showNotification('项目已保存', 'success')
}

// 导出为可分享链接
const exportProject = () => {
  if (currentVideo.value) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=true&videoUrl=${encodeURIComponent(currentVideo.value)}`
    
    // 复制到剪贴板
    navigator.clipboard.writeText(shareUrl).then(() => {
      showNotification('分享链接已复制到剪贴板', 'success')
    }).catch(() => {
      showNotification('链接：' + shareUrl, 'info')
    })
  } else {
    showNotification('请先加载视频', 'error')
  }
}

// 处理生成视频总结
const handleGenerateSummary = (level: string) => {
  console.log('生成视频总结:', level)
  showNotification(`正在生成${level === 'simple' ? '简单' : level === 'normal' ? '一般' : '详细'}总结...`, 'info')
  // 这里可以调用后端API生成总结
  // 暂时使用组件内的模拟数据
}

// 处理导出视频总结
const handleExportSummary = (data: any) => {
  console.log('导出视频总结:', data)
  showNotification('总结已导出', 'success')
}

const openUploadModal = () => {
  showUploadModal.value = true
  uploadVideoTitle.value = ''
  uploadVideoDescription.value = ''
  uploadStatus.value = ''
}

const closeUploadModal = () => {
  showUploadModal.value = false
  videoUploadRef.value?.reset()
}

// 触发隐藏的文件选择
const triggerFileSelection = () => {
  hiddenFileInput.value?.click()
}

// 处理文件选择
const handleHiddenFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    // 使用VideoUpload组件的setVideoFile方法设置文件
    videoUploadRef.value?.setVideoFile(file)
    // 如果没有设置标题，使用文件名作为标题
    if (!uploadVideoTitle.value) {
      uploadVideoTitle.value = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

const confirmUpload = async () => {
  try {
    uploadStatus.value = '正在上传视频...'
    await videoUploadRef.value?.uploadVideo(uploadVideoTitle.value, uploadVideoDescription.value)
  } catch (error) {
    console.error('上传失败:', error)
  }
}

const confirmUrlUpload = async () => {
  try {
    uploadStatus.value = '正在创建视频...'
    await videoUploadRef.value?.createVideoFromUrl()
  } catch (error) {
    console.error('创建视频失败:', error)
  }
}

interface UploadResponse {
  video: {
    video_url: string;
    [key: string]: any;
  };
}

const handleUploadSuccess = (data: UploadResponse | any) => {
  console.log('操作成功:', data)
  uploadStatus.value = '成功！'
  
  // 处理返回的视频数据
  const videoData = data.video || data
  
  // 使用后端返回的视频路径作为当前视频
  setTimeout(() => {
    if (videoData.video_url) {
      currentVideo.value = videoData.video_url.startsWith('/') ? 
        'http://localhost:3000' + videoData.video_url : 
        videoData.video_url
      videoUrl.value = currentVideo.value
    }
    
    // 保存视频ID用于获取知识卡片
    if (videoData.id) {
      videoId.value = videoData.id
      // 保存标题
      if (videoData.title) {
        uploadVideoTitle.value = videoData.title
      }
    }
    
    // 显示成功通知
    showNotification(`视频${videoData.id ? '创建' : '上传'}成功！`, 'success')
    
    closeUploadModal()
    uploadStatus.value = ''
    // 视频操作完成后自动保存状态
    saveVideoToStorage()
    
    // 重新加载知识卡片
    if (videoId.value) {
      fetchKnowledgeCards()
    }
  }, 1000)
}

const handleUploadProgress = (progress: number) => {
  uploadStatus.value = `上传中: ${progress}%`
}

const handleUploadError = (error: string) => {
  console.error('上传错误:', error)
  uploadStatus.value = '上传失败: ' + error
}

// 视频库相关函数
const openVideoLibrary = () => {
  showVideoLibrary.value = true
}

const closeVideoLibrary = () => {
  showVideoLibrary.value = false
}

interface LibraryVideo {
  id: number
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration: number
  status: string
  created_at: string
  updated_at: string
}

const handleLibraryVideoPlay = (video: LibraryVideo) => {
  console.log('=== 开始播放视频 ===')
  console.log('视频对象:', video)
  console.log('video.video_url:', video.video_url)
  console.log('切换到视频ID:', video.id)
  
  // 清空当前知识卡片,避免显示上一个视频的卡片
  knowledgeCards.value = []
  currentCards.value = []
  displayedCardIds.value.clear()
  visiblePopupCards.value = []
  
  // 播放选中的视频
  // video_url 格式: /uploads/videos/xxx.mp4
  // 添加 /api 前缀,通过Vite的 /api 代理访问后端
  const fullUrl = video.video_url.startsWith('http') ? 
    video.video_url : 
    `/api${video.video_url}`  // 添加 /api 前缀,通过代理重写后变成正确的后端路径
  
  console.log('完整播放URL:', fullUrl)
  
  currentVideo.value = fullUrl
  // videoUrl 用于显示,应该使用原始的 video_url 而不是加了 /api 前缀的
  // 这样在输入框中显示的是实际的文件路径,而不是API路径
  videoUrl.value = video.video_url  // 显示原始路径,更清晰
  videoId.value = video.id
  
  console.log('currentVideo 已设置为:', currentVideo.value)
  console.log('videoUrl 已设置为:', videoUrl.value)
  console.log('videoId 已设置为:', videoId.value)
  
  // 保存到 localStorage
  saveVideoToStorage()
  
  // 加载该视频的知识卡片
  if (video.id) {
    console.log(`开始加载视频 ${video.id} 的知识卡片`)
    fetchKnowledgeCards()
  }
  
  // 关闭视频库模态框
  closeVideoLibrary()
  
  console.log('=== 视频播放设置完成 ===')
  showNotification(`正在播放: ${video.title}`, 'success')
}

const handleLibraryVideoSelect = (video: LibraryVideo) => {
  console.log('选中视频:', video)
}

const goToEditPage = () => {
  if (currentVideo.value) {
    console.log('=== 准备跳转到编辑页 ===')
    console.log('当前视频URL:', currentVideo.value)
    console.log('视频ID:', videoId.value)
    
    // 跳转前自动保存当前视频状态
    saveVideoToStorage()
    
    // 将视频信息传递到编辑页面
    const encodedUrl = encodeURIComponent(currentVideo.value)
    console.log('编码后的URL:', encodedUrl)
    
    router.push({
      path: '/edit',
      query: { 
        videoUrl: encodedUrl,
        videoId: videoId.value?.toString() || '1'
      }
    })
  } else {
    showNotification('请先加载或上传视频', 'error')
  }
}

const handleTimeUpdate = (event: Event) => {
  const video = event.target as HTMLVideoElement
  currentTime.value = video.currentTime
  
  // 更新播放进度
  if (video.duration) {
    playedPercent.value = (video.currentTime / video.duration) * 100
    
    // 更新缓冲进度
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1)
      bufferedPercent.value = (bufferedEnd / video.duration) * 100
    }
  }
  
  // 实时更新当前时间点的知识卡片
  updateCurrentCards()
  
  // 更新活跃分段
  if (isSegmentMode.value) {
    updateActiveSegment()
  }
}

// 处理视频跳转事件(用户拖动进度条)
const handleSeeked = (event: Event) => {
  const video = event.target as HTMLVideoElement
  const newTime = video.currentTime
  
  console.log('═══════════════════════════════════════')
  console.log(`🔄 用户拖动进度条到: ${newTime.toFixed(2)}s`)
  console.log(`   拖动前 displayedCardIds:`, Array.from(displayedCardIds.value))
  console.log(`   拖动前 currentCards:`, currentCards.value.map(c => c.title))
  
  // 清除已显示卡片的记录,允许卡片重新弹出
  displayedCardIds.value.clear()
  console.log(`   ✅ 已清空 displayedCardIds`)
  
  // 关闭所有弹窗
  if (visiblePopupCards.value.length > 0) {
    console.log(`   关闭所有弹窗: ${visiblePopupCards.value.map(card => card.title).join(', ')}`)
    visiblePopupCards.value = []
  }
  
  // 立即更新当前时间
  currentTime.value = newTime
  
  // 🔧 修复: 清空 currentCards,强制重新计算
  // 这样 checkAndShowPopup 中的 isNew 判断会认为所有卡片都是新的
  const previousCards: Card[] = []
  currentCards.value = knowledgeCards.value.filter(card => 
    currentTime.value >= card.startTime && currentTime.value <= card.endTime
  )
  
  console.log(`   更新后 currentCards:`, currentCards.value.map(c => c.title))
  console.log(`   开始调用 checkAndShowPopup()`)
  
  // 直接调用检查弹窗,传入空的 previousCards
  checkAndShowPopup(previousCards)
  
  console.log('✅ 已重置知识卡片显示状态,卡片可以重新弹出')
  console.log('═══════════════════════════════════════')
}

// 根据当前视频时间更新显示的知识卡片
const updateCurrentCards = () => {
  if (!knowledgeCards.value.length) return
  
  const previousCards = currentCards.value
  currentCards.value = knowledgeCards.value.filter(card => 
    currentTime.value >= card.startTime && currentTime.value <= card.endTime
  )
  
  // 移除已经不在当前时间范围内的卡片
  visiblePopupCards.value = visiblePopupCards.value.filter(card => {
    const isStillActive = currentTime.value >= card.startTime && currentTime.value <= card.endTime
    if (!isStillActive) {
      console.log(`⏰ 知识卡片 "${card.title}" 已过期,自动关闭弹窗`)
    }
    return isStillActive
  })
  
  // 检查是否有新卡片需要显示弹窗
  checkAndShowPopup(previousCards)
}

// 检查并显示弹窗
const checkAndShowPopup = (previousCards: Card[]) => {
  console.log('🔍 checkAndShowPopup 调用')
  console.log('   previousCards:', previousCards.map(c => c.title))
  console.log('   currentCards:', currentCards.value.map(c => c.title))
  console.log('   displayedCardIds:', Array.from(displayedCardIds.value))
  console.log('   visiblePopupCards:', visiblePopupCards.value.map(c => c.title))
  console.log('   当前是否全屏:', isFullscreen.value)
  console.log('   当前播放状态:', isPlaying.value)
  
  // 找到新出现的卡片（在当前时间范围内但之前没有显示的）
  const newCards = currentCards.value.filter(card => {
    const isNew = !previousCards.some(prev => prev.id === card.id)
    const notDisplayed = !displayedCardIds.value.has(card.id)
    const result = isNew && notDisplayed && card.id !== undefined
    
    console.log(`   检查卡片 "${card.title}": isNew=${isNew}, notDisplayed=${notDisplayed}, result=${result}`)
    
    return result
  })
  
  console.log('   newCards:', newCards.map(c => c.title))
  
  // 如果有新卡片，添加到显示队列中
  if (newCards.length > 0) {
    // 按开始时间排序新卡片
    const sortedNewCards = [...newCards].sort((a, b) => a.startTime - b.startTime)
    
    // 添加到可见弹窗卡片列表
    for (const card of sortedNewCards) {
      if (!visiblePopupCards.value.some(pc => pc.id === card.id)) {
        // 检查是否是从第0秒开始的卡片
        const isZeroSecondCard = card.startTime === 0
        
        // 如果是从第0秒开始的卡片，只有当视频播放时才显示
        // 如果不是从第0秒开始的卡片，或者视频正在播放，则显示卡片
        if (!isZeroSecondCard || (isZeroSecondCard && isPlaying.value)) {
          console.log('✅ 准备显示卡片:', card.title, '(全屏模式:', isFullscreen.value, ')')
          visiblePopupCards.value.push(card)
          displayedCardIds.value.add(card.id)
        } else {
          console.log('⏸️  视频暂停，暂不显示第0秒卡片:', card.title)
        }
      }
    }
  }
  
  // 移除已经不在当前时间范围内的卡片
  visiblePopupCards.value = visiblePopupCards.value.filter(card => {
    return currentCards.value.some(cc => cc.id === card.id)
  })
}

// 检查并显示第0秒开始的卡片
const checkZeroSecondCards = () => {
  console.log('🔍 检查第0秒开始的卡片')
  
  // 找到所有从第0秒开始但尚未显示的卡片
  const zeroSecondCards = knowledgeCards.value.filter(card => {
    // 卡片从第0秒开始
    const isZeroSecond = card.startTime === 0
    // 卡片未被显示过
    const notDisplayed = !displayedCardIds.value.has(card.id)
    // 当前时间在卡片时间范围内
    const inTimeRange = currentTime.value >= card.startTime && currentTime.value <= card.endTime
    // 视频正在播放
    const isPlayingNow = isPlaying.value
    
    return isZeroSecond && notDisplayed && inTimeRange && isPlayingNow
  })
  
  console.log('   找到需要显示的第0秒卡片:', zeroSecondCards.map(card => card.title))
  
  // 如果有匹配的卡片，添加到可见弹窗列表
  for (const card of zeroSecondCards) {
    if (!visiblePopupCards.value.some(pc => pc.id === card.id)) {
      console.log('✅ 显示第0秒卡片:', card.title)
      visiblePopupCards.value.push(card)
      displayedCardIds.value.add(card.id)
    }
  }
}



// 显示弹窗
const showPopup = (card: Card) => {
  // 清除之前的定时器
  if (popupTimer !== null) {
    clearTimeout(popupTimer)
    popupTimer = null
  }
  
  currentPopupCard.value = card
  showCardPopup.value = true
  displayedCardIds.value.add(card.id)
  
  console.log('💬 显示知识卡片弹窗:', card.title)
  console.log('   卡片内容:', card.content?.substring(0, 50) + '...')
  console.log('   当前全屏状态:', isFullscreen.value)
  console.log('   showCardPopup:', showCardPopup.value)
  console.log('   currentPopupCard:', currentPopupCard.value?.title)
  
  // 多次检查DOM元素以确保渲染
  const checkDom = (attempt: number = 1) => {
    const overlay = document.querySelector('.knowledge-card-popup-overlay')
    const popup = document.querySelector('.knowledge-card-popup')
    const videoWrapper = document.querySelector('.video-wrapper')
    
    console.log(`   DOM检查 (尝试${attempt}) - overlay:`, !!overlay, ', popup:', !!popup, ', videoWrapper:', !!videoWrapper)
    
    if (overlay) {
      const styles = window.getComputedStyle(overlay)
      console.log('   overlay样式:')
      console.log('      position:', styles.position, isFullscreen.value ? '(期望: absolute)' : '(期望: fixed)')
      console.log('      display:', styles.display, '(期望: flex)')
      console.log('      z-index:', styles.zIndex, '(期望: 10000)')
      console.log('      visibility:', styles.visibility)
      console.log('      opacity:', styles.opacity)
      console.log('      width:', styles.width)
      console.log('      height:', styles.height)
      console.log('      top:', styles.top)
      console.log('      left:', styles.left)
      
      // 检查是否有内容
      const rect = overlay.getBoundingClientRect()
      console.log('   overlay位置和大小:')
      console.log('      rect:', rect)
      console.log('      是否在视口内:', rect.width > 0 && rect.height > 0)
    } else {
      console.log('   ⚠️ 未找到overlay元素!检查visible属性:', showCardPopup.value)
      if (attempt < 3) {
        setTimeout(() => checkDom(attempt + 1), 100)
      }
    }
    
    if (popup) {
      const popupStyles = window.getComputedStyle(popup)
      const popupRect = popup.getBoundingClientRect()
      console.log('   popup样式:')
      console.log('      position:', popupStyles.position)
      console.log('      z-index:', popupStyles.zIndex)
      console.log('      rect:', popupRect)
    }
  }
  
  setTimeout(() => checkDom(1), 50)
}

// 关闭弹窗
const handlePopupClose = (cardId: string | number) => {
  console.log('🚪 处理弹窗关闭:', cardId)
  
  // 从可见弹窗列表中移除指定卡片
  const cardIndex = visiblePopupCards.value.findIndex(card => card.id === cardId)
  if (cardIndex > -1) {
    visiblePopupCards.value.splice(cardIndex, 1)
    console.log('✅ 弹窗已关闭,剩余可见卡片:', visiblePopupCards.value.map(c => c.title))
  }
  
  // 从手动打开的卡片列表中移除
  const manualIndex = manuallyOpenedCards.value.findIndex(card => card.id === cardId)
  if (manualIndex > -1) {
    manuallyOpenedCards.value.splice(manualIndex, 1)
    console.log('✅ 从手动打开列表中移除卡片')
  }
  
  if (popupTimer !== null) {
    clearTimeout(popupTimer)
    popupTimer = null
  }
}

// 获取弹窗样式，实现连接显示效果
const getPopupStyle = (index: number) => {
  // 每个卡片垂直偏移量，实现底部接头部的连接显示效果
  // 卡片高度约为250px，确保卡片之间没有重叠
  const cardHeight = 250 // 估计的卡片高度
  const verticalOffset = index * cardHeight // 每张卡片向下偏移一个卡片高度
  return {
    transform: `translateY(${verticalOffset}px)`,
    zIndex: 10000 - index // 前面的卡片z-index更高，显示在上面
  }
}

// 知识卡片点击事件 - 打开知识卡片弹窗
const handleCardClick = (card: Card) => {
  console.log('🔍 查看按钮被点击，打开知识卡片弹窗:', card.title)
  
  // 检查卡片是否已经在手动打开的列表中
  const isAlreadyOpened = manuallyOpenedCards.value.some(c => c.id === card.id)
  if (!isAlreadyOpened) {
    // 添加到手动打开的卡片列表
    manuallyOpenedCards.value.push(card)
    
    // 添加到可见弹窗列表
    visiblePopupCards.value.push(card)
    
    console.log('✅ 知识卡片弹窗已打开:', card.title)
  } else {
    console.log('ℹ️ 该知识卡片弹窗已经打开:', card.title)
  }
}

// 知识卡片链接点击事件
const handleCardLinkClick = (url: string, title?: string) => {
  console.log('链接被点击:', url)
  
  // 如果当前处于全屏状态，自动退出全屏以便用户观看弹窗内容
  if (isFullscreen.value) {
    console.log('📱 检测到全屏状态，自动退出全屏以显示链接弹窗')
    toggleFullscreen()
  }
  
  currentLinkUrl.value = url
  currentLinkTitle.value = title || '链接内容'
  showLinkModal.value = true
}

// 跳转到指定时间
const seekToTime = (time: number) => {
  console.log('跳转到时间:', time)
  const videoElement = document.querySelector('video') as HTMLVideoElement
  if (videoElement) {
    videoElement.currentTime = time
    videoElement.play()
  }
}

// 关闭链接模态框
const closeLinkModal = () => {
  showLinkModal.value = false
  currentLinkUrl.value = ''
  currentLinkTitle.value = ''
}

// 关闭卡片详情模态框
const closeCardModal = () => {
  showCardModal.value = false
  currentModalCard.value = null
}

// 从链接模态框返回到卡片
const handleBackToCard = () => {
  closeLinkModal()
  // 可以添加更多返回逻辑
}

// 在外部浏览器中打开链接
const handleExternalOpen = (url: string) => {
  window.open(url, '_blank')
}

// 检查当前时间是否在卡片时间范围内
const isCurrentTimeInCardRange = (card: Card): boolean => {
  return currentTime.value >= card.startTime && currentTime.value <= card.endTime
}

// 获取视频的知识卡片
const fetchKnowledgeCards = async () => {
  if (!videoId.value) {
    console.log('⚠️ videoId为空，跳过加载知识卡片')
    knowledgeCards.value = []
    return
  }
  
  try {
    isLoadingCards.value = true
    console.log(`📡 正在获取视频 ${videoId.value} 的知识卡片...`)
    
    const response = await fetch(`/api/admin/knowledge_cards?video_id=${videoId.value}`)
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API返回数据:', data)
      
      // 处理后端返回的数据结构，兼容多种情况
      const cardsData = data.data?.knowledgeCards || data.knowledgeCards || []
      console.log(`📋 收到 ${cardsData.length} 个知识卡片数据`)
      
      // 验证所有卡片都属于当前视频
      const validCards = cardsData.filter((card: any) => {
        if (card.video_id !== videoId.value) {
          console.warn(`⚠️ 卡片 ${card.id} 的 video_id (${card.video_id}) 与当前视频 (${videoId.value}) 不匹配,已过滤`)
          return false
        }
        return true
      })
      
      console.log(`✔️ 验证后有效卡片数: ${validCards.length}`)
      
      // 转换后端数据为统一的前端格式
      knowledgeCards.value = validCards.map((card: any) => ({
        id: card.id,
        video_id: card.video_id,
        startTime: card.start_time || card.startTime || 0,
        endTime: card.end_time || card.endTime || 0,
        title: card.title || '未命名卡片',
        content: card.content || '',
        content_type: card.content_type || 'rich_text',
        display_style: card.display_style || 'default',
        is_ai_generated: card.is_ai_generated || false,
        created_at: card.created_at
      }))
      
      // 对卡片按时间排序
      knowledgeCards.value.sort((a, b) => a.startTime - b.startTime)
      
      console.log(`✅ 成功加载 ${knowledgeCards.value.length} 个知识卡片`)
      
      // 打印每个卡片的时间范围(用于调试)
      knowledgeCards.value.forEach(card => {
        console.log(`   📌 ${card.title}: ${card.startTime}s - ${card.endTime}s`)
      })
      
      // 显示加载成功提示
      if (knowledgeCards.value.length > 0) {
        showNotification(`成功加载 ${knowledgeCards.value.length} 个知识卡片`, 'success')
      } else {
        console.log('ℹ️ 该视频暂无知识卡片')
      }
      
      // 加载视频分段数据
      await fetchVideoSegments()
    } else {
      console.error('❌ API返回错误状态:', response.status)
      knowledgeCards.value = []
      showNotification('获取知识卡片失败', 'error')
      
      // 即使卡片加载失败，也尝试加载分段
      await fetchVideoSegments()
    }
  } catch (error) {
    console.error('❌ 获取知识卡片失败:', error)
    knowledgeCards.value = []
    showNotification('获取知识卡片失败，请稍后重试', 'error')
    
    // 出错时也尝试加载分段
    await fetchVideoSegments()
  } finally {
    isLoadingCards.value = false
  }
}

// 监听视频ID变化，获取对应的知识卡片
watch(videoId, (newId) => {
  if (newId) {
    fetchKnowledgeCards()
  }
})

// 显示调试信息
const showDebugInfo = async () => {
  // 获取视频库信息用于对比
  let videoLibraryInfo = ''
  try {
    const response = await fetch('/api/admin/videos')
    if (response.ok) {
      const data = await response.json()
      const videos = data.data?.videos || []
      const videoPath = videoUrl.value.replace(/^\/api/, '')
      const fileName = videoPath.split('/').pop() || ''
      
      videoLibraryInfo = `\n📚 视频库匹配分析:
  • 视频库总数: ${videos.length}
  • 当前视频路径: ${videoPath}
  • 当前文件名: ${fileName}
  
  🔍 匹配检查:`
      
      if (videos.length === 0) {
        videoLibraryInfo += '\n  ❌ 视频库为空!'
      } else {
        const exactMatch = videos.find((v: any) => v.video_url === videoPath)
        const fileNameMatch = videos.find((v: any) => v.video_url.includes(fileName))
        
        if (exactMatch) {
          videoLibraryInfo += `\n  ✅ 找到完全匹配: [${exactMatch.id}] ${exactMatch.title}`
        } else if (fileNameMatch) {
          videoLibraryInfo += `\n  ⚠️ 找到文件名匹配: [${fileNameMatch.id}] ${fileNameMatch.title}`
          videoLibraryInfo += `\n     但URL不完全一致:`
          videoLibraryInfo += `\n     - 库中: ${fileNameMatch.video_url}`
          videoLibraryInfo += `\n     - 当前: ${videoPath}`
        } else {
          videoLibraryInfo += `\n  ❌ 未找到匹配的视频!`
          videoLibraryInfo += `\n  
  💡 可能的原因:
     1. 该视频未上传到视频库
     2. 视频URL路径不匹配
     3. 视频文件被移动或重命名
  
  📋 视频库中的所有视频:`
          videos.slice(0, 5).forEach((v: any, index: number) => {
            videoLibraryInfo += `\n     ${index + 1}. [${v.id}] ${v.title}`
            videoLibraryInfo += `\n        URL: ${v.video_url}`
          })
          if (videos.length > 5) {
            videoLibraryInfo += `\n     ... 还有 ${videos.length - 5} 个视频`
          }
        }
      }
    }
  } catch (err) {
    videoLibraryInfo = '\n⚠️ 无法获取视频库信息: ' + err
  }
  
  const info = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 视频和知识卡片调试信息

🎬 视频信息:
  • 视频ID: ${videoId.value || '❌ 未设置'}
  • 视频标题: ${uploadVideoTitle.value || '未设置'}
  • 视频URL: ${videoUrl.value || '未设置'}
  • 当前播放: ${currentVideo.value || '未加载'}
  • 视频时长: ${duration.value.toFixed(2)}秒
  • 当前时间: ${currentTime.value.toFixed(2)}秒

📚 知识卡片信息:
  • 总卡片数: ${knowledgeCards.value.length}
  • 当前时间段卡片数: ${currentCards.value.length}
  • 是否正在加载: ${isLoadingCards.value ? '是' : '否'}
  • 已显示卡片ID: ${Array.from(displayedCardIds.value).join(', ') || '无'}
  • 弹窗显示状态: ${visiblePopupCards.value.length > 0 ? '显示中' : '隐藏'}

${knowledgeCards.value.length > 0 ? `\n📋 卡片列表:\n${knowledgeCards.value.map(card => 
  `  • [${card.id}] ${card.title} (${card.startTime}s - ${card.endTime}s)`
).join('\n')}` : '  暂无卡片数据'}
${videoLibraryInfo}

${!videoId.value ? `
⚠️ 问题诊断:
  videoId未设置！这是导致无法加载知识卡片的主要原因。

💡 解决方案:
  1. 【推荐】点击"📚 视频库"按钮,从视频库中选择视频
  2. 确认当前视频已上传到视频库
  3. 检查视频URL路径是否与视频库中的一致
  4. 刷新页面后重新从视频库加载视频
` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim()
  
  console.log(info)
  alert(info)
}

// 快速修复VideoID
const quickFixVideoId = async () => {
  console.log('🔧 开始快速修复VideoID...')
  
  try {
    const videoPath = videoUrl.value.replace(/^\/api/, '')
    const fileName = videoPath.split('/').pop() || ''
    
    console.log('   当前视频路径:', videoPath)
    console.log('   文件名:', fileName)
    
    // 获取视频库
    const response = await fetch('/api/admin/videos')
    if (!response.ok) {
      throw new Error('无法获取视频库')
    }
    
    const data = await response.json()
    const videos = data.data?.videos || []
    
    console.log('   视频库总数:', videos.length)
    
    if (videos.length === 0) {
      showNotification('视频库为空,请先上传视频', 'error')
      return
    }
    
    // 多策略匹配
    let matchedVideo = null
    
    // 策略1: 完全匹配
    matchedVideo = videos.find((v: any) => v.video_url === videoPath)
    
    // 策略2: 文件名匹配
    if (!matchedVideo && fileName) {
      matchedVideo = videos.find((v: any) => v.video_url.includes(fileName))
    }
    
    // 策略3: 标题匹配(如果有uploadVideoTitle)
    if (!matchedVideo && uploadVideoTitle.value) {
      matchedVideo = videos.find((v: any) => 
        v.title.toLowerCase().includes(uploadVideoTitle.value.toLowerCase()) ||
        uploadVideoTitle.value.toLowerCase().includes(v.title.toLowerCase())
      )
    }
    
    // 策略4: 如果只有一个视频,直接使用
    if (!matchedVideo && videos.length === 1) {
      matchedVideo = videos[0]
      console.log('   只有一个视频,自动选择')
    }
    
    if (matchedVideo) {
      videoId.value = matchedVideo.id
      uploadVideoTitle.value = matchedVideo.title
      uploadVideoDescription.value = matchedVideo.description || ''
      
      console.log('   ✅ 找到匹配视频!')
      console.log('      ID:', matchedVideo.id)
      console.log('      标题:', matchedVideo.title)
      
      // 保存状态
      saveVideoToStorage()
      
      // 加载知识卡片
      await fetchKnowledgeCards()
      
      // 🆕 如果视频已加载,尝试更新元数据
      if (videoPlayerRef.value && duration.value > 0) {
        console.log('   🔄 同时更新视频元数据...')
        await updateVideoMetadata(videoPlayerRef.value)
      }
      
      if (knowledgeCards.value.length > 0) {
        showNotification(`修复成功!找到 ${knowledgeCards.value.length} 个知识卡片`, 'success')
      } else {
        showNotification(`VideoID已设置为 ${matchedVideo.id},但该视频暂无知识卡片`, 'info')
      }
    } else {
      // 显示选择列表
      const videoList = videos.map((v: any, index: number) => 
        `${index + 1}. [${v.id}] ${v.title}`
      ).join('\n')
      
      const message = `无法自动匹配视频!\n\n视频库中的视频:\n${videoList}\n\n请从"视频库"中选择正确的视频`
      
      alert(message)
      showNotification('请从视频库中选择视频', 'error')
    }
  } catch (err) {
    console.error('   修复失败:', err)
    showNotification('修复失败: ' + (err as Error).message, 'error')
  }
}

const handleVideoLoaded = async (event: Event) => {
  const video = event.target as HTMLVideoElement
  duration.value = video.duration
  volume.value = video.volume
  playbackRate.value = video.playbackRate
  console.log('✅ 视频元数据已加载, 时长:', duration.value)
  
  // 🆕 如果视频有ID且时长为0,自动更新视频时长到后端
  if (videoId.value && duration.value > 0) {
    await updateVideoMetadata(video)
  }
  
  // 首次使用时显示全屏提示
  const tipShown = localStorage.getItem('fullscreenTipShown')
  if (!tipShown && currentVideo.value) {
    setTimeout(() => {
      showFullscreenTip.value = true
      // 5秒后自动关闭提示
      setTimeout(() => {
        if (showFullscreenTip.value) {
          closeFullscreenTip()
        }
      }, 5000)
    }, 1000)
  }
}

// 更新视频元数据到后端(时长和缩略图)
const updateVideoMetadata = async (video: HTMLVideoElement) => {
  if (!videoId.value) return
  
  try {
    console.log('🔄 准备更新视频元数据到后端...')
    console.log('   视频ID:', videoId.value)
    console.log('   视频时长:', duration.value, '秒')
    
    // 检查后端视频信息
    const checkResponse = await fetch(`/api/admin/videos/${videoId.value}`)
    if (!checkResponse.ok) {
      console.log('   无法获取视频信息,跳过更新')
      return
    }
    
    const videoData = await checkResponse.json()
    const currentDuration = videoData.data?.duration || 0
    
    console.log('   后端当前时长:', currentDuration, '秒')
    
    // 如果后端时长为0或与当前时长差异很大,则更新
    if (currentDuration === 0 || Math.abs(currentDuration - duration.value) > 1) {
      console.log('   📝 需要更新时长信息')
      
      // 生成缩略图(从视频第1秒截取)
      const thumbnail = await generateThumbnail(video)
      
      // 构建更新数据
      const updateData: any = {
        duration: Math.floor(duration.value)
      }
      
      // 如果成功生成了缩略图,也一起更新
      if (thumbnail) {
        updateData.thumbnail_base64 = thumbnail
        console.log('   📸 已生成缩略图')
      }
      
      // 更新到后端
      const updateResponse = await fetch(`/api/admin/videos/${videoId.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (updateResponse.ok) {
        console.log('   ✅ 视频元数据更新成功!')
        showNotification('视频信息已自动更新', 'success')
      } else {
        console.log('   ⚠️ 视频元数据更新失败')
      }
    } else {
      console.log('   ✓ 后端时长已存在,无需更新')
    }
  } catch (error) {
    console.error('   ❌ 更新视频元数据时出错:', error)
  }
}

// 生成视频缩略图
const generateThumbnail = async (video: HTMLVideoElement): Promise<string | null> => {
  try {
    // 创建canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    // 设置canvas尺寸为视频尺寸(或固定尺寸)
    const maxWidth = 320
    const maxHeight = 180
    const videoRatio = video.videoWidth / video.videoHeight
    
    if (videoRatio > maxWidth / maxHeight) {
      canvas.width = maxWidth
      canvas.height = maxWidth / videoRatio
    } else {
      canvas.height = maxHeight
      canvas.width = maxHeight * videoRatio
    }
    
    // 保存当前播放位置
    const currentTime = video.currentTime
    
    // 跳转到第1秒(或10%位置)截图
    const captureTime = Math.min(1, video.duration * 0.1)
    video.currentTime = captureTime
    
    // 等待视频跳转完成
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked)
        resolve()
      }
      video.addEventListener('seeked', onSeeked)
    })
    
    // 延迟一帧确保视频渲染
    await new Promise(resolve => requestAnimationFrame(resolve))
    
    // 绘制当前帧到canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // 恢复原播放位置
    video.currentTime = currentTime
    
    // 转换为base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    console.log('   📸 缩略图生成成功, 大小:', Math.floor(dataUrl.length / 1024), 'KB')
    
    return dataUrl
  } catch (error) {
    console.error('   生成缩略图失败:', error)
    return null
  }
}

// 视频开始加载
const handleVideoLoadStart = (event: Event) => {
  console.log('📥 视频开始加载:', currentVideo.value)
}

// 视频可以播放
const handleVideoCanPlay = (event: Event) => {
  const video = event.target as HTMLVideoElement
  console.log('✅ 视频可以播放了')
  
  // 监听播放/暂停事件
  video.addEventListener('play', () => {
    isPlaying.value = true
    resetControlsTimer()
    
    // 当视频开始播放时，检查是否有第0秒开始的卡片需要显示
    console.log('▶️  视频开始播放，检查第0秒卡片')
    checkZeroSecondCards()
  })
  
  video.addEventListener('pause', () => {
    isPlaying.value = false
    showControls.value = true
    if (controlsTimer !== null) {
      clearTimeout(controlsTimer)
    }
  })
}

// 视频加载错误
const handleVideoError = (event: Event) => {
  const video = event.target as HTMLVideoElement
  console.error('❌ 视频加载错误!')
  console.error('视频 src:', currentVideo.value)
  console.error('错误对象:', video.error)
  
  if (video.error) {
    let errorMessage = '视频加载失败: '
    switch (video.error.code) {
      case 1:
        errorMessage += '获取视频被中止'
        break
      case 2:
        errorMessage += '网络错误'
        break
      case 3:
        errorMessage += '解码错误'
        break
      case 4:
        errorMessage += '视频格式不支持或视频文件损坏'
        break
      default:
        errorMessage += '未知错误'
    }
    console.error(errorMessage)
    showNotification(errorMessage, 'error')
  }
}
</script>

<style scoped>
.user-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:root {
  --neutral-dark: #2c3e50;
  --transition-smooth: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  --transition-bounce: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 视频上传区域 */
.video-upload-section {
  padding: 20px;
  display: flex;
  justify-content: center;
}

/* 上传状态 */
.upload-status {
  text-align: center;
  padding: 10px;
  margin-bottom: 16px;
  color: #1890ff;
  font-size: 14px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-zoom-enter-active {
  animation: modalZoomIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.modal-zoom-leave-active {
  animation: modalZoomOut 0.3s ease-in;
}

@keyframes modalZoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modalZoomOut {
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

/* 视频库模态框样式 */
.library-modal {
  max-width: 1400px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.library-body {
  padding: 0;
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.video-info-inputs {
  margin-bottom: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-dark);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e8eef2;
  border-radius: 14px;
  font-size: 15px;
  transition: var(--transition-smooth);
  background: white;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #FF6B6B;
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e8eef2;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-bounce);
}

.btn-primary {
  background: linear-gradient(135deg, #4ECDC4, #45B7D1);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-confirm {
  background: linear-gradient(135deg, #FF6B6B, #F38181);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.btn-secondary {
  background: white;
  color: var(--neutral-dark);
  border: 2px solid #e8eef2;
}

.btn-secondary:hover {
  border-color: #FF6B6B;
  color: #FF6B6B;
}


.header {
  background: #4682b4;
  color: white;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

/* 主内容区域 - 左右分栏布局 */
.main-content-wrapper {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

/* 左侧视频区域 */
.video-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: transparent;
  overflow-y: auto;
  min-height: 0;
}

/* 右侧知识卡片侧边栏 */
.knowledge-cards-sidebar {
  width: 380px;
  background: #f8f9fa;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
  overflow-y: hidden; /* 只隐藏水平溢出，允许垂直方向由内部组件处理 */
  height: 100%; /* 确保侧边栏占满整个高度 */
}

.sidebar-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.debug-info:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.debug-icon {
  font-size: 16px;
}

.debug-text {
  font-weight: 500;
  font-family: 'Consolas', 'Monaco', monospace;
}

.quick-fix-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(245, 87, 108, 0.3);
}

.quick-fix-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
  background: linear-gradient(135deg, #fa9de5 0%, #f76c81 100%);
}

.quick-fix-btn:active {
  transform: translateY(0);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto; /* 使用auto，需要时显示滚动条 */
  padding: 0; /* 移除 padding,避免影响高度计算 */
  min-height: 0; /* 确保 flex 子元素可以缩小 */
  display: flex;
  flex-direction: column;
  height: 100%; /* 确保内容区域占满剩余高度 */
  position: relative; /* 确保子元素定位正确 */
  background: transparent; /* 确保背景透明 */
}

/* 相关知识栏滚动条样式 - 与视频预览区域进度条保持一致 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #1890ff;
  border-radius: 3px;
  transition: background 0.3s;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #40a9ff;
}

.video-url-section {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.url-input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input-wrapper {
  display: flex;
  gap: 12px;
}

.url-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.url-input:focus {
  outline: none;
  border-color: #1890ff;
}

.load-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.load-btn:hover {
  background: #40a9ff;
}

/* 视频播放区域 - 16:9横屏比例 */
.video-player-container {
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9比例 (9/16=0.5625) */
  position: relative;
  background: #000;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  flex: none;
  z-index: 1; /* 视频容器在底层 */
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #1a1a1a;
  flex-direction: column;
}

.placeholder-content {
  text-align: center;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.encoding-status {
  color: #1890ff;
  font-size: 14px;
  margin-top: 8px;
}

.video-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 注意: 全屏模式样式已移至文件末尾的非scoped样式块中 */

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  display: block;
  z-index: 1; /* 视频播放器在底层 */
}

.video-time-display {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: rgba(51, 51, 51, 0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 12px;
  z-index: 5; /* 降低z-index，让原生进度条在上面 */
}



/* 全屏操作区域 - 更大的可点击区域 */
.fullscreen-zone {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 180px;
  height: 80px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 12px;
  transition: all 0.3s ease;
}

.fullscreen-zone:hover {
  background: linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
}

.fullscreen-icon-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.fullscreen-zone:hover .fullscreen-icon-wrapper {
  background: rgba(24, 144, 255, 0.9);
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
}

.fullscreen-icon-wrapper svg {
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.fullscreen-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 自定义视频控制UI */
.custom-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  z-index: 100;
}

.custom-controls > * {
  pointer-events: auto;
}

/* 控制UI淡入淡出动画 */
.fade-controls-enter-active,
.fade-controls-leave-active {
  transition: opacity 0.3s ease;
}

.fade-controls-enter-from,
.fade-controls-leave-to {
  opacity: 0;
}

/* 顶部信息栏 */
.controls-top {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
  padding: 20px;
}

.video-title {
  color: white;
  font-size: 18px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* 底部控制栏 */
.controls-bottom {
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  padding: 20px 20px 15px;
}

/* 进度条容器 */
.progress-bar-container {
  position: relative;
  height: 6px;
  margin-bottom: 15px;
  cursor: pointer;
  padding: 8px 0;
  margin: -8px 0 7px;
}

.progress-bar-bg {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: visible;
  transition: height 0.2s;
}

.progress-bar-container:hover .progress-bar-bg {
  height: 8px;
}

.progress-bar-buffered {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-bar-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #1890ff;
  border-radius: 3px;
  transition: width 0.1s;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.progress-handle {
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transform: scale(0);
  transition: transform 0.2s;
  margin-right: -7px;
}

.progress-bar-container:hover .progress-handle {
  transform: scale(1);
}

/* 时间提示 */
.time-tooltip {
  position: absolute;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.time-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
}

/* 控制按钮组 */
.controls-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 控制按钮 */
.control-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  min-width: 40px;
  min-height: 40px;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* 音量控制 */
.volume-control {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  background: rgba(0, 0, 0, 0.9);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
}

.volume-input {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 4px;
  height: 100px;
  -webkit-appearance: slider-vertical;
  appearance: slider-vertical;
  cursor: pointer;
  margin: 0 auto;
}

.volume-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-left: -6px; /* 精确居中调整 */
}

.volume-input::-webkit-slider-runnable-track {
  width: 4px;
  height: 100px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin: 0 auto;
}

/* 时间显示 */
.time-display {
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.time-separator {
  opacity: 0.7;
}

/* 播放速度控制 */
.playback-rate {
  position: relative;
}

.rate-btn {
  min-width: 50px;
  font-size: 14px;
  font-weight: 500;
}

.rate-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 10px;
  background: rgba(0, 0, 0, 0.95);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 80px;
}

.rate-option {
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.rate-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.rate-option.active {
  background: #1890ff;
  font-weight: 600;
}



/* 分段模式按钮 */
.segment-mode-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.segment-mode-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.segment-mode-btn.active {
  background: rgba(255, 107, 53, 0.7);
}

/* 全屏使用提示 */
.fullscreen-tip {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  animation: tipSlideDown 0.4s ease-out;
}

@keyframes tipSlideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.tip-content {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.95) 0%, rgba(16, 110, 204, 0.95) 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 500px;
}

.tip-icon {
  font-size: 32px;
  flex-shrink: 0;
  animation: tipPulse 2s ease-in-out infinite;
}

@keyframes tipPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.tip-text {
  flex: 1;
}

.tip-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.tip-methods {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  opacity: 0.95;
}

.tip-methods span {
  display: flex;
  align-items: center;
}

.tip-close {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tip-close:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

/* Fade过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 全屏模式下时间显示样式 - 已移至文件末尾的非scoped样式块 */

/* 确保视频播放器控件可见并可交互 */
.video-player::-webkit-media-controls {
  display: flex !important;
  opacity: 1 !important;
}

.video-player::-webkit-media-controls-timeline {
  z-index: 15 !important;
  height: 8px !important;
}

/* 知识卡片显示区域样式 */
.knowledge-cards-section {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.knowledge-cards-section h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.knowledge-cards-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-card-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.knowledge-card-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.knowledge-card-item .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.knowledge-card-item .card-time {
  background: #17a2b8;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.knowledge-card-item .card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.knowledge-card-item .card-content {
  color: #555;
  line-height: 1.6;
  font-size: 14px;
}

.knowledge-card-item .card-content a {
  color: #007bff;
  text-decoration: none;
  cursor: pointer; /* 确保链接可点击，但不会跳转 */
  border-bottom: 1px dotted #007bff;
}

.knowledge-card-item .card-content a:hover {
  color: #0056b3;
  border-bottom-style: solid;
}

.video-action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  flex-shrink: 0;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 100px;
}

.save-btn {
  background: #5399A0;
  color: white;
}

.export-btn {
  background: #98C3C7;
  color: white;
}

.upload-btn {
  background: #BE9F89;
  color: white;
}

.library-btn {
  background: #1b2a31;
  color: white;
}

.edit-cards-btn {
  background: #E0D7C7;
  color: white;
}

.action-btn:hover {
  opacity: 0.9;
}

/* ========== Responsive Design ========== */
@media (max-width: 1200px) {
  .main-content-wrapper {
    flex-direction: column;
  }
  
  .knowledge-cards-sidebar {
    width: 100%;
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .premium-header {
    padding: 12px 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .header-btn {
    flex: 1;
    min-width: 100px;
    justify-content: center;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .main-content-wrapper {
    padding: 16px;
    gap: 16px;
  }
  
  .url-input-card {
    padding: 20px;
  }
  
  .input-wrapper {
    flex-direction: column;
  }
  
  .load-btn {
    width: 100%;
    justify-content: center;
  }
  
  .knowledge-cards-sidebar {
    max-height: 300px;
  }
  
  .video-main {
    padding: 16px;
  }
  
  .video-action-buttons {
    flex-wrap: wrap;
  }
  
  .action-btn {
    min-width: 80px;
    font-size: 13px;
    padding: 6px 12px;
  }
  
  .sidebar-header {
    padding: 12px 15px;
  }
  
  .sidebar-header h2 {
    font-size: 15px;
  }
  
  .sidebar-content {
    padding: 8px;
  }
  
  .debug-info {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .quick-fix-btn {
    font-size: 12px;
    padding: 6px 12px;
  }
}

@media (max-width: 480px) {
  .logo-section {
    flex-direction: column;
    text-align: center;
  }
  
  .header-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
  
  .controls-buttons {
    gap: 4px;
  }
  
  .control-btn {
    min-width: 36px;
    min-height: 36px;
    padding: 8px;
  }
  
  .play-btn {
    width: 44px;
    height: 44px;
  }
  
  .time-display {
    font-size: 12px;
  }
  
  .knowledge-cards-sidebar {
    max-height: 250px;
  }
  
  .sidebar-header {
    padding: 10px 12px;
  }
  
  .sidebar-header h2 {
    font-size: 14px;
  }
  
  .sidebar-content {
    padding: 6px;
  }
  
  .debug-info {
    font-size: 11px;
    padding: 4px 8px;
  }
  
  .quick-fix-btn {
    font-size: 11px;
    padding: 5px 10px;
  }
}

@media (min-width: 1400px) {
  .knowledge-cards-sidebar {
    width: 420px;
  }
}
</style>

<!-- 全屏模式样式 - 必须使用非scoped样式 -->
<style>
/* ===== 全屏模式下知识卡片弹窗样式修复 ===== */
/* 这个样式块必须是非scoped的,才能正确应用到全屏元素 */

.video-wrapper:fullscreen,
.video-wrapper:-webkit-full-screen,
.video-wrapper:-moz-full-screen,
.video-wrapper:-ms-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #000;
}

.video-wrapper:fullscreen .video-player,
.video-wrapper:-webkit-full-screen .video-player,
.video-wrapper:-moz-full-screen .video-player,
.video-wrapper:-ms-fullscreen .video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 确保全屏模式下弹窗overlay使用absolute定位 */
.video-wrapper:fullscreen .knowledge-card-popup-overlay,
.video-wrapper:-webkit-full-screen .knowledge-card-popup-overlay,
.video-wrapper:-moz-full-screen .knowledge-card-popup-overlay,
.video-wrapper:-ms-fullscreen .knowledge-card-popup-overlay {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 10000 !important;
  display: flex !important;
  pointer-events: none !important;
}

/* 确保弹窗本身可见且可交互 */
.video-wrapper:fullscreen .knowledge-card-popup,
.video-wrapper:-webkit-full-screen .knowledge-card-popup,
.video-wrapper:-moz-full-screen .knowledge-card-popup,
.video-wrapper:-ms-fullscreen .knowledge-card-popup {
  pointer-events: auto !important;
  position: relative !important;
  z-index: 10001 !important;
}

/* 全屏模式下时间显示调整 */
.video-wrapper:fullscreen .video-time-display,
.video-wrapper:-webkit-full-screen .video-time-display,
.video-wrapper:-moz-full-screen .video-time-display,
.video-wrapper:-ms-fullscreen .video-time-display {
  position: absolute;
  bottom: 50px;
  z-index: 9998;
}

/* ===== 视频分段标记点样式 ===== */
/* 分段标记点容器 */
.segment-markers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10 !important; /* 分段标记点在视频层之上 */
}

/* 单个分段标记点 */
.segment-marker {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--segment-color, #ff6b35);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
  z-index: 10006 !important;
}

/* 开始时间标记点样式 */
.segment-marker.start-marker {
  background: var(--segment-color, #ff6b35);
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

/* 结束时间标记点样式 */
.segment-marker.end-marker {
  background: var(--segment-color, #ff6b35);
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.segment-marker:hover {
  transform: translateY(-50%) scale(1.5);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 10007 !important;
}

.segment-marker.active {
  transform: translateY(-50%) scale(1.3);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 0 0 6px var(--segment-color, rgba(255, 107, 53, 0.3));
  animation: segmentPulse 2s ease-in-out infinite;
  z-index: 10008 !important;
}

@keyframes segmentPulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9), 0 0 0 8px var(--segment-color, rgba(255, 107, 53, 0.3));
  }
  50% {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9), 0 0 0 12px var(--segment-color, rgba(255, 107, 53, 0.1));
  }
}

/* 分段间填充区域样式 */
.segment-fill {
  position: absolute;
  top: 0;
  height: 100%;
  background: var(--segment-color, #ff6b35);
  opacity: 0.3;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  z-index: 10004 !important;
  border-radius: 0;
}

.segment-fill:hover {
  opacity: 0.5;
}

.segment-fill.active {
  opacity: 0.4;
}

.segment-fill.hover {
  opacity: 0.45;
}

/* 分段信息条样式 - 隐藏分段信息但保留分段点 */
.segment-info-bar {
  position: absolute;
  top: 0;
  height: 100%;
  background: transparent; /* 隐藏背景色 */
  border-radius: 3px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  z-index: 10005 !important;
  opacity: 0.7 !important;
  border: none; /* 移除边框 */
}

/* 取消鼠标移动到分段时的高亮显示 */
.segment-info-bar:hover {
  opacity: 0; /* 保持隐藏状态 */
}

.segment-info-bar.active {
  opacity: 0; /* 保持隐藏状态 */
}

/* 分段标题文字 - 隐藏显示 */
.segment-title {
  display: block !important;
}

/* 当分段宽度过小时，调整标题显示位置，用"..."代替竖着显示 */
.segment-info-bar.narrow .segment-title {
  display: none; /* 保持隐藏 */
}

.segment-info-bar:hover .segment-title {
  display: none; /* 保持隐藏 */
}

.segment-info-bar.narrow:hover .segment-title {
  display: none; /* 保持隐藏 */
}

/* 分段标记点悬停时的标题显示 */
.segment-marker:hover + .segment-info-bar .segment-title,
.segment-marker.hover + .segment-info-bar .segment-title {
  display: none; /* 保持隐藏 */
}

.segment-marker:hover + .segment-info-bar.narrow .segment-title,
.segment-marker.hover + .segment-info-bar.narrow .segment-title {
  display: none; /* 保持隐藏 */
}

/* 分段信息显示区域的优化样式 */
.segment-info-display {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 10015 !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(15px);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.segment-info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.segment-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.segment-info-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

/* 全屏模式下的分段标记优化 */
:fullscreen .segment-marker,
:-webkit-full-screen .segment-marker,
:-moz-full-screen .segment-marker,
:-ms-fullscreen .segment-marker {
  width: 10px;
  height: 10px;
}

:fullscreen .segment-info-bar,
:-webkit-full-screen .segment-info-bar,
:-moz-full-screen .segment-info-bar,
:-ms-fullscreen .segment-info-bar {
  opacity: 0.5;
}

:fullscreen .segment-info-bar:hover,
:-webkit-full-screen .segment-info-bar:hover,
:-moz-full-screen .segment-info-bar:hover,
:-ms-fullscreen .segment-info-bar:hover {
  opacity: 0.9;
  transform: scaleY(1.4);
}

:fullscreen .segment-title,
:-webkit-full-screen .segment-title,
:-moz-full-screen .segment-title,
:-ms-fullscreen .segment-title {
  font-size: 14px;
  padding: 8px 16px;
  top: -35px;
}



/* 分段信息显示区域 - 固定位置显示 */
.segment-info-display {
  position: absolute;
  top: -25px;
  left: 0;
  right: 0;
  z-index: 10020 !important;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.segment-info-content {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 12px 20px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  text-align: center;
  animation: segmentInfoFadeIn 0.3s ease-out;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

@keyframes segmentInfoFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.segment-info-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #222;
}

.segment-info-time {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.segment-info-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  font-weight: 500;
}

.segment-info-type.introduction {
  background: rgba(76, 175, 80, 0.15);
  color: #2E7D32;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.segment-info-type.key-point {
  background: rgba(33, 150, 243, 0.15);
  color: #1565C0;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.segment-info-type.example {
  background: rgba(255, 152, 0, 0.15);
  color: #EF6C00;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.segment-info-type.summary {
  background: rgba(156, 39, 176, 0.15);
  color: #7B1FA2;
  border: 1px solid rgba(156, 39, 176, 0.3);
}

.segment-info-type.exercise {
  background: rgba(244, 67, 54, 0.15);
  color: #C62828;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

/* 分段标记点颜色变体 */
.segment-marker[data-segment-type="introduction"] {
  background: #4CAF50;
}

.segment-marker[data-segment-type="key-point"] {
  background: #2196F3;
}

.segment-marker[data-segment-type="example"] {
  background: #FF9800;
}

.segment-marker[data-segment-type="summary"] {
  background: #9C27B0;
}

.segment-marker[data-segment-type="exercise"] {
  background: #F44336;
}

/* ===== 全屏模式文字进度条样式 ===== */
.fullscreen-text-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  cursor: pointer;
  z-index: 8; /* 文字进度条在视频进度条之下 */
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.fullscreen-text-progress-bar:hover {
  height: 80px;
}

/* 文字进度条背景 */
.text-progress-bg {
  position: relative;
  width: 100%;
  height: 40px;
  background: rgba(128, 128, 128, 0.3);
  border-radius: 8px;
  border: none;
  overflow: visible;
  backdrop-filter: blur(10px);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.fullscreen-text-progress-bar:hover .text-progress-bg {
  background: rgba(128, 128, 128, 0.4);
  border: none;
}

/* 文字进度条播放进度 */
.text-progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(77, 77, 77, 0.4); /* 比文字进度条深一点的透灰色 */
  border-radius: 8px 0 0 8px;
  z-index: 10001;
  pointer-events: none;
  transition: width 0.1s ease;
}

.fullscreen-text-progress-bar:hover .text-progress-played {
  background: rgba(64, 64, 64, 0.9); /* 悬停时更深的透灰色 */
}

/* 播放进度指示器 */
.text-progress-indicator {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10002; /* 在分段填充区域之下 */
  pointer-events: none;
}

.progress-handle {
  font-size: 16px;
  color: #ff6b35;
  text-shadow: 0 0 10px rgba(255, 107, 53, 0.8);
  font-weight: bold;
  animation: progressPulse 2s ease-in-out infinite;
}

@keyframes progressPulse {
  0%, 100% {
    text-shadow: 0 0 10px rgba(255, 107, 53, 0.8);
  }
  50% {
    text-shadow: 0 0 20px rgba(255, 107, 53, 1);
  }
}

/* 分段标记和信息容器 */
.text-segment-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5; /* 文字进度条分段信息在视频进度条之下 */
}

.text-segment-item {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 分段间填充区域 */
.text-segment-fill {
  position: absolute;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, 
    var(--segment-color, rgba(102, 126, 234, 0.15)) 0%, 
    var(--segment-color, rgba(102, 126, 234, 0.1)) 50%,
    var(--segment-color, rgba(102, 126, 234, 0.05)) 100%);
  border-radius: 6px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  z-index: 10003;
  opacity: 0.3;
  border: none;
}

.text-segment-fill:hover {
  opacity: 0.5;
  transform: scaleY(1.05);
  border: none;
}

.text-segment-fill.active {
  opacity: 0.4;
  box-shadow: 0 0 0 2px var(--segment-color, rgba(102, 126, 234, 0.4));
  border: none;
}

/* 文字分段标记 - 使用 | 符号 */
.text-segment-marker {
  display: none; /* 隐藏文字进度条的分段竖杠 */
}

.text-segment-marker:hover {
  font-size: 32px;
  text-shadow: 0 0 12px rgba(255, 255, 255, 1);
  z-index: 10007;
  background: rgba(0, 0, 0, 0.5);
  transform: scaleX(1.2);
}

.text-segment-marker.active {
  font-size: 30px;
  text-shadow: 0 0 15px var(--segment-color, rgba(255, 107, 53, 0.9));
  animation: textSegmentPulse 2s ease-in-out infinite;
  z-index: 10008;
  background: rgba(0, 0, 0, 0.6);
  box-shadow: 0 0 0 2px var(--segment-color, rgba(255, 107, 53, 0.5));
}

@keyframes textSegmentPulse {
  0%, 100% {
    text-shadow: 0 0 10px var(--segment-color, rgba(255, 107, 53, 0.8));
  }
  50% {
    text-shadow: 0 0 20px var(--segment-color, rgba(255, 107, 53, 1));
  }
}

/* 分段信息文字显示 */
.text-segment-info {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  z-index: 10004; /* 在分段填充区域之上显示文字 */
  opacity: 1;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  overflow: hidden;
}

.text-segment-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.text-segment-info.active {
  background: rgba(255, 255, 255, 0.15);
}

/* 分段标题和时间文字 */
.segment-title {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

.segment-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

/* 文字进度条时间提示 */
.text-time-tooltip {
  position: absolute;
  top: -55px;
  left: 0;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  z-index: 10015;
  pointer-events: none;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

/* 文字进度条分段详细信息显示 */
.text-segment-detail {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.9) 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 10020;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  max-width: 350px;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  text-align: center;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.detail-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.detail-type {
  font-size: 12px;
}

/* ===== 现代UI设计样式 - 基于video-cube-ui设计元素 ===== */

/* 玻璃态效果基础样式 */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 顶部标题栏样式 */
.premium-header {
  padding: 16px 24px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo-section .app-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.logo-section .subtitle {
  font-size: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* 现代输入区域样式 */
.premium-input-section {
  margin-bottom: 24px;
}

.url-input-group.glass-card {
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%);
}

.input-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.input-icon {
  color: #667eea;
}

.input-title {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.premium-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.premium-url-input {
  flex: 1;
  padding: 14px 20px;
  background-color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 12px;
  background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 14px;
  transition: all 0.3s ease;
}

.premium-url-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

.premium-url-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.premium-load-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.premium-load-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.input-hint {
  font-size: 12px;
  background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-top: 12px;
  margin-bottom: 0;
}

/* 现代视频播放器样式 */
.premium-video-container {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.video-placeholder.glass-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.premium-icon {
  color: #667eea;
  margin-bottom: 16px;
}

.placeholder-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: white;
}

.placeholder-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.encoding-status.premium-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 现代视频控制UI样式 */
.premium-controls .controls-top.glass-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%);
  border: none;
  border-radius: 0;
  padding: 16px 24px;
}

.premium-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.title-icon {
  color: #667eea;
}

.premium-controls .controls-bottom.glass-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 100%);
  border: none;
  border-radius: 0;
  padding: 20px 24px;
}

.premium-progress .progress-bar-bg {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  height: 6px;
}

.premium-played {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  height: 6px;
}

.premium-handle {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #667eea;
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
}

.detail-time {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

/* 全屏模式下分段标记点调整 */
.video-wrapper:fullscreen .segment-markers,
.video-wrapper:-webkit-full-screen .segment-markers,
.video-wrapper:-moz-full-screen .segment-markers,
.video-wrapper:-ms-fullscreen .segment-markers {
  z-index: 9999;
}

.video-wrapper:fullscreen .segment-marker,
.video-wrapper:-webkit-full-screen .segment-marker,
.video-wrapper:-moz-full-screen .segment-marker,
.video-wrapper:-ms-fullscreen .segment-marker {
  width: 10px;
  height: 10px;
}

</style>
