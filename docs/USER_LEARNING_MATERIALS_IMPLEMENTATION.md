# User Learning Materials - Course Progress Tracking Implementation

## Overview

This implementation provides a complete system for mapping users to courses and tracking their learning progress through chapters. It includes enrollment management, progress tracking, and a visual dashboard showing course completion status.

## Architecture

### Database Collections

- **`user-course-enrollment`**: Tracks user enrollments in courses

  - `userId`: User identifier
  - `courseId`: Course identifier
  - `enrolledAt`: Enrollment timestamp
  - `lastAccessedAt`: Last access timestamp
  - `completedAt`: Completion timestamp (if completed)
  - `progressPercentage`: Overall progress (0-100)

- **`user-progress`**: Tracks chapter-level completion
  - `userId`: User identifier
  - `chapterId`: Chapter identifier
  - `isCompleted`: Boolean completion status
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp

## Features Implemented

### 1. API Routes

#### `/api/user/[userId]/courses/progress` (GET)

- Fetches all courses with progress data for a specific user
- Returns `CourseWithProgress[]` including enrollment info and chapter completion

#### `/api/user/[userId]/courses/[courseId]/enroll` (POST)

- Enrolls a user in a specific course
- Creates enrollment record if not exists
- Returns enrollment details

#### `/api/user/[userId]/progress` (POST)

- Updates user progress for a specific chapter
- Body: `{ chapterId: string, isCompleted: boolean }`
- Automatically updates course progress percentage

### 2. React Hooks

#### `useGetUserCoursesWithProgress(userId: string)`

```typescript
const { coursesWithProgress, isLoading, refetch } = useGetUserCoursesWithProgress(userId);
```

- Fetches courses with complete progress tracking
- Returns `CourseWithProgress[]` with enrollment and chapter completion data

#### `useEnrollUserInCourse()`

```typescript
const { enrollUser, isEnrolling } = useEnrollUserInCourse();
await enrollUser({ userId, courseId });
```

- Enrolls a user in a course
- Invalidates relevant queries on success
- Shows toast notifications

#### `useChapterProgress()`

```typescript
const { updateProgress, isUpdatingProgress } = useChapterProgress();
await updateProgress({ userId, chapterId, isCompleted: true });
```

- Updates chapter completion status
- Automatically recalculates course progress
- Shows success/error notifications

### 3. Service Functions

#### `getUserCoursesWithProgress(userId: string)`

- Server-side function to fetch all enrolled courses with progress
- Calculates completion statistics
- Returns complete course data with enrollment info

#### `enrollUserInCourse({ userId, courseId })`

- Server-side enrollment function
- Checks for existing enrollment
- Creates new enrollment with initial progress of 0%

#### `updateUserProgress({ userId, chapterId, isCompleted })`

- Updates chapter completion status
- Automatically finds courseId from chapter
- Calls `markChapterComplete` or `markChapterIncomplete`
- Updates course progress percentage

#### `updateCourseProgress({ userId, courseId })`

- Calculates overall course progress percentage
- Updates enrollment record with new percentage
- Sets `completedAt` when reaching 100%

### 4. UI Components

#### `UserLearningMaterials` Component

Enhanced with progress tracking features:

**Statistics Dashboard:**

- Total courses enrolled
- Courses in progress
- Completed courses

**Course Cards Display:**

- Progress bars showing completion percentage
- Status badges (Completed, In Progress)
- Chapter completion counter (e.g., "3 of 10 chapters completed")
- Last accessed date
- Dynamic CTA buttons:
  - "Start Course" (0% progress)
  - "Continue Learning" (1-99% progress)
  - "Review Course" (100% progress)

## Type Definitions

### `CourseWithProgress`

```typescript
interface CourseWithProgress extends Course {
  enrollment?: UserCourseEnrollment;
  completedChapters?: number;
  totalChapters?: number;
  userProgress?: UserProgress[];
}
```

### `UserCourseEnrollment`

```typescript
{
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  lastAccessedAt?: Date;
  completedAt?: Date;
  progressPercentage: number; // 0-100
}
```

### `UserProgress`

