import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DesignerContext = createContext();

const initialState = {
  designers: [],
  currentDesigner: null,
  assessments: {},
  user: null,
  loading: true
};

function designerReducer(state, action) {
  console.log('Reducer called with action:', action.type);
  console.log('Current state:', state);
  
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_DESIGNERS':
      return { ...state, designers: action.payload };
    
    case 'ADD_DESIGNER':
      return { ...state, designers: [...state.designers, action.payload] };
    
    case 'UPDATE_DESIGNER':
      return {
        ...state,
        designers: state.designers.map(d => 
          d.id === action.payload.id ? { ...d, name: action.payload.name } : d
        )
      };
    
    case 'DELETE_DESIGNER':
      return {
        ...state,
        designers: state.designers.filter(d => d.id !== action.payload),
        currentDesigner: state.currentDesigner === action.payload ? null : state.currentDesigner,
        assessments: Object.fromEntries(
          Object.entries(state.assessments).filter(([id]) => id !== action.payload)
        )
      };
    
    case 'SET_CURRENT_DESIGNER':
      return { ...state, currentDesigner: action.payload };
    
    case 'SET_ASSESSMENTS':
      return { ...state, assessments: action.payload };
    
    case 'UPDATE_ASSESSMENT':
      return {
        ...state,
        assessments: {
          ...state.assessments,
          [action.payload.designerId]: action.payload.assessment
        }
      };
    
    default:
      return state;
  }
}

export function DesignerProvider({ children }) {
  const [state, dispatch] = useReducer(designerReducer, initialState);

  // Check for existing user session on app load
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
        await loadUserData(user.id);
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          dispatch({ type: 'SET_USER', payload: session.user });
          await loadUserData(session.user.id);
        } else {
          dispatch({ type: 'SET_USER', payload: null });
          dispatch({ type: 'SET_DESIGNERS', payload: [] });
          dispatch({ type: 'SET_ASSESSMENTS', payload: {} });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      // Load designers for this user
      const { data: designers, error: designersError } = await supabase
        .from('designers')
        .select('*')
        .eq('user_id', userId);

      if (designersError) throw designersError;

      if (designers) {
        dispatch({ type: 'SET_DESIGNERS', payload: designers });
        
        // Load assessments for each designer
        const assessments = {};
        for (const designer of designers) {
          const { data: assessment, error: assessmentError } = await supabase
            .from('assessments')
            .select(`
              *,
              assessment_skills (
                skill_id,
                proficiency,
                notes
              )
            `)
            .eq('designer_id', designer.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!assessmentError && assessment && assessment.length > 0) {
            const latestAssessment = assessment[0];
            const skills = latestAssessment.assessment_skills.map(as => ({
              name: getSkillName(as.skill_id), // We'll implement this
              proficiency: as.proficiency
            }));
            
            assessments[designer.id] = {
              skills,
              timestamp: latestAssessment.created_at
            };
          }
        }
        
        dispatch({ type: 'SET_ASSESSMENTS', payload: assessments });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getSkillName = (skillId) => {
    // This will be implemented when we load skills from database
    // For now, return a placeholder
    return 'Skill ' + skillId;
  };

  const addDesigner = async (name, email) => {
    if (!state.user) return null;

    try {
      const { data: designer, error } = await supabase
        .from('designers')
        .insert([
          {
            name,
            email,
            user_id: state.user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_DESIGNER', payload: designer });
      return designer;
    } catch (error) {
      console.error('Error adding designer:', error);
      return null;
    }
  };

  const updateDesigner = async (id, name) => {
    try {
      const { data: designer, error } = await supabase
        .from('designers')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_DESIGNER', payload: { id, name } });
      return designer;
    } catch (error) {
      console.error('Error updating designer:', error);
      return null;
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
      return true;
    } catch (error) {
      console.error('Error deleting designer:', error);
      return false;
    }
  };

  const saveAssessment = async (designerId, skills) => {
    if (!state.user) return false;

    try {
      // First, create or get the latest assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert([
          {
            designer_id: designerId,
            name: 'Assessment'
          }
        ])
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Then, insert all the skill proficiencies
      const skillData = skills.map(skill => ({
        assessment_id: assessment.id,
        skill_id: getSkillIdByName(skill.name), // We'll implement this
        proficiency: skill.proficiency
      }));

      const { error: skillsError } = await supabase
        .from('assessment_skills')
        .insert(skillData);

      if (skillsError) throw skillsError;

      // Update local state
      dispatch({
        type: 'UPDATE_ASSESSMENT',
        payload: {
          designerId,
          assessment: {
            skills,
            timestamp: assessment.created_at
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Error saving assessment:', error);
      return false;
    }
  };

  const getSkillIdByName = (skillName) => {
    // This will be implemented when we load skills from database
    // For now, return a placeholder
    return 'skill-id-placeholder';
  };

  const value = {
    ...state,
    addDesigner,
    updateDesigner,
    deleteDesigner,
    saveAssessment
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