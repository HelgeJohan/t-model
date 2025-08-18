import React from 'react';
import styled from 'styled-components';
import { useDesigner } from '../context/DesignerContext';

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: white;
  border: none;
  color: #333333;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.4 : 1};
  height: 35px;
  
  &:hover:not(:disabled) {
    background: #777777;
    color: white;
    
    svg {
      fill: #ffffff !important;
    }
  }
`;

const ArrowIcon = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;

const DesignerName = styled.span`
  font-size: 1rem;
  font-weight: 500;
`;

const Spacer = styled.div`
  width: 200px;
`;

const DesignerNavigation = ({ currentDesignerId, onDesignerChange }) => {
  const { designers } = useDesigner();
  
  if (!currentDesignerId || designers.length <= 1) {
    return null;
  }

  const currentIndex = designers.findIndex(d => d.id === currentDesignerId);
  const previousDesigner = currentIndex > 0 ? designers[currentIndex - 1] : null;
  const nextDesigner = currentIndex < designers.length - 1 ? designers[currentIndex + 1] : null;

  const handlePrevious = () => {
    if (previousDesigner && onDesignerChange) {
      onDesignerChange(previousDesigner.id);
    }
  };

  const handleNext = () => {
    if (nextDesigner && onDesignerChange) {
      onDesignerChange(nextDesigner.id);
    }
  };

  return (
    <NavigationContainer>
      {previousDesigner ? (
        <NavButton onClick={handlePrevious}>
          <svg 
            style={{ 
              width: '20px', 
              height: '20px', 
              marginRight: '8px',
              fill: '#777777',
              transition: 'fill 0.2s ease'
            }}
            viewBox="0 0 24 24"
          >
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          <DesignerName>Forrige: {previousDesigner.name}</DesignerName>
        </NavButton>
      ) : (
        <Spacer />
      )}
      
      <div style={{ 
        color: '#333333', 
        fontSize: '1rem', 
        fontWeight: '500',
        textAlign: 'center'
      }}>
        {currentIndex + 1} av {designers.length}
      </div>
      
      {nextDesigner ? (
        <NavButton onClick={handleNext}>
          <DesignerName>Neste: {nextDesigner.name}</DesignerName>
          <svg 
            style={{ 
              width: '20px', 
              height: '20px', 
              marginLeft: '8px',
              fill: '#777777',
              transition: 'fill 0.2s ease'
            }}
            viewBox="0 0 24 24"
          >
            <path d="M4 11h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41L16.17 13H4v-2z"/>
          </svg>
        </NavButton>
      ) : (
        <Spacer />
      )}
    </NavigationContainer>
  );
};

export default DesignerNavigation;