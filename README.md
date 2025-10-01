# Alzense 🧠

A geo-emotional mapping tool designed for Alzheimer's patients and their caregivers. Alzense helps make daily walks and outings more peaceful by learning each patient's unique triggers and recommending serene routes.

## 🌟 Features

### Core Functionality
- **Walk Logging**: Simple start/stop walk sessions with GPS tracking
- **Mood Tracking**: Large, accessible buttons to log emotional states (Calm, Neutral, Stressed)
- **Noise Detection**: Automatic ambient noise level monitoring during walks
- **Data Storage**: Local storage of all walk data and mood entries
- **Map Visualization**: Interactive maps with color-coded mood points and zone overlays

### AI-Powered Insights
- **Pattern Recognition**: Identifies calm and stress zones based on mood data
- **Correlation Analysis**: Links stress to factors like noise, time, and location
- **Session Summaries**: Generates insights after each walk
- **Trend Analysis**: Tracks improvements in emotional well-being over time

### Route Planning
- **Calm Route Suggestions**: Recommends paths that avoid stress zones and include calm areas
- **Zone Visualization**: Shows identified calm zones (green) and stress zones (red)
- **Route Optimization**: Considers noise levels, time of day, and historical data

### Data Management
- **Session History**: View past walks with detailed statistics and maps
- **Export Options**: Download data as HTML reports, JSON, or CSV
- **Sharing**: Share care reports with family members or healthcare providers
- **Privacy-First**: All data stored locally, never sent to external servers

## 🚀 Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager
- Modern web browser with GPS and microphone access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alzense
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### First Time Setup

1. **Grant Permissions**: Allow GPS and microphone access when prompted
2. **Start Your First Walk**: Click "Start Walk" to begin tracking
3. **Log Moods**: Use the large mood buttons during the walk
4. **End Walk**: Click "End Walk" to complete the session
5. **View Results**: Check the History tab to see insights and patterns

## 📱 How to Use

### Starting a Walk
1. Navigate to the Map view (home page)
2. Click "Start Walk" - the app will request GPS and microphone permissions
3. Wait for the status to show "Walk in Progress"
4. Begin your walk

### Logging Moods During Walks
- **🙂 Calm**: Tap when the patient appears relaxed and comfortable
- **😐 Neutral**: Tap for normal, baseline emotional state
- **😟 Stressed**: Tap when the patient shows signs of agitation or distress

### Ending a Walk
1. Click "End Walk" when finished
2. The app will generate insights and update calm/stress zones
3. View the summary and continue to the next walk

### Viewing History
1. Go to the "History" tab
2. See all past walks with statistics
3. Click on any session to view detailed mood entries
4. Review identified calm and stress zones

### Getting Route Suggestions
1. Go to the "Routes" tab
2. Set your destination by clicking on the map
3. Click "Generate Calm Route"
4. View the suggested path that avoids stress zones

### Exporting Data
1. Go to the "Export" tab
2. Choose your preferred format (HTML report, JSON, or CSV)
3. Click "Download Export" to save your data
4. Use "Share Report" to send to family or healthcare providers

## 🏗️ Technical Architecture

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Leaflet** for interactive maps
- **Lucide React** for icons
- **Date-fns** for date handling

### Services
- **GPS Service**: Handles location tracking and geolocation API
- **Audio Service**: Manages microphone access and noise level detection
- **Storage Service**: Local data persistence using localStorage
- **Insights Service**: AI-powered analysis and pattern recognition

### Data Models
- **WalkSession**: Complete walk data with mood entries
- **MoodEntry**: Individual mood logs with location and noise data
- **CalmZone/StressZone**: Identified areas based on mood patterns
- **RouteSuggestion**: AI-generated route recommendations

## 🔒 Privacy & Security

- **Local Storage Only**: All data stays on your device
- **No Cloud Sync**: No data is sent to external servers
- **Secure Permissions**: Only requests necessary GPS and microphone access
- **Export Control**: You control what data to share and with whom

## 🎯 Use Cases

### For Caregivers
- Track patient's emotional responses to different environments
- Identify patterns in stress triggers
- Plan routes that minimize agitation
- Share insights with healthcare providers
- Monitor long-term emotional well-being trends

### For Families
- Understand what environments work best for their loved one
- Coordinate care with multiple caregivers
- Track progress over time
- Make informed decisions about outings and activities

### For Healthcare Providers
- Receive detailed reports on patient's environmental responses
- Identify specific triggers and calming factors
- Monitor treatment effectiveness
- Make data-driven care recommendations

## 🚧 Future Enhancements

### Planned Features
- **Community Sharing**: Share anonymized calm zones with other families
- **Weather Integration**: Correlate mood with weather conditions
- **Time-based Insights**: Identify best times of day for walks
- **Medication Tracking**: Link mood patterns to medication schedules
- **Emergency Features**: Quick access to emergency contacts and location sharing

### Scalability
- **Multi-patient Support**: Manage multiple patients in one app
- **Care Facility Integration**: Support for assisted living centers
- **API Integration**: Connect with healthcare management systems
- **Mobile Apps**: Native iOS and Android applications

## 🤝 Contributing

We welcome contributions to make Alzense better for the Alzheimer's community:

1. **Bug Reports**: Help us identify and fix issues
2. **Feature Requests**: Suggest new functionality
3. **Code Contributions**: Submit pull requests for improvements
4. **Documentation**: Help improve guides and documentation
5. **Testing**: Test with real-world scenarios and provide feedback

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Alzheimer's Community**: For inspiring this tool and providing valuable feedback
- **Caregivers**: For their dedication and the insights they share
- **Healthcare Providers**: For their expertise in dementia care
- **Open Source Community**: For the amazing tools and libraries that make this possible

## 📞 Support

For support, questions, or feedback:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation and FAQ

---

**Alzense** - Making every walk a step toward better care and understanding.

*"Turning hidden stress triggers into visible data, so patients can live with greater ease and dignity."*
