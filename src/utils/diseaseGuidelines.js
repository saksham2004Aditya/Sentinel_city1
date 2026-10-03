/**
 * Disease Prevention Guidelines Database
 * Comprehensive precautionary measures for common infectious diseases
 */

const DISEASE_GUIDELINES = {
  'covid 19': {
    name: 'COVID-19',
    category: 'Respiratory Viral',
    symptoms: ['Fever', 'Cough', 'Shortness of breath', 'Loss of taste/smell', 'Fatigue'],
    prevention: [
      'Wear a well-fitted N95 or KN95 mask in crowded indoor spaces',
      'Maintain physical distance of at least 6 feet from others',
      'Improve ventilation by opening windows and using air purifiers',
      'Wash hands frequently with soap for at least 20 seconds',
      'Get vaccinated and stay up-to-date with booster shots',
      'Test if symptomatic and isolate immediately when positive',
      'Avoid touching your face, especially eyes, nose, and mouth'
    ],
    severity: 'high',
    transmissionMode: 'Airborne & Droplet'
  },
  flu: {
    name: 'Influenza (Flu)',
    category: 'Respiratory Viral',
    symptoms: ['Fever', 'Body aches', 'Cough', 'Sore throat', 'Fatigue', 'Headache'],
    prevention: [
      'Get annual flu vaccination before flu season begins',
      'Stay home if you have fever or respiratory symptoms',
      'Wash hands frequently and avoid touching your face',
      'Cover coughs and sneezes with a tissue or elbow',
      'Clean and disinfect frequently-touched surfaces daily',
      'Avoid close contact with sick individuals',
      'Maintain good overall health with adequate sleep and nutrition'
    ],
    severity: 'medium',
    transmissionMode: 'Droplet & Contact'
  },
  dengue: {
    name: 'Dengue Fever',
    category: 'Mosquito-borne Viral',
    symptoms: ['High fever', 'Severe headache', 'Pain behind eyes', 'Joint/muscle pain', 'Rash', 'Bleeding'],
    prevention: [
      'Use mosquito repellent containing DEET, picaridin, or IR3535',
      'Wear long-sleeved shirts and long pants, especially during dawn and dusk',
      'Remove standing water from containers, tires, and plant saucers weekly',
      'Use mosquito nets while sleeping, especially during daytime',
      'Install window and door screens to prevent mosquito entry',
      'Seek immediate medical care if you have high fever or severe body aches',
      'Support community-wide mosquito control efforts'
    ],
    severity: 'high',
    transmissionMode: 'Vector (Aedes mosquito)'
  },
  malaria: {
    name: 'Malaria',
    category: 'Mosquito-borne Parasitic',
    symptoms: ['Fever', 'Chills', 'Sweating', 'Headache', 'Nausea', 'Fatigue'],
    prevention: [
      'Sleep under insecticide-treated bed nets every night',
      'Use mosquito repellents and wear long sleeves at dusk and dawn',
      'Take antimalarial prophylaxis medication as prescribed in endemic areas',
      'Eliminate mosquito breeding sites by draining stagnant water',
      'Apply indoor residual spraying in high-risk areas',
      'Report fever promptly for rapid diagnostic testing and treatment',
      'Avoid outdoor activities during peak mosquito hours (dusk to dawn)'
    ],
    severity: 'high',
    transmissionMode: 'Vector (Anopheles mosquito)'
  },
  chikungunya: {
    name: 'Chikungunya',
    category: 'Mosquito-borne Viral',
    symptoms: ['Fever', 'Severe joint pain', 'Muscle pain', 'Headache', 'Rash', 'Fatigue'],
    prevention: [
      'Prevent mosquito bites with repellents containing DEET or picaridin',
      'Wear protective clothing including long sleeves and pants',
      'Eliminate standing water to reduce Aedes mosquito breeding',
      'Use air conditioning or window/door screens to keep mosquitoes out',
      'Rest adequately and stay well-hydrated if infected',
      'Seek medical care for persistent joint pain or high fever',
      'Avoid areas with known outbreaks during peak transmission seasons'
    ],
    severity: 'medium',
    transmissionMode: 'Vector (Aedes mosquito)'
  },
  'viral fever': {
    name: 'Viral Fever',
    category: 'General Viral',
    symptoms: ['Fever', 'Body aches', 'Fatigue', 'Headache', 'Weakness'],
    prevention: [
      'Rest adequately and stay well-hydrated with water and electrolytes',
      'Practice frequent hand hygiene with soap and water',
      'Avoid close contact with others to prevent transmission',
      'Maintain good nutrition to support immune function',
      'Monitor temperature regularly and track symptom progression',
      'Seek medical advice if fever persists beyond 48-72 hours',
      'Keep living spaces clean and well-ventilated'
    ],
    severity: 'low',
    transmissionMode: 'Variable (Droplet/Contact)'
  },
  'respiratory infection': {
    name: 'Respiratory Infection',
    category: 'Respiratory',
    symptoms: ['Cough', 'Congestion', 'Sore throat', 'Shortness of breath', 'Chest discomfort'],
    prevention: [
      'Wear a mask if you have cough, congestion, or other symptoms',
      'Keep indoor air well-ventilated and avoid crowded enclosed spaces',
      'Practice respiratory hygiene by covering coughs and sneezes',
      'Wash hands frequently, especially after coughing or sneezing',
      'Stay hydrated and use humidifiers to ease breathing',
      'Seek immediate care if breathing becomes difficult or labored',
      'Avoid smoking and exposure to secondhand smoke or air pollution'
    ],
    severity: 'medium',
    transmissionMode: 'Airborne & Droplet'
  },
  gastroenteritis: {
    name: 'Gastroenteritis',
    category: 'Gastrointestinal',
    symptoms: ['Diarrhea', 'Vomiting', 'Abdominal cramps', 'Nausea', 'Fever', 'Dehydration'],
    prevention: [
      'Wash hands thoroughly with soap after using restroom and before meals',
      'Drink safe, treated, or boiled water only',
      'Avoid unsafe street food and ensure proper food handling',
      'Cook food thoroughly, especially meat, eggs, and seafood',
      'Refrigerate perishable foods promptly',
      'Rehydrate with oral rehydration solution or electrolyte drinks',
      'Seek medical care for severe dehydration, bloody stools, or persistent symptoms'
    ],
    severity: 'medium',
    transmissionMode: 'Fecal-Oral & Contact'
  },
  'nipah virus': {
    name: 'Nipah Virus',
    category: 'Zoonotic Viral',
    symptoms: ['Fever', 'Headache', 'Drowsiness', 'Confusion', 'Respiratory distress', 'Encephalitis'],
    prevention: [
      'Avoid contact with sick individuals, bats, or bat droppings',
      'Do not consume raw date palm sap or fruits partially eaten by bats',
      'Practice strict hand hygiene with soap and water regularly',
      'Use personal protective equipment when caring for infected patients',
      'Maintain safe food handling and avoid contact with sick animals',
      'Seek immediate medical care for fever with neurological symptoms',
      'Report unusual animal deaths or illnesses to health authorities'
    ],
    severity: 'critical',
    transmissionMode: 'Zoonotic & Person-to-Person'
  },
  fever: {
    name: 'Fever (General)',
    category: 'General Symptom',
    symptoms: ['Elevated temperature', 'Chills', 'Sweating', 'Body aches', 'Weakness'],
    prevention: [
      'Rest adequately and monitor temperature every 4-6 hours',
      'Stay well-hydrated with water, clear broths, or electrolyte solutions',
      'Avoid close contact with others while symptomatic',
      'Take fever-reducing medication as recommended by healthcare provider',
      'Keep cool with light clothing and room temperature regulation',
      'Seek medical care if fever exceeds 103°F or persists beyond 3 days',
      'Watch for warning signs like difficulty breathing, severe headache, or rash'
    ],
    severity: 'low',
    transmissionMode: 'Variable'
  },
  cold: {
    name: 'Common Cold',
    category: 'Respiratory Viral',
    symptoms: ['Runny nose', 'Sneezing', 'Sore throat', 'Cough', 'Mild headache'],
    prevention: [
      'Wash hands frequently with soap for at least 20 seconds',
      'Avoid close contact with people who have colds',
      'Cover coughs and sneezes with tissue or elbow',
      'Dispose of used tissues safely and wash hands immediately',
      'Avoid touching your eyes, nose, and mouth',
      'Clean and disinfect frequently-touched surfaces',
      'Rest and hydrate well; seek care if symptoms worsen or persist'
    ],
    severity: 'low',
    transmissionMode: 'Droplet & Contact'
  },
  tuberculosis: {
    name: 'Tuberculosis (TB)',
    category: 'Bacterial Respiratory',
    symptoms: ['Persistent cough', 'Chest pain', 'Coughing blood', 'Fatigue', 'Weight loss', 'Night sweats'],
    prevention: [
      'Ensure adequate ventilation in living and working spaces',
      'Wear N95 masks when in close contact with TB patients',
      'Complete full course of TB treatment if diagnosed',
      'Get BCG vaccination in high-risk areas',
      'Screen household contacts of TB patients regularly',
      'Seek immediate testing if you have persistent cough for over 2 weeks',
      'Maintain good nutrition and overall health to boost immunity'
    ],
    severity: 'high',
    transmissionMode: 'Airborne'
  },
  typhoid: {
    name: 'Typhoid Fever',
    category: 'Bacterial Gastrointestinal',
    symptoms: ['Prolonged fever', 'Headache', 'Abdominal pain', 'Weakness', 'Rose spots rash'],
    prevention: [
      'Drink only boiled or bottled water from reliable sources',
      'Wash hands thoroughly before eating and after using restroom',
      'Avoid raw vegetables and fruits unless properly washed and peeled',
      'Get typhoid vaccination, especially before traveling to endemic areas',
      'Ensure proper sewage disposal and sanitation',
      'Seek medical care promptly for persistent fever and abdominal symptoms',
      'Complete full antibiotic course if diagnosed'
    ],
    severity: 'high',
    transmissionMode: 'Fecal-Oral'
  }
};

