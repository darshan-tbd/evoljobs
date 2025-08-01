import React from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import AutoApplyTrigger from '../components/AutoApplyTrigger';
import ProtectedRoute from '../components/ProtectedRoute';

const AutoApplyTestPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Head>
        <title>Auto-Apply Test - EvolJobs</title>
        <meta name="description" content="Test the auto-apply functionality" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Auto-Apply System Test</h1>
              <p className="mt-2 text-gray-600">
                Test the auto-apply functionality for Darshan Patel → Technobits Digital
              </p>
            </div>

            {/* Prerequisites Check */}
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-4">📋 Prerequisites</h2>
              <div className="space-y-2 text-sm text-yellow-700">
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">🔴</span>
                  <span>Redis server running: <code>redis-server</code></span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">🔴</span>
                  <span>Django backend running: <code>python manage.py runserver</code></span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">🔴</span>
                  <span>Celery worker running: <code>celery -A Backend worker --loglevel=info</code></span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2">🟡</span>
                  <span>Google OAuth configured (for actual email sending)</span>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-4">🔧 System Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-blue-700 mb-2">Backend Configuration</h3>
                  <div className="space-y-1 text-blue-600">
                    <div>URL: http://127.0.0.1:8000</div>
                    <div>API: /api/v1/google/integration/</div>
                    <div>Celery: Redis broker</div>
                    <div>Database: PostgreSQL</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-blue-700 mb-2">Test Scenario</h3>
                  <div className="space-y-1 text-blue-600">
                    <div>User: darshanp.technobits@gmail.com</div>
                    <div>Company: Technobits Digital</div>
                    <div>Email: technobits@gmail.com</div>
                    <div>Method: Gmail API</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Apply Component */}
            <AutoApplyTrigger className="mb-8" />

            {/* Expected Results */}
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-4">✅ Expected Results</h2>
              <div className="space-y-3 text-sm text-green-700">
                <div>
                  <strong>1. Task Triggered:</strong> You should get a task ID confirming the auto-apply was triggered
                </div>
                <div>
                  <strong>2. Celery Processing:</strong> Check Celery worker logs to see the task being processed
                </div>
                <div>
                  <strong>3. Email Sending:</strong> Emails will be sent from darshanp.technobits@gmail.com to technobits@gmail.com
                </div>
                <div>
                  <strong>4. Database Tracking:</strong> Check admin panel for AutoAppliedJob records
                </div>
                <div>
                  <strong>5. Session Tracking:</strong> AutoApplySession records will show the results
                </div>
              </div>
            </div>

            {/* API Debugging */}
            <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 API Debugging</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-gray-700">Correct URL Structure:</strong>
                  <code className="block bg-gray-100 p-2 mt-1 rounded text-xs">
                    http://127.0.0.1:8000/api/v1/google/integration/trigger_auto_apply/
                  </code>
                </div>
                <div>
                  <strong className="text-red-600">Your Previous Error:</strong>
                  <code className="block bg-red-100 p-2 mt-1 rounded text-xs text-red-700">
                    http://localhost:3000/api/v1/google/integration/trigger_auto_apply
                  </code>
                </div>
                <div className="text-red-600 text-xs">
                  Issues: Wrong port (3000 → 8000), wrong host (localhost → 127.0.0.1), missing trailing slash
                </div>
              </div>
            </div>

            {/* Manual Testing */}
            <div className="mb-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-purple-800 mb-4">🧪 Manual Testing</h2>
              <div className="space-y-3 text-sm text-purple-700">
                <div>
                  <strong>Using cURL:</strong>
                  <pre className="bg-purple-100 p-3 mt-2 rounded text-xs overflow-x-auto">
{`curl -X POST http://127.0.0.1:8000/api/v1/google/integration/trigger_auto_apply/ \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"max_applications": 5}'`}
                  </pre>
                </div>
                <div>
                  <strong>Using Browser DevTools:</strong>
                  <div className="mt-1">Open DevTools → Network tab → Click "Trigger Auto-Apply" to see the actual request</div>
                </div>
              </div>
            </div>

            {/* Success Indicators */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-indigo-800 mb-4">🎯 Success Indicators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-700">
                <div>
                  <h3 className="font-medium mb-2">Frontend</h3>
                  <div className="space-y-1">
                    <div>✅ No 500 errors</div>
                    <div>✅ Task ID returned</div>
                    <div>✅ Success message shown</div>
                    <div>✅ Status updates correctly</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Backend</h3>
                  <div className="space-y-1">
                    <div>✅ Celery task processes</div>
                    <div>✅ Jobs found and filtered</div>
                    <div>✅ Emails sent (if OAuth setup)</div>
                    <div>✅ Database records created</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AutoApplyTestPage; 