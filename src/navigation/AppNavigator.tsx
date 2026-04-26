import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/store/auth/authStore';
import { ROUTES } from '@/constants';

import SplashScreen from '@/screens/auth/SplashScreen';
import LandingScreen from '@/screens/auth/LandingScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import SignUpTeacherScreen from '@/screens/auth/SignUpTeacherScreen';
import SignUpStudentScreen from '@/screens/auth/SignUpStudentScreen';
import SetPinScreen from '@/screens/auth/SetPinScreen';
import ForgotPinEmailScreen from '@/screens/auth/ForgotPinEmailScreen';
import ForgotPinOtpScreen from '@/screens/auth/ForgotPinOtpScreen';
import ForgotPinNewScreen from '@/screens/auth/ForgotPinNewScreen';

import TeacherHomeScreen from '@/screens/teacher/TeacherHomeScreen';
import TeacherBatchesScreen from '@/screens/teacher/TeacherBatchesScreen';
import TeacherExamsScreen from '@/screens/teacher/TeacherExamsScreen';
import TeacherContentScreen from '@/screens/teacher/TeacherContentScreen';
import TeacherAnalyticsScreen from '@/screens/teacher/TeacherAnalyticsScreen';
import BatchDetailScreen from '@/screens/teacher/BatchDetailScreen';
import AddEditBatchScreen from '@/screens/teacher/AddEditBatchScreen';
import TeacherStudentProfileScreen from '@/screens/teacher/StudentProfileScreen';
import CreateEditExamScreen from '@/screens/teacher/CreateEditExamScreen';
import QuestionCreatorScreen from '@/screens/teacher/QuestionCreatorScreen';
import QuestionBankScreen from '@/screens/teacher/QuestionBankScreen';
import ExamResultsOverviewScreen from '@/screens/teacher/ExamResultsOverviewScreen';
import StudentExamResultScreen from '@/screens/teacher/StudentExamResultScreen';
import TeacherAssignmentsScreen from '@/screens/teacher/TeacherAssignmentsScreen';
import CreateEditAssignmentScreen from '@/screens/teacher/CreateEditAssignmentScreen';
import AssignmentSubmissionsScreen from '@/screens/teacher/AssignmentSubmissionsScreen';
import TeacherNotesScreen from '@/screens/teacher/TeacherNotesScreen';
import UploadNoteScreen from '@/screens/teacher/UploadNoteScreen';
import TeacherLecturesScreen from '@/screens/teacher/TeacherLecturesScreen';
import UploadEditLectureScreen from '@/screens/teacher/UploadEditLectureScreen';
import TeacherLiveClassesScreen from '@/screens/teacher/TeacherLiveClassesScreen';
import ScheduleLiveClassScreen from '@/screens/teacher/ScheduleLiveClassScreen';
import TeacherDoubtsScreen from '@/screens/teacher/TeacherDoubtsScreen';
import DoubtThreadScreen from '@/screens/teacher/DoubtThreadScreen';
import AttendanceMarkScreen from '@/screens/teacher/AttendanceMarkScreen';
import AttendanceReportScreen from '@/screens/teacher/AttendanceReportScreen';
import InterviewUploadScreen from '@/screens/teacher/InterviewUploadScreen';
import InterviewPackManagementScreen from '@/screens/teacher/InterviewPackManagementScreen';
import StudentAnalyticsDetailScreen from '@/screens/teacher/StudentAnalyticsDetailScreen';
import TeacherPaymentsScreen from '@/screens/teacher/TeacherPaymentsScreen';
import StudentFeeDetailScreen from '@/screens/teacher/StudentFeeDetailScreen';
import TeacherCalendarScreen from '@/screens/teacher/TeacherCalendarScreen';
import TeacherTodoScreen from '@/screens/teacher/TeacherTodoScreen';
import TeacherProfileScreen from '@/screens/teacher/TeacherProfileScreen';
import UpiSetupScreen from '@/screens/teacher/UpiSetupScreen';
import TeacherPaymentNotifScreen from '@/screens/teacher/TeacherPaymentNotifScreen';

