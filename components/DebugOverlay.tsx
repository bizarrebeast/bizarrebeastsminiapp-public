import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Bug } from 'lucide-react';

interface DebugData {
  wallet: string | null;
  contestId: string;
  userSubmissions: any[];
  allSubmissionsCount: number;
  renderTime: string;
  dataSource: string;
  cacheStatus: string;
  errorState?: string;
}

interface DebugOverlayProps {
  data: DebugData;
  isVisible: boolean;
  onClose: () => void;
}

export default function DebugOverlay({ data, isVisible, onClose }: DebugOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Store debug state in session storage
    if (isVisible) {
      sessionStorage.setItem('debug_overlay_active', 'true');
      sessionStorage.setItem('debug_data', JSON.stringify(data));
    } else {
      sessionStorage.removeItem('debug_overlay_active');
      sessionStorage.removeItem('debug_data');
    }
  }, [isVisible, data]);

  if (!isVisible) return null;

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'top-4 right-4'} z-50 transition-all duration-300`}>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Bug className="w-5 h-5" />
          <span className="text-sm font-mono">Debug Mode</span>
        </button>
      ) : (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-2xl max-w-md w-96 border border-purple-500">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Debug: Submission Tracker
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="bg-gray-800 p-2 rounded">
              <div className="text-purple-300 mb-1">Wallet:</div>
              <div className="text-gray-300 break-all">
                {data.wallet || 'Not connected'}
              </div>
            </div>

            <div className="bg-gray-800 p-2 rounded">
              <div className="text-purple-300 mb-1">Contest ID:</div>
              <div className="text-gray-300 break-all text-xs">
                {data.contestId}
              </div>
            </div>

            <div className="bg-gray-800 p-2 rounded">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center w-full text-left"
              >
                <div className="text-purple-300">Submissions ({data.userSubmissions.length})</div>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {isExpanded && (
                <div className="mt-2 space-y-1">
                  {data.userSubmissions.length === 0 ? (
                    <div className="text-gray-500">No submissions</div>
                  ) : (
                    data.userSubmissions.map((sub, idx) => (
                      <div key={sub.id} className="text-gray-300 pl-2 border-l border-gray-700">
                        <div className="text-green-400">Entry #{idx + 1}</div>
                        <div className="text-xs text-gray-400">ID: {sub.id.slice(0, 8)}...</div>
                        <div className="text-xs text-gray-400">Contest: {sub.contest_id === data.contestId ? '✓ This' : 'Other'}</div>
                        <div className="text-xs text-gray-400">Time: {new Date(sub.submitted_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 p-2 rounded">
                <div className="text-purple-300 text-xs">All Submissions</div>
                <div className="text-white font-bold">{data.allSubmissionsCount}</div>
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <div className="text-purple-300 text-xs">This Contest</div>
                <div className="text-white font-bold">
                  {data.userSubmissions.filter(s => s.contest_id === data.contestId).length}
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-2 rounded">
              <div className="text-purple-300 mb-1">Data Source:</div>
              <div className="text-gray-300">{data.dataSource}</div>
            </div>

            <div className="bg-gray-800 p-2 rounded">
              <div className="text-purple-300 mb-1">Cache Status:</div>
              <div className="text-gray-300">{data.cacheStatus}</div>
            </div>

            <div className="bg-gray-800 p-2 rounded">
              <div className="text-purple-300 mb-1">Render Time:</div>
              <div className="text-gray-300">{data.renderTime}</div>
            </div>

            {data.errorState && (
              <div className="bg-red-900/50 p-2 rounded border border-red-500">
                <div className="text-red-300 mb-1">Error:</div>
                <div className="text-red-200 text-xs">{data.errorState}</div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
              <div className="text-xs text-gray-500">
                Press Shift+D to toggle debug mode
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}