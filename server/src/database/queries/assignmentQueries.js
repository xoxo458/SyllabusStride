const { getAppwriteService } = require('../../config/appwrite');
const { Query } = require('appwrite');

const appwrite = getAppwriteService();

/**
 * Create a new assignment
 */
async function createAssignment(assignmentData) {
  try {
    return await appwrite.createDocument('assignments', {
      ...assignmentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to create assignment: ${error.message}`);
  }
}

/**
 * Get assignment by ID
 */
async function getAssignmentById(assignmentId) {
  try {
    return await appwrite.getDocument('assignments', assignmentId);
  } catch (error) {
    throw new Error(`Failed to get assignment: ${error.message}`);
  }
}

/**
 * Get all assignments for a course
 */
async function getCourseAssignments(courseId, limit = 50) {
  try {
    const query = [Query.equal('course_id', courseId), Query.limit(limit)];
    return await appwrite.queryDocuments('assignments', query);
  } catch (error) {
    throw new Error(`Failed to get course assignments: ${error.message}`);
  }
}

/**
 * Update assignment
 */
async function updateAssignment(assignmentId, assignmentData) {
  try {
    return await appwrite.updateDocument('assignments', assignmentId, {
      ...assignmentData,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to update assignment: ${error.message}`);
  }
}

/**
 * Delete assignment
 */
async function deleteAssignment(assignmentId) {
  try {
    return await appwrite.deleteDocument('assignments', assignmentId);
  } catch (error) {
    throw new Error(`Failed to delete assignment: ${error.message}`);
  }
}

/**
 * Get upcoming assignments (due within 7 days)
 */
async function getUpcomingAssignments(limit = 25) {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const query = [
      Query.greaterThanOrEqual('due_date', now.toISOString()),
      Query.lessThanOrEqual('due_date', sevenDaysLater.toISOString()),
      Query.limit(limit),
      Query.orderAsc('due_date'),
    ];

    return await appwrite.queryDocuments('assignments', query);
  } catch (error) {
    throw new Error(`Failed to get upcoming assignments: ${error.message}`);
  }
}

/**
 * Get overdue assignments
 */
async function getOverdueAssignments(limit = 25) {
  try {
    const now = new Date();
    const query = [
      Query.lessThan('due_date', now.toISOString()),
      Query.notEqual('status', 'graded'),
      Query.limit(limit),
    ];

    return await appwrite.queryDocuments('assignments', query);
  } catch (error) {
    throw new Error(`Failed to get overdue assignments: ${error.message}`);
  }
}

/**
 * Get assignments by status
 */
async function getAssignmentsByStatus(courseId, status) {
  try {
    const query = [
      Query.equal('course_id', courseId),
      Query.equal('status', status),
    ];
    return await appwrite.queryDocuments('assignments', query);
  } catch (error) {
    throw new Error(`Failed to get assignments by status: ${error.message}`);
  }
}

module.exports = {
  createAssignment,
  getAssignmentById,
  getCourseAssignments,
  updateAssignment,
  deleteAssignment,
  getUpcomingAssignments,
  getOverdueAssignments,
  getAssignmentsByStatus,
};
