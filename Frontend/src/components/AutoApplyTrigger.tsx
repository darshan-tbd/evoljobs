import React, { useState, useEffect } from 'react';
import { 
  googleIntegrationAPI, 
  debugGoogleAPIUrls,
  AutoApplyTriggerRequest,
  AutoApplyResponse,
  GoogleIntegrationStatus 
} from '../services/googleIntegrationAPI';

interface AutoApplyTriggerProps {
  className?: string;
}

const AutoApplyTrigger: React.FC<AutoApplyTriggerProps> = ({ className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [result, setResult] = useState<AutoApplyResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [maxApplications, setMaxApplications] = useState(5);

  // Debug URLs on component mount
  useEffect(() => {
    debugGoogleAPIUrls();
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const statusData = await googleIntegrationAPI.getStatus();
      setStatus(statusData);
      console.log('✅ Google Integration Status:', statusData);
    } catch (error: any) {
      console.error('❌ Error fetching status:', error);
      setError(`Status error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleTriggerAutoApply = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🚀 Triggering auto-apply...');
      
      const request: AutoApplyTriggerRequest = {
        max_applications: maxApplications,
        filters: {
          // These filters can be customized based on user preferences
          experience_level: ['entry', 'mid'],
          employment_type: ['full_time']
        }
      };

      console.log('📤 Request data:', request);
      
      const response = await googleIntegrationAPI.triggerAutoApply(request);
      
      console.log('✅ Auto-apply triggered successfully:', response);
      setResult(response);
      
      // Optionally refresh status
      await fetchStatus();
      
    } catch (error: any) {
      console.error('❌ Auto-apply error:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        setError(`Error ${error.response.status}: ${error.response.data?.error || error.response.data?.detail || 'Unknown error'}`);
      } else {
        setError(`Network error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'expired': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Auto-Apply System</h2>
      
      {/* Status Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Google Integration Status</h3>
        {status ? (
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium">Status:</span>
              <span className={`ml-2 ${getStatusColor(status.status)}`}>
                {status.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Auto-Apply:</span>
              <span className={`ml-2 ${status.auto_apply_enabled ? 'text-green-600' : 'text-red-600'}`}>
                {status.auto_apply_enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Gmail:</span>
              <span className="ml-2 text-gray-700">{status.google_email}</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading status...</div>
        )}
      </div>

      {/* Auto-Apply Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Auto-Apply Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Applications
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxApplications}
              onChange={(e) => setMaxApplications(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 w-24"
            />
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <div className="mb-6">
        <button
          onClick={handleTriggerAutoApply}
          disabled={loading || !status?.auto_apply_enabled || status?.status !== 'connected'}
          className={`
            px-6 py-3 rounded-md font-medium text-white
            ${loading || !status?.auto_apply_enabled || status?.status !== 'connected'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {loading ? 'Triggering...' : 'Trigger Auto-Apply'}
        </button>
        
        {!status?.auto_apply_enabled && (
          <p className="text-red-600 text-sm mt-2">
            Auto-apply is disabled. Enable it in settings first.
          </p>
        )}
        
        {status?.status !== 'connected' && (
          <p className="text-red-600 text-sm mt-2">
            Google integration is not connected. Please connect your Google account first.
          </p>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800 mb-2">✅ Success!</h3>
          <div className="space-y-1 text-sm">
            <div><strong>Task ID:</strong> {result.task_id}</div>
            <div><strong>Message:</strong> {result.message}</div>
            <div className="text-green-700 mt-2">
              Auto-apply process has been started. Emails will be sent from {status?.google_email} to company emails.
            </div>
          </div>
        </div>
      )}

      {/* Error Section */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">❌ Error</h3>
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-2">🔧 Debug Info</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Correct URL:</strong> http://127.0.0.1:8000/api/v1/google/integration/trigger_auto_apply/</div>
          <div><strong>Your Previous URL:</strong> http://localhost:3000/api/v1/google/integration/trigger_auto_apply</div>
          <div className="text-red-600"><strong>Issues:</strong> Wrong port (3000 vs 8000), wrong host (localhost vs 127.0.0.1)</div>
        </div>
      </div>

      {/* How it Works */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">📧 How Auto-Apply Works</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <div>1. System finds jobs matching your preferences</div>
          <div>2. For each job at companies with email addresses:</div>
          <div>3. - Generates professional application email</div>
          <div>4. - Sends from your Gmail ({status?.google_email}) to company email</div>
          <div>5. - Tracks application in database</div>
          <div>6. - Updates your subscription usage</div>
        </div>
      </div>
    </div>
  );
};

export default AutoApplyTrigger; 