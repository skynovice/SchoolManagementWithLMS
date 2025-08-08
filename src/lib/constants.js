/**
 * @fileoverview Application constants
 * @author School Management System
 * @created 2025-01-08
 */

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student'
};

// User Role Display Names
export const USER_ROLE_NAMES = {
  [USER_ROLES.SUPER_ADMIN]: 'ผู้ดูแลระบบสูงสุด',
  [USER_ROLES.ADMIN]: 'ผู้ดูแลระบบ',
  [USER_ROLES.TEACHER]: 'ครู',
  [USER_ROLES.PARENT]: 'ผู้ปกครอง',
  [USER_ROLES.STUDENT]: 'นักเรียน'
};

// Course Status
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Course Status Display Names
export const COURSE_STATUS_NAMES = {
  [COURSE_STATUS.DRAFT]: 'ร่าง',
  [COURSE_STATUS.PUBLISHED]: 'เผยแพร่แล้ว',
  [COURSE_STATUS.ARCHIVED]: 'เก็บถาวร'
};

// Enrollment Status
export const ENROLLMENT_STATUS = {
  ENROLLED: 'enrolled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DROPPED: 'dropped'
};

// Enrollment Status Display Names
export const ENROLLMENT_STATUS_NAMES = {
  [ENROLLMENT_STATUS.ENROLLED]: 'ลงทะเบียนแล้ว',
  [ENROLLMENT_STATUS.IN_PROGRESS]: 'กำลังเรียน',
  [ENROLLMENT_STATUS.COMPLETED]: 'จบแล้ว',
  [ENROLLMENT_STATUS.DROPPED]: 'ถอนตัว'
};

// Message Types
export const MESSAGE_TYPES = {
  GENERAL: 'general',
  ANNOUNCEMENT: 'announcement',
  ASSIGNMENT: 'assignment',
  GRADE: 'grade'
};

// Message Type Display Names
export const MESSAGE_TYPE_NAMES = {
  [MESSAGE_TYPES.GENERAL]: 'ทั่วไป',
  [MESSAGE_TYPES.ANNOUNCEMENT]: 'ประกาศ',
  [MESSAGE_TYPES.ASSIGNMENT]: 'งานที่มอบหมาย',
  [MESSAGE_TYPES.GRADE]: 'คะแนน'
};

// Activity Types
export const ACTIVITY_TYPES = {
  LESSON: 'lesson',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  DISCUSSION: 'discussion',
  RESOURCE: 'resource'
};

// Activity Type Display Names
export const ACTIVITY_TYPE_NAMES = {
  [ACTIVITY_TYPES.LESSON]: 'บทเรียน',
  [ACTIVITY_TYPES.QUIZ]: 'แบบทดสอบ',
  [ACTIVITY_TYPES.ASSIGNMENT]: 'งานที่มอบหมาย',
  [ACTIVITY_TYPES.DISCUSSION]: 'การอภิปราย',
  [ACTIVITY_TYPES.RESOURCE]: 'ทรัพยากร'
};

// Grade Levels
export const GRADE_LEVELS = {
  KINDERGARTEN: 'kindergarten',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  HIGH_SCHOOL: 'high_school'
};

// Grade Level Display Names
export const GRADE_LEVEL_NAMES = {
  [GRADE_LEVELS.KINDERGARTEN]: 'อนุบาล',
  [GRADE_LEVELS.PRIMARY]: 'ประถมศึกษา',
  [GRADE_LEVELS.SECONDARY]: 'มัธยมศึกษาตอนต้น',
  [GRADE_LEVELS.HIGH_SCHOOL]: 'มัธยมศึกษาตอนปลาย'
};

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
    AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg']
  }
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss'
};

// Performance Levels
export const PERFORMANCE_LEVELS = {
  EXCELLENT: { min: 80, max: 100, name: 'ดีเยี่ยม', class: 'text-green-600 bg-green-100' },
  GOOD: { min: 70, max: 79, name: 'ดี', class: 'text-blue-600 bg-blue-100' },
  FAIR: { min: 60, max: 69, name: 'พอใช้', class: 'text-yellow-600 bg-yellow-100' },
  POOR: { min: 50, max: 59, name: 'ต้องปรับปรุง', class: 'text-orange-600 bg-orange-100' },
  FAIL: { min: 0, max: 49, name: 'ไม่ผ่าน', class: 'text-red-600 bg-red-100' }
};

// API Endpoints
export const API_ENDPOINTS = {
  PROFILES: '/api/profiles',
  ZONES: '/api/zones',
  GROUPS: '/api/groups',
  SUBJECTS: '/api/subjects',
  COURSES: '/api/courses',
  ENROLLMENTS: '/api/enrollments',
  MESSAGES: '/api/messages',
  REPORTS: '/api/reports'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
  UNAUTHORIZED: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้',
  FORBIDDEN: 'การเข้าถึงถูกปฏิเสธ',
  NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
  VALIDATION_ERROR: 'ข้อมูลที่กรอกไม่ถูกต้อง',
  SERVER_ERROR: 'เกิดข้อผิดพลาดในระบบ กรุณาติดต่อผู้ดูแลระบบ'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'สร้างข้อมูลสำเร็จ',
  UPDATED: 'อัพเดทข้อมูลสำเร็จ',
  DELETED: 'ลบข้อมูลสำเร็จ',
  SAVED: 'บันทึกข้อมูลสำเร็จ',
  SENT: 'ส่งข้อมูลสำเร็จ'
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  THAI_PHONE: /^(\+66|0)[0-9]{8,9}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100
};