import StudentHomeScreen from '@/screens/student/StudentHomeScreen';
import MyTeachersScreen from '@/screens/student/MyTeachersScreen';
import StudentExamsScreen from '@/screens/student/StudentExamsScreen';
import StudentProgressScreen from '@/screens/student/StudentProgressScreen';
import StudentProfileScreen from '@/screens/student/StudentProfileScreen';
import JoinBatchScreen from '@/screens/student/JoinBatchScreen';
import TeacherSpaceScreen from '@/screens/student/TeacherSpaceScreen';
import TakeExamScreen from '@/screens/student/TakeExamScreen';
import ExamResultScreen from '@/screens/student/ExamResultScreen';
import StudentAssignmentsScreen from '@/screens/student/StudentAssignmentsScreen';
import SubmitAssignmentScreen from '@/screens/student/SubmitAssignmentScreen';
import ViewGradedAssignmentScreen from '@/screens/student/ViewGradedAssignmentScreen';
import NotesBrowserScreen from '@/screens/student/NotesBrowserScreen';
import NoteViewerScreen from '@/screens/student/NoteViewerScreen';
import StudentLecturesScreen from '@/screens/student/StudentLecturesScreen';
import VideoPlayerScreen from '@/screens/student/VideoPlayerScreen';
import StudentLiveClassesScreen from '@/screens/student/StudentLiveClassesScreen';
import StudentDoubtsScreen from '@/screens/student/StudentDoubtsScreen';
import PostDoubtScreen from '@/screens/student/PostDoubtScreen';
import MyAttendanceScreen from '@/screens/student/MyAttendanceScreen';
import InterviewPacksScreen from '@/screens/student/InterviewPacksScreen';
import InterviewPracticeScreen from '@/screens/student/InterviewPracticeScreen';
import InterviewTrackerScreen from '@/screens/student/InterviewTrackerScreen';
import StudentCalendarScreen from '@/screens/student/StudentCalendarScreen';
import StudentTodoScreen from '@/screens/student/StudentTodoScreen';
import FeePaymentScreen from '@/screens/student/FeePaymentScreen';
import PaymentHistoryScreen from '@/screens/student/PaymentHistoryScreen';
import PaymentSlipScreen from '@/screens/PaymentSlipScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const opt = { headerShown: false };

