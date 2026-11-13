import React from 'react';
import { Download } from 'lucide-react';
import { useAuction } from '../../context/AuctionContext';
import { useToast } from '../../context/ToastContext';
import { openAuctionPdf } from '../../utils/auctionPdf';

export const DownloadAuctionPdfButton = ({ compact = false, className = '' }) => {
  const { activeTournament, teams, players, isLiveLoading } = useAuction();
  const { toast } = useToast();
  const disabled = !activeTournament?.id || isLiveLoading;

  const handleDownload = () => {
    if (!openAuctionPdf({ tournament: activeTournament, teams, players })) {
      toast.error('Allow pop-ups for this site to create the PDF report.');
      return;
    }
    toast.info('In the print window, choose “Save as PDF” to download the report.');
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      aria-label="Download selected tournament details as PDF"
      title="Download selected tournament details as PDF"
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface-accent px-2.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-surface-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Download className="h-4 w-4 text-brand-cyan" />
      <span className={compact ? 'hidden sm:inline' : ''}>{compact ? 'PDF' : 'Download PDF'}</span>
    </button>
  );
};
