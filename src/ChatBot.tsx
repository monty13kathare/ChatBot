import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import MessageBubble from './MessageBubble';
import type { ChatBotProps, Message, ChatSession, FileAttachment } from './types';
import {
    Download,
    Eraser,
    X,
    Image as ImageIcon,
    Bot,
    Send,
    Sparkles
} from 'lucide-react';
import { QUICK_ACTIONS } from './data';



const INITIAL_SESSION: ChatSession = {
    id: '1',
    title: 'New Chat',
    messages: [{
        id: '1',
        content: 'Hello! 👋 I\'m your AI assistant. How can I help you today? 🌟',
        role: 'assistant',
        timestamp: new Date(),
    }],
    createdAt: new Date(),
    updatedAt: new Date()
};

const ChatBot: React.FC<ChatBotProps> = ({
    className = '',
    user
}) => {
    const [sessions, setSessions] = useState<ChatSession[]>([INITIAL_SESSION]);
    const [currentSessionId] = useState('1');
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode] = useState(true);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    console.log('copiedMessageId', copiedMessageId)
    console.log('isOnline', isOnline)

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Memoized computations
    const currentSession = useMemo(() =>
        sessions.find(session => session.id === currentSessionId),
        [sessions, currentSessionId]
    );

    const messages = useMemo(() =>
        currentSession?.messages || [],
        [currentSession]
    );

    // Initialize the Gemini API client
    const ai = useMemo(() => new GoogleGenAI({
        apiKey: "AIzaSyD0TOmsdZSkSWSyyiOVsJWUmlblbKEVL54",
    }), []);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Online status simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setIsOnline(navigator.onLine && Math.random() > 0.05);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    // Clean up object URLs when component unmounts
    useEffect(() => {
        return () => {
            attachments.forEach(attachment => {
                if (attachment.previewUrl) {
                    URL.revokeObjectURL(attachment.previewUrl);
                }
            });
        };
    }, [attachments]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
        });
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= 2000) {
            setInputValue(value);
            // Auto-resize textarea
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
            }
        }
    }, []);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [inputValue, attachments, isLoading]);

    // File handling functions
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            handleFiles(files);
        }
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleFiles = useCallback((files: FileList) => {
        const newAttachments: FileAttachment[] = [];

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const attachment: FileAttachment = {
                    id: Date.now().toString() + Math.random(),
                    file,
                    type: 'image',
                    previewUrl: URL.createObjectURL(file),
                    name: file.name,
                    size: file.size,
                    mimeType: file.type
                };
                newAttachments.push(attachment);
            }
        });

        setAttachments(prev => [...prev, ...newAttachments]);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }, [handleFiles]);

    const removeAttachment = useCallback((id: string) => {
        setAttachments(prev => {
            const attachment = prev.find(a => a.id === id);
            if (attachment?.previewUrl) {
                URL.revokeObjectURL(attachment.previewUrl);
            }
            return prev.filter(a => a.id !== id);
        });
    }, []);

    const generateSessionTitle = useCallback(async (firstMessage: string): Promise<string> => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Generate a very short title (max 4 words) for this chat starting with: "${firstMessage.substring(0, 100)}"`,
            });
            return response?.text?.replace(/["']/g, '').trim() || firstMessage.substring(0, 30) + '...';
        } catch {
            return firstMessage.substring(0, 30) + '...';
        }
    }, [ai]);

    // Convert file to base64 for Gemini API
    const fileToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }, []);

    const handleSendMessage = useCallback(async () => {
        if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputValue.trim(),
            role: 'user',
            timestamp: new Date(),
            type: attachments.length > 0 ? 'multimodal' : 'text',
            attachments: [...attachments]
        };

        // Update sessions with user message
        setSessions(prev => prev.map(session =>
            session.id === currentSessionId
                ? {
                    ...session,
                    messages: [...session.messages, userMessage],
                    updatedAt: new Date()
                }
                : session
        ));

        setInputValue('');
        setAttachments([]);
        setIsLoading(true);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Generate session title if this is the first user message
        if (messages.length === 1) {
            const title = await generateSessionTitle(inputValue);
            setSessions(prev => prev.map(session =>
                session.id === currentSessionId ? { ...session, title } : session
            ));
        }

        try {
            // Prepare content for Gemini API - support both text and images
            const contents = [];

            // Add text content if available
            if (inputValue.trim()) {
                contents.push({ text: inputValue.trim() });
            }

            // Add image content if available
            for (const attachment of attachments) {
                if (attachment.type === 'image') {
                    const base64Data = await fileToBase64(attachment.file);
                    contents.push({
                        inlineData: {
                            mimeType: attachment.file.type,
                            data: base64Data.split(',')[1] // Remove data URL prefix
                        }
                    });
                }
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents,
            });

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: response.text,
                role: 'assistant',
                timestamp: new Date(),
            };

            setSessions(prev => prev.map(session =>
                session.id === currentSessionId
                    ? {
                        ...session,
                        messages: [...session.messages, aiMessage],
                        updatedAt: new Date()
                    }
                    : session
            ));
        } catch (error) {
            console.error('Error fetching AI response:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: 'Sorry, I encountered an error. Please try again. ❌',
                role: 'assistant',
                timestamp: new Date(),
            };

            setSessions(prev => prev.map(session =>
                session.id === currentSessionId
                    ? {
                        ...session,
                        messages: [...session.messages, errorMessage],
                        updatedAt: new Date()
                    }
                    : session
            ));
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, attachments, isLoading, currentSessionId, messages.length, generateSessionTitle, fileToBase64, ai]);

    const clearCurrentSession = useCallback(() => {
        setSessions(prev => prev.map(session =>
            session.id === currentSessionId
                ? {
                    ...session,
                    messages: [{
                        id: '1',
                        content: 'Chat cleared! 🧹 How can I help you now? 💫',
                        role: 'assistant',
                        timestamp: new Date(),
                    }],
                    updatedAt: new Date()
                }
                : session
        ));
        setAttachments([]);
    }, [currentSessionId]);

    const handleQuickAction = useCallback((actionKey: string) => {
        const action = QUICK_ACTIONS.find(a => a.key === actionKey);
        if (action) {
            setInputValue(action.prompt);
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    }, []);

    const copyToClipboard = useCallback(async (text: string, messageId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }, []);

    const downloadFile = useCallback((file: File) => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    const exportChat = useCallback(() => {
        const chatContent = messages.map(msg =>
            `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}${msg.attachments ? ` [Attachments: ${msg.attachments.length} files]` : ''}`
        ).join('\n\n');
        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, [messages]);

    // Memoized header stats
    const headerStats = useMemo(() => (
        <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
            <span>{messages.length} messages</span>
            <span>•</span>
            <span className="flex items-center gap-1">
                <Bot className="w-4 h-4" />
                Powered by Gemini AI
            </span>
            {attachments.length > 0 && (
                <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-blue-500">
                        <ImageIcon className="w-4 h-4" />
                        {attachments.length} file{attachments.length > 1 ? 's' : ''}
                    </span>
                </>
            )}
        </p>
    ), [messages.length, attachments.length]);

    // Memoized loading indicator
    const loadingIndicator = useMemo(() => (
        <div className="flex justify-start mb-6">
            <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[80%]">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className={`rounded-2xl rounded-tl-none px-4 py-3 shadow-lg border ${isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-500">
                            {attachments.length > 0 ? 'Analyzing images...' : 'AI is thinking...'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    ), [isDarkMode, attachments.length]);

    // Memoized attachments preview
    const attachmentsPreview = useMemo(() => (
        <div className="flex flex-wrap gap-2 sm:gap-3">
            {attachments.map((attachment) => (
                <div key={attachment.id} className="relative group">
                    {attachment.type === 'image' && attachment.previewUrl && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl border-2 border-blue-400 overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg">
                            <img
                                src={attachment.previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg border border-white"
                            >
                                <X className="w-2 h-2 sm:w-3 sm:h-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate backdrop-blur-sm">
                                {attachment.name}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    ), [attachments, removeAttachment]);

    return (
        <div className={`flex h-screen bg-gradient-to-br ${isDarkMode
            ? 'from-gray-900 via-gray-800 to-gray-900 text-gray-100'
            : 'from-gray-50 via-white to-gray-100 text-gray-900'
            } transition-all duration-500 ${className}`}>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Enhanced Header */}
                <header className={`p-3 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} backdrop-blur-sm bg-opacity-95 sticky top-0 z-30`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">


                            <div className="min-w-0 flex-1">
                                <h1 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                                    {currentSession?.title}
                                </h1>
                                {headerStats}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={exportChat}
                                className="p-2 sm:p-2.5 rounded-xl transition-all duration-200 hover:scale-105 group"
                                title="Export Chat"
                            >
                                <Download className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'}`} />
                            </button>
                            <button
                                onClick={clearCurrentSession}
                                className="p-2 sm:p-2.5 rounded-xl transition-all duration-200 hover:scale-105 group"
                                title="Clear Chat"
                            >
                                <Eraser className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'}`} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Enhanced Messages Container */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto custom-scrollbar pb-4"
                >
                    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
                        {messages.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                onCopy={copyToClipboard}
                                onDownload={downloadFile}
                                onRemoveAttachment={removeAttachment}
                                isDarkMode={isDarkMode}
                                user={user}

                            />
                        ))}

                        {/* Enhanced Loading Animation */}
                        {isLoading && loadingIndicator}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Enhanced Input Area */}
                <footer className={`p-3 sm:p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} backdrop-blur-sm bg-opacity-95 sticky bottom-0 z-20`}>
                    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
                        {/* Attachments Preview */}
                        {attachments.length > 0 && attachmentsPreview}

                        {/* Quick Actions Bar */}
                        <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar md:flex-wrap md:justify-center md:overflow-visible">
                            {QUICK_ACTIONS.map(({ key, label, icon }) => (
                                <button
                                    key={key}
                                    onClick={() => handleQuickAction(key)}
                                    disabled={isLoading}
                                    className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span className="text-xs sm:text-sm">{icon}</span>
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Input Container */}
                        <div
                            className={`flex items-end gap-2 sm:gap-3 border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 shadow-lg ${isDragOver
                                ? 'border-blue-500 bg-blue-500/5 shadow-blue-500/20'
                                : isDarkMode
                                    ? 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {/* File Upload Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 group ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                title="Upload images"
                            >
                                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>

                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isLoading}
                            />

                            {/* Text Input Area */}
                            <div className="flex-1 relative min-h-[50px] sm:min-h-[60px] flex items-center">
                                <textarea
                                    ref={textareaRef}
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                    placeholder={
                                        attachments.length > 0
                                            ? "Describe what you want to do with these images..."
                                            : "Message AI Assistant..."
                                    }
                                    className={`w-full resize-none border-0 bg-transparent focus:outline-none focus:ring-0 text-sm sm:text-lg placeholder-gray-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}
                                    rows={1}
                                    disabled={isLoading}
                                    style={{ height: 'auto', minHeight: '50px', maxHeight: '120px' }}
                                />
                                <div className="absolute right-0 bottom-0 flex items-center gap-2">
                                    <span className={`text-xs ${inputValue.length > 1800 ? 'text-red-400' : 'text-gray-500'}`}>
                                        {inputValue.length}/2000
                                    </span>
                                </div>
                            </div>

                            {/* Send Button */}
                            <button
                                onClick={handleSendMessage}
                                disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
                                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 flex-shrink-0 group ${(!inputValue.trim() && attachments.length === 0) || isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                )}
                            </button>
                        </div>

                        {/* Footer Note */}
                        <div className="text-center px-2">
                            <p className="text-xs text-gray-500 flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                                <Sparkles className="w-3 h-3 flex-shrink-0" />
                                AI Assistant can make mistakes. Consider checking important information.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>


        </div>
    );
};

export default React.memo(ChatBot);