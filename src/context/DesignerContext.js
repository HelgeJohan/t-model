import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const DesignerContext = createContext();

const initialState = {
  designers: [],
  currentDesigner: null,
  assessments: {},
  user: null,
  loading: true,
  designersLoading: false,
  assessmentsLoading: false
};

function designerReducer(state, action) {
  console.log('Reducer called with action:', action.type);
  console.log('Current state:', state);
  
  let newState;
  
  switch (action.type) {
    case 'SET_USER':
      newState = { ...state, user: action.payload };
      break;
    case 'SET_LOADING':
      newState = { ...state, loading: action.payload };
      break;
    case 'SET_DESIGNERS_LOADING':
      newState = { ...state, designersLoading: action.payload };
      break;
    case 'SET_ASSESSMENTS_LOADING':
      newState = { ...state, assessmentsLoading: action.payload };
      break;
    case 'SET_DESIGNERS':
      newState = { ...state, designers: action.payload };
      break;
    case 'SET_ASSESSMENTS':
      newState = { ...state, assessments: action.payload };
      break;
    case 'SET_CURRENT_DESIGNER':
      newState = { ...state, currentDesigner: action.payload };
      break;
    case 'ADD_DESIGNER':
      newState = { ...state, designers: [...state.designers, action.payload] };
      break;
    case 'UPDATE_DESIGNER':
      newState = {
        ...state,
        designers: state.designers.map(d => 
          d.id === action.payload.id ? action.payload : d
        )
      };
      break;
    case 'DELETE_DESIGNER':
      newState = {
        ...state,
        designers: state.designers.filter(d => d.id !== action.payload),
        currentDesigner: state.currentDesigner === action.payload ? null : state.currentDesigner
      };
      break;
    default:
      newState = state;
  }
  
  console.log('New state after', action.type + ':', newState);
  return newState;
}

