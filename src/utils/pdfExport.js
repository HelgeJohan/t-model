import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF export utility that works for all pages
export const exportToPDF = async (pageTitle, contentElement, includeAllAssessments = false) => {
  try {
    // Create PDF document in A4 landscape format
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(pageTitle, 20, 25);
    
    // Add timestamp
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const timestamp = new Date().toLocaleString('nb-NO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Eksportert: ${timestamp}`, 20, 35);
    
    if (contentElement) {
      // Convert HTML content to canvas
      const canvas = await html2canvas(contentElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Calculate dimensions to fit on A4 landscape
      const imgWidth = pageWidth - 40; // 20mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add content image
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, 45, imgWidth, imgHeight);
      
      // If content is too tall, add new pages
      let currentY = 45 + imgHeight;
      while (currentY > pageHeight - 20) {
        pdf.addPage('landscape', 'a4');
        currentY = 20;
        pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);
        currentY += imgHeight;
      }
    }
    
    // Save the PDF
    const fileName = `${pageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    return false;
  }
};

// Export all assessments at once
export const exportAllAssessments = async (designers, getDesignerAssessment) => {
  try {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    for (let i = 0; i < designers.length; i++) {
      const designer = designers[i];
      const assessment = getDesignerAssessment(designer.id);
      
      if (i > 0) {
        pdf.addPage('landscape', 'a4');
      }
      
      // Add designer name as title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Egenevaluering: ${designer.name}`, 20, 25);
      
      // Add timestamp
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const timestamp = new Date().toLocaleString('nb-NO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Eksportert: ${timestamp}`, 20, 35);
      
      // Add subtitle
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Hvilke deler av brukeropplevelsesdesign behersker du. Dra i stolpene for å angi ferdighetsnivå.', 20, 50);
      
      // Create a temporary container that mimics the actual assessment page structure
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '1200px'; // Match the app container width
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '40px';
      tempContainer.style.borderRadius = '20px';
      tempContainer.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
      
      // Create the exact same structure as the TModel component
      const tmodelContainer = document.createElement('div');
      tmodelContainer.style.display = 'grid';
      tmodelContainer.style.gridTemplateColumns = 'repeat(10, 80px)';
      tmodelContainer.style.gap = '32px';
      tmodelContainer.style.justifyContent = 'center';
      tmodelContainer.style.alignItems = 'flex-start';
      tmodelContainer.style.minHeight = '340px';
      tmodelContainer.style.padding = '20px 0';
      tmodelContainer.style.width = '100%';
      tmodelContainer.style.maxWidth = '100%';
      tmodelContainer.style.marginLeft = '0';
      tmodelContainer.style.marginRight = '0';
      
      if (assessment && assessment.skills) {
        assessment.skills.forEach((skill, index) => {
          const skillBarWrapper = document.createElement('div');
          skillBarWrapper.style.display = 'flex';
          skillBarWrapper.style.flexDirection = 'column';
          skillBarWrapper.style.alignItems = 'center';
          skillBarWrapper.style.width = '80px';
          skillBarWrapper.style.flexShrink = '0';
          
          // Skill name (above the bar)
          const skillName = document.createElement('div');
          skillName.style.marginTop = '0';
          skillName.style.marginBottom = '15px';
          skillName.style.fontSize = '0.85rem';
          skillName.style.fontWeight = '500';
          skillName.style.color = '#333333';
          skillName.style.textAlign = 'center';
          skillName.style.width = '100px';
          skillName.style.minWidth = '100px';
          skillName.style.maxWidth = '100px';
          skillName.style.lineHeight = '1.2';
          skillName.style.wordWrap = 'break-word';
          skillName.style.display = 'flex';
          skillName.style.alignItems = 'flex-end';
          skillName.style.justifyContent = 'center';
          skillName.style.minHeight = '40px';
          skillName.textContent = skill.name;
          
          // Bar wrapper
          const barWrapper = document.createElement('div');
          barWrapper.style.position = 'relative';
          barWrapper.style.width = '80px';
          barWrapper.style.height = '300px'; // Match the barAreaHeight from SkillBar
          
          // Skill bar
          const barFill = document.createElement('div');
          const barHeight = skill.proficiency === 0 ? 10 : Math.max(10, (skill.proficiency / 100) * 300);
          barFill.style.width = '100%';
          barFill.style.height = `${barHeight}px`;
          barFill.style.position = 'absolute';
          barFill.style.top = '0'; // Start at the top, right under skill names
          barFill.style.borderRadius = '8px 8px 0 0';
          
          // Set bar color based on proficiency (exact same colors as the app)
          if (skill.proficiency === 0) {
            barFill.style.background = 'transparent';
            barFill.style.border = '1px solid #d9d9d9';
          } else {
            const colors = {
              10: '#D4DBF9', 20: '#C8D1F7', 30: '#AFBCF3', 40: '#97A7EF',
              50: '#7E93EC', 60: '#667EE8', 70: '#566AC3', 80: '#45569E',
              90: '#354279', 100: '#252D54'
            };
            const roundedProficiency = Math.round(skill.proficiency / 10) * 10;
            barFill.style.background = colors[roundedProficiency] || colors[10];
          }
          
          // Handle (below the bar)
          const handle = document.createElement('div');
          handle.style.position = 'absolute';
          handle.style.left = '0';
          handle.style.width = '100%';
          handle.style.height = '20px';
          handle.style.background = '#d9d9d9';
          handle.style.border = 'none';
          handle.style.borderRadius = '0 0 8px 8px';
          handle.style.top = `${barHeight}px`; // Position below the bar
          
          // Skill level (below the handle)
          const skillLevel = document.createElement('div');
          skillLevel.style.marginTop = '15px';
          skillLevel.style.background = 'transparent';
          skillLevel.style.color = '#333333';
          skillLevel.style.padding = '0';
          skillLevel.style.fontSize = '0.85rem';
          skillLevel.style.fontWeight = '500';
          skillLevel.style.textAlign = 'center';
          skillLevel.style.minWidth = '80px';
          skillLevel.style.maxWidth = '80px';
          skillLevel.style.lineHeight = '1.2';
          skillLevel.style.wordWrap = 'break-word';
          skillLevel.style.display = 'flex';
          skillLevel.style.alignItems = 'flex-start';
          skillLevel.style.justifyContent = 'center';
          skillLevel.style.minHeight = '40px';
          
          // Get skill level text (exact same logic as the app)
          let levelText = 'Ingen ferdighet';
          if (skill.proficiency > 0) {
            if (skill.proficiency <= 14) levelText = 'Nybegynner';
            else if (skill.proficiency <= 24) levelText = 'Grunnleggende';
            else if (skill.proficiency <= 34) levelText = 'Elementært nivå';
            else if (skill.proficiency <= 44) levelText = 'Middels nivå';
            else if (skill.proficiency <= 54) levelText = 'Moderat nivå';
            else if (skill.proficiency <= 64) levelText = 'Kompetent';
            else if (skill.proficiency <= 74) levelText = 'Dyktig';
            else if (skill.proficiency <= 84) levelText = 'Avansert';
            else if (skill.proficiency <= 94) levelText = 'Ekspert';
            else levelText = 'Mester';
          }
          skillLevel.textContent = levelText;
          
          // Assemble the skill bar
          barWrapper.appendChild(barFill);
          barWrapper.appendChild(handle);
          
          skillBarWrapper.appendChild(skillName);
          skillBarWrapper.appendChild(barWrapper);
          skillBarWrapper.appendChild(skillLevel);
          
          tmodelContainer.appendChild(skillBarWrapper);
        });
      }
      
      tempContainer.appendChild(tmodelContainer);
      document.body.appendChild(tempContainer);
      
      try {
        // Capture the rendered T-model with the same settings as single export
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1200,
          height: tempContainer.scrollHeight
        });
        
        // Calculate dimensions to fit on A4 landscape (same as single export)
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add the captured image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 20, 70, imgWidth, imgHeight);
        
        // Clean up
        document.body.removeChild(tempContainer);
        
      } catch (error) {
        console.error('Failed to capture T-model for designer:', designer.name, error);
        // Fallback to text-based export
        if (assessment && assessment.skills) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Ferdigheter:', 20, 70);
          
          let yPosition = 85;
          assessment.skills.forEach((skill) => {
            if (yPosition > pageHeight - 30) {
              pdf.addPage('landscape', 'a4');
              yPosition = 25;
            }
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${skill.name}: ${skill.proficiency}%`, 20, yPosition);
            yPosition += 8;
          });
        }
      }
    }
    
    // Save the PDF
    const fileName = `alle_egenvurderinger_${Date.now()}.pdf`;
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    return false;
  }
};
