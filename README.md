# School Management System with LMS

A comprehensive School Management System with integrated Learning Management System (LMS) built with SvelteKit and Supabase.

## 🚀 Features

### 📚 Learning Management System (LMS)
- **Course Management**: Create, edit, and manage courses
- **Interactive Quizzes**: Comprehensive quiz system with multiple subjects
- **Progress Tracking**: Student progress monitoring and analytics
- **Assignment System**: Course assignments and submissions
- **Resource Management**: Learning materials and resources

### 👥 User Management
- **Multi-role System**: Admin, Teacher, Student, Parent roles
- **Profile Management**: User profiles with role-based permissions
- **Authentication**: Secure login and session management

### 📊 Reporting & Analytics
- **Student Progress Reports**: Detailed progress tracking
- **Academic Performance**: Grade and performance analytics
- **Usage Statistics**: System usage and engagement metrics
- **Personal Reports**: Individual student reports

### 💬 Communication
- **Messaging System**: Internal messaging between users
- **Notifications**: Real-time notifications and alerts

### ⚙️ Administration
- **Database Setup**: Automated database schema setup
- **User Management**: Admin panel for user management
- **System Configuration**: Flexible system settings
- **Zone & Group Management**: Organizational structure management

## 🛠️ Technology Stack

- **Frontend**: SvelteKit, JavaScript, CSS3
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Styling**: Custom CSS with modern design patterns
- **Database**: PostgreSQL with Row Level Security (RLS)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/skynovice/SchoolManagementWithLMS.git
   cd SchoolManagementWithLMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Navigate to `/admin/setup-database` in your application
   - Follow the automated setup process

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 📖 Usage

### For Administrators
1. Access the admin panel at `/admin`
2. Set up database tables and initial data
3. Manage users, subjects, and system settings

### For Teachers
1. Create and manage courses
2. Add learning materials and quizzes
3. Track student progress and performance

### For Students
1. Browse and enroll in courses
2. Complete assignments and quizzes
3. Track personal learning progress

### For Parents
1. Monitor child's academic progress
2. View reports and performance analytics

## 🎯 Key Features Implemented

### Quiz System
- **27+ Subject Areas**: Comprehensive coverage including Thai, Math, Science, English, Arts, PE, Technology, and Vocational subjects
- **60+ Questions**: Pre-loaded with educational content
- **Multiple Choice Format**: Standard 4-option questions with explanations
- **Smart Topic Matching**: Intelligent question assignment based on course topics

### Course Management
- **Beautiful UI**: Modern glassmorphism design with responsive layout
- **Role-based Access**: Different views for teachers and students
- **Enrollment System**: Easy course enrollment and management
- **Progress Tracking**: Real-time progress monitoring

### Reporting System
- **Academic Reports**: Detailed academic performance analysis
- **Progress Reports**: Individual and class progress tracking
- **Usage Statistics**: System usage and engagement metrics
- **Export Functionality**: Data export capabilities

## 🔧 Development

### Project Structure
```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── stores/         # Svelte stores for state management
│   └── utils.js        # Utility functions
├── routes/
│   ├── admin/          # Admin panel routes
│   ├── courses/        # Course management
│   ├── dashboard/      # Main dashboard
│   ├── lms/           # Learning management system
│   ├── reports/       # Reporting system
│   └── messages/      # Communication system
└── app.css            # Global styles
```

### Database Schema
The system uses Supabase with the following main tables:
- `profiles` - User profiles and roles
- `courses` - Course information
- `subjects` - Subject categories
- `learning_topics` - Learning content
- `quiz_questions` - Quiz questions and answers
- `student_progress` - Progress tracking
- `course_enrollments` - Course enrollments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**skynovice**
- GitHub: [@skynovice](https://github.com/skynovice)

## 🙏 Acknowledgments

- SvelteKit team for the amazing framework
- Supabase team for the backend infrastructure
- All contributors and testers

## 📞 Support

If you have any questions or need support, please open an issue on GitHub.

---

**Built with ❤️ for education**