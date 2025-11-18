# Admin Course Enrollment UI Components

## Overview

This document explains how to use the admin UI components for enrolling users in courses and managing course enrollments.

## Components Created

### 1. `EnrollUserInCourseDialog`

**Location:** `components/EnrollUserInCourseDialog.tsx`

A dialog component that allows admins to enroll a user in available courses.

#### Features:

- Shows all published courses that the user is NOT already enrolled in
- Grid view with course cards showing:
  - Course image
  - Course title and category
  - Course description
  - Number of chapters and attachments
- Visual selection with ring highlight
- Real-time validation (disabled if user is already enrolled in all courses)
- Loading states and error handling
- Success/error toast notifications

#### Usage:

```tsx
import EnrollUserInCourseDialog from "@/components/EnrollUserInCourseDialog";

function AdminPanel({ userId }) {
  return (
    <div>
      <EnrollUserInCourseDialog userId={userId} />
    </div>
  );
}
```

#### Props:

- `userId` (string, required): The ID of the user to enroll

---

### 2. `UserLearningMaterials` (Enhanced)

**Location:** `components/UserLearningMaterials.tsx`

Updated to support admin view with enrollment capabilities.

#### New Features:

- `isAdminView` prop to enable admin-specific features
- Enrollment button in the header (when admin view)
- Enrollment button in empty state (when admin view)

#### Usage:

```tsx
import UserLearningMaterials from "@/components/UserLearningMaterials";

// Client view (no enrollment button)
<UserLearningMaterials userId={userId} />

// Admin view (with enrollment button)
<UserLearningMaterials userId={userId} isAdminView />
```

#### Props:

- `userId` (string, required): The ID of the user
- `isAdminView` (boolean, optional, default: false): Enable admin features

---

### 3. `CourseEnrollmentsList` (Bonus)

**Location:** `components/CourseEnrollmentsList.tsx`

A component to view and manage all users enrolled in a specific course.

#### Features:

- Lists all enrolled users with their details
- Shows progress percentage for each user
- Badges for completion status (Completed, In Progress)
- Shows enrollment date and last accessed date
- Unenroll functionality with confirmation dialog
- Empty state when no enrollments
- Refresh button to reload data

#### Usage:

```tsx
import CourseEnrollmentsList from "@/components/CourseEnrollmentsList";

function CourseManagementPage({ courseId, enrollments }) {
  const handleRefresh = () => {
    // Refetch enrollments data
  };

  return (
    <CourseEnrollmentsList
      courseId={courseId}
      enrollments={enrollments}
      onRefresh={handleRefresh}
    />
  );
}
```

#### Props:

- `courseId` (string, required): The ID of the course
- `enrollments` (CourseEnrollment[], optional): Array of enrollment data
- `onRefresh` (function, optional): Callback to refresh enrollment data

#### CourseEnrollment Interface:

```typescript
interface CourseEnrollment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  enrolledAt: Date;
  lastAccessedAt?: Date;
  progressPercentage: number;
  completedAt?: Date;
}
```

---

## Integration Points

### Client Profile Page

**Location:** `app/(admin)/admin/clients/[userId]/page.tsx`

Already integrated! The admin can now:

1. Navigate to a client's profile
2. Click on the "Learning Materials" tab
3. See the "Enroll in Course" button
4. Click to open the enrollment dialog
5. Select a course and enroll the user

The enrollment button appears:

- In the header when courses exist
- In the empty state when no courses are enrolled

---

## Workflow

### Enrolling a User in a Course:

1. **Admin navigates to client profile**

   - Go to `/admin/clients/[userId]`
   - Click "Learning Materials" tab

2. **Click "Enroll in Course" button**

   - Button appears in header or empty state

3. **Dialog opens showing available courses**

   - Only published courses are shown
   - Courses user is already enrolled in are filtered out
   - Courses displayed in a grid with images and details

4. **Select a course**

   - Click on a course card
   - Selected course gets highlighted with a ring

5. **Click "Enroll User" button**

   - User is enrolled via API call
   - Success toast appears
   - Dialog closes
   - Course list refreshes automatically

6. **View enrolled course**
   - User's new course appears in the grid
   - Shows 0% progress initially
   - Admin can view progress updates

---

## API Endpoints Used

### Enrollment:

```
POST /api/user/[userId]/courses/[courseId]/enroll
```

### Fetch User Courses with Progress:

```
GET /api/user/[userId]/courses/progress
```

### Fetch All Courses:

```
GET /api/courses
```

---

## Visual States

### Empty State:

When user has no courses:

- Shows empty state message
- Shows "Enroll in Course" button (admin view only)

### Loading State:

- Shows spinner while fetching courses
- Disabled buttons during enrollment

### Success State:

- Course appears in grid immediately
- Toast notification confirms enrollment

### Error State:

- Toast notification shows error message
- User remains on dialog to retry

---

## Future Enhancements

Potential additions:

1. **Bulk Enrollment**: Enroll multiple users at once
2. **Auto-enrollment**: Based on Denefits contract type
3. **Enrollment History**: Track when and by whom users were enrolled
4. **Notifications**: Email users when enrolled in a course
5. **Course Recommendations**: Suggest courses based on user profile
6. **Enrollment Reports**: Analytics on course enrollments
7. **Expiration Dates**: Set course access expiration
8. **Prerequisites**: Define course prerequisites

---

## Notes

- Only **published** courses are available for enrollment
- Users cannot be enrolled in the same course twice
- Enrollment creates a record with 0% progress
- Progress tracking starts when user begins chapters
- Admins can see real-time progress updates
- The system prevents duplicate enrollments automatically

---

## Troubleshooting

### Button not showing:

- Ensure `isAdminView={true}` is passed to `UserLearningMaterials`
- Check user has appropriate admin permissions

### No courses showing in dialog:

- Verify courses are published
- Check user isn't already enrolled in all courses
- Ensure courses have proper data structure

### Enrollment fails:

- Check API endpoint is accessible
- Verify userId and courseId are valid
- Check Firebase permissions
- Review browser console for errors

---

## Component Dependencies

Required components:

- Dialog (shadcn/ui)
- Button (shadcn/ui)
- Card (shadcn/ui)
- Badge (shadcn/ui)
- ScrollArea (shadcn/ui)
- AlertDialog (shadcn/ui)
- Spinner (custom)
- EmptyState (custom)

Required hooks:

- useGetCourses
- useGetUserCoursesWithProgress
- useEnrollUserInCourse

Required icons (lucide-react):

- UserPlus
- Book
- CheckCircle2
- Users
- UserMinus
- RefreshCw
