import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';

const DesignerContext = createContext();

const initialState = {
  designers: [],
  currentDesigner: null,
  assessments: {}
};

const designerReducer = (state, action) => {
  console.log('Reducer called with action:', action.type, action.payload);
  console.log('Current state:', state);
  
  switch (action.type) {
    case 'ADD_DESIGNER':
      console.log('=== REDUCER: ADD_DESIGNER ===');
      console.log('Payload received:', action.payload);
      console.log('Current designers in state:', state.designers);
      
      const newState1 = {
        ...state,
        designers: [...state.designers, action.payload],
        currentDesigner: action.payload.id
      };
      
      console.log('New state after ADD_DESIGNER:', newState1);
      console.log('New designers array length:', newState1.designers.length);
      console.log('=== END REDUCER: ADD_DESIGNER ===');
      return newState1;
    
    case 'SET_CURRENT_DESIGNER':
      const newState2 = {
        ...state,
        currentDesigner: action.payload
      };
      console.log('New state after SET_CURRENT_DESIGNER:', newState2);
      return newState2;
    
    case 'SAVE_ASSESSMENT':
      const newState3 = {
        ...state,
        assessments: {
          ...state.assessments,
          [action.payload.designerId]: {
            ...action.payload.assessment,
            timestamp: new Date().toISOString()
          }
        }
      };
      console.log('New state after SAVE_ASSESSMENT:', newState3);
      return newState3;
    
    case 'LOAD_DESIGNERS':
      const newState4 = {
        ...state,
        designers: action.payload
      };
      console.log('New state after LOAD_DESIGNERS:', newState4);
      return newState4;
    
    case 'LOAD_ASSESSMENTS':
      const newState5 = {
        ...state,
        assessments: action.payload
      };
      console.log('New state after LOAD_ASSESSMENTS:', newState5);
      return newState5;
    
    case 'UPDATE_DESIGNER':
      const newState6 = {
        ...state,
        designers: state.designers.map(d => 
          d.id === action.payload.id ? { ...d, name: action.payload.name } : d
        )
      };
      console.log('New state after UPDATE_DESIGNER:', newState6);
      return newState6;
    
    case 'DELETE_DESIGNER':
      const newState7 = {
        ...state,
        designers: state.designers.filter(d => d.id !== action.payload),
        currentDesigner: state.currentDesigner === action.payload ? null : state.currentDesigner,
        assessments: Object.fromEntries(
          Object.entries(state.assessments).filter(([id]) => id !== action.payload)
        )
      };
      console.log('New state after DELETE_DESIGNER:', newState7);
      return newState7;
    
    default:
      return state;
  }
};