```typescript
{
  id: string;
  userId: string;
  chapterId: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Examples

### 1. Display User's Courses with Progress

```tsx
import UserLearningMaterials from "@/components/UserLearningMaterials";

function UserProfile({ userId }) {
  return (
    <div>
      <UserLearningMaterials userId={userId} />
    </div>
  );
}
```

### 2. Enroll User in Course

```tsx
import { useEnrollUserInCourse } from "@/hooks/educational-materials/course";

function CourseEnrollButton({ userId, courseId }) {
  const { enrollUser, isEnrolling } = useEnrollUserInCourse();

  const handleEnroll = async () => {
    try {
      await enrollUser({ userId, courseId });
    } catch (error) {
      console.error("Enrollment failed:", error);
    }
  };

  return (
    <button onClick={handleEnroll} disabled={isEnrolling}>
      {isEnrolling ? "Enrolling..." : "Enroll Now"}
    </button>
  );
}
```

### 3. Update Chapter Progress

```tsx
import { useChapterProgress } from "@/hooks/educational-materials/chapter";

function ChapterCompleteButton({ userId, chapterId }) {
  const { updateProgress, isUpdatingProgress } = useChapterProgress();

  const markComplete = async () => {
    await updateProgress({
      userId,
      chapterId,
      isCompleted: true,
    });
  };

  return (
    <button onClick={markComplete} disabled={isUpdatingProgress}>
      Mark as Complete
    </button>
  );
}
```

### 4. Fetch Courses with Progress

```tsx
import { useGetUserCoursesWithProgress } from "@/hooks/educational-materials/course";

function MyCourses({ userId }) {
  const { coursesWithProgress, isLoading } = useGetUserCoursesWithProgress(userId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {coursesWithProgress?.map((course) => (
        <div key={course.id}>
          <h3>{course.title}</h3>
          <p>Progress: {course.enrollment?.progressPercentage}%</p>
          <p>
            Completed: {course.completedChapters} / {course.totalChapters}
          </p>
        </div>
      ))}
    </div>
  );
}
```

## Progress Calculation Logic

1. **Chapter Completion:**

   - User marks a chapter as complete/incomplete
   - Progress record created/updated in `user-progress` collection

2. **Course Progress Update:**

   - After chapter completion, `updateCourseProgress` is called
   - Counts total published chapters in course
   - Counts completed chapters by user
   - Calculates percentage: `(completed / total) * 100`
   - Updates enrollment record with new percentage

3. **Course Completion:**
   - When progress reaches 100%, `completedAt` timestamp is set
   - User can continue to review completed courses

## Visual Indicators

- **Progress Bar**: Shows completion percentage
- **Status Badges**:
  - 🏆 **Completed** (green) - 100% progress
  - ⏱️ **In Progress** (orange) - 1-99% progress
  - (No badge) - Not started (0% progress)
- **Statistics Cards**: Overview of total, in-progress, and completed courses
- **Dynamic Buttons**: Context-aware CTAs based on progress state

## Benefits

1. **User Engagement**: Clear progress tracking motivates course completion
2. **Admin Visibility**: Track user learning progress and engagement
3. **Automatic Calculations**: Progress updates automatically when chapters are completed
4. **Flexible Enrollment**: Easy to enroll users in courses programmatically
5. **Performance**: Efficient queries using Firestore indexes
6. **Type Safety**: Full TypeScript support with proper types

## Future Enhancements

Potential additions to consider:

- Certificate generation upon course completion
- Time tracking for chapters
- Quiz/assessment integration
- Learning path recommendations
- Completion badges and achievements
- Email notifications for milestones
- Detailed analytics dashboard
- Course ratings and reviews
- Discussion forums per course
- Export progress reports

## Dependencies

- Next.js API routes
- React Query (TanStack Query) for data fetching
- Firebase Firestore for data storage
- Shadcn/ui components (Card, Badge, Progress)
- Lucide React icons
- TypeScript for type safety

## Notes

- Progress is calculated only from **published** chapters
- Enrollment is required before tracking progress
- Course progress updates happen automatically on chapter completion
- All timestamps use Firestore Timestamp objects
- The system supports multiple users enrolled in the same course
- Progress tracking is per-user, per-course, per-chapter
