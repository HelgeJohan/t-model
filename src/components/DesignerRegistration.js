import React, { useState } from 'react';
import styled from 'styled-components';
import { useDesigner } from '../context/DesignerContext';

const RegistrationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const RegistrationCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h2`
  color: #333333;
  font-size: 1.8rem;
  margin-bottom: 15px;
  text-align: center;
`;

const Description = styled.p`
  color: #333333;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 25px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #777777;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 25px;
  outline: none;
  transition: border-color 0.2s ease;
  
  &:focus {
    border-color: #333333;
  }
  
  &::placeholder {
    color: #999;
  }
`;

const Button = styled.button`
  background: #333333;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  margin-bottom: 15px;
  min-height: 20px;
`;

const DesignerRegistration = ({ onClose }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { addDesigner, designers } = useDesigner();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Vennligst skriv navnet ditt');
      return;
    }
    
    // Check if name already exists
    const nameExists = designers.some(
      designer => designer.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (nameExists) {
      setError('En designer med dette navnet eksisterer allerede');
      return;
    }
    
    // Add designer and close
    addDesigner(name);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <RegistrationOverlay onClick={onClose}>
      <RegistrationCard onClick={(e) => e.stopPropagation()}>
        <Title>Legg til designer</Title>
        <Description>
          Start din egenvurdering nå. Du kan lagre valgene dine og komme tilbake og oppdatere valgene når som helst.
        </Description>
        
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Skriv navnet ditt"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          
          <ErrorMessage>{error}</ErrorMessage>
          
          <Button type="submit" disabled={!name.trim()}>
            Legg til og start egenvurdering
          </Button>
        </form>
      </RegistrationCard>
    </RegistrationOverlay>
  );
};

export default DesignerRegistration;