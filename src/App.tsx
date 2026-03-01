import React, { useState, useRef } from "react";
import { 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  Download,
  Copy,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { tailorCV, extractJD } from "./services/geminiService";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobText, setJobText] = useState("");
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [isFetchingJd, setIsFetchingJd] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvFile(file);
    setIsParsingCv(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-cv", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setCvText(data.text);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to parse CV");
    } finally {
      setIsParsingCv(false);
    }
  };

  const handleFetchJd = async () => {
    if (!jobUrl) return;
    setIsFetchingJd(true);
    setError(null);

    try {
      const response = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const extracted = await extractJD(data.text);
      setJobText(extracted || "");
    } catch (err: any) {
      setError(err.message || "Failed to fetch job description");
    } finally {
      setIsFetchingJd(false);
    }
  };

  const handleTailor = async () => {
    if (!cvText || !jobText) return;
    setIsTailoring(true);
    setError(null);

    try {
      const tailored = await tailorCV(cvText, jobText);
      setResult(tailored || "");
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to tailor CV");
    } finally {
      setIsTailoring(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <header className="max-w-3xl w-full text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl"
        >
          CV Tailor <span className="text-emerald-600">AI</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-lg text-zinc-600"
        >
          Optimize your CV for any job description in seconds. 
          Natural language, AI-resilient, and highly relevant.
        </motion.p>
      </header>

      <main className="max-w-4xl w-full space-y-8">
        {/* Progress Steps */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                step >= s ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-500"
              )}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "w-12 h-0.5 mx-2",
                  step > s ? "bg-emerald-600" : "bg-zinc-200"
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="text-emerald-600" />
                Step 1: Upload your current CV
              </h2>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                />
                {isParsingCv ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                    <p className="text-zinc-600 font-medium">Parsing your CV...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-lg font-medium text-zinc-900">
                      {cvFile ? cvFile.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-zinc-500 mt-2">
                      Supports PDF and Word documents
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <LinkIcon className="text-emerald-600" />
                Step 2: Job Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Job Posting URL
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="url"
                      placeholder="https://linkedin.com/jobs/..."
                      className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                    />
                    <button 
                      onClick={handleFetchJd}
                      disabled={!jobUrl || isFetchingJd}
                      className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isFetchingJd ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-zinc-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-sm text-zinc-500">OR</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Paste Job Description
                  </label>
                  <textarea 
                    rows={8}
                    placeholder="Paste the job requirements and description here..."
                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value)}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-2 text-zinc-600 font-medium hover:text-zinc-900"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleTailor}
                    disabled={!jobText || isTailoring}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Tailoring CV...
                      </>
                    ) : (
                      <>
                        Tailor My CV
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && result && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" />
                  Tailored CV Ready
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Print / Save as PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-zinc-50 p-8 rounded-xl border border-zinc-100 max-h-[600px] overflow-y-auto">
                <div className="markdown-body">
                  <Markdown>{result}</Markdown>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                    setJobUrl("");
                    setJobText("");
                  }}
                  className="px-6 py-2 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  Start Over
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </main>

      <footer className="mt-20 text-center text-zinc-400 text-sm">
        <p>© {new Date().getFullYear()} CV Tailor AI. Professional CV optimization.</p>
      </footer>
    </div>
  );
}
