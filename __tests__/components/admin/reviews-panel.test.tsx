/// <reference types="vitest/globals" />

import { render, screen, fireEvent } from "@testing-library/react";
import { ReviewsPanel } from "@/app/(admin)/admin/educational-materials/courses/[courseId]/_components/reviews-panel";
import { createWrapper } from "../../utils/test-utils";

const mockUseCourseReviews = vi.fn();

vi.mock("@/hooks/educational-materials/course", () => ({
  useCourseReviews: (courseId: string) => mockUseCourseReviews(courseId),
}));

describe("ReviewsPanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeletons when loading", () => {
    mockUseCourseReviews.mockReturnValue({
      reviews: [],
      isLoading: true,
      refetch: vi.fn(),
    });

    render(<ReviewsPanel courseId="course-123" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Student Reviews & Ratings")).toBeDefined();
  });

  it("renders empty state when there are no reviews", () => {
    mockUseCourseReviews.mockReturnValue({
      reviews: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    render(<ReviewsPanel courseId="course-123" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("No reviews yet")).toBeDefined();
    expect(
      screen.getByText(
        "Enrolled students will be able to submit star ratings and written reviews once they start this course.",
      ),
    ).toBeDefined();
    expect(screen.getByText("0.0")).toBeDefined();
    expect(screen.getByText("0 reviews total")).toBeDefined();
  });

  it("renders reviews summary, breakdown distribution, and review list items", () => {
    const mockReviews = [
      {
        id: "rev-1",
        courseId: "course-123",
        userId: "user-1",
        userName: "John Doe",
        userAvatar: "https://example.com/avatar.jpg",
        rating: 5,
        comment: "Outstanding course on financial repair!",
        createdAt: new Date("2026-03-01T12:00:00Z"),
      },
      {
        id: "rev-2",
        courseId: "course-123",
        userId: "user-2",
        userName: "Jane Smith",
        rating: 3,
        comment: "Very helpful, but could use more examples.",
        createdAt: new Date("2026-03-05T12:00:00Z"),
      },
    ];

    const mockRefetch = vi.fn();
    mockUseCourseReviews.mockReturnValue({
      reviews: mockReviews,
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<ReviewsPanel courseId="course-123" />, {
      wrapper: createWrapper(),
    });

    // Average: (5 + 3) / 2 = 4.0
    expect(screen.getByText("4.0")).toBeDefined();
    expect(screen.getByText("2 reviews total")).toBeDefined();

    // Distribution (1 5-star out of 2 = 50%, 1 3-star out of 2 = 50%)
    expect(screen.getAllByText("50%")).toHaveLength(2);

    // Reviewer names and comments
    expect(screen.getByText("John Doe")).toBeDefined();
    expect(
      screen.getByText("Outstanding course on financial repair!"),
    ).toBeDefined();

    expect(screen.getByText("Jane Smith")).toBeDefined();
    expect(
      screen.getByText("Very helpful, but could use more examples."),
    ).toBeDefined();

    // Refresh button test
    const refreshBtn = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(refreshBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
