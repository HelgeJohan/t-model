import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DesignerProvider, useDesigner } from './context/DesignerContext';
import TModel from './components/TModel';
import DesignerRegistration from './components/DesignerRegistration';
import DesignerNavigation from './components/DesignerNavigation';
import ComparisonOverlay from './components/ComparisonOverlay';
import { exportToPDF, exportAllAssessments } from './utils/pdfExport';
import Authentication from './components/Authentication';

const AppContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  margin: 20px;
  transition: all 0.3s ease;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: #333333;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #333333;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
`;

const AddDesignerButton = styled.button`
  background: white;
  color: #333333;
  border: 2px solid #777777;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #777777;
    color: white;
    
    span {
      color: #ffffff !important;
    }
  }
`;

const SaveButton = styled.button`
  background: #333333;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #555555;
    color: white;
  }
`;

const SwitchDesignerButton = styled.button`
  background: white;
  border: 2px solid #777777;
  color: #333333;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #777777;
    color: white;
    
    svg {
      fill: #ffffff !important;
    }
  }
`;

const DesignerList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 2px solid #777777;
  border-radius: 8px;
  margin-top: 5px;
  padding: 0;
  z-index: 9999;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  width: fit-content;
  display: ${props => props.show ? 'block' : 'none'};
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: visible;
`;

const DesignerItem = styled.div`
  padding: 12px 24px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #333333;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
  
  &:hover {
    background-color: #f7fafc;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #AAAAAA;
  }
`;

