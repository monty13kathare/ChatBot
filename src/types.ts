export interface Message {
    id: string;
    content: string | any;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'image' | 'multimodal';
    file?: File;
    attachments?: FileAttachment[];
}

export interface FileAttachment {
    id: string;
    file: File;
    type: 'image' | 'document' | 'pdf' | 'text' | any;
    previewUrl?: string;
    name?: string;
    size?: number;
    mimeType?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ChatBotProps {
    className?: string;
    user: User;
    onNewSession?: (session: ChatSession) => void;
    onMessageSent?: (message: Message) => void;
    onError?: (error: Error) => void;
}

export interface MessageBubbleProps {
    message: Message;
    onCopy: (text: string, messageId: string) => void;
    onDownload?: (file: File) => void;
    onRemoveAttachment?: (attachmentId: string) => void;
    isDarkMode: boolean;
    user: User;
    showAvatars?: boolean;
    showTimestamps?: boolean;
}

export interface GeminiContent {
    parts: Array<{
        text?: string;
        inlineData?: {
            mimeType: string;
            data: string;
        };
    }>;
    role?: string;
}

export interface GeminiRequest {
    contents: GeminiContent[];
    generationConfig?: {
        temperature?: number;
        topK?: number;
        topP?: number;
        maxOutputTokens?: number;
    };
    safetySettings?: Array<{
        category: string;
        threshold: string;
    }>;
}

export interface GeminiResponse {
    candidates: Array<{
        content: GeminiContent;
        finishReason: string;
        index: number;
        safetyRatings: Array<{
            category: string;
            probability: string;
        }>;
    }>;
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    preferences?: UserPreferences;
}

export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    autoScroll: boolean;
    enterToSend: boolean;
    showWordCount: boolean;
    fontSize: 'small' | 'medium' | 'large';
}

export interface AuthCredentials {
    email: string;
    password: string;
    name?: string;
    avatar?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
    expiresIn: number;
    refreshToken?: string;
}

export interface ChatState {
    sessions: ChatSession[];
    currentSessionId: string;
    isLoading: boolean;
    isOnline: boolean;
    error?: string;
    inputValue: string;
    attachments: FileAttachment[];
}

export interface UIState {
    isSidebarOpen: boolean;
    isDarkMode: boolean;
    isDragOver: boolean;
    messageCount: number;
    unreadCount: number;
    activeView: 'chat' | 'settings' | 'history';
}

export interface QuickAction {
    id: string;
    label: string;
    prompt: string;
    icon: string;
    category: 'code' | 'explain' | 'idea' | 'joke' | 'write' | 'learn' | 'analyze';
    description?: string;
}

export interface FileUploadConfig {
    maxSize: number; // in bytes
    allowedTypes: string[];
    maxFiles: number;
    compressImages: boolean;
    maxImageWidth?: number;
    maxImageHeight?: number;
}

export interface ChatConfig {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    topK: number;
    stream: boolean;
    safetySettings: Array<{
        category: string;
        threshold: string;
    }>;
}

export interface ExportOptions {
    format: 'txt' | 'json' | 'pdf' | 'html';
    includeTimestamps: boolean;
    includeAttachments: boolean;
    includeUserInfo: boolean;
}

// Event types for analytics and tracking
export interface ChatEvent {
    type: 'session_start' | 'session_end' | 'message_sent' | 'message_received' | 'file_uploaded' | 'error_occurred';
    sessionId: string;
    messageId?: string;
    timestamp: Date;
    data?: Record<string, any>;
}

// Error types
export interface ChatError {
    code: string;
    message: string;
    details?: any;
    retryable: boolean;
}

// Props for file upload component
export interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    onError: (error: Error) => void;
    config: FileUploadConfig;
    disabled?: boolean;
    multiple?: boolean;
    className?: string;
}

// Props for quick actions component
export interface QuickActionsProps {
    onActionSelect: (action: QuickAction) => void;
    actions: QuickAction[];
    className?: string;
}

// Props for session list component
export interface SessionListProps {
    sessions: ChatSession[];
    currentSessionId: string;
    onSessionSelect: (sessionId: string) => void;
    onSessionDelete: (sessionId: string) => void;
    onSessionRename: (sessionId: string, newTitle: string) => void;
    className?: string;
}

// Enhanced types for real-time features
export interface TypingIndicator {
    isTyping: boolean;
    userId?: string;
    userName?: string;
    startedAt?: Date;
}

export interface PresenceInfo {
    userId: string;
    userName: string;
    isOnline: boolean;
    lastSeen?: Date;
    currentSession?: string;
}