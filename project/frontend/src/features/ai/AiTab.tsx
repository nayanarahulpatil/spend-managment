import React, { useState } from 'react';
import {
  useAiChatMutation,
  useGetAiAnomaliesQuery,
  useGetAiForecastQuery,
  useGetAiConfigQuery,
  useUpdateAiConfigMutation,
  useGetAiLogsQuery
} from '../../services/api';
import {
  Send,
  Download,
  RotateCw,
  Bot,
  Sparkles,
  TrendingUp,
  Sliders,
  Terminal,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Check,
  Zap,
  Info
} from 'lucide-react';

interface AiTabProps {
  role: string;
}

export default function AiTab({ role }: AiTabProps) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    sender: 'user' | 'bot';
    text: string;
    citation?: { text: string; reference: string } | null;
  }>>([
    {
      sender: 'bot',
      text: "Hello! I'm your Equinox Finance Assistant. You can ask me about travel reimbursement, meal limits, or any policy-related questions."
    }
  ]);
  const [sessionId] = useState(() => 'session-' + Math.random().toString(36).substr(2, 9));
  const [scanning, setScanning] = useState(false);
  const [rescanSuccess, setRescanSuccess] = useState(false);

  // RTK Queries & Mutations
  const { data: anomaliesData, refetch: refetchAnomalies } = useGetAiAnomaliesQuery({});
  const { data: forecastData } = useGetAiForecastQuery({});
  const { data: configData } = useGetAiConfigQuery({});
  const { data: logsData, refetch: refetchLogs } = useGetAiLogsQuery({});
  
  const [updateConfig] = useUpdateAiConfigMutation();
  const [aiChat, { isLoading: isChatLoading }] = useAiChatMutation();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isChatLoading) return;

    const userText = message;
    setMessage('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);

    try {
      const result = await aiChat({ message: userText, session_id: sessionId }).unwrap();
      if (result.status === 200) {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: result.data.reply,
            citation: result.data.citation
          }
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error: Could not retrieve response from AI assistant. Please try again later.' }
      ]);
    }
  };

  const handleRescanLedger = async () => {
    setScanning(true);
    setRescanSuccess(false);
    setTimeout(async () => {
      await refetchAnomalies();
      await refetchLogs();
      setScanning(false);
      setRescanSuccess(true);
      setTimeout(() => setRescanSuccess(false), 3000);
    }, 2000);
  };

  const handleToggleConfig = async (key: string, currentValue: boolean) => {
    if (!configData) return;
    const updated = {
      ...configData.data,
      [key]: !currentValue
    };
    try {
      await updateConfig(updated).unwrap();
    } catch (e) {
      console.error('Failed to save AI configuration settings:', e);
    }
  };

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!configData) return;
    const val = parseInt(e.target.value, 10);
    const updated = {
      ...configData.data,
      sensitivity: val
    };
    try {
      await updateConfig(updated).unwrap();
    } catch (err) {
      console.error('Failed to save AI configuration settings:', err);
    }
  };

  const getSensitivityLabel = (val: number) => {
    if (val < 35) return 'Lenient';
    if (val > 70) return 'Strict';
    return 'Balanced';
  };

  // Safe destructuring with fallbacks
  const anomaliesList = anomaliesData?.data?.anomalies || [];
  const forecast = forecastData?.data || { q4Spend: 2480000, potentialSavings: 1420000, chartData: [] };
  const config = configData?.data || { policyAssistant: true, smartOcr: true, realTimeAnomaly: false, sensitivity: 50 };
  const systemLogs = logsData?.data?.logs || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-glass-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
            AI Intelligence Hub
            <span className="bg-electric-blue/10 text-electric-blue text-[10px] px-2 py-0.5 rounded border border-electric-blue/20 uppercase font-mono tracking-wider">
              Powered by Equinox AI v4.2
            </span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Real-time anomaly detection, predictive forecasting, and policy assistance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-glass-border hover:bg-slate-700 rounded-lg text-xs font-semibold text-white transition-colors">
            <Download size={14} /> Export Report
          </button>
          <button
            onClick={handleRescanLedger}
            disabled={scanning}
            className={`flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container hover:brightness-105 active:scale-95 disabled:opacity-50 rounded-lg text-xs font-bold transition-all ${
              scanning ? 'animate-pulse' : ''
            }`}
          >
            {scanning ? (
              <>
                <RotateCw size={14} className="animate-spin" /> Scanning Ledger...
              </>
            ) : rescanSuccess ? (
              <>
                <Check size={14} /> Scan Completed!
              </>
            ) : (
              <>
                <RotateCw size={14} /> Re-scan Ledger
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: AI Policy Assistant (Chat Interface) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col glass-card rounded-xl overflow-hidden min-h-[600px] border border-glass-border">
          <div className="p-4 border-b border-glass-border flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-electric-blue" />
              <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">Policy AI Assistant</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-success font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-success animate-pulse" />
              Agent Online
            </span>
          </div>

          {/* Chat message display area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar">
            {chatHistory.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="flex items-start gap-2.5 max-w-[85%]">
                  {chat.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-electric-blue/20 flex-shrink-0 flex items-center justify-center border border-electric-blue/30 mt-0.5">
                      <Bot size={14} className="text-electric-blue" />
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl border leading-relaxed space-y-2 ${
                    chat.sender === 'user'
                      ? 'bg-electric-blue/10 border-electric-blue/20 text-on-surface rounded-tr-none'
                      : 'bg-surface-container-high border-glass-border text-on-surface rounded-tl-none shadow-md'
                  }`}>
                    <p>{chat.text}</p>
                    
                    {/* Render Citations if provided */}
                    {chat.citation && (
                      <div className="bg-slate-900/50 p-2.5 rounded border border-glass-border text-[10px] text-on-surface-variant italic mt-2">
                        "{chat.citation.text}"
                        <span className="block mt-1.5 text-electric-blue not-italic font-bold flex items-center gap-1">
                          <Info size={10} /> Ref: {chat.citation.reference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-electric-blue/20 flex-shrink-0 flex items-center justify-center border border-electric-blue/30 mt-0.5">
                    <Bot size={14} className="text-electric-blue animate-pulse" />
                  </div>
                  <div className="bg-surface-container-high/40 p-3 rounded-2xl rounded-tl-none w-14 h-8 flex items-center justify-center border border-glass-border/30">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce delay-150" />
                      <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat input panel */}
          <form onSubmit={handleSend} className="p-4 border-t border-glass-border bg-slate-900/40">
            <div className="relative">
              <input
                type="text"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isChatLoading}
                className="w-full bg-surface-container-lowest border border-glass-border rounded-xl pl-4 pr-12 py-3 text-xs text-white focus:ring-1 focus:ring-electric-blue focus:border-electric-blue outline-none placeholder-on-surface-variant/50"
                placeholder="Type your question..."
              />
              <button
                type="submit"
                disabled={isChatLoading || !message.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-electric-blue text-slate-900 rounded-lg hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Insights, Analytics, Configuration, Logs */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Row 1: Insights & Spend Forecast */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Anomaly Detection Overview Card */}
            <div className="col-span-12 xl:col-span-7 glass-card rounded-xl p-6 relative overflow-hidden border border-glass-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-ruby-violation" />
                    <h3 className="font-bold text-white text-sm">Anomaly Detection Overview</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider font-mono">
                    Last 30 Days
                  </span>
                </div>
                
                {/* List of active anomalies */}
                <div className="space-y-3.5">
                  {anomaliesList.map((anom: any) => {
                    const isHigh = anom.risk >= 80;
                    const isMedium = anom.risk >= 50 && anom.risk < 80;
                    return (
                      <div
                        key={anom.id}
                        className="flex items-center justify-between p-3 bg-surface-container-high hover:bg-surface-container-highest rounded-lg border border-glass-border hover:border-white/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isHigh
                              ? 'bg-ruby-violation/10 text-ruby-violation'
                              : isMedium
                              ? 'bg-amber-pending/10 text-amber-pending'
                              : 'bg-electric-blue/10 text-electric-blue'
                          }`}>
                            <AlertTriangle size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{anom.type}</p>
                            <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{anom.description}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`text-xs font-bold ${
                            isHigh
                              ? 'text-ruby-violation'
                              : isMedium
                              ? 'text-amber-pending'
                              : 'text-electric-blue'
                          }`}>
                            Risk: {anom.risk}/100
                          </p>
                          <p className="text-[8px] text-on-surface-variant uppercase font-bold tracking-widest mt-0.5">
                            {anom.statusLabel || (isHigh ? 'Immediate Action' : isMedium ? 'Moderate Alert' : 'Review Recommended')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-ruby-violation/5 blur-[80px] rounded-full pointer-events-none" />
            </div>

            {/* Spend Forecast Card */}
            <div className="col-span-12 xl:col-span-5 glass-card rounded-xl p-6 border border-glass-border flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-secondary" />
                  <h3 className="font-bold text-white text-sm">Spend Forecast</h3>
                </div>

                <div className="text-center space-y-1 mb-5">
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-mono">Projected Q4 Spend</p>
                  <p className="text-3xl font-black text-white">${(forecast.q4Spend / 1000000).toFixed(2)}M</p>
                  <p className="text-[10px] text-emerald-success font-bold flex items-center justify-center gap-1">
                    <Sparkles size={10} className="animate-pulse" />
                    Potential Savings: ${(forecast.potentialSavings / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>

              {/* Dynamic SVG / Chart columns */}
              <div className="space-y-4">
                <div className="w-full h-24 flex items-end gap-2.5 px-1 relative">
                  {/* Highlighted "Now" Line */}
                  <div className="absolute top-0 bottom-0 left-[66%] w-0.5 bg-electric-blue/40 border-l border-dashed border-electric-blue/70 z-10">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-extrabold text-electric-blue uppercase tracking-wider font-mono">
                      Now
                    </span>
                  </div>

                  {/* Columns rendering */}
                  {forecast.chartData?.map((item: any) => {
                    const isForecast = item.type === 'forecast';
                    // Scale height relative to max amount ($300k limit)
                    const heightPercent = Math.min(100, Math.round((item.amount / 300000) * 100));
                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group cursor-help relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 bg-slate-900/90 text-white border border-glass-border px-1.5 py-0.5 rounded text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                          ${(item.amount / 1000).toFixed(0)}K
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all duration-500 ${
                            isForecast
                              ? 'bg-electric-blue/20 border-t-2 border-dashed border-electric-blue/45'
                              : item.month === 'Oct'
                              ? 'bg-electric-blue/40 border-t-2 border-electric-blue shadow-lg shadow-electric-blue/10'
                              : 'bg-slate-700 hover:bg-slate-650'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* Months labels */}
                <div className="w-full flex justify-between px-1 text-[8px] text-on-surface-variant font-black uppercase tracking-wider font-mono">
                  {forecast.chartData?.map((item: any) => (
                    <span key={item.month}>{item.month}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Config & System Logs */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* AI Config Panel Card */}
            <div className="col-span-12 xl:col-span-4 glass-card rounded-xl p-6 border border-glass-border">
              <h3 className="font-bold text-white text-sm mb-5 flex items-center gap-2">
                <Sliders size={16} className="text-on-surface-variant" />
                AI Engine Config
              </h3>

              <div className="space-y-4 text-xs">
                {/* Policy Assistant Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Policy Assistant</p>
                    <p className="text-[10px] text-on-surface-variant">Internal Q&A Bot</p>
                  </div>
                  <button
                    onClick={() => handleToggleConfig('policyAssistant', config.policyAssistant)}
                    className={`w-9 h-5 rounded-full relative transition-all duration-200 border border-white/5 ${
                      config.policyAssistant ? 'bg-electric-blue shadow-sm shadow-electric-blue/20' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all duration-200 ${
                      config.policyAssistant ? 'right-[2px]' : 'left-[2px]'
                    }`} />
                  </button>
                </div>

                {/* Smart OCR Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Smart OCR</p>
                    <p className="text-[10px] text-on-surface-variant">Receipt Auto-extraction</p>
                  </div>
                  <button
                    onClick={() => handleToggleConfig('smartOcr', config.smartOcr)}
                    className={`w-9 h-5 rounded-full relative transition-all duration-200 border border-white/5 ${
                      config.smartOcr ? 'bg-electric-blue shadow-sm shadow-electric-blue/20' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all duration-200 ${
                      config.smartOcr ? 'right-[2px]' : 'left-[2px]'
                    }`} />
                  </button>
                </div>

                {/* Real-time Anomaly Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Real-time Anomaly</p>
                    <p className="text-[10px] text-on-surface-variant">Flagging on submission</p>
                  </div>
                  <button
                    onClick={() => handleToggleConfig('realTimeAnomaly', config.realTimeAnomaly)}
                    className={`w-9 h-5 rounded-full relative transition-all duration-200 border border-white/5 ${
                      config.realTimeAnomaly ? 'bg-electric-blue shadow-sm shadow-electric-blue/20' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all duration-200 ${
                      config.realTimeAnomaly ? 'right-[2px]' : 'left-[2px]'
                    }`} />
                  </button>
                </div>

                {/* Sensitivity Slider */}
                <div className="pt-4 border-t border-glass-border">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider font-mono">
                      Detection Sensitivity
                    </p>
                    <span className="text-[10px] bg-electric-blue/15 text-electric-blue px-2 py-0.5 rounded border border-electric-blue/25 font-bold font-mono">
                      {getSensitivityLabel(config.sensitivity)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={config.sensitivity}
                    onChange={handleSliderChange}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-electric-blue"
                  />
                  <div className="flex justify-between mt-1.5 text-[8px] text-on-surface-variant font-bold font-mono">
                    <span>Lenient</span>
                    <span>Balanced</span>
                    <span>Strict</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Intelligence Log Card */}
            <div className="col-span-12 xl:col-span-8 glass-card rounded-xl p-6 border border-glass-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Terminal size={16} className="text-secondary" />
                  System Intelligence Log
                </h3>
                <span className="text-[9px] text-on-surface-variant hover:underline cursor-pointer font-bold">
                  View All Logs
                </span>
              </div>
              
              <div className="overflow-x-auto text-xs font-sans">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-widest text-on-surface-variant border-b border-glass-border">
                      <th className="pb-3 font-bold font-mono">Action Taken</th>
                      <th className="pb-3 font-bold font-mono">Confidence</th>
                      <th className="pb-3 font-bold font-mono">Timestamp</th>
                      <th className="pb-3 font-bold font-mono text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/5">
                    {systemLogs.map((log: any) => {
                      const isFlagged = log.status === 'FLAGGED';
                      const isAuto = log.status === 'AUTO';
                      const isTask = log.status === 'TASK';
                      return (
                        <tr key={log.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-2.5 max-w-[240px] truncate text-white">
                            <span className="inline-block mr-2 text-[10px] text-on-surface-variant/80 font-mono">
                              ▶
                            </span>
                            {log.action}
                          </td>
                          <td className={`py-2.5 font-semibold font-mono ${
                            isFlagged
                              ? 'text-ruby-violation'
                              : isAuto
                              ? 'text-emerald-success'
                              : 'text-primary'
                          }`}>
                            {log.confidence}
                          </td>
                          <td className="py-2.5 text-on-surface-variant font-mono text-[10px]">
                            {log.timestamp}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider ${
                              isFlagged
                                ? 'bg-ruby-violation/20 text-ruby-violation border border-ruby-violation/30'
                                : isAuto
                                ? 'bg-emerald-success/15 text-emerald-success border border-emerald-success/20'
                                : isTask
                                ? 'bg-slate-700/80 text-on-surface-variant border border-glass-border'
                                : 'bg-primary/10 text-primary border border-primary/25'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background radial highlights */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[50%] bg-electric-blue/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[10%] w-[30%] h-[40%] bg-secondary/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
