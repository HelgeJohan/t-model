import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  padding: 20px;
`;

const SkillBar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  height: 24px;
`;

const SkillName = styled.div`
  width: 120px;
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
  margin-right: 12px;
  flex-shrink: 0;
`;

const BarContainer = styled.div`
  flex: 1;
  height: 16px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const BarFill = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  width: ${props => props.proficiency}%;
  transition: width 0.3s ease;
`;

const ProficiencyText = styled.div`
  width: 40px;
  text-align: right;
  font-size: 0.8rem;
  color: #333;
  font-weight: 600;
  margin-left: 12px;
  flex-shrink: 0;
`;

const ComparisonTModel = ({ skills }) => {
  return (
    <Container>
      {skills.map((skill, index) => (
        <SkillBar key={index}>
          <SkillName>{skill.name}</SkillName>
          <BarContainer>
            <BarFill proficiency={skill.proficiency} />
          </BarContainer>
          <ProficiencyText>{skill.proficiency}%</ProficiencyText>
        </SkillBar>
      ))}
    </Container>
  );
};

export default ComparisonTModel;
