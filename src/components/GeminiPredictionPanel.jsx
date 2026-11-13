import React, { useEffect, useState } from 'react';
import { getAIAlert } from '../api';
import AIAlertBox from './AIAlertBox';

const GeminiPredictionPanel = ({ selectedWard }) => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!selectedWard) {
        setAiData(null);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await getAIAlert(selectedWard.id);
        if (!data) {
          setError('Unable to generate AI prediction. This may be due to missing API configuration or insufficient ward data.');
          setAiData(null);
        } else {
          setAiData({
            ...data,
            wardName: selectedWard.name
          });
          setError('');
        }
      } catch (err) {
        console.error('AI prediction error:', err);
        setError('Unable to connect to AI prediction service. Please check your API configuration.');
        setAiData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [selectedWard]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            Outbreak predictions
          </h2>
          <p className="text-xs text-gray-400">
            Model-driven forecasts for emerging outbreaks and medical trends.
          </p>
        </div>
        <div className="text-[10px] text-gray-400 text-right">
          Engine:{' '}
          <span className="text-gray-200 font-medium">Gemini</span>
        </div>
      </div>

      {!selectedWard ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500 text-center px-4">
          <div>
            <div className="text-4xl mb-2 opacity-30">🏥</div>
            <p>Select a ward from the map to request an AI-powered outbreak prediction.</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accentSoft mb-2"></div>
            <p className="text-xs text-gray-400">
              Analyzing data for {selectedWard.name}…
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-xs text-danger border border-danger/50 bg-danger/10 rounded-lg px-4 py-3 text-center w-full">
            <div className="font-semibold mb-1">⚠️ Prediction Unavailable</div>
            <p className="text-gray-300">{error}</p>
            <div className="mt-3 text-[10px] text-gray-400 border-t border-danger/30 pt-2">
              <p className="font-medium mb-1">Troubleshooting:</p>
              <ul className="list-disc list-inside text-left space-y-0.5">
                <li>Verify GEMINI_API_KEY is set in backend/.env</li>
                <li>Ensure ward has signal data available</li>
                <li>Check backend server logs for errors</li>
              </ul>
            </div>
          </div>
        </div>
      ) : !aiData ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500 text-center px-4">
          <div>
            <div className="text-3xl mb-2 opacity-30">📊</div>
            <p>No prediction available yet.</p>
            <p className="text-[10px] text-gray-600 mt-1">
              Try updating signals or adding disease data for this ward.
            </p>
          </div>
        </div>
      ) : (
        <AIAlertBox data={aiData} wardName={selectedWard.name} />
      )}
    </div>
  );
};

export default GeminiPredictionPanel;

