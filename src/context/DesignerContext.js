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
    console.log('=== LOADING USER DATA ===');
    console.log('User ID:', userId);
    
    try {
      // Load ALL designers (no user filtering)
      console.log('Fetching designers from database...');
      
      // Add timeout to prevent hanging
      const designersPromise = supabase
        .from('designers')
        .select('*')
        .order('name');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Designers fetch timeout')), 10000)
      );
      
      const { data: designers, error: designersError } = await Promise.race([
        designersPromise,
        timeoutPromise
      ]);

      console.log('Designers response:', { designers, designersError });

      if (designersError) {
        console.error('Error fetching designers:', designersError);
        throw designersError;
      }

      if (designers) {
        console.log('Setting designers in state:', designers);
        dispatch({ type: 'SET_DESIGNERS', payload: designers });
        
        // Load assessments for each designer
        const assessments = {};
        for (const designer of designers) {
          console.log('Loading assessment for designer:', designer.name);
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

          console.log('Assessment for', designer.name, ':', assessment);

          if (!assessmentError && assessment && assessment.length > 0) {
            const latestAssessment = assessment[0];
            const skills = latestAssessment.assessment_skills.map(as => ({
              name: getSkillName(as.skill_id),
              proficiency: as.proficiency
            }));
            
            assessments[designer.id] = {
              skills,
              timestamp: latestAssessment.created_at
            };
          }
        }
        
        console.log('Setting assessments in state:', assessments);
        dispatch({ type: 'SET_ASSESSMENTS', payload: assessments });
      } else {
        console.log('No designers found in database');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      console.error('Error details:', error.message, error.code, error.details);
    }
  };

  const getSkillName = (skillId) => {
    // This will be implemented when we load skills from database
    // For now, return a placeholder
    return 'Skill ' + skillId;
  };

  const addDesigner = async (name) => {
    console.log('=== ADD DESIGNER START ===');
    console.log('DesignerContext.addDesigner called with:', name);
    console.log('Current user:', state.user);
    
    if (!state.user) {
      console.log('No user, returning null');
      return null;
    }

    try {
      console.log('Attempting to insert designer into database...');
      console.log('Inserting data:', { name, user_id: state.user.id });
      
      // Test database connection first with a simple select
      console.log('Testing database connection with simple select...');
      console.log('About to call supabase.from...');
      
      // Test if supabase object is working
      console.log('Supabase object:', supabase);
      console.log('Supabase.from method:', typeof supabase.from);
      
      // Try the query step by step
      const query = supabase.from('designers');
      console.log('Query object created:', query);
      
      const selectQuery = query.select('id');
      console.log('Select query created:', selectQuery);
      
      const limitQuery = selectQuery.limit(1);
      console.log('Limit query created:', limitQuery);
      
      console.log('About to await the query...');
      const { data: testData, error: testError } = await limitQuery;
      
      console.log('Connection test result:', { testData, testError });
      
      if (testError) {
        console.log('Connection test failed:', testError);
        throw testError;
      }
      
      console.log('Connection test successful, proceeding with insert...');
      
      const { data: designer, error } = await supabase
        .from('designers')
        .insert([
          {
            name,
            user_id: state.user.id
          }
        ])
        .select()
        .single();

      console.log('Database response:', { designer, error });

      if (error) {
        console.log('Database error, throwing:', error);
        throw error;
      }

      console.log('Designer added to database, updating state...');
      dispatch({ type: 'ADD_DESIGNER', payload: designer });
      console.log('State updated, returning designer:', designer);
      return designer;
    } catch (error) {
      console.error('Error adding designer:', error);
      console.error('Error details:', error.message, error.code, error.details);
      console.error('Error stack:', error.stack);
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

  const getDesignerAssessment = (designerId) => {
    console.log('=== GET DESIGNER ASSESSMENT ===');
    console.log('Looking for assessment for designer:', designerId);
    console.log('Current assessments state:', state.assessments);
    
    const assessment = state.assessments[designerId];
    console.log('Found assessment:', assessment);
    
    return assessment;
  };

  const value = {
    ...state,
    addDesigner,
    updateDesigner,
    deleteDesigner,
    saveAssessment,
    getDesignerAssessment, // Add this line
    setCurrentDesigner: (designerId) => {
      dispatch({ type: 'SET_CURRENT_DESIGNER', payload: designerId });
    }
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