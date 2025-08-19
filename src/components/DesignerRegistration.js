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

export default function DesignerRegistration({ onDesignerAdded }) {
  const [name, setName] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const { addDesigner } = useDesigner();

  const handleSubmit = async (e) => {
    console.log('=== FORM SUBMITTED ==='); // Add this line
    e.preventDefault();
    
    console.log('Form submitted with name:', name);
    
    if (!name.trim()) {
      console.log('Name is empty, returning');
      return;
    }

    console.log('Calling addDesigner...');
    const designer = await addDesigner(name.trim());
    console.log('addDesigner result:', designer);
    
    if (designer) {
      console.log('Designer added successfully, closing form');
      setName('');
      setIsVisible(false);
      if (onDesignerAdded) {
        console.log('Calling onDesignerAdded callback');
        onDesignerAdded(designer);
      }
    } else {
      console.log('addDesigner returned null/undefined');
    }
  };

  // Add this test function
  const testClick = () => {
    console.log('=== TEST CLICK ===');
    console.log('Current name:', name);
    console.log('Form visible:', isVisible);
  };

  return (
    <div>
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          style={{
            background: 'white',
            border: '2px solid #777777',
            color: '#333333',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: '0.2s',
            height: '35px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', marginRight: '8px', fill: '#777777' }}>
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
          </svg>
          + Legg til designer
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Designer navn"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              onClick={testClick} // Add this line
              style={{
                background: '#333333',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: '0.2s',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', marginRight: '8px', fill: 'white' }}>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
              </svg>
              Legg til og start egenvurdering
            </button>
            
            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                setName('');
              }}
              style={{
                background: 'white',
                border: '2px solid #777777',
                color: '#333333',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: '0.2s',
                height: '35px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Avbryt
            </button>
          </div>
        </form>
      )}
    </div>
  );
}