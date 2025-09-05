import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, Edit3, Check, X, Search, Loader2, Sparkles, FileText, Table, Scissors, Maximize2 } from 'lucide-react';
import { callGemini } from './aiAPi';



// Mock web search function
const webSearch = async (query) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return `Search results for "${query}":

**Latest Updates:**
- Version 15.0 released with App Router improvements
- Enhanced performance with React 18 features
- Better TypeScript integration
- Improved SEO capabilities

**Key Features:**
- Turbopack integration for faster builds
- Enhanced Image optimization
- Simplified data fetching patterns
- Better error handling mechanisms

These updates represent significant improvements in developer experience and application performance.`;
};

function LiveCollaborativeEditor() {
  const [editorContent, setEditorContent] = useState(`# Welcome to Live Collaborative Editor


This is a powerful editor with AI integration. Try these features:

## Getting Started
1. Select any text to see the floating toolbar
2. Use the chat sidebar to interact with AI
3. Apply AI suggestions directly to your content

## Sample Content
Here's some sample text you can experiment with. Try selecting this paragraph and use the "Edit with AI" option to see how AI can help improve your content.

You can also ask the AI to search for information and insert it directly into the editor. The possibilities are endless!`);
  
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI assistant. I can help you edit text, search for information, and improve your content. Try selecting some text in the editor or ask me anything!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({ original: '', suggestion: '', action: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  
  const editorRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Mock AI API function - replace with actual API calls
const callAI = async (prompt, context = '') => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate different AI responses based on the prompt
  if (prompt.includes('search') || prompt.includes('find') || prompt.includes('latest')) {
    return `Here's what I found about "${prompt}":

Recent developments include significant updates and improvements. Based on my search, there are several key points to consider:

1. **Performance Enhancements**: New optimizations have been implemented
2. **Developer Experience**: Improved tooling and better error handling
3. **Community Feedback**: Positive reception from the developer community

This information can help inform your project decisions and implementation strategy.`;
  }
  
  if (prompt.includes('shorten')) {
    const words = context.split(' ');
    return words.slice(0, Math.ceil(words.length / 2)).join(' ') + '...';
  }
  
  if (prompt.includes('lengthen') || prompt.includes('expand')) {
    return context + ' This expanded version provides additional context and detail, making the content more comprehensive and informative for readers who need deeper understanding of the topic.';
  }
  
  if (prompt.includes('table') || prompt.includes('convert to table')) {
    const lines = context.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      return `| Item | Description |\n|------|-------------|\n${lines.map((line, i) => `| ${i + 1} | ${line.trim()} |`).join('\n')}`;
    }
    return '| Column 1 | Column 2 |\n|----------|----------|\n| Sample | Data |';
  }
  
  if (prompt.includes('grammar') || prompt.includes('fix')) {
    return context.replace(/\bi\b/g, 'I').replace(/\bits\b/g, "it's").replace(/\byour\b/g, 'you\'re');
  }
  console.log('called in editor');
  const result = await callGemini(prompt, {context, editorContent});
  return result;
  // return `I've processed your request: "${prompt}". ${context ? 'Based on the selected text, here\'s my suggestion: ' + context.substring(0, 100) + (context.length > 100 ? '...' : '') : 'How can I help you further?'}`;
};


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleTextSelection = useCallback(() => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (selectedText.length === 0) {
      setShowToolbar(false);
      return;
    }

    // Calculate position relative to editor
    const editorRect = editorRef.current.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();
    
    setSelectedText(selectedText);
    setSelectionStart(range.startOffset);
    setSelectionEnd(range.endOffset);
    setToolbarPosition({
      x: rangeRect.left - editorRect.left + rangeRect.width / 2,
      y: rangeRect.top - editorRect.top - 50
    });
    setShowToolbar(true);
  }, []);

  const handleEditorChange = (e) => {
    setEditorContent(e.target.value);
    setShowToolbar(false);
  };

  const handleAIEdit = async (action) => {
    if (!selectedText) return;
    
    setIsLoading(true);
    try {
      const prompt = `${action} this text: ${selectedText}`;
      const suggestion = await callAI(prompt, selectedText);
      
      setPreviewData({
        original: selectedText,
        suggestion,
        action
      });
      setShowPreview(true);
    } catch (error) {
      console.error('AI edit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyEdit = () => {
    const beforeSelection = editorContent.substring(0, editorContent.indexOf(selectedText));
    const afterSelection = editorContent.substring(editorContent.indexOf(selectedText) + selectedText.length);
    
    setEditorContent(beforeSelection + previewData.suggestion + afterSelection);
    setShowPreview(false);
    setShowToolbar(false);
    
    // Add to chat history
    setChatMessages(prev => [...prev, 
      { role: 'user', content: `Applied AI edit: ${previewData.action}` },
      { role: 'assistant', content: `Great! I've ${previewData.action.toLowerCase()} your selected text. The changes have been applied to your document.` }
    ]);
  };

  const cancelEdit = () => {
    setShowPreview(false);
    setShowToolbar(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = inputMessage;
    setInputMessage('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);
    
    try {
      let response;
      
      if (agentMode && (userMessage.toLowerCase().includes('search') || userMessage.toLowerCase().includes('find'))) {
        // Agent mode with web search
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Searching the web for you...', isSearching: true }]);
        
        const searchQuery = userMessage.replace(/find|search|latest|about/gi, '').trim();
        const searchResults = await webSearch(searchQuery);
        
        if (userMessage.toLowerCase().includes('insert') || userMessage.toLowerCase().includes('add to editor')) {
          setEditorContent(prev => prev + '\n\n## Search Results\n\n' + searchResults);
          response = 'I\'ve searched the web and inserted the results into your editor. You can find the information at the bottom of your document.';
        } else {
          response = searchResults;
        }
        
        // Remove searching message
        setChatMessages(prev => prev.filter(msg => !msg.isSearching));
      } else {
        response = await callAI(userMessage);
      }
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      sendMessage();
    }
  };

  const toggleAgentMode = () => {
    setAgentMode(!agentMode);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              Live Collaborative Editor
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleAgentMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  agentMode 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {agentMode ? 'Agent Mode ON' : 'Agent Mode OFF'}
              </button>
              <span className="text-sm text-gray-500">
                {editorContent.length} characters
              </span>
            </div>
          </div>
        </div>

        {/* Editor Container */}
        <div className="flex-1 p-6 relative">
          <div className="h-full bg-white rounded-lg shadow-sm border relative">
            <textarea
              ref={editorRef}
              value={editorContent}
              onChange={handleEditorChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className="w-full h-full p-6 border-none resize-none focus:outline-none focus:ring-0 rounded-lg font-mono text-sm leading-relaxed"
              placeholder="Start typing your content here..."
              style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
            />

            {/* Floating Toolbar */}
            {showToolbar && (
              <div
                className="absolute z-10 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-2 flex items-center gap-1"
                style={{
                  left: toolbarPosition.x - 100,
                  top: Math.max(toolbarPosition.y, 10),
                }}
              >
                <button
                  onClick={() => handleAIEdit('shorten')}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 rounded text-blue-700 transition-colors disabled:opacity-50"
                >
                  <Scissors className="h-3 w-3" />
                  Shorten
                </button>
                <button
                  onClick={() => handleAIEdit('lengthen')}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 text-xs bg-green-50 hover:bg-green-100 rounded text-green-700 transition-colors disabled:opacity-50"
                >
                  <Maximize2 className="h-3 w-3" />
                  Expand
                </button>
                <button
                  onClick={() => handleAIEdit('convert to table')}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 text-xs bg-purple-50 hover:bg-purple-100 rounded text-purple-700 transition-colors disabled:opacity-50"
                >
                  <Table className="h-3 w-3" />
                  Table
                </button>
                <button
                  onClick={() => handleAIEdit('fix grammar')}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-2 text-xs bg-orange-50 hover:bg-orange-100 rounded text-orange-700 transition-colors disabled:opacity-50"
                >
                  <Edit3 className="h-3 w-3" />
                  Fix
                </button>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Chat Header */}
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">AI Assistant</h2>
            {agentMode && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                Agent Mode
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {agentMode ? 'I can search the web and insert results' : 'I can help edit and improve your content'}
          </p>
        </div>

        {/* Chat Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.isSearching
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.isSearching && (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">{message.content}</span>
                  </div>
                )}
                {!message.isSearching && (
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={agentMode ? "Ask me to search and insert content..." : "Ask me anything or request edits..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isChatLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isChatLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {agentMode ? 'Try: "Find latest Next.js updates and insert into editor"' : 'Select text in editor for quick AI edits'}
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">AI Suggestion Preview</h3>
              <p className="text-sm text-gray-600">Action: {previewData.action}</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Original</h4>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm whitespace-pre-wrap">
                    {previewData.original}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">AI Suggestion</h4>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm whitespace-pre-wrap">
                    {previewData.suggestion}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={applyEdit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveCollaborativeEditor;