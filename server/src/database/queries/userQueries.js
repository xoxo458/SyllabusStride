const { getAppwriteService } = require('../../config/appwrite');
const { Query } = require('appwrite');

const appwrite = getAppwriteService();

/**
 * Get user profile by ID
 */
async function getUserProfile(userId) {
  try {
    return await appwrite.getDocument('users', userId);
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

/**
 * Update user profile
 */
async function updateUserProfile(userId, data) {
  try {
    return await appwrite.updateDocument('users', userId, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Get user's courses
 */
async function getUserCourses(userId, limit = 25, offset = 0) {
  try {
    const query = [
      Query.equal('user_id', userId),
    ];
    return await appwrite.queryDocuments('courses', query);
  } catch (error) {
    throw new Error(`Failed to get user courses: ${error.message}`);
  }
}

/**
 * Get user's upcoming assignments
 */
async function getUserUpcomingAssignments(userId) {
  try {
    const courses = await getUserCourses(userId);
    const courseIds = courses.documents.map(c => c.$id);
    
    if (courseIds.length === 0) return { documents: [] };

    const now = new Date();
    const queries = [
      Query.greaterThan('due_date', now.toISOString()),
      Query.limit(50),
    ];

    return await appwrite.queryDocuments('assignments', queries);
  } catch (error) {
    throw new Error(`Failed to get upcoming assignments: ${error.message}`);
  }
}

/**
 * Get user statistics
 */
async function getUserStats(userId) {
  try {
    const courses = await getUserCourses(userId);
    const stats = {
      total_courses: courses.documents.length,
      total_assignments: 0,
      completed_assignments: 0,
      pending_assignments: 0,
      average_grade: 0,
    };

    let totalGrade = 0;
    let gradedCount = 0;

    for (const course of courses.documents) {
      const assignments = await getAppwriteService().queryDocuments('assignments', [
        Query.equal('course_id', course.$id),
      ]);

      stats.total_assignments += assignments.documents.length;
      
      for (const assignment of assignments.documents) {
        if (assignment.status === 'graded') {
          stats.completed_assignments++;
          if (assignment.grade) {
            totalGrade += assignment.grade;
            gradedCount++;
          }
        } else if (assignment.status === 'submitted') {
          stats.pending_assignments++;
        }
      }
    }

    if (gradedCount > 0) {
      stats.average_grade = Math.round(totalGrade / gradedCount);
    }

    return stats;
  } catch (error) {
    throw new Error(`Failed to get user stats: ${error.message}`);
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserCourses,
  getUserUpcomingAssignments,
  getUserStats,
};
