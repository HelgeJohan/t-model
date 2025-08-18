import React from 'react';
import styled from 'styled-components';
import ComparisonTModel from './ComparisonTModel';
import { useDesigner } from '../context/DesignerContext';
import { exportToPDF } from '../utils/pdfExport';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const ComparisonContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 1400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const Title = styled.h2`
  color: #333;
  font-size: 2rem;
  margin-bottom: 30px;
  text-align: left;
`;

const ComparisonTable = styled.div`
  width: 100%;
  margin-top: 30px;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 0;
  margin-bottom: 10px;
`;

const SkillNameHeader = styled.div`
  width: 150px;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
  flex-shrink: 0;
`;

const DesignerHeader = styled.div`
  flex: 1;
  text-align: center;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
  padding: 0 10px;
`;

const SkillRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0;
  margin-bottom: 10px;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const SkillName = styled.div`
  width: 150px;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
`;

const GraphContainer = styled.div`
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 0 10px;
`;

const DesignerGraph = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const BarContainer = styled.div`
  width: 100%;
  height: 48px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e1e5e9;
`;

const SkillRectangle = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.color};
  border-radius: 3px;
  transition: all 0.3s ease;
`;

const DesignerName = styled.div`
  font-size: 0.8rem;
  color: #333;
  font-weight: 600;
  margin-bottom: 5px;
`;

const ComparisonOverlay = ({ selectedDesignerIds, onClose }) => {
  const { getDesignerAssessment, designers } = useDesigner();
  
  const selectedDesigners = designers.filter(d => selectedDesignerIds.includes(d.id));

  // Color palette for 11 skill levels (0% to 100%)
  const getSkillColor = (proficiency) => {
    const colors = {
      0: '#FFFFFF',    // 0% - White (no fill)
      10: '#D4DBF9',   // 10% - Very Light Blue
      20: '#C8D1F7',   // 20% - Light Blue
      30: '#AFBCF3',   // 30% - Light Blue
      40: '#97A7EF',   // 40% - Medium Light Blue
      50: '#7E93EC',   // 50% - Medium Blue
      60: '#667EE8',   // 60% - Blue
      70: '#566AC3',   // 70% - Medium Dark Blue
      80: '#45569E',   // 80% - Dark Blue
      90: '#354279',   // 90% - Very Dark Blue
      100: '#252D54'   // 100% - Darkest Blue
    };
    
    // Round to nearest 10% increment
    const roundedProficiency = Math.round(proficiency / 10) * 10;
    return colors[roundedProficiency] || colors[0];
  };

  return (
    <Overlay onClick={onClose}>
      <ComparisonContainer onClick={(e) => e.stopPropagation()}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px'
          }}>
            <Title style={{ margin: 0, textAlign: 'left' }}>Sammenligning av designerferdigheter</Title>
            
            <button
              onClick={() => exportToPDF(
                'Sammenligning av designerferdigheter',
                document.querySelector('.comparison-container')
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
          
          <button
            onClick={onClose}
            style={{
              background: 'white',
              color: '#333333',
              border: 'none',
              padding: '8px',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '1rem',
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
              e.target.style.color = '#333333';
            }}
          >
            <svg 
              style={{ 
                width: '20px', 
                height: '20px', 
                fill: 'currentColor'
              }}
              viewBox="0 0 24 24"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <ComparisonTable className="comparison-container">
          <TableHeader>
            <SkillNameHeader>Ferdighet</SkillNameHeader>
            {selectedDesigners.map(designer => (
              <DesignerHeader key={designer.id}>{designer.name}</DesignerHeader>
            ))}
          </TableHeader>
          
          {[
            'Forretnings-analyse',
            'Brukerinnsikt', 
            'Grafisk design',
            'Innholds-design',
            'Interaksjons-design',
            'Informasjons-arkitektur',
            'Brukertesting',
            'Frontend design, UU',
            'Prototyping',
            'Data og trafikkanalyse'
          ].map(skillName => (
            <SkillRow key={skillName}>
              <SkillName>{skillName}</SkillName>
              <GraphContainer>
                {selectedDesigners.map(designer => {
                  const assessment = getDesignerAssessment(designer.id);
                  const skills = assessment?.skills || [
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
                  ];
                  const skill = skills.find(s => s.name === skillName);
                  const proficiency = skill ? skill.proficiency : 0;
                    
                  return (
                    <DesignerGraph key={designer.id}>
                      <BarContainer>
                        <SkillRectangle color={getSkillColor(proficiency)} />
                      </BarContainer>
                    </DesignerGraph>
                  );
                })}
              </GraphContainer>
            </SkillRow>
          ))}
        </ComparisonTable>
      </ComparisonContainer>
    </Overlay>
  );
};

export default ComparisonOverlay;
