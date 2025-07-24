import React from 'react';
import Head from 'next/head';

const CSSTestPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>CSS Test - JobPilot</title>
        <meta name="description" content="Testing CSS functionality" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            CSS Test Page
          </h1>
          
          <div className="space-y-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-blue-800 font-medium">Blue background test</p>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-green-800 font-medium">Green background test</p>
            </div>
            
            <div className="bg-red-100 p-4 rounded-lg">
              <p className="text-red-800 font-medium">Red background test</p>
            </div>
            
            <div className="bg-yellow-100 p-4 rounded-lg">
              <p className="text-yellow-800 font-medium">Yellow background test</p>
            </div>
            
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Test Button
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              If you can see colored backgrounds and styled text, Tailwind CSS is working!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CSSTestPage; 