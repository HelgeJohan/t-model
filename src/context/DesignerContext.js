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
    if (state.designers.length > 0) {
      console.log('Designers already loaded, skipping...');
      return;
    }

    console.log('Loading designers...');
    dispatch({ type: 'SET_DESIGNERS_LOADING', payload: true });

    try {
      const { data: designers, error } = await supabase
        .from('designers')
        .select('*')
        .order('name');

      if (error) throw error;

      if (designers) {
        console.log('Designers loaded:', designers.length);
        dispatch({ type: 'SET_DESIGNERS', payload: designers });
      }
    } catch (error) {
      console.error('Error loading designers:', error);
    } finally {
      dispatch({ type: 'SET_DESIGNERS_LOADING', payload: false });
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
      if (isInitialized) return;
      
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
      } else {
        console.log('No user found');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      
      setIsInitialized(true);
    };

    initializeApp();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          dispatch({ type: 'SET_USER', payload: session.user });
          await loadDesigners();
          await loadAssessments();
          // Also set loading to false after auth change
          dispatch({ type: 'SET_LOADING', payload: false });
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_DESIGNERS', payload: [] });
          dispatch({ type: 'SET_ASSESSMENTS', payload: {} });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isInitialized]);

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