export function DesignerProvider({ children }) {
  const [state, dispatch] = useReducer(designerReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);
  const dataLoadPromise = useRef(null);
  const hasLoadedData = useRef(false);

  // Add navigation state persistence
  useEffect(() => {
    // Restore current designer from localStorage on refresh
    const savedDesigner = localStorage.getItem('currentDesigner');
    if (savedDesigner && !state.currentDesigner && !isInitialized) {
      console.log('Restoring current designer from localStorage:', savedDesigner);
      dispatch({ type: 'SET_CURRENT_DESIGNER', payload: savedDesigner });
    }
  }, [state.currentDesigner, isInitialized]);

  // Save current designer to localStorage when it changes
  useEffect(() => {
    if (state.currentDesigner) {
      localStorage.setItem('currentDesigner', state.currentDesigner);
    }
  }, [state.currentDesigner]);

  // Simple function to load designers
  const loadDesigners = async () => {
    console.log('=== LOAD DESIGNERS START ===');
    
    // Prevent multiple simultaneous loads
    if (dataLoadPromise.current || hasLoadedData.current) {
      console.log('Data loading already in progress or completed, skipping...');
      return;
    }
    
    console.log('Loading designers...');
    dispatch({ type: 'SET_DESIGNERS_LOADING', payload: true });

    // Retry logic with exponential backoff
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to load designers...`);
        
        // Shorter timeout for retries
        const timeout = retryCount === 0 ? 5000 : 2000; // 5s first, 2s retries
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Designers loading timeout after ${timeout/1000} seconds`)), timeout);
        });
        
        const dataPromise = supabase
          .from('designers')
          .select('*')
          .order('name');
        
        // Race between timeout and data loading
        const { data: designers, error } = await Promise.race([dataPromise, timeoutPromise]);

        console.log('Supabase response received:', { designers, error });

        if (error) {
          console.error('Error fetching designers:', error);
          throw error;
        }

        if (designers) {
          console.log('Designers loaded successfully:', designers.length);
          console.log('Designer names:', designers.map(d => d.name));
          
          // Dispatch the action to update state
          dispatch({ type: 'SET_DESIGNERS', payload: designers });
          
          // Mark as loaded
          hasLoadedData.current = true;
          
          // Load assessments after designers are loaded
          console.log('Starting to load assessments...');
          await loadAssessments(designers);
          console.log('Assessments loading completed');
          
          // Success - break out of retry loop
          break;
        } else {
          console.log('No designers returned from database');
          break;
        }
      } catch (error) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed:`, error.message);
        
        if (retryCount >= maxRetries) {
          console.error('All retry attempts failed');
          // Set loading to false on final failure
          dispatch({ type: 'SET_DESIGNERS_LOADING', payload: false });
          dispatch({ type: 'SET_LOADING', payload: false });
        } else {
          console.log(`Retrying in ${retryCount * 1000}ms...`);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }
    }
    
    console.log('Setting designersLoading to false');
    dispatch({ type: 'SET_DESIGNERS_LOADING', payload: false });
    console.log('=== LOAD DESIGNERS END ===');
  };

  // Simple function to load assessments
  const loadAssessments = async (designersList = null) => {
    const designers = designersList || state.designers;
    
    if (designers.length === 0) return;

    console.log('Loading assessments...');
    dispatch({ type: 'SET_ASSESSMENTS_LOADING', payload: true });

    try {
      const assessments = {};
      
      for (const designer of designers) {
        const { data: assessmentData, error } = await supabase
          .from('assessments')
          .select(`
            *,
            assessment_skills(skill_id, proficiency)
          `)
          .eq('designer_id', designer.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && assessmentData) {
          assessments[designer.id] = assessmentData;
        }
      }

      dispatch({ type: 'SET_ASSESSMENTS', payload: assessments });
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      dispatch({ type: 'SET_ASSESSMENTS_LOADING', payload: false });
    }
  };

  // Single initialization effect
  useEffect(() => {
    const initializeApp = async () => {
      console.log('=== INITIALIZE APP START ===');
      console.log('isInitialized:', isInitialized);
      console.log('state.loading:', state.loading);
      console.log('state.designers.length:', state.designers.length);
      
      if (isInitialized && state.designers.length > 0) {
        console.log('Already initialized with data, skipping...');
        return;
      }
      
      console.log('Initializing app...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('User found:', user.id);
        dispatch({ type: 'SET_USER', payload: user });
        
        // Load data
        await loadDesigners();
        
        // Set loading to false AFTER data is loaded
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('Data loaded, loading set to false');
      } else {
        console.log('No user found');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      
      setIsInitialized(true);
      console.log('=== INITIALIZE APP END ===');
    };

    initializeApp();

    // Listen for auth changes - but don't load data if we already have it
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          dispatch({ type: 'SET_USER', payload: session.user });
          
          // Only load data if we don't already have it AND app is not initialized
          if (state.designers.length === 0 && !hasLoadedData.current && !isInitialized) {
            console.log('Auth SIGNED_IN: No designers, loading data...');
            await loadDesigners();
            dispatch({ type: 'SET_LOADING', payload: false });
          } else {
            console.log('Auth SIGNED_IN: Designers already loaded or app initialized, skipping...');
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_DESIGNERS', payload: [] });
          dispatch({ type: 'SET_ASSESSMENTS', payload: {} });
          dispatch({ type: 'SET_LOADING', payload: false });
          hasLoadedData.current = false;
        } else if (event === 'INITIAL_SESSION') {
          console.log('Auth INITIAL_SESSION: Skipping data load (handled by getUser)');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // Keep empty dependencies to prevent re-runs

  // Functions for components to use
  const addDesigner = async (name) => {
    try {
      const { data: designer, error } = await supabase
        .from('designers')
        .insert([{ name, user_id: state.user.id }])
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_DESIGNER', payload: designer });
      return designer;
    } catch (error) {
      console.error('Error adding designer:', error);
      throw error;
    }
  };

  const updateDesigner = async (id, updates) => {
    try {
      const { data: designer, error } = await supabase
        .from('designers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_DESIGNER', payload: designer });
      return designer;
    } catch (error) {
      console.error('Error updating designer:', error);
      throw error;
    }
  };

  const deleteDesigner = async (id) => {
    try {
      const { error } = await supabase
        .from('designers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_DESIGNER', payload: id });
    } catch (error) {
      console.error('Error deleting designer:', error);
      throw error;
    }
  };

  const saveAssessment = async (designerId, skills) => {
    try {
      console.log('=== SAVE ASSESSMENT START ===');
      console.log('Designer ID:', designerId);
      console.log('Skills parameter:', skills);
      console.log('Skills type:', typeof skills);
      console.log('Skills keys:', Object.keys(skills));
      console.log('Current user:', state.user);
      
      // Check if we have a user
      if (!state.user) {
        throw new Error('No user found - cannot save assessment');
      }
      
      // Extract the actual skills array from the parameter
      let skillsArray;
      if (skills && skills.skills && Array.isArray(skills.skills)) {
        skillsArray = skills.skills;
        console.log('Extracted skills array:', skillsArray);
      } else if (Array.isArray(skills)) {
        skillsArray = skills;
        console.log('Skills is already an array:', skillsArray);
      } else {
        console.error('Invalid skills format:', skills);
        throw new Error('Invalid skills format - expected array or object with skills property');
      }
      
      // Create the assessment with your exact schema
      const assessmentData = {
        designer_id: designerId,
        user_id: state.user.id,
        assessment_date: new Date().toISOString()
      };
      
      console.log('Creating assessment with data:', assessmentData);
      
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert([assessmentData])
        .select()
        .single();

      if (assessmentError) {
        console.error('Error creating assessment:', assessmentError);
        throw assessmentError;
      }

      console.log('Assessment created:', assessment);

      // Create assessment skills with the correct skill UUIDs from your skills table
      const assessmentSkills = skillsArray.map(skill => {
        console.log('Processing skill:', skill);
        
        // Map skill names to UUIDs based on your skills table
        const skillIdMap = {
          'Forretnings-analyse': 'e46b710d-1d7d-43da-b922-c9c9d520ccf8',
          'Brukerinnsikt': '6bdaf4e2-2d8e-411f-8f9e-788db20ebf12',
          'Grafisk design': 'b5a240a2-ac79-40fa-998a-16a4bf67b0f9',
          'Innholds-design': 'a0b2f920-05f8-4925-a922-514a8a520317',
          'Interaksjons-design': '6ac0522e-107b-4998-a2de-6352c52e6b3e',
          'Informasjons-arkitektur': '734fa46a-3f80-4ba6-acaa-cfee9b81d763',
          'Brukertesting': '1a15abd9-0176-4076-af94-91456eda08c1',
          'Frontend design, UU': '42f096a0-3db5-47e0-83a2-245aec62dabc',
          'Prototyping': '1e5bc6d0-8286-4be5-b1f9-d31007e5df9d',
          'Data og trafikkanalyse': '64a39e1a-6c53-4c4a-a445-8938334944ef'
        };
        
        const skillId = skillIdMap[skill.name];
        console.log(`Skill name: "${skill.name}" -> UUID: "${skillId}"`);
        
        if (!skillId) {
          console.error(`Unknown skill name: ${skill.name}`);
          throw new Error(`Unknown skill name: ${skill.name}`);
        }
        
        const assessmentSkill = {
          assessment_id: assessment.id,
          skill_id: skillId, // Use the correct UUID from your skills table
          proficiency: skill.proficiency
        };
        
        console.log('Created assessment skill:', assessmentSkill);
        return assessmentSkill;
      });

      console.log('Final assessment skills array:', assessmentSkills);

      const { error: assessmentSkillsError } = await supabase
        .from('assessment_skills')
        .insert(assessmentSkills);

      if (assessmentSkillsError) {
        console.error('Error creating assessment skills:', assessmentSkillsError);
        throw assessmentSkillsError;
      }

      console.log('Assessment skills created successfully');

      // Update local state
      const updatedAssessment = {
        ...assessment,
        assessment_skills: assessmentSkills
      };

      dispatch({
        type: 'SET_ASSESSMENTS',
        payload: {
          ...state.assessments,
          [designerId]: updatedAssessment
        }
      });

      console.log('=== SAVE ASSESSMENT END ===');
      return updatedAssessment;
    } catch (error) {
      console.error('Error saving assessment:', error);
      console.error('Error details:', error.message, error.code, error.details);
      throw error;
    }
  };

  const getDesignerAssessment = (designerId) => {
    const assessment = state.assessments[designerId];
    
    if (!assessment) {
      return null;
    }
    
    // If assessment already has skills array, return as is
    if (assessment.skills) {
      return assessment;
    }
    
    // If assessment has assessment_skills, reconstruct the skills array
    if (assessment.assessment_skills && assessment.assessment_skills.length > 0) {
      // Map skill UUIDs back to skill names and proficiency
      const skillIdToNameMap = {
        'e46b710d-1d7d-43da-b922-c9c9d520ccf8': 'Forretnings-analyse',
        '6bdaf4e2-2d8e-411f-8f9e-788db20ebf12': 'Brukerinnsikt',
        'b5a240a2-ac79-40fa-998a-16a4bf67b0f9': 'Grafisk design',
        'a0b2f920-05f8-4925-a922-514a8a520317': 'Innholds-design',
        '6ac0522e-107b-4998-a2de-6352c52e6b3e': 'Interaksjons-design',
        '734fa46a-3f80-4ba6-acaa-cfee9b81d763': 'Informasjons-arkitektur',
        '1a15abd9-0176-4076-af94-91456eda08c1': 'Brukertesting',
        '42f096a0-3db5-47e0-83a2-245aec62dabc': 'Frontend design, UU',
        '1e5bc6d0-8286-4be5-b1f9-d31007e5df9d': 'Prototyping',
        '64a39e1a-6c53-4c4a-a445-8938334944ef': 'Data og trafikkanalyse'
      };
      
      const reconstructedSkills = assessment.assessment_skills.map(assessmentSkill => {
        const skillName = skillIdToNameMap[assessmentSkill.skill_id];
        if (!skillName) {
          console.error(`Unknown skill ID: ${assessmentSkill.skill_id}`);
          return null;
        }
        
        return {
          name: skillName,
          proficiency: assessmentSkill.proficiency
        };
      }).filter(Boolean); // Remove any null entries
      
      // Return assessment with reconstructed skills
      return {
        ...assessment,
        skills: reconstructedSkills
      };
    }
    
    // No skills found, return assessment as is
    return assessment;
  };

  const setCurrentDesigner = (designerId) => {
    dispatch({ type: 'SET_CURRENT_DESIGNER', payload: designerId });
  };

  const value = {
    ...state,
    addDesigner,
    updateDesigner,
    deleteDesigner,
    saveAssessment,
    getDesignerAssessment,
    setCurrentDesigner
  };

  return (
    <DesignerContext.Provider value={value}>
      {children}
    </DesignerContext.Provider>
  );
}

export function useDesigner() {
  const context = useContext(DesignerContext);
  if (!context) {
    throw new Error('useDesigner must be used within a DesignerProvider');
  }
  return context;
}