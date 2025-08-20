import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
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
  
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_DESIGNERS_LOADING':
      return { ...state, designersLoading: action.payload };
    case 'SET_ASSESSMENTS_LOADING':
      return { ...state, assessmentsLoading: action.payload };
    case 'SET_DESIGNERS':
      return { ...state, designers: action.payload };
    case 'SET_ASSESSMENTS':
      return { ...state, assessments: action.payload };
    case 'SET_CURRENT_DESIGNER':
      return { ...state, currentDesigner: action.payload };
    case 'ADD_DESIGNER':
      return { ...state, designers: [...state.designers, action.payload] };
    case 'UPDATE_DESIGNER':
      return {
        ...state,
        designers: state.designers.map(d => 
          d.id === action.payload.id ? action.payload : d
        )
      };
    case 'DELETE_DESIGNER':
      return {
        ...state,
        designers: state.designers.filter(d => d.id !== action.payload),
        currentDesigner: state.currentDesigner === action.payload ? null : state.currentDesigner
      };
    default:
      return state;
  }
}

export function DesignerProvider({ children }) {
  const [state, dispatch] = useReducer(designerReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Simple function to load designers
  const loadDesigners = async () => {
    console.log('=== LOAD DESIGNERS START ===');
    
    // Get current state from the reducer, not from closure
    const currentState = state;
    console.log('Current state at start:', currentState);
    
    if (currentState.designers.length > 0) {
      console.log('Designers already loaded, skipping...');
      return;
    }

    console.log('Loading designers...');
    dispatch({ type: 'SET_DESIGNERS_LOADING', payload: true });

    try {
      console.log('About to call supabase.from...');
      
      // Try multiple approaches to load designers
      let designers = null;
      let error = null;
      
      // Approach 1: Try with timeout (5 seconds)
      try {
        console.log('Trying approach 1: Normal query with timeout...');
        const designersPromise = supabase
          .from('designers')
          .select('*')
          .order('name');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Designers query timeout')), 5000)
        );
        
        const result = await Promise.race([
          designersPromise,
          timeoutPromise
        ]);
        
        designers = result.data;
        error = result.error;
        console.log('Approach 1 succeeded:', { designers, error });
      } catch (timeoutError) {
        console.log('Approach 1 failed (timeout):', timeoutError.message);
        
        // Approach 2: Try without ordering (3 seconds)
        try {
          console.log('Trying approach 2: Query without ordering...');
          const result = await Promise.race([
            supabase.from('designers').select('*').limit(100),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Approach 2 timeout')), 3000))
          ]);
          
          designers = result.data;
          error = result.error;
          console.log('Approach 2 succeeded:', { designers, error });
        } catch (simpleError) {
          console.log('Approach 2 failed:', simpleError.message);
          
          // Approach 3: Try minimal query (2 seconds)
          try {
            console.log('Trying approach 3: Minimal query (just IDs)...');
            const result = await Promise.race([
              supabase.from('designers').select('id, name').limit(10),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Approach 3 timeout')), 2000))
            ]);
            
            designers = result.data;
            error = result.error;
            console.log('Approach 3 succeeded:', { designers, error });
          } catch (minimalError) {
            console.log('Approach 3 failed:', minimalError.message);
            
            // Approach 4: Try with different Supabase client settings
            try {
              console.log('Trying approach 4: Different client settings...');
              const result = await Promise.race([
                supabase.from('designers').select('id, name').limit(5),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Approach 4 timeout')), 2000))
              ]);
              
              designers = result.data;
              error = result.error;
              console.log('Approach 4 succeeded:', { designers, error });
            } catch (finalError) {
              console.log('All approaches failed, final error:', finalError.message);
              throw finalError;
            }
          }
        }
      }

      if (error) {
        console.error('All approaches failed, final error:', error);
        throw error;
      }

      if (designers) {
        console.log('Designers loaded successfully:', designers.length);
        console.log('Designer names:', designers.map(d => d.name));
        
        // Dispatch the action to update state
        dispatch({ type: 'SET_DESIGNERS', payload: designers });
        
        // Wait a moment for state to update, then check
        setTimeout(() => {
          console.log('State after dispatch:', state);
        }, 100);
      } else {
        console.log('No designers returned from any approach');
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
  const loadAssessments = async () => {
    if (state.designers.length === 0) return;

    console.log('Loading assessments...');
    dispatch({ type: 'SET_ASSESSMENTS_LOADING', payload: true });

    try {
      const assessments = {};
      
      for (const designer of state.designers) {
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
        
        // Load data sequentially
        await loadDesigners();
        await loadAssessments();
        
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
          if (state.designers.length === 0) {
            console.log('Auth SIGNED_IN: No designers, loading data...');
            await loadDesigners();
            await loadAssessments();
            dispatch({ type: 'SET_LOADING', payload: false });
          } else {
            console.log('Auth SIGNED_IN: Designers already loaded, skipping...');
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_DESIGNERS', payload: [] });
          dispatch({ type: 'SET_ASSESSMENTS', payload: {} });
          dispatch({ type: 'SET_LOADING', payload: false });
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
      // First, create the assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert([{
          designer_id: designerId,
          user_id: state.user.id
        }])
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Then, create the assessment skills
      const assessmentSkills = skills.map(skill => ({
        assessment_id: assessment.id,
        skill_id: skill.id || skill.name, // Handle both cases
        proficiency: skill.proficiency
      }));

      const { error: skillsError } = await supabase
        .from('assessment_skills')
        .insert(assessmentSkills);

      if (skillsError) throw skillsError;

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

      return updatedAssessment;
    } catch (error) {
      console.error('Error saving assessment:', error);
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