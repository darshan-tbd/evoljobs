import React from 'react';
import '../styles/globals.css';

const CSSImportTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">CSS Import Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tailwind Test</h2>
          <div className="space-y-4">
            <div className="bg-blue-500 text-white p-4 rounded">Blue Box</div>
            <div className="bg-green-500 text-white p-4 rounded">Green Box</div>
            <div className="bg-red-500 text-white p-4 rounded">Red Box</div>
            <div className="bg-yellow-500 text-white p-4 rounded">Yellow Box</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Button Test</h2>
          <div className="space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Blue Button
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Green Button
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              Red Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSSImportTest; 