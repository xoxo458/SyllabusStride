const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Testmail Email Service Configuration
 * For automated testing and development email notifications
 * Uses Testmail.app SMTP for test email capture and validation
 */

class TestmailService {
  constructor() {
    this.isEnabled = process.env.ENABLE_TESTMAIL === 'true';
    this.transporter = null;

    if (this.isEnabled && this.validateConfig()) {
      this.initializeTransporter();
    }
  }

  /**
   * Validate Testmail configuration
   */
  validateConfig() {
    const required = [
      'TESTMAIL_SMTP_HOST',
      'TESTMAIL_SMTP_PORT',
      'TESTMAIL_SMTP_USER',
      'TESTMAIL_SMTP_PASSWORD',
    ];

    for (const env of required) {
      if (!process.env[env]) {
        console.warn(`⚠️  Missing Testmail config: ${env}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.TESTMAIL_SMTP_HOST,
        port: parseInt(process.env.TESTMAIL_SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.TESTMAIL_SMTP_USER,
          pass: process.env.TESTMAIL_SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      console.log('✅ Testmail SMTP configured for email testing');
    } catch (error) {
      console.error('❌ Failed to initialize Testmail:', error.message);
      this.isEnabled = false;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        return false;
      }
      await this.transporter.verify();
      console.log('✅ Testmail SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ Testmail connection verification failed:', error.message);
      return false;
    }
  }

  /**
   * Send assignment deadline notification
   */
  async sendAssignmentDeadlineEmail(userEmail, assignmentData) {
    if (!this.isEnabled || !this.transporter) {
      console.log('⏭️  Email service disabled');
      return { success: false, message: 'Email service disabled' };
    }

    const htmlContent = `
      <h2>Assignment Deadline Reminder</h2>
      <p>You have an upcoming assignment in <strong>${assignmentData.courseName}</strong></p>
      <h3>${assignmentData.assignmentTitle}</h3>
      <p><strong>Due Date:</strong> ${new Date(assignmentData.dueDate).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${new Date(assignmentData.dueDate).toLocaleTimeString()}</p>
      ${assignmentData.description ? `<p><strong>Description:</strong> ${assignmentData.description}</p>` : ''}
      <p>
        <a href="${process.env.API_BASE_URL}/assignments/${assignmentData.assignmentId}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Assignment
        </a>
      </p>
      <p>Stay organized with SyllabusStride! 🎓</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Reminder: ${assignmentData.assignmentTitle} due on ${new Date(assignmentData.dueDate).toLocaleDateString()}`,
      html: htmlContent,
    });
  }

  /**
   * Send grade notification email
   */
  async sendGradeNotificationEmail(userEmail, gradeData) {
    if (!this.isEnabled || !this.transporter) {
      return { success: false, message: 'Email service disabled' };
    }

    const htmlContent = `
      <h2>Grade Posted</h2>
      <p>A grade has been posted for your assignment in <strong>${gradeData.courseName}</strong></p>
      <h3>${gradeData.assignmentTitle}</h3>
      <p><strong>Grade:</strong> ${gradeData.grade}%</p>
      ${gradeData.feedback ? `<p><strong>Feedback:</strong> ${gradeData.feedback}</p>` : ''}
      <p>
        <a href="${process.env.API_BASE_URL}/assignments/${gradeData.assignmentId}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Details
        </a>
      </p>
      <p>Keep up the great work! 🌟</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Grade Posted: ${gradeData.assignmentTitle}`,
      html: htmlContent,
    });
  }

  /**
   * Send course enrolled confirmation
   */
  async sendCourseEnrollmentEmail(userEmail, courseData) {
    if (!this.isEnabled || !this.transporter) {
      return { success: false, message: 'Email service disabled' };
    }

    const htmlContent = `
      <h2>Enrollment Confirmed</h2>
      <p>You have successfully enrolled in:</p>
      <h3>${courseData.courseName}</h3>
      <p><strong>Course Code:</strong> ${courseData.courseCode}</p>
      <p><strong>Instructor:</strong> ${courseData.instructor}</p>
      <p><strong>Semester:</strong> ${courseData.semester}</p>
      ${courseData.description ? `<p><strong>Description:</strong> ${courseData.description}</p>` : ''}
      <p>
        <a href="${process.env.API_BASE_URL}/courses/${courseData.courseId}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Course
        </a>
      </p>
      <p>Welcome to the course! 📚</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Course Enrollment: ${courseData.courseName}`,
      html: htmlContent,
    });
  }

  /**
   * Send custom email
   */
  async sendEmail(options) {
    if (!this.isEnabled || !this.transporter) {
      return { success: false, message: 'Email service disabled' };
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || 'noreply@syllabustride.com',
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email sent: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);

      // Capture in Sentry if available
      try {
        const Sentry = require('./sentry');
        Sentry.captureException(error, {
          context: 'email_service',
          recipient: options.to,
        });
      } catch (e) {
        // Sentry not available
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send batch emails
   */
  async sendBatchEmails(recipients, emailTemplate) {
    if (!this.isEnabled || !this.transporter) {
      return {
        success: false,
        message: 'Email service disabled',
        sent: 0,
        failed: 0,
      };
    }

    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [],
    };

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail({
          to: recipient.email,
          subject: emailTemplate.subject,
          html: emailTemplate.getHtml(recipient),
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({ email: recipient.email, error: result.error });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ email: recipient.email, error: error.message });
      }
    }

    return results;
  }
}

// Singleton instance
let testmailService = null;

const getTestmailService = () => {
  if (!testmailService) {
    testmailService = new TestmailService();
  }
  return testmailService;
};

module.exports = {
  TestmailService,
  getTestmailService,
};
