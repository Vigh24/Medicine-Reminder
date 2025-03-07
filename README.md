# MedReminder App

A React Native mobile application for managing medication reminders and tracking medication adherence.

## Features

- User Authentication with Email
- Dark/Light Theme Support
- Smooth Animations and Transitions
- Profile Management
- Medication Scheduling (Coming Soon)
- Reminder Notifications (Coming Soon)
- Progress Reports (Coming Soon)

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase for Backend
- React Navigation
- Custom Animation Hooks
- Secure Storage

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd medreminder
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
```

5. Follow the Expo CLI instructions to run on your desired platform

## Project Structure

```
medreminder/
├── App.tsx              # Main application component
├── screens/             # Screen components
├── components/          # Reusable components
├── context/            # React Context providers
├── hooks/              # Custom hooks
├── utils/              # Utility functions
└── supabase/           # Database migrations
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details 