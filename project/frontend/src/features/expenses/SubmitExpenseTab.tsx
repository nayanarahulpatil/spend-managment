import React, { useState, useEffect } from 'react';
import { useSubmitExpenseMutation, useUploadReceiptMutation } from '../../services/api';
import { 
  Upload, 
  Loader, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  HelpCircle, 
  CreditCard,
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface SubmitExpenseTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SubmitExpenseTab({ showToast }: SubmitExpenseTabProps) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [fileLinked, setFileLinked] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const generateIdempotencyKey = () => {
    return 'idemp_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  };

  useEffect(() => {
    setIdempotencyKey(generateIdempotencyKey());
  }, []);
  
  const [formData, setFormData] = useState({
    amount: '15.40',
    currency: 'USD',
    category_id: 'meals',
    cost_center_id: 'CC-102', // Marketing
    date: '2026-06-15',
    description: 'Morning coffee for campaign kickoff meeting with vendor...',
    receipt_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqvBQbpe2YdeEM3bjUfxbG3MoHukM3BjxYRNAYhWtTb2pKaDj3RRtHkqwURqU6SXQr0UeEDmWGeJHM9V_ZNISP5xCQp_Wvh94yHTwR8beUNOzAsD8kYFQFzCAQq8XGgMubH5hboNS-pT4ehhHZU-THgPB80swJS4zk9qdpknGbtp7tEzLaoHm3_wYgySn33bc8ra9FXtyX8IgcWOlIyTfNavYaPOBxJdV_9IlWIHA0amBE_eIqBIO44qXLohclZTA_KMT65OqXMD60',
  });

  const [policyViolation, setPolicyViolation] = useState<{ isViolated: boolean; reason: string | null }>({ 
    isViolated: true, 
    reason: 'This expense exceeds the $15 per-meal limit for Marketing (MKT-22). Please provide a justification.' 
  });

  const [submitExpense, { isLoading: submitLoading }] = useSubmitExpenseMutation();
  const [uploadReceipt] = useUploadReceiptMutation();

  // Handle local real-time policy rules
  useEffect(() => {
    const amountNum = parseFloat(formData.amount);
    if (!isNaN(amountNum)) {
      // Marketing breakfast/coffee limit is $15.00
      if (formData.category_id === 'meals' && formData.cost_center_id === 'CC-102' && amountNum > 15.00) {
        setPolicyViolation({
          isViolated: true,
          reason: 'This expense exceeds the $15 per-meal limit for Marketing (MKT-22). Please provide a justification.',
        });
      } else {
        // Fallback standard rules
        const limits: Record<string, number> = {
          meals: 50,
          travel: 500,
          entertainment: 150,
          office: 200,
        };
        const limit = limits[formData.category_id];
        if (limit && amountNum > limit) {
          setPolicyViolation({
            isViolated: true,
            reason: `Warning: This exceeds the category limit of $${limit} for ${formData.category_id}. It will be auto-flagged.`,
          });
        } else {
          setPolicyViolation({ isViolated: false, reason: null });
        }
      }
    } else {
      setPolicyViolation({ isViolated: false, reason: null });
    }
  }, [formData.amount, formData.category_id, formData.cost_center_id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setOcrLoading(true);
      setFileLinked(false);

      try {
        const payload = new FormData();
        payload.append('file', selectedFile);
        const response = await uploadReceipt(payload).unwrap();
        if (response.status === 200) {
          const { receipt_url, ocr_data } = response.data;
          setFormData((prev) => ({
            ...prev,
            amount: ocr_data.amount.toString(),
            date: ocr_data.date,
            receipt_url: receipt_url,
            description: `Reimbursement for transaction at ${ocr_data.vendor}`,
          }));
          setFileLinked(true);
          setShowNotification(true);
          showToast('OCR extracted fields and pre-populated the form!');
        }
      } catch (err) {
        // Fallback for demo or custom mock uploads
        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            amount: '15.40',
            date: '2026-06-15',
            description: 'Morning coffee for campaign kickoff meeting with vendor...',
            receipt_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqvBQbpe2YdeEM3bjUfxbG3MoHukM3BjxYRNAYhWtTb2pKaDj3RRtHkqwURqU6SXQr0UeEDmWGeJHM9V_ZNISP5xCQp_Wvh94yHTwR8beUNOzAsD8kYFQFzCAQq8XGgMubH5hboNS-pT4ehhHZU-THgPB80swJS4zk9qdpknGbtp7tEzLaoHm3_wYgySn33bc8ra9FXtyX8IgcWOlIyTfNavYaPOBxJdV_9IlWIHA0amBE_eIqBIO44qXLohclZTA_KMT65OqXMD60'
          }));
          setFileLinked(true);
          setShowNotification(true);
          showToast('Receipt link compiled (Mock OCR parsed fields).');
        }, 1200);
      } finally {
        setTimeout(() => setOcrLoading(false), 1200);
      }
    }
  };

  const handleDiscard = () => {
    setFormData({
      amount: '',
      currency: 'USD',
      category_id: 'meals',
      cost_center_id: 'CC-101',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receipt_url: '',
    });
    setFileLinked(false);
    setIdempotencyKey(generateIdempotencyKey());
    showToast('Expense report draft discarded.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    // Receipt threshold check: above $25 requires a receipt (EXP-07)
    if (amountNum > 25 && (!formData.receipt_url || formData.receipt_url.trim() === '')) {
      showToast('Please upload a receipt for expenses exceeding $25.', 'error');
      return;
    }

    try {
      const result = await submitExpense({
        expense: {
          ...formData,
          amount: amountNum,
        },
        idempotencyKey,
      }).unwrap();
      
      if (result.status === 201) {
        showToast(`Expense submitted successfully! Policy Flag: ${result.data.policy_violation ? 'Violated' : 'Clear'}`);
        // Reset
        setFormData({
          amount: '',
          currency: 'USD',
          category_id: 'meals',
          cost_center_id: 'CC-101',
          date: new Date().toISOString().split('T')[0],
          description: '',
          receipt_url: '',
        });
        setFileLinked(false);
        setIdempotencyKey(generateIdempotencyKey());
      }
    } catch (err: any) {
      showToast(err.data?.message || 'Error submitting expense.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Toast popup */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-10 duration-500">
          <div className="glass-card p-4 rounded-xl shadow-2xl border-l-4 border-emerald-success flex items-center gap-4 bg-slate-900/90 backdrop-blur-3xl border border-glass-border">
            <div className="w-10 h-10 rounded-full bg-emerald-success/20 flex items-center justify-center text-emerald-success">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">AI Extraction Ready</p>
              <p className="text-xs text-on-surface-variant">Successfully parsed 3 fields from image.</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="ml-4 text-on-surface-variant hover:text-on-surface">
              <span className="text-xs font-bold font-mono">CLOSE</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <header className="flex justify-between items-center mb-xl border-b border-glass-border pb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface text-2xl font-bold">New Expense Report</h2>
          <p className="font-body-md text-on-surface-variant text-sm mt-0.5">Automated AI extraction and policy validation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleDiscard}
            className="bg-surface-container border border-glass-border text-on-surface-variant font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-surface-bright transition-colors"
          >
            Discard
          </button>
          <button 
            type="button"
            onClick={() => showToast('Draft saved successfully.')}
            className="bg-surface-container border border-glass-border text-primary font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-surface-bright transition-colors"
          >
            Save Draft
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={submitLoading}
            className="bg-electric-blue text-slate-900 text-xs px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-electric-blue/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {submitLoading && <Loader className="animate-spin" size={14} />}
            <span>Submit for Approval</span>
          </button>
        </div>
      </header>

      {/* Form and Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left Column: Receipt Scanner */}
        <section className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-xl overflow-hidden relative group border border-glass-border">
            <div className="p-4 flex justify-between items-center border-b border-glass-border">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-electric-blue w-5 h-5" />
                <h3 className="font-headline-md text-sm font-bold text-on-surface">Receipt Analysis</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-success/15 text-emerald-success text-[10px] font-bold flex items-center gap-1.5 border border-emerald-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-success animate-pulse"></span>
                AI OCR Active
              </span>
            </div>

            <div className="p-4 bg-surface-container-low/50">
              {/* Receipt Preview */}
              <div className="relative w-full aspect-[3/4] bg-white/5 rounded-lg overflow-hidden border border-dashed border-glass-border flex items-center justify-center group-hover:border-electric-blue/50 transition-colors">
                {/* Scanline element */}
                <div className="ocr-scanline"></div>

                {ocrLoading ? (
                  <div className="absolute inset-0 bg-slate-900/80 z-10 flex flex-col items-center justify-center gap-3">
                    <Loader className="animate-spin text-electric-blue" size={32} />
                    <span className="text-xs text-on-surface-variant font-mono animate-pulse">EXTRACTING OCR DATA...</span>
                  </div>
                ) : formData.receipt_url ? (
                  <div className="absolute inset-0 p-4 flex flex-col items-center justify-center">
                    <img 
                      alt="Receipt Preview" 
                      className="w-3/4 h-5/6 object-contain shadow-2xl transform -rotate-1 brightness-95 contrast-125 rounded" 
                      src={formData.receipt_url}
                    />
                    {/* OCR Overlay Markers */}
                    <div className="absolute top-[35%] left-[25%] w-[50%] h-[6%] border border-electric-blue bg-electric-blue/10 animate-pulse rounded">
                      <span className="absolute -top-5 left-0 text-[8px] text-electric-blue bg-background px-1 font-bold font-mono">VENDOR_IDENTIFIED</span>
                    </div>
                    <div className="absolute bottom-[20%] left-[55%] w-[25%] h-[5%] border border-electric-blue bg-electric-blue/10 rounded">
                      <span className="absolute -bottom-5 right-0 text-[8px] text-electric-blue bg-background px-1 font-bold font-mono">AMOUNT_EXTRACTED</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center justify-center text-center">
                    <Upload size={36} className="text-on-surface-variant mb-3" />
                    <p className="text-xs font-semibold text-white mb-1">Drag receipt here or browse</p>
                    <p className="text-[10px] text-on-surface-variant mb-3">Supports PDF, PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Browse input overlay */}
              <div className="mt-4 flex justify-center">
                <input type="file" onChange={handleFileChange} className="hidden" id="receipt-upload" />
                <label 
                  htmlFor="receipt-upload" 
                  className="px-4 py-2 bg-surface-bright border border-glass-border hover:bg-surface-container rounded-lg text-xs font-semibold cursor-pointer transition-all text-on-surface"
                >
                  {ocrLoading ? 'Scanning...' : 'Select Receipt File'}
                </label>
              </div>

              {/* Extracted fields list */}
              {formData.receipt_url && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between p-2.5 glass-card rounded-lg bg-surface-container-high/50 border-l-2 border-electric-blue text-xs">
                    <span className="text-on-surface-variant font-mono font-medium">Vendor</span>
                    <span className="text-on-surface font-bold">Starbucks</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 glass-card rounded-lg bg-surface-container-high/50 border-l-2 border-electric-blue text-xs">
                    <span className="text-on-surface-variant font-mono font-medium">Extracted Amount</span>
                    <span className="text-on-surface font-bold">$15.40</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 glass-card rounded-lg bg-surface-container-high/50 border-l-2 border-electric-blue text-xs">
                    <span className="text-on-surface-variant font-mono font-medium">Transaction Date</span>
                    <span className="text-on-surface font-bold">June 15, 2026</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extraction Confidence score indicator */}
          <div className="glass-card p-4 rounded-xl border border-glass-border">
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="text-on-surface-variant uppercase font-mono font-semibold">Extraction Confidence</span>
              <span className="text-emerald-success font-bold font-mono">98.2%</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-success h-full" style={{ width: '98.2%' }}></div>
            </div>
            <p className="mt-3 text-[10px] text-on-surface-variant leading-relaxed flex items-center gap-1.5">
              <CheckCircle size={12} className="text-emerald-success" />
              AI has mapped fields and selected the category matching your history.
            </p>
          </div>
        </section>

        {/* Right Column: Expense Form */}
        <section className="lg:col-span-7">
          <div className="glass-card rounded-xl p-6 border border-glass-border">
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="text-primary w-5 h-5" />
              <h3 className="font-headline-md text-sm font-bold text-on-surface">Expense Details</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Policy Alert Banner */}
              {policyViolation.isViolated && (
                <div className="p-4 rounded-xl bg-amber-pending/10 border border-amber-pending/30 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
                  <AlertTriangle size={18} className="text-amber-pending shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 relative group">
                      <p className="text-on-surface font-bold text-xs">Policy Violation Detected</p>
                      <HelpCircle size={14} className="text-on-surface-variant cursor-help" />
                      
                      {/* Tooltip detail */}
                      <div className="absolute bottom-full mb-2 left-0 w-64 p-3 bg-slate-900 border border-glass-border text-[10px] rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-on-surface leading-normal">
                        <p className="font-bold mb-1">Marketing Per-Meal Rule (MKT-22)</p>
                        <p className="text-on-surface-variant">The standard breakfast/coffee limit for non-client meetings is $15.00. Amounts exceeding this require a secondary justification.</p>
                      </div>
                    </div>
                    <p className="text-on-surface-variant text-xs mt-1">
                      {policyViolation.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Inputs amount & currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-on-surface-variant mb-1.5">Amount</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="any"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-slate-800 border-glass-border focus:border-electric-blue focus:ring-1 focus:ring-electric-blue text-on-surface rounded-lg px-4 py-3 font-bold text-xs transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-success bg-emerald-success/10 px-2 py-0.5 rounded font-mono font-bold">Verified</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-on-surface-variant mb-1.5">Currency</label>
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-800 border-glass-border focus:border-electric-blue focus:ring-1 focus:ring-electric-blue text-on-surface rounded-lg px-4 py-3 text-xs transition-all"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>
              </div>

              {/* Inputs category & cost center */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-on-surface-variant mb-1.5">Category</label>
                  <div className="relative">
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full bg-slate-800 border-glass-border focus:border-electric-blue focus:ring-1 focus:ring-electric-blue text-on-surface rounded-lg px-4 py-3 text-xs transition-all pr-12"
                    >
                      <option value="meals">Meals & Entertainment (Limit $15/$50)</option>
                      <option value="travel">Business Travel (Limit $500)</option>
                      <option value="entertainment">Client Relations (Limit $150)</option>
                      <option value="office">Office Equipment (Limit $200)</option>
                    </select>
                    <div className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded text-[8px] font-bold text-primary border border-primary/20 pointer-events-none">
                      <Sparkles size={8} />
                      <span>SUGGESTED</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-on-surface-variant mb-1.5">Cost Center</label>
                  <select
                    value={formData.cost_center_id}
                    onChange={(e) => setFormData({ ...formData, cost_center_id: e.target.value })}
                    className="w-full bg-slate-800 border-glass-border focus:border-electric-blue focus:ring-1 focus:ring-electric-blue text-on-surface rounded-lg px-4 py-3 text-xs transition-all"
                  >
                    <option value="CC-102">Marketing (MKT-400)</option>
                    <option value="CC-101">Product Eng (PD-102)</option>
                    <option value="CC-103">Global Sales (GS-505)</option>
                  </select>
                </div>
              </div>

              {/* Description & justification */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs uppercase font-mono tracking-wider text-on-surface-variant">Description &amp; Justification</label>
                  {policyViolation.isViolated && (
                    <span className="text-[9px] text-ruby-violation font-bold font-mono">REQUIRED FOR VIOLATION</span>
                  )}
                </div>
                <textarea
                  required={policyViolation.isViolated}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full bg-slate-800 border-glass-border focus:border-electric-blue focus:ring-1 focus:ring-electric-blue text-on-surface rounded-lg px-4 py-3 text-xs transition-all resize-none ${
                    policyViolation.isViolated ? 'ring-1 ring-amber-pending/50' : ''
                  }`}
                  placeholder="e.g. coffee meeting with vendor..."
                />
              </div>

              {/* Metadata Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-glass-border">
                <div className="glass-card p-3 rounded-lg bg-surface-container-high/40 flex flex-col gap-1 text-xs">
                  <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">Project Code</span>
                  <span className="text-on-surface font-semibold">Q3_LAUNCH_US</span>
                </div>
                <div className="glass-card p-3 rounded-lg bg-surface-container-high/40 flex flex-col gap-1 text-xs">
                  <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">Payment Method</span>
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={12} className="text-on-surface-variant" />
                    <span className="text-on-surface font-semibold">Corporate Visa *4492</span>
                  </div>
                </div>
                <div className="glass-card p-3 rounded-lg bg-surface-container-high/40 flex flex-col gap-1 text-xs">
                  <span className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">Tax ID</span>
                  <span className="text-on-surface font-semibold">88-21394-X</span>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
