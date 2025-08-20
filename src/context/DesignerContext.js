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
    if (savedDesigner && !state.currentDesigner) {
      console.log('Restoring current designer from localStorage:', savedDesigner);
      dispatch({ type: 'SET_CURRENT_DESIGNER', payload: savedDesigner });
    }
  }, [state.currentDesigner]);

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

    try {
      console.log('About to call supabase.from...');
      
      // Simple, direct approach without timeouts
      const { data: designers, error } = await supabase
        .from('designers')
        .select('*')
        .order('name');

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
        await loadAssessments(designers);
      } else {
        console.log('No designers returned from database');
      }
    } catch (error) {
      console.error('Error loading designers:', error);
      console.error('Error details:', error.message, error.code, error.details);
      
      // Set loading to false even on error
      dispatch({ type: 'SET_DESIGNERS_LOADING', payload: false });
      dispatch({ type: 'SET_LOADING', payload: false });
    } finally {
      console.log('Setting designersLoading to false');
      dispatch({ type: 'SET_DESIGNERS_LOADING', payload: false });
      console.log('=== LOAD DESIGNERS END ===');
    }
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
          
          // Only load data if we don't already have it
          if (state.designers.length === 0 && !hasLoadedData.current) {
            console.log('Auth SIGNED_IN: No designers, loading data...');
            await loadDesigners();
            dispatch({ type: 'SET_LOADING', payload: false });
          } else {
            console.log('Auth SIGNED_IN: Designers already loaded, skipping...');
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
      console.log('Skills:', skills);
      console.log('Current user:', state.user);
      
      // Check if we have a user
      if (!state.user) {
        throw new Error('No user found - cannot save assessment');
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

      // Then, create the assessment skills
      const assessmentSkills = skills.map(skill => ({
        assessment_id: assessment.id,
        skill_id: skill.id || skill.name, // Handle both cases
        proficiency: skill.proficiency
      }));

      console.log('Creating assessment skills:', assessmentSkills);

      const { error: skillsError } = await supabase
        .from('assessment_skills')
        .insert(assessmentSkills);

      if (skillsError) {
        console.error('Error creating assessment skills:', skillsError);
        throw skillsError;
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
    return state.assessments[designerId];
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