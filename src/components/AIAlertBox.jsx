// frontend/src/components/AIAlertBox.jsx
import React from 'react';
import { 
  getGuidelinesForDisease, 
  getDiseaseDisplayName, 
  getDiseaseSeverity,
  getSeverityColor,
  isKnownDisease 
} from '../utils/diseaseGuidelines';

const AIAlertBox = ({ data, wardName }) => {
  if (!data) return null;

  const riskColors = {
    High: 'bg-red-950 border-red-500/60 text-red-100',
    Medium: 'bg-yellow-950 border-yellow-500/60 text-yellow-100',
    Low: 'bg-emerald-950 border-emerald-500/60 text-emerald-100',
    Unknown: 'bg-gray-900 border-gray-600/60 text-gray-300'
  };

  // Try to extract disease mentions from the prediction text
  const extractDiseases = (predictionText) => {
    if (!predictionText) return [];
    const text = predictionText.toLowerCase();
    const diseases = [];
    
    // Common disease patterns to check
    const diseasePatterns = [
      'covid', 'flu', 'dengue', 'malaria', 'chikungunya', 
      'viral fever', 'respiratory infection', 'gastroenteritis',
      'nipah', 'tuberculosis', 'typhoid'
    ];
    
    diseasePatterns.forEach(pattern => {
      if (text.includes(pattern)) {
        diseases.push(pattern);
      }
    });
    
    return [...new Set(diseases)]; // Remove duplicates
  };

  const mentionedDiseases = extractDiseases(data.prediction);

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
      {/* Main Prediction Card */}
      <div className={`p-4 border rounded-lg ${riskColors[data.risk] || riskColors.Unknown}`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="text-lg">🔮</span>
            Outbreak prediction
          </h3>
          <span className="text-[10px] font-mono uppercase bg-black/40 px-2 py-1 rounded border border-white/10">
            RISK: {data.risk}
          </span>
        </div>
        
        {wardName && (
          <div className="text-[10px] text-gray-400 mb-2">
            Analysis for: <span className="font-medium text-gray-200">{wardName}</span>
          </div>
        )}
        
        <p className="text-sm mb-4 text-gray-100 leading-relaxed">{data.prediction}</p>
        
        <h4 className="font-semibold text-xs mb-2 uppercase tracking-wide text-gray-300 flex items-center gap-1">
          <span>📋</span>
          Recommended actions
        </h4>
        <ul className="list-disc list-inside text-xs space-y-1.5 text-gray-200">
          {data.prevention.map((step, i) => (
            <li key={i} className="leading-relaxed">{step}</li>
          ))}
        </ul>
      </div>

      {/* Disease-Specific Guidelines (if diseases mentioned) */}
      {mentionedDiseases.length > 0 && (
        <div className="bg-background/80 border border-accent/40 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🛡️</span>
            <h4 className="font-semibold text-xs uppercase tracking-wide text-gray-300">
              Disease-Specific Prevention
            </h4>
          </div>
          
          <div className="space-y-3">
            {mentionedDiseases.map((disease) => {
              if (!isKnownDisease(disease)) return null;
              
              const displayName = getDiseaseDisplayName(disease);
              const severity = getDiseaseSeverity(disease);
              const guidelines = getGuidelinesForDisease(disease);
              
              return (
                <div key={disease} className="bg-background/60 border border-slate-700 rounded px-3 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-100">{displayName}</span>
                    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border font-medium ${getSeverityColor(severity)}`}>
                      {severity}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {guidelines.slice(0, 5).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-300">
                        <span className="text-accentSoft mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                  {guidelines.length > 5 && (
                    <div className="mt-1 text-[10px] text-gray-500 italic">
                      + {guidelines.length - 5} more guidelines available
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* General Health Notice */}
      <div className="bg-blue-950/20 border border-blue-500/30 rounded px-3 py-2 text-[10px] text-blue-200">
        <div className="font-medium mb-1">💡 Important Notice</div>
        <p className="text-blue-300/80">
          This is an AI-generated prediction based on available data. Always consult local health 
          authorities and medical professionals for official guidance and medical decisions.
        </p>
      </div>
    </div>
  );
};

export default AIAlertBox;