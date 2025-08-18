import React from 'react';
import styled from 'styled-components';
import SkillBar from './SkillBar';

const TModelContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 80px);
  gap: 32px;
  justify-content: center;
  align-items: flex-start;
  min-height: 340px;
  padding: 20px 0;
  width: 100%;
  max-width: 100%;
  margin-left: 0;
  margin-right: 0;
`;

const SkillBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  flex-shrink: 0;
`;

const TModel = ({ skills, onUpdateSkill }) => {
  return (
    <TModelContainer className="tmodel-container">
      {skills.map((skill, index) => (
        <SkillBarWrapper key={index}>
          <SkillBar
            skill={skill}
            onUpdate={(newProficiency) => onUpdateSkill(skill.name, newProficiency)}
          />
        </SkillBarWrapper>
      ))}
    </TModelContainer>
  );
};

export default TModel; 