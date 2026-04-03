import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Bot, User, Sparkles, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { useFirebase } from '../lib/FirebaseContext';
import { db, collection, getDocs, query, orderBy, OperationType, handleFirestoreError } from '../firebase';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, userProfile } = useFirebase();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        if (response.ok) {
          const jobs = await response.json();
          // Filter sensitive data if user is not recruiter/admin/partner
          const isInternal = ['recruiter', 'admin', 'partner'].includes(userProfile?.role);
          return jobs.map((job: any) => ({
            title: job.title,
            company: isInternal ? job.company : 'Confidential Client',
            location: job.location,
            type: job.type,
            salary: job.salary,
            description: job.description,
            partnerInCharge: isInternal ? job.partnerInCharge : undefined,
            commissionRange: isInternal ? job.commissionRange : undefined,
            clientRequirements: isInternal ? job.clientRequirements : undefined,
            contactDetails: isInternal ? job.contactDetails : undefined,
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('ChatBot fetchJobs error:', error);
      return [];
    }
  };

  const fetchApplications = async () => {
    if (!['recruiter', 'admin', 'partner'].includes(userProfile?.role)) return "Unauthorized";
    try {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'applications');
      return [];
    }
  };

  const fetchCandidateSubmissions = async () => {
    if (!['recruiter', 'admin', 'partner'].includes(userProfile?.role)) return "Unauthorized";
    try {
      const q = query(collection(db, 'candidate-submissions'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'candidate-submissions');
      return [];
    }
  };

  const fetchUserProfiles = async () => {
    if (userProfile?.role !== 'admin') return "Unauthorized";
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const tools = [
        {
          functionDeclarations: [
            {
              name: "fetchJobs",
              description: "Fetch current job listings from the database.",
              parameters: { type: Type.OBJECT, properties: {} },
            },
            {
              name: "fetchApplications",
              description: "Fetch job applications submitted by candidates.",
              parameters: { type: Type.OBJECT, properties: {} },
            },
            {
              name: "fetchCandidateSubmissions",
              description: "Fetch candidate submissions provided by recruiters.",
              parameters: { type: Type.OBJECT, properties: {} },
            },
            {
              name: "fetchUserProfiles",
              description: "Fetch user profiles (Admin only).",
              parameters: { type: Type.OBJECT, properties: {} },
            }
          ]
        }
      ];

      const systemInstruction = `You are the Sunrise Recruit Assistant. You help different users based on their roles:
- **Job Seekers**: Help them find jobs, explain job details, and guide them on how to apply. Use only public job information.
- **Recruiters**: Help them check job statuses (open, pending, interviewing) and manage their candidate submissions.
- **Employers**: Provide information about Sunrise Recruit's recruitment services (e.g., executive search, talent mapping, payroll services, and specialized recruitment in tech, finance, and healthcare). Explain that we offer tailored solutions for both permanent and contract staffing.
- **Admins**: Provide system-wide overviews, including job ownership by partners and recruiter performance.
- **Partners**: Help them track submissions for the jobs they own.

Current User Info:
Name: ${userProfile?.displayName || 'Guest'}
Role: ${userProfile?.role || 'guest'}
Email: ${userProfile?.email || 'N/A'}

Always be professional, helpful, and concise. If a user asks for information they don't have permission for, politely decline.
When using tool data, summarize it effectively for the user.`;

      let response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          tools,
        }
      });

      // Handle function calls
      let functionCalls = response.functionCalls;
      if (functionCalls) {
        const toolResults = [];
        for (const call of functionCalls) {
          let result;
          if (call.name === 'fetchJobs') result = await fetchJobs();
          else if (call.name === 'fetchApplications') result = await fetchApplications();
          else if (call.name === 'fetchCandidateSubmissions') result = await fetchCandidateSubmissions();
          else if (call.name === 'fetchUserProfiles') result = await fetchUserProfiles();
          
          toolResults.push({
            functionResponse: {
              name: call.name,
              response: { result },
              id: call.id
            }
          });
        }

        // Send tool results back to model
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
            { role: 'user', parts: [{ text: userMessage }] },
            response.candidates?.[0]?.content,
            { role: 'user', parts: toolResults }
          ],
          config: {
            systemInstruction,
            tools,
          }
        });
      }

      const aiText = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'model', content: aiText }]);
    } catch (error) {
      console.error('ChatBot error:', error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-orange-600 transition-all active:scale-90 z-[9999] group"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute right-full mr-4 px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chat with Sunrise Assistant
          </span>
        )}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isExpanded ? '600px' : '400px',
              height: isExpanded ? '80vh' : '600px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-24 right-6 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-[9998] transition-all duration-300",
              isExpanded ? "max-w-[90vw]" : "max-w-[calc(100vw-48px)]"
            )}
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Sunrise Assistant</h3>
                  <div className="flex items-center text-[10px] text-orange-400 font-bold uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Powered by Gemini
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50"
            >
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">How can I help you today?</h4>
                    <p className="text-sm text-slate-500 mt-1 px-6">
                      I can help you find jobs, check application statuses, or provide recruitment insights.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 px-4">
                    {[
                      "What jobs are available?",
                      "How do I apply for a role?",
                      "Tell me about recruitment services",
                      ...(userProfile?.role === 'admin' ? ["Show me recruiter performance"] : []),
                      ...(userProfile?.role === 'recruiter' ? ["Check my submission status"] : [])
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(suggestion);
                          // We can't call handleSendMessage directly here because input hasn't updated yet in state
                          // but we can pass it as a param if we refactor handleSendMessage
                        }}
                        className="text-xs font-medium text-slate-600 bg-white border border-slate-200 p-3 rounded-xl hover:border-orange-500 hover:text-orange-600 transition-all text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex items-start space-x-3",
                    msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    msg.role === 'user' ? "bg-slate-900 text-white" : "bg-orange-500 text-white"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-slate-900 text-white rounded-tr-none" 
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-slate-100 flex items-center space-x-3"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow bg-slate-100 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 transition-all active:scale-90 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
