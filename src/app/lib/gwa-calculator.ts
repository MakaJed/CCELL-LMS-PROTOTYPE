/**
 * GWA (General Weighted Average) Calculator
 *
 * Converts percentage grades to Philippine GWA scale
 * Based on standard university grading systems
 */

export interface GradeData {
  score: number; // percentage (0-100)
  weight?: number; // optional weight for weighted average (default: 1)
}

/**
 * Convert percentage to GWA (Philippine grading scale)
 *
 * GWA Scale:
 * 1.0  = 97-100% (Excellent)
 * 1.25 = 94-96%
 * 1.5  = 91-93%
 * 1.75 = 88-90%
 * 2.0  = 85-87%
 * 2.25 = 82-84%
 * 2.5  = 79-81%
 * 2.75 = 76-78%
 * 3.0  = 75% (Passing)
 * 5.0  = Below 75% (Failing)
 *
 * @param percentage - Grade as percentage (0-100)
 * @returns GWA grade (1.0-5.0)
 */
export function percentageToGWA(percentage: number): number {
  if (percentage >= 97) return 1.0;
  if (percentage >= 94) return 1.25;
  if (percentage >= 91) return 1.5;
  if (percentage >= 88) return 1.75;
  if (percentage >= 85) return 2.0;
  if (percentage >= 82) return 2.25;
  if (percentage >= 79) return 2.5;
  if (percentage >= 76) return 2.75;
  if (percentage >= 75) return 3.0;
  return 5.0; // Failing
}

/**
 * Calculate GWA from multiple grades
 *
 * @param grades - Array of grade data with optional weights
 * @returns GWA (1.0-5.0)
 */
export function calculateGWA(grades: GradeData[]): number {
  if (grades.length === 0) return 0;

  // Calculate weighted average percentage
  const totalWeight = grades.reduce((sum, g) => sum + (g.weight || 1), 0);
  const weightedSum = grades.reduce((sum, g) => sum + g.score * (g.weight || 1), 0);
  const averagePercentage = weightedSum / totalWeight;

  // Convert to GWA
  return percentageToGWA(averagePercentage);
}

/**
 * Get GWA descriptor (Excellent, Very Good, etc.)
 *
 * @param gwa - GWA grade (1.0-5.0)
 * @returns Descriptor string
 */
export function getGWADescriptor(gwa: number): string {
  if (gwa === 1.0) return 'Excellent';
  if (gwa <= 1.5) return 'Very Good';
  if (gwa <= 2.0) return 'Good';
  if (gwa <= 2.5) return 'Satisfactory';
  if (gwa <= 3.0) return 'Passing';
  return 'Failed';
}

/**
 * Get color class for GWA display
 *
 * @param gwa - GWA grade (1.0-5.0)
 * @returns Tailwind color class
 */
export function getGWAColorClass(gwa: number): string {
  if (gwa === 1.0) return 'text-green-700';
  if (gwa <= 1.5) return 'text-green-600';
  if (gwa <= 2.0) return 'text-blue-600';
  if (gwa <= 2.5) return 'text-amber-600';
  if (gwa <= 3.0) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Format GWA for display
 *
 * @param gwa - GWA grade (1.0-5.0)
 * @returns Formatted string (e.g., "1.25")
 */
export function formatGWA(gwa: number): string {
  return gwa.toFixed(2);
}

/**
 * Calculate course GWA from assessments
 *
 * Typical assessment weights:
 * - Pre-test: 10%
 * - Post-tests: 30% (combined)
 * - Final assessment: 60%
 *
 * @param assessments - Array of assessment scores with types
 * @returns Course GWA
 */
export function calculateCourseGWA(assessments: {
  type: 'pre_test' | 'post_test' | 'final';
  percentage: number;
}[]): number {
  if (assessments.length === 0) return 0;

  // Group by type
  const preTests = assessments.filter(a => a.type === 'pre_test');
  const postTests = assessments.filter(a => a.type === 'post_test');
  const finals = assessments.filter(a => a.type === 'final');

  const grades: GradeData[] = [];

  // Pre-test average (10% weight)
  if (preTests.length > 0) {
    const preTestAvg = preTests.reduce((sum, a) => sum + a.percentage, 0) / preTests.length;
    grades.push({ score: preTestAvg, weight: 0.1 });
  }

  // Post-test average (30% weight)
  if (postTests.length > 0) {
    const postTestAvg = postTests.reduce((sum, a) => sum + a.percentage, 0) / postTests.length;
    grades.push({ score: postTestAvg, weight: 0.3 });
  }

  // Final assessment (60% weight)
  if (finals.length > 0) {
    const finalAvg = finals.reduce((sum, a) => sum + a.percentage, 0) / finals.length;
    grades.push({ score: finalAvg, weight: 0.6 });
  }

  return calculateGWA(grades);
}

/**
 * Check if GWA is passing
 *
 * @param gwa - GWA grade (1.0-5.0)
 * @returns True if passing (3.0 or better)
 */
export function isPassingGWA(gwa: number): boolean {
  return gwa <= 3.0 && gwa >= 1.0;
}
