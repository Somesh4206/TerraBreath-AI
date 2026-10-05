import React, { useState } from 'react';
import { FileText, Download, Check, Loader2, Sparkles, Shield, Satellite } from 'lucide-react';
import { generateAoiReportPdf, ReportData } from '../services/pdfReportGenerator';

interface ExportPdfButtonProps {
  reportData: ReportData;
  variant?: 'primary' | 'secondary' | 'compact';
  className?: string;
}

export const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({
  reportData,
  variant = 'primary',
  className = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [justExported, setJustExported] = useState(false);

  const handleExport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Small artificial tick to allow browser UI thread to update loading state
      await new Promise((r) => setTimeout(r, 100));
      await generateAoiReportPdf(reportData);
      setJustExported(true);
      setTimeout(() => setJustExported(false), 3000);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleExport}
        disabled={isGenerating}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer border ${
          justExported
            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
            : isGenerating
            ? 'bg-slate-800 text-slate-400 border-slate-700'
            : 'bg-[#0f172a] hover:bg-[#1e293b] text-cyan-300 border-cyan-800/80 hover:border-cyan-500 shadow-sm'
        } ${className}`}
        title={`Export ${reportData.aoi.name} PDF Dossier`}
      >
        {isGenerating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        ) : justExported ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
        )}
        <span>{isGenerating ? 'Rendering PDF...' : justExported ? 'PDF Saved!' : 'Export PDF'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={isGenerating}
      className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer border shadow-md ${
        justExported
          ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500 shadow-emerald-950/40'
          : isGenerating
          ? 'bg-slate-800 text-slate-300 border-slate-700 cursor-not-allowed'
          : 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-sky-950/80 hover:from-cyan-900 hover:to-sky-900 text-cyan-200 border-cyan-700/80 hover:border-cyan-400 shadow-cyan-950/30'
      } ${className}`}
      title={`Export complete ${reportData.aoi.name} flood analysis, satellite snapshots, and risk report as formatted PDF`}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
      ) : justExported ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <FileText className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
      )}

      <div className="flex flex-col text-left leading-tight">
        <span>{isGenerating ? 'Synthesizing PDF...' : justExported ? 'PDF Downloaded!' : 'Export Risk PDF'}</span>
        <span className="text-[9px] text-cyan-400/80 font-normal">
          {isGenerating ? 'Embedding snapshots & telemetry' : '2-Page Verified Dossier'}
        </span>
      </div>

      <Download className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity ml-1" />
    </button>
  );
};