const AppContent = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showDesignerList, setShowDesignerList] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedDesigners, setSelectedDesigners] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [editingDesignerId, setEditingDesignerId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [skills, setSkills] = useState([
    { name: 'Forretnings-analyse', proficiency: 0 },
    { name: 'Brukerinnsikt', proficiency: 0 },
    { name: 'Grafisk design', proficiency: 0 },
    { name: 'Innholds-design', proficiency: 0 },
    { name: 'Interaksjons-design', proficiency: 0 },
    { name: 'Informasjons-arkitektur', proficiency: 0 },
    { name: 'Brukertesting', proficiency: 0 },
    { name: 'Frontend design, UU', proficiency: 0 },
    { name: 'Prototyping', proficiency: 0 },
    { name: 'Data og trafikkanalyse', proficiency: 0 }
  ]);

  const { 
    currentDesigner, 
    setCurrentDesigner, 
    designers, 
    addDesigner, 
    saveAssessment, 
    getCurrentAssessment,
    getDesignerAssessment,
    migrateAllAssessments,
    updateDesigner,
    deleteDesigner,
    user,
    loading
  } = useDesigner();

  useEffect(() => {
    if (currentDesigner) {
      console.log('=== LOADING SKILLS FOR DESIGNER ===');
      console.log('Loading skills for designer:', currentDesigner);
      
      const assessment = getDesignerAssessment(currentDesigner);
      console.log('Retrieved assessment:', assessment);
      
      if (assessment && assessment.skills) {
        console.log('Setting skills from assessment:', assessment.skills);
        setSkills(assessment.skills);
      } else {
        console.log('No assessment found, resetting to default skills');
        // Reset to default skills for new designer
        setSkills([
          { name: 'Forretnings-analyse', proficiency: 0 },
          { name: 'Brukerinnsikt', proficiency: 0 },
          { name: 'Grafisk design', proficiency: 0 },
          { name: 'Innholds-design', proficiency: 0 },
          { name: 'Interaksjons-design', proficiency: 0 },
          { name: 'Informasjons-arkitektur', proficiency: 0 },
          { name: 'Brukertesting', proficiency: 0 },
          { name: 'Frontend design, UU', proficiency: 0 },
          { name: 'Prototyping', proficiency: 0 },
          { name: 'Data og trafikkanalyse', proficiency: 0 }
        ]);
      }
      console.log('=== END LOADING SKILLS ===');
    }
  }, [currentDesigner, getDesignerAssessment]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDesignerList && !event.target.closest('.designer-dropdown')) {
        console.log('Click outside detected, closing dropdown');
        setShowDesignerList(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDesignerList]);

  const handleSave = () => {
    if (currentDesigner) {
      saveAssessment(currentDesigner, { skills });
      console.log('Assessment saved for designer:', currentDesigner);
    }
  };

  const updateSkill = (skillName, newProficiency) => {
    console.log('=== UPDATE SKILL CALLED ===');
    console.log('Updating skill:', skillName, 'to proficiency:', newProficiency);
    console.log('Current skills state:', skills);
    
    setSkills(prevSkills => 
      prevSkills.map(skill => 
        skill.name === skillName 
          ? { ...skill, proficiency: newProficiency }
          : skill
      )
    );
  };

  const startEditingDesigner = (designer) => {
    setEditingDesignerId(designer.id);
    setEditingName(designer.name);
  };

  const saveDesignerName = (designerId) => {
    if (editingName.trim()) {
      // Update designer name in context
      updateDesigner(designerId, editingName.trim());
      setEditingDesignerId(null);
      setEditingName('');
    }
  };

  const cancelEditingDesigner = () => {
    setEditingDesignerId(null);
    setEditingName('');
  };

  const handleDeleteDesigner = (designerId) => {
    if (window.confirm(`Er du sikker på at du vil slette denne designeren? Dette vil fjerne alle deres vurderinger permanent.`)) {
      // Remove from designers list and assessments
      deleteDesigner(designerId);
      
      // Clear current designer if it was the deleted one
      if (currentDesigner === designerId) {
        setCurrentDesigner(null);
      }
      
      // Clear editing state
      setEditingDesignerId(null);
      setEditingName('');
    }
  };

  return (
    <AppContainer>
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          Loading...
        </div>
      ) : !user ? (
        <Authentication />
      ) : (
        <>
          {!currentDesigner ? (
            // Landing page
            <div>
              <Title>T-modell for ferdigheter med brukeropplevelsesdesign</Title>
              <Subtitle>Hvilke deler av brukeropplevelsesdesign behersker du og dine kolleger</Subtitle>
              
              <div style={{ textAlign: 'left', marginBottom: '70px', marginTop: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-start', alignItems: 'center' }}>
                  <AddDesignerButton onClick={() => setShowRegistration(true)}>
                    <svg 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        marginRight: '8px',
                        fill: '#777777'
                      }}
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Legg til designer
                  </AddDesignerButton>
                  
                  {designers.length > 0 && (
                    <button
                      onClick={() => exportAllAssessments(designers, getDesignerAssessment)}
                      style={{
                        background: 'white',
                        border: 'none',
                        color: '#333333',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        height: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#777777';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#333333';
                      }}
                    >
                      <svg 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          marginRight: '8px',
                          fill: 'currentColor'
                        }}
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                      </svg>
                      Eksporter designere
                    </button>
                  )}
                </div>
              </div>

              {designers.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#333333' }}>Designere</h3>
                    <button
                      onClick={() => setIsComparing(!isComparing)}
                      style={{
                        background: 'white',
                        border: 'none',
                        color: '#333333',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        height: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#777777';
                        e.target.style.color = 'white';
                        // Update icon color to white if there is one
                        const icon = e.target.querySelector('span');
                        if (icon) icon.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#333333';
                        // Reset icon color to #777777 if there is one
                        const icon = e.target.querySelector('span');
                        if (icon) icon.style.color = '#777777';
                      }}
                    >
                      {isComparing ? 'Stopp sammenligning' : 'Sammenlign designere'}
                    </button>
                  </div>
                  
                  <div style={{ 
                    height: '1px', 
                    background: '#777777', 
                    marginBottom: '10px' 
                  }}></div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '2px',
                    justifyContent: 'flex-start',
                    maxWidth: '100%'
                  }}>
                    {isComparing && (
                      <button
                        onClick={() => {
                          if (selectedDesigners.length === designers.length) {
                            setSelectedDesigners([]);
                          } else {
                            setSelectedDesigners(designers.map(d => d.id));
                          }
                        }}
                        style={{
                          background: selectedDesigners.length === designers.length ? '#777777' : 'white',
                          border: 'none',
                          color: selectedDesigners.length === designers.length ? 'white' : '#333333',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          height: '35px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedDesigners.length !== designers.length) {
                            e.target.style.background = '#777777';
                            e.target.style.color = 'white';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedDesigners.length !== designers.length) {
                            e.target.style.background = 'white';
                            e.target.style.color = '#333333';
                          }
                        }}
                      >
                        <svg 
                          style={{ 
                            width: '16px',
                            height: '16px', 
                            marginRight: '8px',
                            fill: selectedDesigners.length === designers.length ? '#ffffff' : '#777777',
                            transition: 'fill 0.2s ease'
                          }}
                          viewBox="0 0 24 24"
                        >
                          {selectedDesigners.length === designers.length ? (
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          ) : (
                            <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                          )}
                        </svg>
                        Velg alle
                      </button>
                    )}
                    
                    {designers.map(designer => (
                      isComparing ? (
                        <button
                          key={designer.id}
                          onClick={() => {
                            if (selectedDesigners.includes(designer.id)) {
                              setSelectedDesigners(selectedDesigners.filter(id => id !== designer.id));
                            } else {
                              setSelectedDesigners([...selectedDesigners, designer.id]);
                            }
                          }}
                          style={{
                            background: selectedDesigners.includes(designer.id) ? '#777777' : 'white',
                            border: 'none',
                            color: selectedDesigners.includes(designer.id) ? 'white' : '#333333',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            height: '35px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedDesigners.includes(designer.id)) {
                              e.target.style.background = '#777777';
                              e.target.style.color = 'white';
                              const icon = e.target.querySelector('svg');
                              if (icon) icon.style.fill = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedDesigners.includes(designer.id)) {
                              e.target.style.background = 'white';
                              e.target.style.color = '#333333';
                              const icon = e.target.querySelector('svg');
                              if (icon) icon.style.fill = '#777777';
                            }
                          }}
                        >
                          <svg 
                            style={{ 
                              width: '16px',
                              height: '16px', 
                              marginRight: '8px',
                              fill: selectedDesigners.includes(designer.id) ? '#ffffff' : '#777777',
                              transition: 'fill 0.2s ease'
                            }}
                            viewBox="0 0 24 24"
                          >
                            {selectedDesigners.includes(designer.id) ? (
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            ) : (
                              <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                            )}
                          </svg>
                          {designer.name}
                        </button>
                      ) : (
                        <button
                          key={designer.id}
                          onClick={() => setCurrentDesigner(designer.id)}
                          style={{
                            background: 'white',
                            border: 'none',
                            color: '#333333',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            height: '35px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#777777';
                            e.target.style.color = 'white';
                            const icon = e.target.querySelector('svg');
                            if (icon) icon.style.fill = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.color = '#333333';
                            const icon = e.target.querySelector('svg');
                            if (icon) icon.style.fill = '#777777';
                          }}
                        >
                          <svg 
                            className="designer-icon"
                            style={{ 
                              width: '20px',
                              height: '20px', 
                              marginRight: '8px',
                              fill: '#777777',
                              transition: 'fill 0.2s ease'
                            }}
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                          {designer.name}
                        </button>
                      )
                    ))}
                  </div>
                  
                  {isComparing && (
                    <div style={{ marginTop: '20px' }}>
                      <button
                        onClick={() => setShowComparison(true)}
                        style={{
                          background: 'white',
                          color: '#333333',
                          border: '2px solid #777777',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          height: '35px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#777777';
                          e.target.style.color = 'white';
                          // Update icon color to white if there is one
                          const icon = e.target.querySelector('span');
                          if (icon) icon.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.color = '#333333';
                          // Reset icon color to #777777 if there is one
                          const icon = e.target.querySelector('span');
                          if (icon) icon.style.color = '#777777';
                        }}
                      >
                        Vis sammenligning
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {designers.length === 0 && (
                <div style={{ marginTop: '40px', color: '#999', fontStyle: 'italic' }}>
                  Ingen designers registrert enda
                </div>
              )}
            </div>
          ) : (
            // Assessment view
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '30px' 
              }}>
                <button
                  onClick={() => setCurrentDesigner(null)}
                  style={{
                    background: 'white',
                    border: 'none',
                    color: '#333333',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    height: '35px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#777777';
                    e.target.style.color = 'white';
                    const icon = e.target.querySelector('svg');
                    if (icon) {
                      icon.style.fill = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = '#333333';
                    const icon = e.target.querySelector('svg');
                    if (icon) {
                      icon.style.fill = '#777777';
                    }
                  }}
                >
                  <svg 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      marginRight: '8px',
                      fill: '#777777'
                    }}
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                  </svg>
                  Forside
                </button>
                
                <div style={{ display: 'flex', gap: '15px', position: 'relative' }}>
                  <SwitchDesignerButton 
                    className="designer-dropdown"
                    onClick={() => {
                      console.log('Dropdown clicked, current state:', showDesignerList);
                      setShowDesignerList(!showDesignerList);
                    }}
                  >
                    <svg 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        marginRight: '8px',
                        fill: '#777777'
                      }}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Velg en annen designer
                  </SwitchDesignerButton>
                  
                  {showDesignerList && (
                    <DesignerList 
                      show={showDesignerList}
                      onClick={(e) => {
                        console.log('DesignerList clicked');
                        e.stopPropagation();
                      }}
                    >
                      {console.log('Rendering dropdown with designers:', designers)}
                      {designers.map((designer, index) => {
                        console.log('Rendering designer item:', designer.name);
                        return (
                          <DesignerItem 
                            key={designer.id}
                            ref={index === 0 ? (el) => {
                              if (el) {
                                console.log('First designer item DOM element:', el);
                                console.log('Icon element:', el.querySelector('svg'));
                              }
                            } : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Dropdown item clicked:', designer.name, designer.id);
                              setCurrentDesigner(designer.id);
                              setShowDesignerList(false);
                            }}
                            onMouseDown={(e) => {
                              console.log('Mouse down on dropdown item:', designer.name);
                            }}
                            onMouseUp={(e) => {
                              console.log('Mouse up on dropdown item:', designer.name);
                            }}
                          >
                            <svg 
                              style={{ 
                                width: '20px',
                                height: '20px', 
                                fill: '#777777',
                                flexShrink: 0,
                                display: 'block',
                                visibility: 'visible',
                                opacity: 1
                              }}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            {designer.name}
                          </DesignerItem>
                        );
                      })}
                    </DesignerList>
                  )}
                  
                  <AddDesignerButton onClick={() => setShowRegistration(true)}>
                    <svg 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        marginRight: '8px',
                        fill: '#777777'
                      }}
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Legg til designer
                  </AddDesignerButton>
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  marginBottom: '10px' 
                }}>
                  <Title style={{ textAlign: 'left', marginBottom: '0', flex: 1 }}>
                    Egenevaluering: {editingDesignerId === currentDesigner ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveDesignerName(currentDesigner);
                          } else if (e.key === 'Escape') {
                            cancelEditingDesigner();
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#333333',
                          fontSize: '2.5rem',
                          fontWeight: '700',
                          outline: 'none',
                          marginLeft: '10px'
                        }}
                        autoFocus
                      />
                    ) : (
                      <span style={{ marginLeft: '10px' }}>
                        {designers.find(d => d.id === currentDesigner)?.name}
                      </span>
                    )}
                  </Title>
                  
                  {editingDesignerId === currentDesigner ? (
                    <>
                      <button
                        onClick={() => saveDesignerName(currentDesigner)}
                        style={{
                          background: '#333333',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          height: '35px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#555555';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#333333';
                        }}
                      >
                        Lagre
                      </button>
                      <button
                        onClick={cancelEditingDesigner}
                        style={{
                          background: 'white',
                          color: '#777777',
                          border: '2px solid #777777',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          height: '35px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#777777';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.color = '#777777';
                        }}
                      >
                        Avbryt
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditingDesigner(designers.find(d => d.id === currentDesigner))}
                        style={{
                          background: 'white',
                          color: '#777777',
                          border: '2px solid #777777',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          height: '35px',
                          width: '35px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#777777';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.color = '#777777';
                        }}
                        title="Rediger navn"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                        >
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteDesigner(currentDesigner)}
                        style={{
                          background: 'white',
                          color: '#dc3545',
                          border: '2px solid #dc3545',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          height: '35px',
                          width: '35px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#dc3545';
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.color = '#dc3545';
                        }}
                        title="Slett designer"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                        >
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <Subtitle style={{ textAlign: 'left', marginBottom: '0' }}>
                  Hvilke deler av brukeropplevelsesdesign behersker du. Dra i stolpene for å angi ferdighetsnivå.
                </Subtitle>
              </div>
              
              <div>
                <TModel skills={skills} onUpdateSkill={updateSkill} />
                
                <div style={{ marginTop: '30px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <SaveButton onClick={handleSave}>
                      <svg 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          marginRight: '8px',
                          fill: '#ffffff'
                        }}
                        viewBox="0 0 24 24"
                      >
                        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3s1.34-3 3-3 3 1.34-3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                      </svg>
                      Lagre evaluering
                    </SaveButton>
                    
                    <button
                      onClick={() => exportToPDF(
                        `Egenevaluering: ${designers.find(d => d.id === currentDesigner)?.name}`,
                        document.querySelector('.tmodel-container') || document.querySelector('[data-testid="tmodel"]')
                      )}
                      style={{
                        background: 'white',
                        color: '#333333',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        height: '35px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#777777';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#333333';
                      }}
                    >
                      <svg 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          marginRight: '8px',
                          fill: 'currentColor'
                        }}
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                      </svg>
                      Eksporter til PDF
                    </button>
                  </div>
                </div>
                
                {console.log('=== RENDERING TMODEL ===')}
                {console.log('Skills being passed to TModel:', skills)}
              </div>
              
              <DesignerNavigation 
                currentDesignerId={currentDesigner} 
                onDesignerChange={setCurrentDesigner}
              />
            </div>
          )}

          {showRegistration && (
            <DesignerRegistration onClose={() => setShowRegistration(false)} />
          )}
          {showComparison && (
            <ComparisonOverlay
              selectedDesignerIds={selectedDesigners}
              onClose={() => setShowComparison(false)}
            />
          )}
        </>
      )}
    </AppContainer>
  );
};

export default function App() {
  return (
    <DesignerProvider>
      <AppContent />
    </DesignerProvider>
  );
}