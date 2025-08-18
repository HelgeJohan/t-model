import React from 'react';
import styled from 'styled-components';
import { useDesigner } from '../context/DesignerContext';

const SelectorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 0;
  flex-wrap: wrap;
`;

const CurrentDesigner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: white;
  color: #333333;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  border: none;
  height: 35px;
`;

const DesignerName = styled.span`
  font-size: 1.1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
`;

const DesignerSelector = () => {
  const { designers, currentDesigner } = useDesigner();

  const currentDesignerData = designers.find(d => d.id === currentDesigner);

  if (designers.length === 0) {
    return (
      <SelectorContainer>
        <EmptyState>No designers registered yet</EmptyState>
      </SelectorContainer>
    );
  }

  return (
    <SelectorContainer>
      <CurrentDesigner>
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
        {currentDesigner?.name || 'Ingen designer valgt'}
      </CurrentDesigner>
    </SelectorContainer>
  );
};

export default DesignerSelector;
