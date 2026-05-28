const { getAppwriteService } = require('../../config/appwrite');
const { Query } = require('appwrite');

const appwrite = getAppwriteService();

/**
 * Create a new course
 */
async function createCourse(userId, courseData) {
  try {
    return await appwrite.createDocument('courses', {
      user_id: userId,
      ...courseData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to create course: ${error.message}`);
  }
}

/**
 * Get course by ID
 */
async function getCourseById(courseId) {
  try {
    return await appwrite.getDocument('courses', courseId);
  } catch (error) {
    throw new Error(`Failed to get course: ${error.message}`);
  }
}

/**
 * Get all user courses
 */
async function getUserCourses(userId, limit = 25, offset = 0) {
  try {
    const query = [Query.equal('user_id', userId)];
    return await appwrite.queryDocuments('courses', query);
  } catch (error) {
    throw new Error(`Failed to get user courses: ${error.message}`);
  }
}

/**
 * Update course
 */
async function updateCourse(courseId, courseData) {
  try {
    return await appwrite.updateDocument('courses', courseId, {
      ...courseData,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(`Failed to update course: ${error.message}`);
  }
}

/**
 * Delete course
 */
async function deleteCourse(courseId) {
  try {
    return await appwrite.deleteDocument('courses', courseId);
  } catch (error) {
    throw new Error(`Failed to delete course: ${error.message}`);
  }
}

/**
 * Get course assignments
 */
async function getCourseAssignments(courseId) {
  try {
    const query = [Query.equal('course_id', courseId)];
    return await appwrite.queryDocuments('assignments', query);
  } catch (error) {
    throw new Error(`Failed to get course assignments: ${error.message}`);
  }
}

/**
 * Search courses by name or code
 */
async function searchCourses(userId, searchTerm) {
  try {
    const courses = await getUserCourses(userId);
    const filtered = courses.documents.filter(
      course => 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { documents: filtered, total: filtered.length };
  } catch (error) {
    throw new Error(`Failed to search courses: ${error.message}`);
  }
}

module.exports = {
  createCourse,
  getCourseById,
  getUserCourses,
  updateCourse,
  deleteCourse,
  getCourseAssignments,
  searchCourses,
};
