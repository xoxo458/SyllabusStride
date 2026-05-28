const { getAppwriteService } = require('../../config/appwrite');
const { Query } = require('appwrite');

const appwrite = getAppwriteService();

/**
 * Create a new submission
 */
async function createSubmission(submissionData) {
  try {
    return await appwrite.createDocument('submissions', {
      ...submissionData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to create submission: ${error.message}`);
  }
}

/**
 * Get submission by ID
 */
async function getSubmissionById(submissionId) {
  try {
    return await appwrite.getDocument('submissions', submissionId);
  } catch (error) {
    throw new Error(`Failed to get submission: ${error.message}`);
  }
}

/**
 * Get all submissions for an assignment
 */
async function getAssignmentSubmissions(assignmentId, limit = 50) {
  try {
    const query = [Query.equal('assignment_id', assignmentId), Query.limit(limit)];
    return await appwrite.queryDocuments('submissions', query);
  } catch (error) {
    throw new Error(`Failed to get assignment submissions: ${error.message}`);
  }
}

/**
 * Get user submission for an assignment
 */
async function getUserAssignmentSubmission(assignmentId, userId) {
  try {
    const query = [
      Query.equal('assignment_id', assignmentId),
      Query.equal('user_id', userId),
    ];
    const result = await appwrite.queryDocuments('submissions', query);
    return result.documents.length > 0 ? result.documents[0] : null;
  } catch (error) {
    throw new Error(`Failed to get user submission: ${error.message}`);
  }
}

/**
 * Update submission
 */
async function updateSubmission(submissionId, submissionData) {
  try {
    return await appwrite.updateDocument('submissions', submissionId, {
      ...submissionData,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to update submission: ${error.message}`);
  }
}

/**
 * Grade submission
 */
async function gradeSubmission(submissionId, gradeData) {
  try {
    return await appwrite.updateDocument('submissions', submissionId, {
      ...gradeData,
      status: 'graded',
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to grade submission: ${error.message}`);
  }
}

/**
 * Get pending submissions (not yet graded)
 */
async function getPendingSubmissions(limit = 25) {
  try {
    const query = [
      Query.equal('status', 'submitted'),
      Query.limit(limit),
      Query.orderDesc('submission_date'),
    ];
    return await appwrite.queryDocuments('submissions', query);
  } catch (error) {
    throw new Error(`Failed to get pending submissions: ${error.message}`);
  }
}

/**
 * Get user submissions
 */
async function getUserSubmissions(userId, limit = 50) {
  try {
    const query = [Query.equal('user_id', userId), Query.limit(limit)];
    return await appwrite.queryDocuments('submissions', query);
  } catch (error) {
    throw new Error(`Failed to get user submissions: ${error.message}`);
  }
}

module.exports = {
  createSubmission,
  getSubmissionById,
  getAssignmentSubmissions,
  getUserAssignmentSubmission,
  updateSubmission,
  gradeSubmission,
  getPendingSubmissions,
  getUserSubmissions,
};
