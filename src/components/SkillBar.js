import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const BarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 100px;
  max-width: 100px;
  position: relative;
`;

const BarWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Removed BarTrack

const BarFill = styled.div`
  width: 100%;
  height: ${props => props.height}px;
  background: ${props => props.background};
  border-radius: 8px 8px 0 0;
  position: relative;
  border: ${props => props.proficiency === 0 ? '1px solid #d9d9d9' : 'none'};
  min-height: ${props => props.proficiency === 0 ? '10px' : '0px'};
  display: ${props => props.proficiency === 0 ? 'block' : 'block'};
`;

const Handle = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  height: 20px;
  background: #d9d9d9;
  border: none;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 8px 8px;
`;

const Label = styled.div`
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #333333;
  text-align: center;
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  line-height: 1.2;
  word-wrap: break-word;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 40px;
`;

const SkillLevelCounter = styled.div`
  margin-top: 30px;
  background: transparent;
  color: #333333;
  padding: 0;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  min-width: 80px;
  max-width: 80px;
  line-height: 1.2;
  word-wrap: break-word;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 40px;
`;

const SkillBar = ({ skill, onUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [dragHeight, setDragHeight] = useState(0); // Visual drag state
  const barRef = useRef(null);
  const containerRef = useRef(null);

  const barAreaHeight = 300; // Bar area (excluding handle)
  const handleHeight = 20;
  const minHeight = 0;
  const maxHeight = barAreaHeight;

  // Skill level mapping
  const getSkillLevel = (proficiency) => {
    if (proficiency === 0) return 'Ingen ferdighet';
    if (proficiency <= 14) return 'Nybegynner';
    if (proficiency <= 24) return 'Grunnleggende';
    if (proficiency <= 34) return 'Elementært nivå';
    if (proficiency <= 44) return 'Middels nivå';
    if (proficiency <= 54) return 'Moderat nivå';
    if (proficiency <= 64) return 'Kompetent';
    if (proficiency <= 74) return 'Dyktig';
    if (proficiency <= 84) return 'Avansert';
    if (proficiency <= 94) return 'Ekspert';
    return 'Mester';
  };

  // Color system for 11 proficiency levels (0% to 100%)
  const getBarBackground = (proficiency) => {
    const colors = {
      0: 'transparent',   // 0% - transparent background with outline
      10: '#D4DBF9',      // 10% - Very Light Blue
      20: 'linear-gradient(180deg, #D4DBF9 0%, #C8D1F7 100%)', // 20% - Light Blue gradient
      30: 'linear-gradient(180deg, #D4DBF9 0%, #AFBCF3 100%)', // 30% - Light Blue gradient
      40: 'linear-gradient(180deg, #D4DBF9 0%, #97A7EF 100%)', // 40% - Medium Light Blue gradient
      50: 'linear-gradient(180deg, #D4DBF9 0%, #7E93EC 100%)', // 50% - Medium Blue gradient
      60: 'linear-gradient(180deg, #D4DBF9 0%, #667EE8 100%)', // 60% - Blue gradient
      70: 'linear-gradient(180deg, #D4DBF9 0%, #566AC3 100%)', // 70% - Medium Dark Blue gradient
      80: 'linear-gradient(180deg, #D4DBF9 0%, #45569E 100%)', // 80% - Dark Blue gradient
      90: 'linear-gradient(180deg, #D4DBF9 0%, #354279 100%)', // 90% - Very Dark Blue gradient
      100: 'linear-gradient(180deg, #D4DBF9 0%, #252D54 100%)' // 100% - Darkest Blue gradient
    };
    
    // Round to nearest 10% increment
    const roundedProficiency = Math.round(proficiency / 10) * 10;
    return colors[roundedProficiency] || colors[0];
  };

  // Get solid color for text (extract from gradients)
  const getTextColor = (proficiency) => {
    if (proficiency === 0) return '#667eea'; // Blue border color for 0%
    
    // For other levels, use the darker color from the gradient
    const colors = {
      10: '#C8D1F7',   // 10% - Light Blue
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
    
    const roundedProficiency = Math.round(proficiency / 10) * 10;
    return colors[roundedProficiency] || colors[10];
  };

  const calculateProficiency = (height) => {
    return Math.round(((height - minHeight) / (maxHeight - minHeight)) * 100);
  };

  const calculateHeight = (proficiency) => {
    return minHeight + ((proficiency / 100) * (maxHeight - minHeight));
  };

  // Snap to nearest 10% increment
  const snapToIncrement = (proficiency) => {
    return Math.round(proficiency / 10) * 10;
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(calculateHeight(skill.proficiency));
    setDragHeight(calculateHeight(skill.proficiency)); // Initialize drag height
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    // REVERSED: dragging down increases height, dragging up decreases
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
    
    // Only update the visual drag state, NOT the actual skill
    setDragHeight(newHeight);
  }, [isDragging, startY, startHeight]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Calculate proficiency from current drag position
      const dragProficiency = calculateProficiency(dragHeight);
      
      // Snap to nearest 10% increment
      const snappedProficiency = snapToIncrement(dragProficiency);
      
      // Update the actual skill with the snapped value
      onUpdate(snappedProficiency);
    }
    setIsDragging(false);
  }, [isDragging, dragHeight, onUpdate]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Use drag height during drag, skill proficiency otherwise
  const currentHeight = isDragging ? dragHeight : (skill.proficiency === 0 ? 10 : calculateHeight(skill.proficiency));
  const currentProficiency = isDragging ? calculateProficiency(dragHeight) : skill.proficiency;

  return (
    <BarContainer ref={containerRef}>
      {console.log('=== RENDERING SKILLBAR ===')}
      {console.log('Skill being rendered:', skill)}
      
      {/* Skill name above the bar */}
      <Label>
        {skill.name}
      </Label>
      
      <BarWrapper>
        <BarFill 
          ref={barRef} 
          height={currentHeight} 
          background={getBarBackground(currentProficiency)} 
          proficiency={currentProficiency}
        />
        {/* Handle positioned below the bar, not overlapping */}
        <Handle
          onMouseDown={handleMouseDown}
          style={{ top: `${currentHeight}px` }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="#777777"
            style={{ pointerEvents: 'none' }}
          >
            <path d="M8 18h8v-2H8v2zm0-4h8v-2H8v2zm0-4h8V8H8v2z"/>
          </svg>
        </Handle>
      </BarWrapper>
      
      {/* Skill level below the bar */}
      <SkillLevelCounter>
        {getSkillLevel(currentProficiency)}
      </SkillLevelCounter>
    </BarContainer>
  );
};

export default SkillBar; 