# UX Design T-Model

An interactive web application that allows UX designers to visualize and assess their proficiency across 10 key UX design skills using draggable vertical bars.

## Features

- **Interactive Skill Bars**: 10 vertical bars representing different UX design skills
- **Drag to Adjust**: Click and drag the handles at the bottom of each bar to set proficiency levels
- **Real-time Feedback**: See percentage values when hovering over bars
- **Responsive Design**: Works on desktop and tablet devices
- **Modern UI**: Clean, professional interface with smooth animations

## Skills Included

1. Business analysis
2. User research
3. Visual and information design
4. Content design
5. Interaction design
6. Information architecture
7. Usability evaluation
8. Front-end design and accessibility
9. Experimentation
10. Data and analytics

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone or download this project
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

### Building for Production

To create a production build:

```bash
npm run build
```

## How to Use

1. **View Your Skills**: Each vertical bar represents a UX design skill
2. **Adjust Proficiency**: Click and drag the dark handle at the bottom of any bar
3. **See Progress**: Hover over bars to see the exact percentage
4. **Visual Assessment**: The T-model helps identify strengths and areas for development

## Technology Stack

- **React 18**: Modern React with hooks
- **Styled Components**: CSS-in-JS styling
- **Create React App**: Development and build tooling

## Project Structure

```
src/
├── components/
│   ├── TModel.js      # Main T-model container
│   └── SkillBar.js    # Individual skill bar component
├── App.js             # Main application component
├── index.js           # Application entry point
└── index.css          # Global styles
```

## Customization

You can easily customize the skills by modifying the `skills` array in `src/App.js`. Each skill object should have:

```javascript
{
  name: 'Skill Name',
  proficiency: 50  // Default percentage (0-100)
}
```

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this tool.

## License

This project is open source and available under the MIT License. 