export const DesignerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(designerReducer, initialState);
  const hasLoaded = useRef(false);

  // Test localStorage functionality
  useEffect(() => {
    try {
      localStorage.setItem('test', 'working');
      const testValue = localStorage.getItem('test');
      localStorage.removeItem('test');
      console.log('localStorage test:', testValue === 'working' ? 'PASSED' : 'FAILED');
    } catch (error) {
      console.error('localStorage not available:', error);
    }
  }, []);

  // Migrate old English skill names to Norwegian
  const migrateSkillNames = (assessment) => {
    if (!assessment || !assessment.skills) return assessment;
    
    console.log('=== MIGRATING SKILL NAMES ===');
    console.log('Original skills:', assessment.skills);
    
    const skillNameMapping = {
      'Business analysis': 'Forretnings-analyse',
      'User research': 'Brukerinnsikt',
      'Visual and information design': 'Grafisk design',
      'Content design': 'Innholds-design',
      'Interaction design': 'Interaksjons-design',
      'Information architecture': 'Informasjons-arkitektur',
      'Usability evaluation': 'Brukertesting',
      'Front-end design and accessibility': 'Frontend design, UU',
      'Experimentation': 'Prototyping',
      'Data and analytics': 'Data og trafikkanalyse',
      // Also handle the old Norwegian names without hyphens
      'Forretningsanalyse': 'Forretnings-analyse',
      'Innholdsdesign': 'Innholds-design',
      'Interaksjonsdesign': 'Interaksjons-design',
      'Informasjonsarkitektur': 'Informasjons-arkitektur',
      // Handle the case where "design" might have a hyphen
      'Frontend design, UU': 'Frontend design, UU',
      'Front-end design, UU': 'Frontend design, UU',
      // Handle any other variations that might exist
      'Frontend de-sign, UU': 'Frontend design, UU',
      'Front-end de-sign, UU': 'Frontend design, UU',
      'Frontend de-sign and accessibility': 'Frontend design, UU',
      'Front-end de-sign and accessibility': 'Frontend design, UU'
    };
    
    const migratedSkills = assessment.skills.map(skill => {
      console.log('Processing skill:', skill.name);
      
      // First try exact mapping
      let newName = skillNameMapping[skill.name];
      
      // If no exact match, try to fix any "de-sign" variations
      if (!newName && skill.name.includes('de-sign')) {
        newName = skill.name.replace(/de-sign/g, 'design');
        console.log('Fixed de-sign to design:', skill.name, '→', newName);
      }
      
      console.log('Final skill name:', newName || skill.name);
      
      return {
        ...skill,
        name: newName || skill.name
      };
    });
    
    console.log('Migrated skills:', migratedSkills);
    console.log('=== END MIGRATION ===');
    
    return {
      ...assessment,
      skills: migratedSkills
    };
  };

  // Load data from localStorage on app start (only once)
  useEffect(() => {
    if (hasLoaded.current) {
      console.log('Already loaded, skipping...');
      return;
    }
    
    console.log('=== LOADING FROM LOCALSTORAGE ===');
    const savedDesigners = localStorage.getItem('uxDesigners');
    const savedAssessments = localStorage.getItem('uxAssessments');
    
    console.log('Raw localStorage data:', { savedDesigners, savedAssessments });
    
    try {
      const designers = savedDesigners ? JSON.parse(savedDesigners) : [];
      const assessments = savedAssessments ? JSON.parse(savedAssessments) : {};
      
      // Migrate existing assessments to use Norwegian skill names
      const migratedAssessments = {};
      Object.keys(assessments).forEach(designerId => {
        migratedAssessments[designerId] = migrateSkillNames(assessments[designerId]);
      });
      
      console.log('Parsed designers:', designers);
      console.log('Dispatching LOAD_DESIGNERS with:', designers);
      dispatch({ type: 'LOAD_DESIGNERS', payload: designers });
      
      console.log('Parsed assessments:', assessments);
      console.log('Dispatching LOAD_ASSESSMENTS with:', migratedAssessments);
      dispatch({ type: 'LOAD_ASSESSMENTS', payload: migratedAssessments });
      
      // Save migrated assessments back to localStorage
      if (Object.keys(migratedAssessments).length > 0) {
        localStorage.setItem('uxAssessments', JSON.stringify(migratedAssessments));
        console.log('Migrated assessments saved to localStorage');
      }
      
      hasLoaded.current = true;
      console.log('=== FINISHED LOADING ===');
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    console.log('=== SAVING DESIGNERS TO LOCALSTORAGE ===');
    console.log('State.designers changed to:', state.designers);
    console.log('State.designers length:', state.designers.length);
    console.log('Stringified designers:', JSON.stringify(state.designers));
    
    localStorage.setItem('uxDesigners', JSON.stringify(state.designers));
    
    // Verify what was saved
    const saved = localStorage.getItem('uxDesigners');
    console.log('Verified saved data:', saved);
    console.log('=== END SAVING DESIGNERS ===');
  }, [state.designers]);

  useEffect(() => {
    console.log('Saving assessments to localStorage:', state.assessments);
    
    // Apply migration before saving to ensure all skill names are correct
    const migratedAssessments = {};
    Object.keys(state.assessments).forEach(designerId => {
      migratedAssessments[designerId] = migrateSkillNames(state.assessments[designerId]);
    });
    
    localStorage.setItem('uxAssessments', JSON.stringify(migratedAssessments));
  }, [state.assessments]);

  const addDesigner = (name) => {
    console.log('=== ADDING DESIGNER ===');
    console.log('Current designers before adding:', state.designers);
    console.log('Adding designer with name:', name);
    
    const newDesigner = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    
    console.log('New designer object:', newDesigner);
    
    // Check if name already exists
    const nameExists = state.designers.some(
      designer => designer.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (nameExists) {
      console.log('Designer name already exists, not adding');
      return null;
    }
    
    console.log('Dispatching ADD_DESIGNER with:', newDesigner);
    dispatch({ type: 'ADD_DESIGNER', payload: newDesigner });
    
    console.log('=== FINISHED ADDING DESIGNER ===');
    return newDesigner;
  };

  const setCurrentDesigner = (designerId) => {
    dispatch({ type: 'SET_CURRENT_DESIGNER', payload: designerId });
  };

  const saveAssessment = (designerId, assessment) => {
    dispatch({ type: 'SAVE_ASSESSMENT', payload: { designerId, assessment } });
  };

  const getCurrentAssessment = () => {
    if (!state.currentDesigner) return null;
    return state.assessments[state.currentDesigner] || null;
  };

  const getDesignerAssessment = (designerId) => {
    return state.assessments[designerId] || null;
  };

  const migrateAllAssessments = () => {
    console.log('=== MIGRATE ALL ASSESSMENTS CALLED ===');
    console.log('Current state.assessments:', state.assessments);
    console.log('Number of assessments:', Object.keys(state.assessments).length);
    
    // Force migration of all existing assessments
    const migratedAssessments = {};
    Object.keys(state.assessments).forEach(designerId => {
      console.log('Migrating designer:', designerId);
      migratedAssessments[designerId] = migrateSkillNames(state.assessments[designerId]);
    });
    
    console.log('Migrated assessments:', migratedAssessments);
    
    // Update state with migrated assessments
    dispatch({ type: 'LOAD_ASSESSMENTS', payload: migratedAssessments });
    
    // Save to localStorage
    localStorage.setItem('uxAssessments', JSON.stringify(migratedAssessments));
    
    console.log('About to reload page...');
    
    // Force a page reload to ensure all components get the updated data
    window.location.reload();
  };

  const updateDesigner = (designerId, newName) => {
    dispatch({ type: 'UPDATE_DESIGNER', payload: { id: designerId, name: newName } });
  };

  const deleteDesigner = (designerId) => {
    dispatch({ type: 'DELETE_DESIGNER', payload: designerId });
  };

  const value = {
    ...state,
    addDesigner,
    setCurrentDesigner,
    saveAssessment,
    getCurrentAssessment,
    getDesignerAssessment,
    migrateAllAssessments,
    updateDesigner,
    deleteDesigner
  };

  return (
    <DesignerContext.Provider value={value}>
      {children}
    </DesignerContext.Provider>
  );
};

export const useDesigner = () => {
  const context = useContext(DesignerContext);
  if (!context) {
    throw new Error('useDesigner must be used within a DesignerProvider');
  }
  return context;
};
