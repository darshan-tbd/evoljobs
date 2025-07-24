import React from 'react';

const MinimalTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          CSS Test - Working!
        </h1>
        <div className="space-y-4">
          <div className="bg-green-500 text-white p-4 rounded">
            Green Box - If you see this with green background, CSS is working!
          </div>
          <div className="bg-red-500 text-white p-4 rounded">
            Red Box - If you see this with red background, CSS is working!
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimalTest; 