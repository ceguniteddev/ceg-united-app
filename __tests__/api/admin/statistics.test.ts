import { GET } from "@/app/api/admin/statistics/route";
import { NextRequest } from "next/server";
import { getAdminStatistics } from "@/service/statistics";

// Mock dependencies
jest.mock("@/service/statistics", () => ({
  getAdminStatistics: jest.fn(),
}));

jest.mock("@/lib/api-validation", () => ({
  withAuth: (handler: any) => handler,
}));

describe("GET /api/admin/statistics", () => {
  const mockGetAdminStatistics = getAdminStatistics as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = () => {
    return new NextRequest("http://localhost/api/admin/statistics", {
      method: "GET",
    });
  };

  it("should return 200 and statistics data when successful", async () => {
    const mockData: AdminStatistics = {
      totalClients: 100,
      totalFundingApplications: 50,
      totalApprovedApplications: 20,
      totalFundedApplications: 10,
      totalApprovedAmount: 500000,
      totalFundedAmount: 250000,
      countsByState: { CA: 10, NY: 5 },
      countsByStatus: { New: 10, Approved: 20 },
    };

    mockGetAdminStatistics.mockResolvedValue(mockData);

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockData);
    expect(mockGetAdminStatistics).toHaveBeenCalledTimes(1);
  });

  it("should return 500 if unexpected error occurs", async () => {
    mockGetAdminStatistics.mockRejectedValue(new Error("Database failure"));

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Internal Server Error");
  });
});