const DEFAULT_GUIDELINES = {
  name: 'General Health Guidelines',
  category: 'General',
  symptoms: [],
  prevention: [
    'Maintain hand hygiene by washing frequently with soap and water',
    'Practice respiratory etiquette by covering coughs and sneezes',
    'Avoid close contact with sick individuals',
    'Maintain a healthy lifestyle with adequate sleep, nutrition, and exercise',
    'Stay up-to-date with recommended vaccinations',
    'Seek medical care if symptoms worsen or persist',
    'Follow local public health advisories and guidelines'
  ],
  severity: 'general',
  transmissionMode: 'Variable'
};

/**
 * Normalize disease name for lookup
 */
export const normalizeDiseaseName = (name) =>
  String(name || '').trim().toLowerCase();

/**
 * Get full disease information including prevention guidelines
 */
export const getDiseaseInfo = (diseaseName) => {
  const key = normalizeDiseaseName(diseaseName);
  return DISEASE_GUIDELINES[key] || null;
};

/**
 * Get only prevention guidelines for a disease
 */
export const getGuidelinesForDisease = (diseaseName) => {
  const info = getDiseaseInfo(diseaseName);
  return info ? info.prevention : DEFAULT_GUIDELINES.prevention;
};

/**
 * Get disease severity level
 */
