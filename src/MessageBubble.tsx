import React, { useState, useCallback, useMemo } from 'react';
import {
    Copy,
    Check,
    Download,
    Trash2,
    Expand,
    Shrink,
    ExternalLink,
    Share,
    Clock,
    Bot,
    File,
    FileText,
    Image as ImageIcon,
    Code2,
    ChevronDown,
    ChevronUp,
    MoreVertical
} from 'lucide-react';
import type { MessageBubbleProps, FileAttachment } from './types';



const FILE_ICONS = {
    image: ImageIcon,
    document: FileText,
    pdf: FileText,
    text: FileText,
    default: File
} as const;

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    user,
    onCopy,
    onDownload,
    onRemoveAttachment,
    isDarkMode,
    showAvatars = true,
    showTimestamps = true
}) => {
    const isUser = message.role === 'user';
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
    const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<Set<number>>(new Set());
    const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
    const [showMobileActions, setShowMobileActions] = useState(false);


    // Memoized content analysis
    const containsCode = useMemo(() =>
        /```[\s\S]*?```|`[^`]*`/.test(message.content),
        [message.content]
    );

    const hasAttachments = useMemo(() =>
        message.attachments && message.attachments.length > 0,
        [message.attachments]
    );

    // Formatting function to mimic ChatGPT-style rendering
    const formatContent = useCallback((content: string): string => {
        let formatted = content
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Code blocks (```...```)
        formatted = formatted.replace(/```([\s\S]*?)```/g, (_match, code) => {
            return `<pre class="bg-slate-900 text-slate-100 text-sm rounded-lg p-3 sm:p-4 overflow-x-auto"><code>${code.trim()}</code></pre>`;
        });

        // Inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">$1</code>');

        // Headings
        formatted = formatted
            .replace(/^### (.*$)/gim, '<h3 class="text-base sm:text-lg font-semibold mt-3 sm:mt-4 mb-1 sm:mb-2 text-slate-800 dark:text-slate-200">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-lg sm:text-xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3 text-slate-900 dark:text-slate-100">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-xl sm:text-2xl font-bold mt-4 sm:mt-6 mb-2 sm:mb-4 text-slate-900 dark:text-slate-100">$1</h1>');

        // Bold + italic
        formatted = formatted
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-inherit">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-inherit">$1</em>')
            .replace(/_(.*?)_/g, '<em class="italic text-inherit">$1</em>');

        // Links [text](url)
        formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800 break-all">$1</a>');

        // Images ![alt](url)
        formatted = formatted.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-2 sm:my-3 shadow-sm" />');

        // Blockquotes
        formatted = formatted.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-slate-300 dark:border-slate-700 pl-3 sm:pl-4 italic text-slate-700 dark:text-slate-300 my-1 sm:my-2 text-sm sm:text-base">$1</blockquote>');

        // Horizontal rule
        formatted = formatted.replace(/^---$/gim, '<hr class="my-3 sm:my-4 border-slate-300 dark:border-slate-700"/>');

        // Bullet lists (- and *)
        formatted = formatted.replace(/^[-*] (.*$)/gim, '<li class="mb-1 list-disc list-inside text-sm sm:text-base">$1</li>');

        // Numbered lists (1.)
        formatted = formatted.replace(/^(\d+)\. (.*$)/gim, '<li class="mb-1 list-decimal list-inside text-sm sm:text-base">$2</li>');

        // Wrap consecutive <li> in <ul> or <ol>
        formatted = formatted
            .replace(/(<li class="mb-1 list-disc list-inside">[\s\S]*?<\/li>)/gim, '<ul class="list-disc pl-4 sm:pl-5 mt-1 sm:mt-2 mb-2 sm:mb-4 space-y-1">$1</ul>')
            .replace(/(<li class="mb-1 list-decimal list-inside">[\s\S]*?<\/li>)/gim, '<ol class="list-decimal pl-4 sm:pl-5 mt-1 sm:mt-2 mb-2 sm:mb-4 space-y-1">$1</ol>');

        // Paragraphs
        formatted = formatted
            .replace(/\n{2,}/g, '</p><p class="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">')
            .replace(/\n/g, '<br>');

        if (!formatted.startsWith("<") || !formatted.startsWith("<p")) {
            formatted = `<p class="leading-relaxed text-slate-800 dark:text-slate-200 text-sm sm:text-base">${formatted}</p>`;
        }

        return formatted;
    }, []);

    // Copy handler
    const handleCopy = useCallback(async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates(prev => ({ ...prev, [key]: true }));
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [key]: false }));
            }, 2000);
        } catch (error) {
            console.error('Failed to copy text:', error);
        }
    }, []);

    // Toggle code block expansion
    const toggleCodeBlockExpand = useCallback((index: number) => {
        setExpandedCodeBlocks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    }, []);

    // Toggle image expansion
    const toggleImageExpand = useCallback((attachmentId: string) => {
        setExpandedImages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(attachmentId)) {
                newSet.delete(attachmentId);
            } else {
                newSet.add(attachmentId);
            }
            return newSet;
        });
    }, []);

    // Download code function
    const downloadCode = useCallback((code: string, language: string) => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code.${language || 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    // Download file function
    const downloadFile = useCallback((attachment: FileAttachment) => {
        if (onDownload) {
            onDownload(attachment.file);
        } else {
            const url = URL.createObjectURL(attachment.file);
            const a = document.createElement('a');
            a.href = url;
            a.download = attachment.name ?? 'downloaded-file';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }, [onDownload]);

    // Format file size
    const formatFileSize = useCallback((bytes: any): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    // Get file icon component
    const getFileIcon = useCallback((attachment: FileAttachment) => {
        const IconComponent = FILE_ICONS[attachment.type as keyof typeof FILE_ICONS] || FILE_ICONS.default;
        return <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />;
    }, []);

    // Render attachments
    const renderAttachments = useCallback(() => {
        if (!hasAttachments) return null;

        return (
            <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
                {message.attachments!.map((attachment) => (
                    <div
                        key={attachment.id}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${isDarkMode
                            ? 'bg-slate-800 border-slate-700'
                            : 'bg-slate-50 border-slate-200'
                            }`}
                    >
                        {/* File Icon */}
                        <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            {getFileIcon(attachment)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-0.5">
                                <span className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {attachment.name}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                    {attachment.type.toUpperCase()}
                                </span>
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {formatFileSize(attachment?.size)} • {attachment.mimeType}
                            </div>
                        </div>

                        {/* File Actions */}
                        <div className="flex items-center gap-0.5 sm:gap-1">
                            {attachment.type === 'image' && attachment.previewUrl && (
                                <>
                                    <button
                                        onClick={() => toggleImageExpand(attachment.id)}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-500/20 transition-colors"
                                        title={expandedImages.has(attachment.id) ? 'Collapse image' : 'Expand image'}
                                    >
                                        {expandedImages.has(attachment.id) ?
                                            <Shrink className="w-3 h-3 sm:w-4 sm:h-4" /> :
                                            <Expand className="w-3 h-3 sm:w-4 sm:h-4" />
                                        }
                                    </button>
                                    <a
                                        href={attachment.previewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-500/20 transition-colors"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </a>
                                </>
                            )}
                            <button
                                onClick={() => downloadFile(attachment)}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-500/20 transition-colors"
                                title="Download file"
                            >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            {isUser && onRemoveAttachment && (
                                <button
                                    onClick={() => onRemoveAttachment(attachment.id)}
                                    className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-500"
                                    title="Remove attachment"
                                >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }, [
        hasAttachments,
        message.attachments,
        isUser,
        isDarkMode,
        getFileIcon,
        formatFileSize,
        expandedImages,
        toggleImageExpand,
        downloadFile,
        onRemoveAttachment
    ]);

    // Render expanded images
    const renderExpandedImages = useCallback(() => {
        if (!hasAttachments || expandedImages.size === 0) return null;

        return (
            <div className="mb-3 sm:mb-4 space-y-3 sm:space-y-4">
                {message.attachments!.map((attachment) =>
                    attachment.type === 'image' &&
                    attachment.previewUrl &&
                    expandedImages.has(attachment.id) && (
                        <div key={`expanded-${attachment.id}`} className="text-center">
                            <img
                                src={attachment.previewUrl}
                                alt={attachment.name}
                                className="max-w-full max-h-48 sm:max-h-96 rounded-lg shadow-lg mx-auto border border-slate-200 dark:border-slate-600"
                            />
                            <div className={`text-xs sm:text-sm mt-1 sm:mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {attachment.name} • {formatFileSize(attachment?.size)}
                            </div>
                        </div>
                    )
                )}
            </div>
        );
    }, [hasAttachments, message.attachments, expandedImages, isDarkMode, formatFileSize]);

    // Format code blocks
    const formatCodeBlocks = useCallback((content: string) => {
        const parts = content.split(/(```[\s\S]*?```|`[^`]*`)/g);
        let codeBlockIndex = -1;

        return parts.map((part, index) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                codeBlockIndex++;
                const currentIndex = codeBlockIndex;
                const codeContent = part.slice(3, -3).trim();
                const languageMatch = codeContent.match(/^(\w+)\n/);
                const language = languageMatch ? languageMatch[1] : 'text';
                const pureCode = languageMatch ? codeContent.slice(languageMatch[0].length) : codeContent;
                const lines = pureCode.split('\n');
                const isExpanded = expandedCodeBlocks.has(currentIndex);
                const showExpandButton = lines.length > 8;
                const displayedLines = isExpanded ? lines : lines.slice(0, 8);

                const copyKey = `code-${currentIndex}`;
                const isCodeCopied = copiedStates[copyKey];

                return (
                    <div key={`code-${index}`} className="my-3 sm:my-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        {/* Code header */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Code2 className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {language}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {lines.length} line{lines.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                                {showExpandButton && (
                                    <button
                                        onClick={() => toggleCodeBlockExpand(currentIndex)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {isExpanded ? 'Collapse' : 'Expand'}
                                    </button>
                                )}
                                <button
                                    onClick={() => downloadCode(pureCode, language)}
                                    className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                    title="Download code"
                                >
                                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                                <button
                                    onClick={() => handleCopy(pureCode, copyKey)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    {isCodeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    {isCodeCopied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Code content */}
                        <div className="bg-white dark:bg-slate-900 overflow-auto max-h-64 sm:max-h-96">
                            <pre className="p-3 sm:p-4 m-0 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                                <code>
                                    {displayedLines.map((line, lineIndex) => (
                                        <div key={lineIndex} className="flex hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="w-6 sm:w-8 flex-shrink-0 text-right pr-2 sm:pr-3 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-700 text-xs">
                                                {isExpanded ? lineIndex + 1 : lineIndex + 1}
                                            </div>
                                            <div className="flex-1 pl-2 sm:pl-3 whitespace-pre break-all">
                                                {line || ' '}
                                            </div>
                                        </div>
                                    ))}
                                    {!isExpanded && lines.length > 8 && (
                                        <div className="flex justify-center py-2 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800">
                                            ... {lines.length - 8} more lines ...
                                        </div>
                                    )}
                                </code>
                            </pre>
                        </div>
                    </div>
                );
            } else if (part.startsWith('`') && part.endsWith('`')) {
                const inlineCode = part.slice(1, -1);
                return (
                    <code
                        key={`inline-${index}`}
                        className="font-mono text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 sm:px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 break-all"
                    >
                        {inlineCode}
                    </code>
                );
            } else if (part.trim()) {
                return (
                    <div
                        key={`text-${index}`}
                        className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base"
                        dangerouslySetInnerHTML={{
                            __html: `<div class="space-y-2 sm:space-y-3">${formatContent(part)}</div>`
                        }}
                    />
                );
            }

            return null;
        }).filter(Boolean);
    }, [expandedCodeBlocks, copiedStates, toggleCodeBlockExpand, downloadCode, handleCopy, formatContent]);

    // Share message function
    const shareMessage = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Message',
                    text: message.content
                });
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.log('Sharing failed', error);
                }
            }
        } else {
            handleCopy(message.content, 'message');
        }
    }, [message.content, handleCopy]);

    const isMessageCopied = copiedStates['message'];

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 sm:mb-6 group`}>
            <div className={`flex max-w-[95%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 sm:gap-3`}>

                {/* Avatar */}
                {showAvatars && (
                    <div
                        className={`flex-shrink-0 object-cover w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center border ${isUser
                            ? ' text-white'
                            : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        {isUser ? (
                            <img src={user?.avatar} className="w-full h-full rounded-md sm:rounded-lg object-cover" />
                        ) : (
                            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                    </div>
                )}

                {/* Message Bubble */}
                <div
                    className={`relative rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm border transition-all duration-200 hover:shadow-md ${isUser
                        ? 'bg-blue-500 text-white border-blue-600 rounded-br-none sm:rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 rounded-bl-none sm:rounded-bl-none'
                        }`}
                >

                    {/* Attachments */}
                    {renderAttachments()}

                    {/* Expanded Images */}
                    {renderExpandedImages()}

                    {/* Message Content */}
                    <div className="text-sm sm:text-base leading-relaxed font-normal break-words">
                        {containsCode ? formatCodeBlocks(message.content) : (
                            <div
                                className="prose prose-slate dark:prose-invert max-w-none prose-sm sm:prose-base"
                                dangerouslySetInnerHTML={{
                                    __html: `<div class="space-y-2 sm:space-y-3">${formatContent(message.content)}</div>`
                                }}
                            />
                        )}
                    </div>

                    {/* Message Footer */}
                    <div className={`flex justify-between items-center mt-2 sm:mt-3 pt-2 sm:pt-3 ${isUser
                        ? 'border-t border-blue-400/40'
                        : 'border-t border-slate-200 dark:border-slate-600'
                        }`}>
                        {showTimestamps && (
                            <span className={`text-xs flex items-center gap-1 ${isUser
                                ? 'text-blue-200'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
                                {message.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        )}

                        {/* Mobile actions dropdown */}
                        <div className="sm:hidden relative">
                            <button
                                onClick={() => setShowMobileActions(!showMobileActions)}
                                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <MoreVertical className="w-3 h-3" />
                            </button>

                            {showMobileActions && (
                                <div className={`absolute bottom-6 ${isUser ? 'left-0' : 'right-0'} z-10 min-w-32 rounded-lg shadow-lg border ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                                    <div className="p-1 space-y-1">
                                        <button
                                            onClick={() => {
                                                onCopy ? onCopy(message.content, message.id) : handleCopy(message.content, 'message');
                                                setShowMobileActions(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-slate-500/20 transition-colors"
                                        >
                                            {isMessageCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {isMessageCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                shareMessage();
                                                setShowMobileActions(false);
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-slate-500/20 transition-colors"
                                        >
                                            <Share className="w-3 h-3" />
                                            Share
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop actions */}
                        <div className="hidden sm:flex items-center gap-1">
                            <button
                                onClick={() => onCopy ? onCopy(message.content, message.id) : handleCopy(message.content, 'message')}
                                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                title="Copy message"
                            >
                                {isMessageCopied ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>

                            <button
                                onClick={shareMessage}
                                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                title="Share message"
                            >
                                <Share className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(MessageBubble);