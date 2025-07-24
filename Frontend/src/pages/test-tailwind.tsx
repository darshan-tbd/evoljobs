import React from 'react';
import Head from 'next/head';

const TailwindTestPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Tailwind CSS Test</title>
      </Head>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-blue-600 mb-8 text-center">
            Tailwind CSS Test Page
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Test Card 1 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Card 1</h2>
              <p className="text-gray-600 mb-4">
                This card should have a white background, rounded corners, and a shadow.
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Blue Button
              </button>
            </div>

            {/* Test Card 2 */}
            <div className="bg-green-100 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Card 2</h2>
              <p className="text-green-700 mb-4">
                This card should have a green background.
              </p>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                Green Button
              </button>
            </div>

            {/* Test Card 3 */}
            <div className="bg-red-100 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-4">Card 3</h2>
              <p className="text-red-700 mb-4">
                This card should have a red background.
              </p>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                Red Button
              </button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-500 text-white p-4 rounded text-center">
              <div className="text-2xl font-bold">Blue</div>
              <div className="text-sm">Primary Color</div>
            </div>
            <div className="bg-green-500 text-white p-4 rounded text-center">
              <div className="text-2xl font-bold">Green</div>
              <div className="text-sm">Success Color</div>
            </div>
            <div className="bg-yellow-500 text-white p-4 rounded text-center">
              <div className="text-2xl font-bold">Yellow</div>
              <div className="text-sm">Warning Color</div>
            </div>
            <div className="bg-red-500 text-white p-4 rounded text-center">
              <div className="text-2xl font-bold">Red</div>
              <div className="text-sm">Error Color</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Instructions:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>If you see colored backgrounds, rounded corners, and shadows, Tailwind CSS is working!</li>
              <li>If you see plain text without styling, Tailwind CSS is not working.</li>
              <li>Try refreshing the page if styles don't appear immediately.</li>
              <li>Check the browser console for any CSS-related errors.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default TailwindTestPage; 