export const getDiseaseSeverity = (diseaseName) => {
  const info = getDiseaseInfo(diseaseName);
  return info ? info.severity : 'unknown';
};

/**
 * Get disease category
 */
export const getDiseaseCategory = (diseaseName) => {
  const info = getDiseaseInfo(diseaseName);
  return info ? info.category : 'Unknown';
};

/**
 * Get proper display name for disease
 */
export const getDiseaseDisplayName = (diseaseName) => {
  const info = getDiseaseInfo(diseaseName);
  return info ? info.name : diseaseName;
};

/**
 * List all known diseases in the database
 */
export const listKnownDiseases = () => 
  Object.keys(DISEASE_GUIDELINES).map(key => DISEASE_GUIDELINES[key].name);

/**
 * Get color coding for disease severity
 */
export const getSeverityColor = (severity) => {
  const colors = {
    critical: 'text-red-500 bg-red-950 border-red-500',
    high: 'text-orange-400 bg-orange-950 border-orange-500',
    medium: 'text-yellow-400 bg-yellow-950 border-yellow-500',
    low: 'text-emerald-400 bg-emerald-950 border-emerald-500',
    general: 'text-blue-400 bg-blue-950 border-blue-500',
    unknown: 'text-gray-400 bg-gray-900 border-gray-600'
  };
  return colors[severity] || colors.unknown;
};

/**
 * Check if a disease is known in the database
 */
export const isKnownDisease = (diseaseName) => {
  const key = normalizeDiseaseName(diseaseName);
  return key in DISEASE_GUIDELINES;
};

export default {
  normalizeDiseaseName,
  getDiseaseInfo,
  getGuidelinesForDisease,
  getDiseaseSeverity,
  getDiseaseCategory,
  getDiseaseDisplayName,
  listKnownDiseases,
  getSeverityColor,
  isKnownDisease
};