const TeacherTabs = () => (
  <Tab.Navigator screenOptions={{
    headerShown: false,
    tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1F2937', height: 60, paddingBottom: 8 },
    tabBarActiveTintColor: '#3B82F6',
    tabBarInactiveTintColor: '#4B5563',
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  }}>
    <Tab.Screen name={ROUTES.TEACHER_HOME} component={TeacherHomeScreen} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name={ROUTES.TEACHER_BATCHES} component={TeacherBatchesScreen} options={{ tabBarLabel: 'Batches' }} />
    <Tab.Screen name={ROUTES.TEACHER_EXAMS} component={TeacherExamsScreen} options={{ tabBarLabel: 'Exams' }} />
    <Tab.Screen name="TeacherContent" component={TeacherContentScreen} options={{ tabBarLabel: 'Content' }} />
    <Tab.Screen name={ROUTES.TEACHER_ANALYTICS} component={TeacherAnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
  </Tab.Navigator>
);

const StudentTabs = () => (
  <Tab.Navigator screenOptions={{
    headerShown: false,
    tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1F2937', height: 60, paddingBottom: 8 },
    tabBarActiveTintColor: '#10B981',
    tabBarInactiveTintColor: '#4B5563',
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  }}>
    <Tab.Screen name={ROUTES.STUDENT_HOME} component={StudentHomeScreen} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name={ROUTES.MY_TEACHERS} component={MyTeachersScreen} options={{ tabBarLabel: 'Teachers' }} />
    <Tab.Screen name={ROUTES.STUDENT_EXAMS} component={StudentExamsScreen} options={{ tabBarLabel: 'Exams' }} />
    <Tab.Screen name="StudentProgress" component={StudentProgressScreen} options={{ tabBarLabel: 'Progress' }} />
    <Tab.Screen name={ROUTES.STUDENT_PROFILE} component={StudentProfileScreen} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, user } = useAuthStore();
  return (
    <Stack.Navigator screenOptions={opt}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
          <Stack.Screen name={ROUTES.LANDING} component={LandingScreen} />
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <Stack.Screen name={ROUTES.SIGN_UP_TEACHER} component={SignUpTeacherScreen} />
          <Stack.Screen name={ROUTES.SIGN_UP_STUDENT} component={SignUpStudentScreen} />
          <Stack.Screen name={ROUTES.SET_PIN} component={SetPinScreen} />
          <Stack.Screen name={ROUTES.FORGOT_PIN_EMAIL} component={ForgotPinEmailScreen} />
          <Stack.Screen name={ROUTES.FORGOT_PIN_OTP} component={ForgotPinOtpScreen} />
          <Stack.Screen name={ROUTES.FORGOT_PIN_NEW} component={ForgotPinNewScreen} />
        </>
      ) : user?.role === 'TEACHER' ? (
        <>
          <Stack.Screen name={ROUTES.TEACHER_ROOT} component={TeacherTabs} />
          <Stack.Screen name={ROUTES.BATCH_DETAIL} component={BatchDetailScreen} />
          <Stack.Screen name={ROUTES.ADD_EDIT_BATCH} component={AddEditBatchScreen} />
          <Stack.Screen name={ROUTES.STUDENT_PROFILE_TEACHER} component={TeacherStudentProfileScreen} />
          <Stack.Screen name={ROUTES.CREATE_EDIT_EXAM} component={CreateEditExamScreen} />
          <Stack.Screen name={ROUTES.QUESTION_CREATOR} component={QuestionCreatorScreen} />
          <Stack.Screen name={ROUTES.QUESTION_BANK} component={QuestionBankScreen} />
          <Stack.Screen name={ROUTES.EXAM_RESULTS_OVERVIEW} component={ExamResultsOverviewScreen} />
          <Stack.Screen name={ROUTES.STUDENT_EXAM_RESULT} component={StudentExamResultScreen} />
          <Stack.Screen name={ROUTES.TEACHER_ASSIGNMENTS} component={TeacherAssignmentsScreen} />
          <Stack.Screen name={ROUTES.CREATE_EDIT_ASSIGNMENT} component={CreateEditAssignmentScreen} />
          <Stack.Screen name={ROUTES.ASSIGNMENT_SUBMISSIONS} component={AssignmentSubmissionsScreen} />
          <Stack.Screen name={ROUTES.TEACHER_NOTES} component={TeacherNotesScreen} />
          <Stack.Screen name={ROUTES.UPLOAD_NOTE} component={UploadNoteScreen} />
          <Stack.Screen name={ROUTES.TEACHER_LECTURES} component={TeacherLecturesScreen} />
          <Stack.Screen name={ROUTES.UPLOAD_EDIT_LECTURE} component={UploadEditLectureScreen} />
          <Stack.Screen name={ROUTES.TEACHER_LIVE_CLASSES} component={TeacherLiveClassesScreen} />
          <Stack.Screen name={ROUTES.SCHEDULE_LIVE_CLASS} component={ScheduleLiveClassScreen} />
          <Stack.Screen name={ROUTES.TEACHER_DOUBTS} component={TeacherDoubtsScreen} />
          <Stack.Screen name={ROUTES.DOUBT_THREAD} component={DoubtThreadScreen} />
          <Stack.Screen name={ROUTES.ATTENDANCE_MARK} component={AttendanceMarkScreen} />
          <Stack.Screen name={ROUTES.ATTENDANCE_REPORT} component={AttendanceReportScreen} />
          <Stack.Screen name={ROUTES.INTERVIEW_UPLOAD} component={InterviewUploadScreen} />
          <Stack.Screen name={ROUTES.INTERVIEW_PACK_MANAGEMENT} component={InterviewPackManagementScreen} />
          <Stack.Screen name={ROUTES.STUDENT_ANALYTICS_DETAIL} component={StudentAnalyticsDetailScreen} />
          <Stack.Screen name={ROUTES.TEACHER_PAYMENTS} component={TeacherPaymentsScreen} />
          <Stack.Screen name={ROUTES.STUDENT_FEE_DETAIL} component={StudentFeeDetailScreen} />
          <Stack.Screen name={ROUTES.UPI_SETUP} component={UpiSetupScreen} />
          <Stack.Screen name={ROUTES.TEACHER_PAYMENT_NOTIF} component={TeacherPaymentNotifScreen} />
          <Stack.Screen name={ROUTES.PAYMENT_SLIP} component={PaymentSlipScreen} />
          <Stack.Screen name={ROUTES.TEACHER_CALENDAR} component={TeacherCalendarScreen} />
          <Stack.Screen name={ROUTES.TEACHER_TODO} component={TeacherTodoScreen} />
          <Stack.Screen name={ROUTES.TEACHER_PROFILE} component={TeacherProfileScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name={ROUTES.STUDENT_ROOT} component={StudentTabs} />
          <Stack.Screen name={ROUTES.JOIN_BATCH} component={JoinBatchScreen} />
          <Stack.Screen name={ROUTES.TEACHER_SPACE} component={TeacherSpaceScreen} />
          <Stack.Screen name={ROUTES.TAKE_EXAM} component={TakeExamScreen} />
          <Stack.Screen name={ROUTES.EXAM_RESULT} component={ExamResultScreen} />
          <Stack.Screen name={ROUTES.STUDENT_ASSIGNMENTS} component={StudentAssignmentsScreen} />
          <Stack.Screen name={ROUTES.SUBMIT_ASSIGNMENT} component={SubmitAssignmentScreen} />
          <Stack.Screen name={ROUTES.VIEW_GRADED_ASSIGNMENT} component={ViewGradedAssignmentScreen} />
          <Stack.Screen name={ROUTES.NOTES_BROWSER} component={NotesBrowserScreen} />
          <Stack.Screen name={ROUTES.NOTE_VIEWER} component={NoteViewerScreen} />
          <Stack.Screen name={ROUTES.STUDENT_LECTURES} component={StudentLecturesScreen} />
          <Stack.Screen name={ROUTES.VIDEO_PLAYER} component={VideoPlayerScreen} />
          <Stack.Screen name={ROUTES.STUDENT_LIVE_CLASSES} component={StudentLiveClassesScreen} />
          <Stack.Screen name={ROUTES.STUDENT_DOUBTS} component={StudentDoubtsScreen} />
          <Stack.Screen name={ROUTES.POST_DOUBT} component={PostDoubtScreen} />
          <Stack.Screen name={ROUTES.MY_ATTENDANCE} component={MyAttendanceScreen} />
          <Stack.Screen name={ROUTES.INTERVIEW_PACKS} component={InterviewPacksScreen} />
          <Stack.Screen name={ROUTES.INTERVIEW_PRACTICE} component={InterviewPracticeScreen} />
          <Stack.Screen name={ROUTES.INTERVIEW_TRACKER} component={InterviewTrackerScreen} />
          <Stack.Screen name={ROUTES.STUDENT_CALENDAR} component={StudentCalendarScreen} />
          <Stack.Screen name={ROUTES.STUDENT_TODO} component={StudentTodoScreen} />
          <Stack.Screen name={ROUTES.FEE_PAYMENT} component={FeePaymentScreen} />
          <Stack.Screen name={ROUTES.PAYMENT_HISTORY} component={PaymentHistoryScreen} />
          <Stack.Screen name={ROUTES.PAYMENT_SLIP} component={PaymentSlipScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
