'use client'

// IMPORTANT: THIS FILE IS COMPLETE - DO NOT REBUILD FEATURES!
// Last updated: May 29, 2025
// Status: Fully functional with all features implemented
// - Feedback collection: WORKING (see line ~1500)
// - Smart continuation: WORKING (see detectContinuation function)
// - Idea history: WORKING (see fetchIdeaHistory function)
// - Personalized welcome: WORKING (see generatePersonalizedWelcome)
// What's needed: USER FEEDBACK DATA (use the app and click feedback buttons!)

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Send, Sparkles, Save, LogOut, Layout, AlertCircle, ArrowRight, Lightbulb, RefreshCw, TrendingUp, Target, MessageSquare, Plus, BookmarkPlus, History, GitBranch, Settings, User as UserIcon } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import IdeaReviewModal from '@/components/ideas/IdeaReviewModal'
import EnhancedSaveModal from '@/components/ideas/EnhancedSaveModal'
import FeedbackComponent from '@/components/feedback/FeedbackComponent'
import FeedbackTooltip from '@/components/feedback/FeedbackTooltip'
import { devLogger } from '@/lib/dev-logger'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatInterfaceProps {
  user: User
}

interface ContinuationDetectionResult {
  continuationDetected: boolean;
  confidence: number;
  relatedIdeaId?: string;
  relatedIdeaTitle?: string;
  relatedIdeaContent?: string;
  relatedIdeaCategory?: string;
  suggestedAction?: 'update' | 'merge' | 'new_variation';
  detectionMethod?: string;
  timeSinceLastUpdate?: number;
  previousDevelopments?: Array<{
    date: string;
    summary: string;
    type: string;
  }>;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showSavePrompt, setShowSavePrompt] = useState<string | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isEnhancedModalOpen, setIsEnhancedModalOpen] = useState(false)
  const [suggestedIdeaForReview, setSuggestedIdeaForReview] = useState<{
    title: string;
    content: string;
    category: string;
    originalMessageId?: string;
  } | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [hasLoadedIdea, setHasLoadedIdea] = useState(false)
  const [currentIdeaContext, setCurrentIdeaContext] = useState<{id: string, title: string, content: string, category: string, development_count?: number} | null>(null)
  const [continuationContext, setContinuationContext] = useState<ContinuationDetectionResult | null>(null)
  const [showContinuationBanner, setShowContinuationBanner] = useState(false)
  const [messageCountSinceDetection, setMessageCountSinceDetection] = useState(0)
  const [showWelcomePulse, setShowWelcomePulse] = useState(false)
  const [showFloatingSave, setShowFloatingSave] = useState(false)
  const [selectedMessageForSave, setSelectedMessageForSave] = useState<string | null>(null)
  const [hasValueableContent, setHasValueableContent] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const definedCategories = ['General', 'Business', 'Creative', 'Technology', 'Personal Growth', 'Learning', 'Health & Wellness', 'Productivity', 'Finance', 'Travel'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  interface WelcomeData {
    message: string;
    lastConversation?: {
      id: string;
      title: string;
      preview: string;
      timeAgo: string;
    };
    lastConversationIdeaId?: string | null;
    recentIdeas: Array<{
      id: string;
      title: string;
      category: string;
    }>;
    suggestions: string[];
    stats: {
      totalIdeas: number;
      totalConversations: number;
    };
  }

  const generatePersonalizedWelcome = async (): Promise<WelcomeData> => {
    try {
      // Fetch user's last conversation with idea information
      const { data: lastConv } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          updated_at,
          idea_id,
          ideas!left(id, title, category),
          conversation_messages!inner(
            content,
            role,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch user's recent ideas
      const { data: recentIdeas } = await supabase
        .from('ideas')
        .select('id, title, category, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3);

      // Fetch user patterns
      const { data: categoryStats } = await supabase
        .from('ideas')
        .select('category')
        .eq('user_id', user.id);

      const { data: conversationStats } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      // Build welcome data
      const welcomeData: WelcomeData = {
        message: '',
        recentIdeas: recentIdeas || [],
        suggestions: [],
        stats: {
          totalIdeas: categoryStats?.length || 0,
          totalConversations: conversationStats?.length || 0
        },
        lastConversationIdeaId: lastConv?.idea_id || null
      };

      // Process last conversation
      if (lastConv && lastConv.conversation_messages && Array.isArray(lastConv.conversation_messages) && lastConv.conversation_messages.length > 0) {
        const messages = Array.isArray(lastConv.conversation_messages) ? lastConv.conversation_messages : [];
        const lastUserMessage = messages
          .filter((m: any) => m.role === 'user')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        if (lastUserMessage) {
          welcomeData.lastConversation = {
            id: lastConv.id,
            title: lastConv.title || 'Previous conversation',
            preview: lastUserMessage.content.length > 100 
              ? lastUserMessage.content.substring(0, 100) + "..."
              : lastUserMessage.content,
            timeAgo: getTimeAgo(new Date(lastConv.updated_at))
          };
        }
      }

      // Generate suggestions based on categories
      if (categoryStats && categoryStats.length > 0) {
        const categoryCount: Record<string, number> = {};
        categoryStats.forEach((idea: any) => {
          categoryCount[idea.category] = (categoryCount[idea.category] || 0) + 1;
        });
        const favoriteCategories = Object.entries(categoryCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([cat]) => cat);

        welcomeData.suggestions = generateSuggestions(favoriteCategories, recentIdeas || []);
      }

      // Build the welcome message
      let message = "Welcome back! 🌟\n\n";

      if (welcomeData.lastConversation) {
        message += `📍 **Where you left off** (${welcomeData.lastConversation.timeAgo}):\n`;
        message += `You were exploring: *"${welcomeData.lastConversation.preview}"*\n\n`;
      }

      if (welcomeData.recentIdeas.length > 0) {
        message += "💡 **Your recent ideas**:\n";
        welcomeData.recentIdeas.forEach((idea: any) => {
          message += `• ${idea.title} (${idea.category})\n`;
        });
        message += "\n";
      }

      if (welcomeData.suggestions.length > 0) {
        message += "🚀 **Based on your interests, you might want to**:\n";
        welcomeData.suggestions.forEach(suggestion => {
          message += `• ${suggestion}\n`;
        });
        message += "\n";
      }

      if (welcomeData.stats.totalIdeas > 0) {
        message += `📊 **Your journey so far**: ${welcomeData.stats.totalIdeas} ideas across ${welcomeData.stats.totalConversations} conversations\n\n`;
      }

      message += "What would you like to explore today?";
      welcomeData.message = message;

      return welcomeData;

    } catch (error) {
      console.error('Error generating personalized welcome:', error);
      // Return default welcome if personalization fails
      return {
        message: getDefaultWelcomeMessage(),
        recentIdeas: [],
        suggestions: [],
        stats: { totalIdeas: 0, totalConversations: 0 }
      };
    }
  }

  const generateSuggestions = (favoriteCategories: string[], recentIdeas: any[]): string[] => {
    const suggestions: string[] = [];
    
    // Category-based suggestions
    const categoryPrompts: Record<string, string[]> = {
      'Business': [
        'Refine your business model with market analysis',
        'Explore new revenue streams for your ideas',
        'Develop a go-to-market strategy'
      ],
      'Technology': [
        'Design the technical architecture for your project',
        'Explore AI integration possibilities',
        'Plan your development roadmap'
      ],
      'Creative': [
        'Brainstorm new creative directions',
        'Develop your artistic vision further',
        'Explore collaboration opportunities'
      ],
      'Personal Growth': [
        'Set actionable goals for the next quarter',
        'Reflect on recent learnings and insights',
        'Create a personal development plan'
      ],
      'Learning': [
        'Identify key skills to develop next',
        'Create a structured learning path',
        'Find resources for deeper exploration'
      ],
      'Health & Wellness': [
        'Design a sustainable wellness routine',
        'Explore mindfulness practices',
        'Set health goals for the month'
      ],
      'Productivity': [
        'Optimize your workflow systems',
        'Identify and eliminate time wasters',
        'Create templates for recurring tasks'
      ],
      'Finance': [
        'Review and optimize your budget',
        'Explore investment opportunities',
        'Plan for financial milestones'
      ],
      'Travel': [
        'Plan your next adventure',
        'Create a travel bucket list',
        'Research destinations that inspire you'
      ]
    };

    // Add suggestions based on favorite categories
    favoriteCategories.forEach(category => {
      const prompts = categoryPrompts[category] || [];
      if (prompts.length > 0) {
        suggestions.push(prompts[Math.floor(Math.random() * prompts.length)]);
      }
    });

    // Add continuation suggestion if there are recent ideas
    if (recentIdeas && recentIdeas.length > 0) {
      suggestions.push(`Continue developing "${recentIdeas[0].title}"`);
    }

    // Add a general exploration suggestion
    if (suggestions.length < 3) {
      suggestions.push('Explore a new idea or challenge you\'ve been thinking about');
    }

    // Limit to 3 suggestions
    return suggestions.slice(0, 3);
  }

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

  const renderWelcomeWithActions = (welcomeData: WelcomeData): string => {
    let message = welcomeData.message;
    
    // Add action button indicators
    message += "\n\n";
    message += "🎯 **Quick Actions:**\n";
    
    if (welcomeData.lastConversation) {
      message += `• 🔄 Continue where you left off\n`;
    }
    
    if (welcomeData.recentIdeas.length > 0) {
      message += `• 📊 Develop "${welcomeData.recentIdeas[0].title}"\n`;
    }
    
    if (welcomeData.suggestions.length > 0) {
      message += `• 🎯 Start guided exploration\n`;
    }
    
    if (welcomeData.stats.totalIdeas > 3) {
      message += `• 💡 Browse all your ideas\n`;
    }
    
    message += `• ✨ Start something new\n`;
    message += "\n_Click any action above or simply type below to begin!_";
    
    return message;
  }

  const handleActionButton = async (action: string, data?: any) => {
    switch (action) {
      case 'continue-last':
        // This would load the last conversation context
        setShowWelcomePulse(false); // Stop pulsing when action is taken
        if (data?.conversationId) {
          // Load conversation history and context
          devLogger.info('ChatInterface', 'Continuing last conversation', { conversationId: data.conversationId });
          
          // If we have welcomeData with lastConversationIdeaId, load that idea
          const welcomeData = (window as any).__poppyWelcomeData;
          if (welcomeData?.lastConversationIdeaId) {
            // This conversation was about an idea - load it!
            await loadIdeaIntoChat(welcomeData.lastConversationIdeaId);
          } else {
            // Check if this conversation was about an idea
            checkAndLoadRelatedIdea(data.conversationId);
          }
          
          setInput(`Let's continue where we left off...`);
        }
        break;
        
      case 'develop-idea':
        setShowWelcomePulse(false); // Stop pulsing when action is taken
        if (data?.ideaId) {
          // Navigate to chat with idea context - use window.location for full page reload
          // This ensures clean state when loading the idea
          window.location.href = `/chat?idea=${data.ideaId}`;
        }
        break;
        
      case 'guided-exploration':
        setShowWelcomePulse(false); // Stop pulsing when action is taken
        if (data?.prompt) {
          setInput(data.prompt);
          // Auto-send after a brief delay to let user see the prompt
          setTimeout(() => {
            const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement;
            if (sendButton) sendButton.click();
          }, 500);
        }
        break;
        
      case 'browse-ideas':
        setShowWelcomePulse(false); // Stop pulsing when action is taken
        router.push('/ideas');
        break;
        
      case 'start-new':
        setShowWelcomePulse(false); // Stop pulsing when action is taken
        setInput('');
        // Focus on the input
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) textarea.focus();
        break;
    }
  }

  const detectValueableContent = (content: string): boolean => {
    // Check for substantial content that might be worth saving
    const wordCount = content.split(/\s+/).length;
    
    // Patterns that indicate valuable content
    const valuablePatterns = [
      /\b(template|framework|system|process|plan|strategy|checklist|guide|steps|method)\b/i,
      /\b(idea|concept|approach|solution|proposal)\b/i,
      /\b\d+\.\s+\w+/m, // Numbered lists
      /^[-•]\s+\w+/m, // Bullet points
      /\b(should|could|would|need to|have to|must)\b/i, // Action items
    ];
    
    // Content is valuable if it's substantial (>50 words) or matches patterns
    return wordCount > 50 || valuablePatterns.some(pattern => pattern.test(content));
  }

  const handleQuickSave = async (messageId?: string) => {
    // If a specific message is selected, use that. Otherwise, prepare the whole conversation
    if (messageId) {
      setSelectedMessageForSave(messageId);
      await handleSaveIdea(messageId);
    } else {
      // Save the entire conversation context
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant' && m.id !== '1').pop();
      if (lastAssistantMessage) {
        await handleSaveIdea(lastAssistantMessage.id);
      }
    }
  }

  const fetchIdeaHistory = async (ideaId: string) => {
    try {
      // Fetch development history
      const { data: history, error } = await supabase
        .from('idea_development_history')
        .select('*')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch the original idea
      const { data: idea } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .single();

      // Generate history message
      let historyMessage = `📚 **Complete History of "${idea?.title || 'This Idea'}"**\n\n`;
      
      if (idea) {
        historyMessage += `🌱 **Original Idea** (Created ${new Date(idea.created_at).toLocaleDateString()}):\n`;
        historyMessage += `*Title:* ${idea.title}\n`;
        historyMessage += `*Content:* ${idea.content}\n`;
        historyMessage += `*Category:* ${idea.category}\n\n`;
      }

      if (history && history.length > 0) {
        historyMessage += `🔄 **Development History** (${history.length} updates):\n\n`;
        
        history.forEach((entry, index) => {
          const date = new Date(entry.created_at).toLocaleDateString();
          const time = new Date(entry.created_at).toLocaleTimeString();
          
          historyMessage += `**Update ${index + 1}** - ${date} at ${time}\n`;
          historyMessage += `🔸 *Type:* ${entry.development_type.replace('_', ' ')}\n`;
          
          if (entry.previous_title !== entry.new_title) {
            historyMessage += `📝 *Title changed from:* "${entry.previous_title}" → "${entry.new_title}"\n`;
          }
          
          historyMessage += `💬 *Changes:* ${entry.change_summary}\n`;
          
          if (entry.ai_confidence_score) {
            historyMessage += `🤖 *AI Confidence:* ${Math.round(entry.ai_confidence_score * 100)}%\n`;
          }
          
          historyMessage += `\n📦 **Content at this point:**\n${entry.new_content}\n\n`;
          historyMessage += `---\n\n`;
        });
        
        // Summary
        historyMessage += `📋 **Summary:**\n`;
        historyMessage += `• Total updates: ${history.length}\n`;
        historyMessage += `• Last updated: ${new Date(history[history.length - 1].created_at).toLocaleDateString()}\n`;
        historyMessage += `• Development span: ${Math.ceil((new Date(history[history.length - 1].created_at).getTime() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60 * 24))} days\n`;
      } else {
        historyMessage += `*No development history yet - this is the original version.*\n`;
      }

      // Add to messages
      const historyMessageObj: Message = {
        id: `history-${Date.now()}`,
        content: historyMessage,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, historyMessageObj]);
      
    } catch (error) {
      console.error('Error fetching idea history:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I couldn't fetch the idea history. Please try again.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }

  const checkAndLoadRelatedIdea = async (conversationId: string) => {
    try {
      // Check if this conversation is related to an idea
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          id,
          idea_id,
          ideas (
            id,
            title,
            content,
            category
          )
        `)
        .eq('id', conversationId)
        .single();

      console.log('Checking related idea for conversation:', conversationId, conversation, error);

      if (conversation?.idea_id && conversation.ideas) {
        // Set the idea context
        setCurrentIdeaContext({
          id: conversation.ideas.id,
          title: conversation.ideas.title,
          content: conversation.ideas.content,
          category: conversation.ideas.category
        });
        
        devLogger.info('ChatInterface', 'Loaded idea context from conversation', {
          ideaId: conversation.ideas.id,
          ideaTitle: conversation.ideas.title
        });
      } else if (conversation?.idea_id && !conversation.ideas) {
        // The conversation has an idea_id but the join failed - fetch the idea directly
        console.log('Conversation has idea_id but join failed, fetching directly:', conversation.idea_id);
        
        const { data: ideaData } = await supabase
          .from('ideas')
          .select('id, title, content, category')
          .eq('id', conversation.idea_id)
          .single();
          
        if (ideaData) {
          setCurrentIdeaContext(ideaData);
          devLogger.info('ChatInterface', 'Loaded idea context directly', {
            ideaId: ideaData.id,
            ideaTitle: ideaData.title
          });
        }
      }
    } catch (error) {
      console.error('Error loading related idea:', error);
    }
  }

  // Check for special commands
  const handleSpecialCommands = (input: string): boolean => {
    const lowerInput = input.toLowerCase().trim();
    
    // Check for history command
    if (lowerInput === '/history' || lowerInput === 'show history' || lowerInput === 'show idea history') {
      if (currentIdeaContext) {
        fetchIdeaHistory(currentIdeaContext.id);
        return true;
      } else {
        const helpMessage: Message = {
          id: `help-${Date.now()}`,
          content: "To view idea history, you need to be working on a specific idea. You can:\n\n• Click 'Develop recent idea' from your welcome screen\n• Navigate to an idea from your gallery\n• Or save this conversation as an idea first!\n\n💡 **Tip**: Type `/history` or 'show history' when working on an idea to see its complete evolution.",
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, helpMessage]);
        return true;
      }
    }
    
    return false;
  }

  const getDefaultWelcomeMessage = (): string => {
    return "Hello! I'm Poppy, your AI thinking partner. 🌟\n\nI'm here to help you explore, develop, and organize your ideas. I learn from your feedback to become more helpful over time!\n\n💡 **Quick tip**: After each of my responses, you'll see feedback buttons. Your thumbs up/down helps me understand what works best for you.\n\nWhat's on your mind today? Share any thought, idea, or question you'd like to explore!";
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Monitor for valuable content
  useEffect(() => {
    const hasValuable = messages.some(m => 
      m.role === 'assistant' && 
      m.id !== '1' && 
      detectValueableContent(m.content)
    );
    setHasValueableContent(hasValuable);
    
    // Show floating save button after meaningful exchanges
    if (messages.length > 3 && hasValuable) {
      setShowFloatingSave(true);
    }
  }, [messages])

  // Initialize chat and handle idea loading
  useEffect(() => {
    const initializeChat = async () => {
      setIsInitializing(true)
      try {
        const ideaId = searchParams.get('idea')
        if (ideaId && !hasLoadedIdea) {
          // Clear any existing messages when loading an idea
          setMessages([])
          await loadIdeaIntoChat(ideaId)
        } else if (!ideaId && !hasLoadedIdea) {
          // Only show welcome if we're not loading an idea
          setHasLoadedIdea(false)
          
          // Check if this is a returning user or first time
          const { data: existingConversations } = await supabase
            .from('conversations')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
          
          const isReturningUser = existingConversations && existingConversations.length > 0;
          
          // Generate appropriate welcome message
          let welcomeMessage: string;
          let welcomeData: WelcomeData | null = null;
          
          if (isReturningUser) {
            welcomeData = await generatePersonalizedWelcome();
            welcomeMessage = renderWelcomeWithActions(welcomeData);
            
            // Store welcome data for action handling
            (window as any).__poppyWelcomeData = welcomeData;
            
            // Enable pulse animation for send button
            setShowWelcomePulse(true);
            
            // Stop pulsing after user interacts or after 10 seconds
            setTimeout(() => setShowWelcomePulse(false), 10000);
          } else {
            welcomeMessage = getDefaultWelcomeMessage();
          }
          
          setMessages([{
            id: '1',
            content: welcomeMessage,
            role: 'assistant',
            timestamp: new Date()
          }]);
          
          // CRITICAL: Create a conversation session immediately
          const conv = await ensureConversationSession(null)
          if (conv) {
            setCurrentConversationId(conv.id)
            devLogger.info('ChatInterface', 'Created initial conversation', { conversationId: conv.id })
          } else {
            console.error('Failed to create initial conversation')
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error)
        // Set default message on error
        setMessages([{
          id: '1',
          content: getDefaultWelcomeMessage(),
          role: 'assistant',
          timestamp: new Date()
        }]);
        
        // Try to create conversation even on error
        try {
          const conv = await ensureConversationSession(null)
          if (conv) {
            setCurrentConversationId(conv.id)
          }
        } catch (convError) {
          console.error('Failed to create conversation on error recovery:', convError)
        }
      } finally {
        setIsInitializing(false)
      }
    }

    initializeChat()
  }, [searchParams.get('idea')])

  // Smart continuation detection
  useEffect(() => {
    const runSmartDetection = async () => {
      // Only run after 4 messages and if not already showing banner
      if (messages.length >= 4 && !showContinuationBanner && messageCountSinceDetection >= 4) {
        await detectContinuation()
        setMessageCountSinceDetection(0)
      }
    }

    if (!isInitializing && !isLoading) {
      runSmartDetection()
    }
  }, [messages.length, messageCountSinceDetection])

  const loadIdeaIntoChat = async (ideaId: string) => {
    setIsLoading(true)
    try {
      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .select('id, title, content, category, development_count')
        .eq('id', ideaId)
        .eq('user_id', user.id)
        .single()
      
      if (ideaData) {
        setCurrentIdeaContext(ideaData)
        
        // Check if there's an existing conversation for this idea
        const { data: existingConversations } = await supabase
          .from('conversations')
          .select(`
            id,
            conversation_messages(
              id,
              content,
              role,
              created_at
            )
          `)
          .eq('idea_id', ideaData.id)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
        
        if (existingConversations && existingConversations.length > 0 && existingConversations[0].conversation_messages?.length > 0) {
          // Load existing conversation
          const conv = existingConversations[0]
          setCurrentConversationId(conv.id)
          
          const messages = conv.conversation_messages.map((m: any) => ({
            id: m.id,
            content: m.content,
            role: m.role as 'user' | 'assistant',
            timestamp: new Date(m.created_at)
          }))
          
          // Only add continuation message if last message was from user
          const lastMessage = messages[messages.length - 1]
          const needsContinuation = !lastMessage || lastMessage.role === 'user'
          
          if (needsContinuation) {
            messages.push({
              id: `continue-${Date.now()}`,
              content: `🔄 **Continuing your idea**: "${ideaData.title}"\n\n📝 **Current version**: "${ideaData.content}"\n\n🚀 **Development mode**: All improvements will be tracked in this idea's history. You can:\n• Update and refine the existing idea (recommended)\n• Save as a completely new idea if needed\n• Type "/history" to see the complete evolution\n\nWhat would you like to develop or refine further?`,
              role: 'assistant',
              timestamp: new Date()
            })
          }
          
          setMessages(messages)
        } else {
          // No existing conversation, create new one
          const newConversation = await ensureConversationSession(ideaData.id)
          if (newConversation) setCurrentConversationId(newConversation.id)

          const ideaSeedMessage: Message = {
            id: 'idea-seed-' + ideaData.id,
            content: `🔄 **Continuing your idea**: "${ideaData.title}"\n\n📝 **Current version**: "${ideaData.content}"\n\n🚀 **Development mode**: All improvements will be tracked in this idea's history. You can:\n• Update and refine the existing idea (recommended)\n• Save as a completely new idea if needed\n• Type "/history" to see the complete evolution\n\nWhat would you like to develop or refine further?`,
            role: 'assistant',
            timestamp: new Date()
          }
          
          setMessages([ideaSeedMessage])
        }
        
        setHasLoadedIdea(true)
      } else if (ideaError) {
        console.error("Error fetching idea:", ideaError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const detectContinuation = async () => {
    try {
      const response = await fetch('/api/detect-continuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.slice(-6).map(m => ({role: m.role, content: m.content})),
          timeThresholdHours: 48
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      if (!response.ok) {
        throw new Error('Detection API failed')
      }

      const detection: ContinuationDetectionResult = await response.json()
      
      if (detection.continuationDetected && detection.confidence > 0.3) {
        setContinuationContext(detection)
        setShowContinuationBanner(true)
        
        // Auto-hide banner after 10 seconds
        setTimeout(() => {
          setShowContinuationBanner(false)
        }, 10000)
      }
    } catch (error) {
      console.error('Smart detection error:', error)
      // Fail silently - don't disrupt the chat experience
    }
  }

  const ensureConversationSession = async (ideaId: string | null) => {
    try {
      if (currentConversationId) {
        const { data: existingConv, error: checkError } = await supabase
          .from('conversations')
          .select('id, idea_id')
          .eq('id', currentConversationId)
          .single()
        
        if (existingConv) {
          // If we have an existing conversation but now we're loading an idea,
          // update the conversation to link it to the idea
          if (ideaId && !existingConv.idea_id) {
            await supabase
              .from('conversations')
              .update({ idea_id: ideaId })
              .eq('id', currentConversationId)
          }
          return existingConv
        }
      }

      // Create a new conversation
      console.log('Creating new conversation for user:', user.id)
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({ 
          user_id: user.id, 
          idea_id: ideaId, 
          title: ideaId ? 'Chat about existing idea' : 'New Chat',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        // Log more details about the error
        console.error('Error details:', {
          code: convError.code,
          message: convError.message,
          details: convError.details,
          hint: convError.hint
        })
        return null
      }
      
      console.log('Successfully created conversation:', newConversation.id)
      return newConversation
    } catch (error) {
      console.error('Unexpected error in ensureConversationSession:', error)
      return null
    }
  }

  const saveMessageWithEmbedding = async (message: Message, conversationId: string): Promise<string | null> => {
    if (!conversationId) {
      console.warn('No conversationId provided for message save')
      return null
    }
    
    console.log('Saving message to database:', {
      conversationId,
      role: message.role,
      contentLength: message.content.length
    })
    
    try {
      // Skip embedding for now to simplify debugging
      const embedding = null;
      
      /* Temporarily disabled embedding generation
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      })
      
      if (!response.ok) {
        console.error('Failed to generate embedding:', response.status)
        throw new Error('Failed to generate embedding')
      }
      
      const { embedding } = await response.json()
      */

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: message.role,
          content: message.content,
          embedding: embedding,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()
        
      if (error) {
        console.error('Error saving message to DB:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return null
      } else {
        console.log(`Message (${message.role}) saved successfully with ID: ${data.id}`)
        return data.id
      }
    } catch (error) {
      console.error('Error in saveMessageWithEmbedding:', error)
      return null
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    // Check for special commands first
    if (handleSpecialCommands(input.trim())) {
      setInput('');
      return;
    }

    // Stop pulsing when user sends a message
    setShowWelcomePulse(false)

    devLogger.info('ChatInterface', 'Sending message', { 
      messageLength: input.length,
      conversationId: currentConversationId 
    })

    // Increment message count for smart detection
    setMessageCountSinceDetection(prev => prev + 1)

    let convId = currentConversationId
    if (!convId) {
      const newConv = await ensureConversationSession(searchParams.get('idea'))
      if (newConv) {
        convId = newConv.id
        setCurrentConversationId(newConv.id)
      } else {
        alert('Error starting conversation. Please try again.')
        return
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    const currentMessages = [...messages, userMessage]
    setMessages(currentMessages)
    setInput('')
    setIsLoading(true)

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantPlaceholderMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, assistantPlaceholderMessage])

    try {
      // Save user message and get DB ID
      let userMessageDbId: string | null = null
      if (convId) {
        userMessageDbId = await saveMessageWithEmbedding(userMessage, convId)
        if (userMessageDbId) {
          // Update the user message with the database ID
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, id: userMessageDbId } 
                : msg
            )
          )
        }
      }

      const response = await fetch('/api/chat-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: currentMessages.map(m => ({role: m.role, content: m.content})) 
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let streamedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        streamedContent += decoder.decode(value, { stream: true })
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: streamedContent } 
              : msg
          )
        )
      }

      streamedContent += decoder.decode()
      
      // Save assistant message and get DB ID
      if (convId && streamedContent) {
        const assistantMessageDbId = await saveMessageWithEmbedding({ 
          ...assistantPlaceholderMessage, 
          content: streamedContent, 
          timestamp: new Date() 
        }, convId)
        
        if (assistantMessageDbId) {
          // Update the assistant message with the database ID
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, id: assistantMessageDbId, content: streamedContent, timestamp: new Date() }
                : msg
            )
          )
        } else {
          // If save failed, just update the content
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: streamedContent, timestamp: new Date() }
                : msg
            )
          )
        }
      } else {
        // If no conversation ID, just update the content
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: streamedContent, timestamp: new Date() }
              : msg
          )
        )
      }

      if (shouldPromptToSave(streamedContent)) {
        setShowSavePrompt(assistantMessageId)
      }

    } catch (error) {
      console.error('Error getting response:', error)
      const errorMessage = error instanceof Error ? error.message : "I'm sorry, I'm having trouble responding right now. Please try again."
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: errorMessage } 
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const shouldPromptToSave = (response: string): boolean => {
    const saveKeywords = [
      'save', 'idea tile', 'organize this', 'concrete idea', 'reference and build',
      'capture', 'finalize', 'entry', 'poppy idea engine', 'meal planner', 
      'let me know if you\'d like me to modify', 'does this look', 'how does this look'
    ]
    return saveKeywords.some(keyword => response.toLowerCase().includes(keyword))
  }

  const handleSaveIdea = async (messageId: string) => {
    setIsLoading(true)
    setShowSavePrompt(null)

    const assistantMessageIndex = messages.findIndex(m => m.id === messageId)
    if (assistantMessageIndex === -1) {
      setIsLoading(false)
      return
    }
    
    const contextMessages = messages.filter(m => m.id !== '1')
    const processedIdea = await simulateAIProcessingForSave(contextMessages)
    
    setSuggestedIdeaForReview({ ...processedIdea, originalMessageId: messageId })
    
    // Use enhanced modal if we have continuation context
    if (continuationContext || currentIdeaContext) {
      setIsEnhancedModalOpen(true)
    } else {
      setIsReviewModalOpen(true)
    }
    
    setIsLoading(false)
  }

  const handleBranchIdea = async (messageId: string) => {
    setIsLoading(true)
    setShowSavePrompt(null)

    const assistantMessageIndex = messages.findIndex(m => m.id === messageId)
    if (assistantMessageIndex === -1) {
      setIsLoading(false)
      return
    }
    
    const contextMessages = messages.filter(m => m.id !== '1')
    const processedIdea = await simulateAIProcessingForSave(contextMessages)
    
    // Add branch context
    const branchContext = {
      ...processedIdea,
      originalMessageId: messageId,
      isBranch: true,
      parentIdeaId: currentIdeaContext?.id,
      parentIdeaTitle: currentIdeaContext?.title,
      branchNote: `Branched from "${currentIdeaContext?.title}" to explore a new direction`
    }
    
    setSuggestedIdeaForReview(branchContext)
    setIsReviewModalOpen(true) // Use regular modal for branches
    
    setIsLoading(false)
  }

  const simulateAIProcessingForSave = async (context: Message[]): Promise<{title: string, content: string, category: string}> => {
    try {
      const conversationText = context.map(m => `${m.role}: ${m.content}`).join('\n\n')
      
      const prompt = `Based on this conversation, please extract and format the main idea for saving:

${conversationText}

Please respond with ONLY a JSON object in this exact format:
{
  "title": "A clear, concise title (5-8 words)",
  "content": "A comprehensive summary of the key points and details discussed (2-3 sentences)",
  "category": "One of: General, Business, Creative, Technology, Personal Growth, Learning, Health & Wellness, Productivity, Finance, Travel"
}`

      const response = await fetch('/api/chat-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: prompt }] 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process idea with AI')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullResponse += decoder.decode(value, { stream: true })
        }
        fullResponse += decoder.decode()
      }

      try {
        const parsed = JSON.parse(fullResponse.trim())
        return {
          title: parsed.title || "New Idea",
          content: parsed.content || "No summary available",
          category: parsed.category || "General"
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON:', fullResponse)
        throw new Error('Invalid AI response format')
      }
    } catch (error) {
      console.error('Error processing idea with AI:', error)
      return fallbackIdeaProcessing(context)
    }
  }

  const fallbackIdeaProcessing = (context: Message[]): {title: string, content: string, category: string} => {
    let relevantContent = ""
    let potentialTitle = "New Idea"

    const userMessages = context.filter(m => m.role === 'user')
    if (userMessages.length > 0) {
      relevantContent = userMessages.map(m => m.content).join("\n\n---\n\n")
      potentialTitle = userMessages[userMessages.length - 1].content.split(' ').slice(0, 7).join(' ') + 
        (userMessages[userMessages.length - 1].content.split(' ').length > 7 ? '...' : '')
    } else {
      relevantContent = context[context.length - 1]?.content || "No content found."
      potentialTitle = relevantContent.split(' ').slice(0, 7).join(' ') + 
        (relevantContent.split(' ').length > 7 ? '...' : '')
    }

    const category = determineCategoryFromContent(relevantContent)
    const summary = relevantContent.length > 300 ? relevantContent.substring(0, 297) + "..." : relevantContent

    return {
      title: potentialTitle,
      content: summary,
      category: category
    }
  }

  const determineCategoryFromContent = (content: string): string => {
    const lowerContent = content.toLowerCase()
    const categoryKeywords = {
      'Business': ['business', 'startup', 'revenue', 'market', 'customer', 'product'],
      'Technology': ['tech', 'software', 'app', 'code', 'api', 'system'],
      'Creative': ['creative', 'art', 'design', 'story', 'visual', 'aesthetic'],
      'Learning': ['learn', 'study', 'course', 'skill', 'knowledge', 'education'],
      'Health & Wellness': ['health', 'fitness', 'wellness', 'exercise', 'nutrition'],
      'Personal Growth': ['personal', 'growth', 'self', 'life', 'development'],
      'Finance': ['money', 'budget', 'investment', 'finance', 'savings'],
      'Productivity': ['productivity', 'workflow', 'efficiency', 'organize'],
      'Travel': ['travel', 'trip', 'vacation', 'destination', 'journey']
    }

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category
      }
    }
    
    return 'General'
  }

  const handleConfirmSaveIdea = async (
    editedIdea: {title: string, content: string, category: string}, 
    saveType: 'update' | 'new' | 'merge' = 'new',
    metadata?: any
  ) => {
    const processingStartTime = Date.now()
    setIsReviewModalOpen(false)
    setIsEnhancedModalOpen(false)
    setIsLoading(true)
    
    try {
      let savedIdea = null
      
      // Check if this is a branch
      const isBranch = (suggestedIdeaForReview as any)?.isBranch
      const parentIdeaId = (suggestedIdeaForReview as any)?.parentIdeaId
      const branchNote = (suggestedIdeaForReview as any)?.branchNote
      
      // Determine which idea ID to use for updates
      const targetIdeaId = currentIdeaContext?.id || continuationContext?.relatedIdeaId
      
      if (isBranch && parentIdeaId) {
        // Create a branched idea
        const response = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editedIdea.title,
            content: editedIdea.content,
            category: editedIdea.category,
            conversationId: currentConversationId,
            branchedFromId: parentIdeaId,
            branchNote: branchNote,
            isBranch: true
          })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to create branched idea: ${response.statusText}`)
        }
        
        const { idea } = await response.json()
        savedIdea = idea
        
      } else if (saveType === 'new' || !targetIdeaId) {
        // Create NEW idea - use the POST endpoint
        const response = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editedIdea.title,
            content: editedIdea.content,
            category: editedIdea.category,
            conversationId: currentConversationId,
            continuationContext: continuationContext || undefined,
            originalIdeaId: targetIdeaId || undefined
          })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to create idea: ${response.statusText}`)
        }
        
        const { idea } = await response.json()
        savedIdea = idea
        
      } else if ((saveType === 'update' || saveType === 'merge') && targetIdeaId) {
        // UPDATE existing idea - use the PATCH endpoint
        const response = await fetch(`/api/ideas/${targetIdeaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editedIdea.title,
            content: editedIdea.content,
            category: editedIdea.category,
            conversationId: currentConversationId,
            developmentType: saveType === 'merge' ? 'major_revision' : 'refinement',
            metadata: metadata
          })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to update idea: ${response.statusText}`)
        }
        
        const { idea } = await response.json()
        savedIdea = idea
      }

      // Track user action
      if (savedIdea && currentConversationId) {
        try {
          await supabase
            .from('user_actions')
            .insert({
              user_id: user.id,
              conversation_id: currentConversationId,
              idea_id: savedIdea.id,
              action_type: 'idea_saved',
              action_metadata: {
                idea_title: editedIdea.title,
                idea_category: editedIdea.category,
                content_length: editedIdea.content.length,
                save_type: saveType,
                ...(metadata || {})
              },
              success_indicators: {
                saved_successfully: true,
                processing_time: Date.now() - processingStartTime
              }
            })
        } catch (trackError) {
          console.error('Error tracking user action:', trackError)
        }
      }
      
      // Show success message based on action
      const actionMessage = saveType === 'new' 
        ? 'New idea created successfully!' 
        : `Idea updated successfully! (Version ${savedIdea.development_count || 1})`
      
      alert(actionMessage)
      
      // Clear continuation context after successful save
      setContinuationContext(null)
      setShowContinuationBanner(false)
      
      // If we updated an existing idea, refresh the context
      if (saveType !== 'new' && savedIdea) {
        setCurrentIdeaContext({
          id: savedIdea.id,
          title: savedIdea.title,
          content: savedIdea.content,
          category: savedIdea.category
        })
      }
      
    } catch (error) {
      console.error('Error saving idea:', error)
      alert(`Failed to save idea: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setSuggestedIdeaForReview(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Initializing Poppy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Poppy Idea Engine</h1>
              <p className="text-sm text-gray-600">Conversation Space</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleQuickSave()}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                hasValueableContent 
                  ? 'text-purple-600 hover:text-purple-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={messages.length <= 1}
              title={hasValueableContent ? 'Save valuable content' : 'Save conversation'}
            >
              <Save className="w-4 h-4" />
              Save Idea
              {hasValueableContent && (
                <span className="inline-flex items-center justify-center w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              )}
            </button>

            <Link 
              href="/ideas"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Layout className="w-4 h-4" /> 
              Idea Gallery
            </Link>

            {/* Admin link - only for authorized users */}
            {(user.email === 'christianbutler@hey.com' || user.email?.includes('@admin')) && (
              <Link 
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                title="Admin Dashboard"
              >
                <Settings className="w-4 h-4" /> 
                Admin
              </Link>
            )}

            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="View Profile"
              >
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-purple-600" />
                  </div>
                )}
                <span className="text-sm text-gray-600">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </Link>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Smart Detection Banner */}
      {showContinuationBanner && continuationContext && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                This conversation might be related to your idea: 
                <span className="font-medium"> "{continuationContext.relatedIdeaTitle}"</span>
                <span className="text-blue-600 ml-2">({Math.round(continuationContext.confidence * 100)}% match)</span>
              </p>
            </div>
            <button
              onClick={() => setShowContinuationBanner(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
        {/* Enhanced idea development mode indicator */}
        {currentIdeaContext && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    Developing: {currentIdeaContext.title}
                  </h3>
                  <p className="text-sm text-blue-700">
                    Version {currentIdeaContext.development_count || 1} • 
                    {currentIdeaContext.category} • 
                    All changes tracked in history
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchIdeaHistory(currentIdeaContext.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-300 font-medium"
                >
                  <History className="w-4 h-4" />
                  View Full History
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-full inline-block">
              💡 Tip: Your improvements will be saved as Version {(currentIdeaContext.development_count || 1) + 1}
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-black'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Add action buttons for welcome message */}
                {message.id === '1' && message.content.includes('🎯 **Quick Actions:**') && (window as any).__poppyWelcomeData && (
                  <div className="mt-6 space-y-3">
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {(window as any).__poppyWelcomeData.lastConversation && (
                        <button
                          onClick={async () => {
                            const data = (window as any).__poppyWelcomeData;
                            console.log('Continue button clicked, welcomeData:', data);
                            
                            // Check if last conversation had an idea
                            if (data.lastConversationIdeaId) {
                              // Navigate to chat with idea context - this will reload the page with the idea
                              console.log('Last conversation had idea:', data.lastConversationIdeaId);
                              window.location.href = `/chat?idea=${data.lastConversationIdeaId}`;
                            } else if (data.lastConversation?.id) {
                              // Show loading state
                              setIsLoading(true);
                              
                              try {
                                // Check if this conversation was about an idea
                                const { data: conversation } = await supabase
                                  .from('conversations')
                                  .select('idea_id')
                                  .eq('id', data.lastConversation.id)
                                  .single();
                                  
                                if (conversation?.idea_id) {
                                  // This conversation was about an idea - load the idea context
                                  console.log('Found idea in conversation:', conversation.idea_id);
                                  
                                  // Fetch the idea details
                                  const { data: ideaData } = await supabase
                                    .from('ideas')
                                    .select('*')
                                    .eq('id', conversation.idea_id)
                                    .single();
                                    
                                  if (ideaData) {
                                    // Set the idea context - THIS IS CRITICAL
                                    setCurrentIdeaContext({
                                      id: ideaData.id,
                                      title: ideaData.title,
                                      content: ideaData.content,
                                      category: ideaData.category
                                    });
                                    
                                    // Set conversation ID
                                    setCurrentConversationId(data.lastConversation.id);
                                    
                                    // Load conversation messages
                                    const { data: messages } = await supabase
                                      .from('conversation_messages')
                                      .select('*')
                                      .eq('conversation_id', data.lastConversation.id)
                                      .order('created_at', { ascending: true });
                                      
                                    if (messages && messages.length > 0) {
                                      // Convert to Message format
                                      const loadedMessages = messages.map(m => ({
                                        id: m.id,
                                        content: m.content,
                                        role: m.role as 'user' | 'assistant',
                                        timestamp: new Date(m.created_at)
                                      }));
                                      
                                      // Only add a continuation message if the last message wasn't from assistant
                                      // or if there are no messages
                                      const lastMessage = loadedMessages[loadedMessages.length - 1];
                                      const needsContinuationMessage = !lastMessage || lastMessage.role === 'user';
                                      
                                      if (needsContinuationMessage) {
                                        loadedMessages.push({
                                          id: `continue-${Date.now()}`,
                                          content: `🔄 **Continuing development of**: "${ideaData.title}"\n\n📝 **Current version**: "${ideaData.content}"\n\n🚀 **Development mode active**: All improvements will be tracked in this idea's history. Let's continue where we left off!\n\nWhat would you like to develop or refine further?`,
                                          role: 'assistant',
                                          timestamp: new Date()
                                        });
                                      }
                                      
                                      // Replace all messages (including welcome) with loaded conversation
                                      setMessages(loadedMessages);
                                    } else {
                                      // No previous messages, show idea context
                                      setMessages([{
                                        id: `continue-${Date.now()}`,
                                        content: `🔄 **Developing your idea**: "${ideaData.title}"\n\n📝 **Current version**: "${ideaData.content}"\n\n🚀 **Development mode**: All improvements will be tracked in this idea's history.\n\nWhat would you like to develop or refine?`,
                                        role: 'assistant',
                                        timestamp: new Date()
                                      }]);
                                    }
                                    
                                    // Mark that we've loaded an idea
                                    setHasLoadedIdea(true);
                                  } else {
                                    throw new Error('Could not load idea details');
                                  }
                                } else {
                                  // Just a regular conversation - load the conversation history
                                  console.log('No idea found, loading conversation history');
                                  
                                  // Set the conversation ID
                                  setCurrentConversationId(data.lastConversation.id);
                                  
                                  // Load conversation messages
                                  const { data: messages } = await supabase
                                    .from('conversation_messages')
                                    .select('*')
                                    .eq('conversation_id', data.lastConversation.id)
                                    .order('created_at', { ascending: true });
                                    
                                  if (messages && messages.length > 0) {
                                    // Convert to Message format and set
                                    const loadedMessages = messages.map(m => ({
                                      id: m.id,
                                      content: m.content,
                                      role: m.role as 'user' | 'assistant',
                                      timestamp: new Date(m.created_at)
                                    }));
                                    
                                    // Only add a continuation message if needed
                                    const lastMessage = loadedMessages[loadedMessages.length - 1];
                                    const needsContinuationMessage = !lastMessage || lastMessage.role === 'user';
                                    
                                    if (needsContinuationMessage) {
                                      loadedMessages.push({
                                        id: `continue-${Date.now()}`,
                                        content: "I've loaded our previous conversation. Let's continue where we left off! What would you like to explore further?",
                                        role: 'assistant',
                                        timestamp: new Date()
                                      });
                                    }
                                    
                                    // Replace all messages (including welcome) with loaded conversation
                                    setMessages(loadedMessages);
                                  } else {
                                    // No messages found, just set a continuation message
                                    // Replace the welcome message with continuation message
                                    setMessages([{
                                      id: `continue-${Date.now()}`,
                                      content: "Let's continue our conversation. What would you like to discuss?",
                                      role: 'assistant',
                                      timestamp: new Date()
                                    }]);
                                  }
                                }
                              } catch (error) {
                                console.error('Error loading conversation:', error);
                                alert('Failed to load conversation. Please try again.');
                              } finally {
                                setIsLoading(false);
                              }
                            }
                          }}
                          className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left group overflow-hidden"
                        >
                          <RefreshCw className="w-5 h-5 text-purple-600 group-hover:rotate-180 transition-transform flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-purple-900">Continue where you left off</div>
                            <div className="text-sm text-purple-700 line-clamp-2">
                              {(window as any).__poppyWelcomeData.lastConversation.preview}
                            </div>
                          </div>
                        </button>
                      )}
                      
                      {(window as any).__poppyWelcomeData.recentIdeas.length > 0 && (
                        <button
                          onClick={() => handleActionButton('develop-idea', { 
                            ideaId: (window as any).__poppyWelcomeData.recentIdeas[0].id 
                          })}
                          className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left group overflow-hidden relative"
                          title={(window as any).__poppyWelcomeData.recentIdeas[0].title}
                        >
                          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-blue-900">Develop recent idea</div>
                            <div className="text-sm text-blue-700 line-clamp-2">
                              {(window as any).__poppyWelcomeData.recentIdeas[0].title}
                            </div>
                            <div className="text-xs text-blue-600 mt-0.5">
                              {(window as any).__poppyWelcomeData.recentIdeas[0].category}
                            </div>
                          </div>
                        </button>
                      )}
                      
                      {(window as any).__poppyWelcomeData.suggestions.length > 0 && (
                        <button
                          onClick={() => handleActionButton('guided-exploration', { 
                            prompt: (window as any).__poppyWelcomeData.suggestions[0] 
                          })}
                          className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left group overflow-hidden"
                        >
                          <Target className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-green-900">Guided exploration</div>
                            <div className="text-sm text-green-700 line-clamp-2">
                              {(window as any).__poppyWelcomeData.suggestions[0]}
                            </div>
                          </div>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleActionButton('start-new')}
                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left group overflow-hidden"
                      >
                        <Sparkles className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">Start something new</div>
                          <div className="text-sm text-gray-600">Free exploration with Poppy</div>
                        </div>
                      </button>
                    </div>
                    
                    {(window as any).__poppyWelcomeData.stats.totalIdeas > 3 && (
                      <button
                        onClick={() => handleActionButton('browse-ideas')}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-300 hover:border-gray-400 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                      >
                        <Layout className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Browse all {(window as any).__poppyWelcomeData.stats.totalIdeas} ideas in your gallery
                        </span>
                      </button>
                    )}
                    
                    <div className="text-center text-sm text-gray-500 pt-2">
                      <MessageSquare className="w-4 h-4 inline-block mr-1" />
                      Or simply type your thoughts below
                    </div>
                  </div>
                )}
                
                {/* Add feedback component for assistant messages - only show if we have a real UUID */}
                {message.role === 'assistant' && message.id !== '1' && message.id.includes('-') && (
                  <>
                    <FeedbackComponent messageId={message.id} />
                    
                    {/* Enhanced save options for idea development */}
                    {detectValueableContent(message.content) && currentIdeaContext && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-gray-800 mb-3">
                          This builds on your "{currentIdeaContext.title}" idea!
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              setSelectedMessageForSave(message.id);
                              handleSaveIdea(message.id);
                            }}
                            className="flex flex-col items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:scale-105 group"
                          >
                            <div className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4" />
                              <span className="font-medium">Update & Version</span>
                            </div>
                            <span className="text-xs opacity-90">
                              Save as Version {(currentIdeaContext.development_count || 1) + 1}
                            </span>
                          </button>
                          <button
                            onClick={() => handleBranchIdea(message.id)}
                            className="flex flex-col items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all hover:scale-105 group"
                          >
                            <div className="flex items-center gap-2">
                              <GitBranch className="w-4 h-4" />
                              <span className="font-medium">Branch as New</span>
                            </div>
                            <span className="text-xs opacity-90">
                              Create separate idea
                            </span>
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-3 text-center">
                          💡 <strong>Update</strong> preserves full history • <strong>Branch</strong> creates a new related idea
                        </p>
                      </div>
                    )}
                    
                    {/* Simple save for non-development mode */}
                    {detectValueableContent(message.content) && !currentIdeaContext && !continuationContext && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleQuickSave(message.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Save as idea
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {showSavePrompt === message.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 mb-3">
                      Would you like me to prepare this idea for saving?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveIdea(message.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                        disabled={isLoading}
                      >
                        <Sparkles className="w-4 h-4" />
                        {isLoading && suggestedIdeaForReview?.originalMessageId === message.id ? 'Processing...' : 'Prepare to Save'}
                      </button>
                      <button
                        onClick={() => setShowSavePrompt(null)}
                        className="px-3 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && !isReviewModalOpen && !isEnhancedModalOpen && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="flex gap-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts, ideas, or questions..."
              className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              data-send-button
              className={`px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${
                showWelcomePulse && messages.length === 1 ? 'animate-pulse-purple' : ''
              }`}
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
      
      {/* Review Modal - for simple saves */}
      {suggestedIdeaForReview && !continuationContext && !currentIdeaContext && (
         <IdeaReviewModal
            isOpen={isReviewModalOpen}
            suggestedIdea={suggestedIdeaForReview}
            onClose={() => {
              setIsReviewModalOpen(false)
              setSuggestedIdeaForReview(null)
            }}
            onSave={(idea) => handleConfirmSaveIdea(idea, 'new')}
            categories={definedCategories}
        />
      )}
      
      {/* Enhanced Save Modal - for updates/merges */}
      {suggestedIdeaForReview && (continuationContext || currentIdeaContext) && (
        <EnhancedSaveModal
          isOpen={isEnhancedModalOpen}
          suggestedIdea={suggestedIdeaForReview}
          originalIdea={currentIdeaContext || (continuationContext ? {
            id: continuationContext.relatedIdeaId!,
            title: continuationContext.relatedIdeaTitle!,
            content: continuationContext.relatedIdeaContent!,
            category: continuationContext.relatedIdeaCategory!
          } : null)}
          continuationContext={continuationContext ? {
            relatedIdeaId: continuationContext.relatedIdeaId!,
            confidence: continuationContext.confidence,
            contextSummary: '',
            suggestedAction: continuationContext.suggestedAction!,
            detectionMethod: continuationContext.detectionMethod as any,
            timeSinceLastUpdate: continuationContext.timeSinceLastUpdate,
            previousDevelopments: continuationContext.previousDevelopments
          } : null}
          conversationHistory={messages.map(m => ({role: m.role, content: m.content}))}
          onClose={() => {
            setIsEnhancedModalOpen(false)
            setSuggestedIdeaForReview(null)
          }}
          onSave={handleConfirmSaveIdea}
          categories={definedCategories}
        />
      )}
      
      {/* Floating Save Button */}
      {showFloatingSave && hasValueableContent && (
        <div className="fixed bottom-24 right-4 z-40">
          <div className="relative">
            {/* Pulse indicator for new valuable content */}
            {messages[messages.length - 1]?.role === 'assistant' && 
             detectValueableContent(messages[messages.length - 1].content) && (
              <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-75"></div>
            )}
            
            <button
              onClick={() => handleQuickSave()}
              className="relative bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-110 group"
              title="Save conversation as idea"
            >
              <Save className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
                  Quick save this conversation
                  <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                </div>
              </div>
            </button>
            
            {/* Quick action menu */}
            <div className="absolute bottom-full right-0 mb-16 hidden group-hover:block">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 space-y-1">
                <button
                  onClick={() => handleQuickSave()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-md transition-colors text-left"
                >
                  <Plus className="w-4 h-4" />
                  Save as new idea
                </button>
                {currentIdeaContext && (
                  <button
                    onClick={() => {
                      const lastAssistant = messages.filter(m => m.role === 'assistant' && m.id !== '1').pop();
                      if (lastAssistant) handleSaveIdea(lastAssistant.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors text-left"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Update "{currentIdeaContext.title}"
                  </button>
                )}
                {continuationContext && (
                  <button
                    onClick={() => {
                      const lastAssistant = messages.filter(m => m.role === 'assistant' && m.id !== '1').pop();
                      if (lastAssistant) handleSaveIdea(lastAssistant.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors text-left"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Continue "{continuationContext.relatedIdeaTitle}"
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback Tooltip for new users */}
      <FeedbackTooltip />
    </div>
  )
}
