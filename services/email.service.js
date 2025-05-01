const { SESClient, SendEmailCommand, GetIdentityVerificationAttributesCommand } = require('@aws-sdk/client-ses');

class EmailService {
  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    this.FROM_EMAIL = 'support@smeinvestorhub.com';
    this.verifySetup();
  }

  async verifySetup() {
    try {
      console.log('Verifying SES setup...');
      
      // Check sender email verification status
      const verificationCommand = new GetIdentityVerificationAttributesCommand({
        Identities: [this.FROM_EMAIL]
      });
      
      const response = await this.sesClient.send(verificationCommand);
      const verificationStatus = response.VerificationAttributes[this.FROM_EMAIL]?.VerificationStatus;
      
      console.log(`Sender email verification status: ${verificationStatus}`);
      
      if (verificationStatus !== 'Success') {
        console.warn('Warning: Sender email is not verified. Please verify in AWS SES console.');
      }
      
      console.log('SES setup verification complete');
    } catch (error) {
      console.error('SES setup verification failed:', error);
    }
  }

  async checkEmailVerification(email) {
    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [email]
      });
      
      const response = await this.sesClient.send(command);
      return response.VerificationAttributes[email]?.VerificationStatus === 'Success';
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }

  async sendWelcomeEmail(user) {
    try {
      console.log(`Attempting to send welcome email to ${user.email}`);

      // Check if recipient email is verified (important in sandbox mode)
      const isRecipientVerified = await this.checkEmailVerification(user.email);
      const isSenderVerified = await this.checkEmailVerification(this.FROM_EMAIL);

      if (!isSenderVerified) {
        console.error('Sender email is not verified');
        return {
          success: false,
          error: 'Sender email not verified',
          needsVerification: true
        };
      }

      if (!isRecipientVerified) {
        // Handle unverified recipient in sandbox mode
        console.log(`Recipient ${user.email} is not verified. Sending verification request...`);
        
        // You could implement logic here to:
        // 1. Store the welcome email in a queue
        // 2. Send a verification request to the user
        // 3. Set up a process to send the welcome email once verified
        
        return {
          success: false,
          error: 'Recipient email not verified',
          needsVerification: true
        };
      }

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2F855A;">Welcome to SME-Investor Hub!</h2>
          <p>Dear ${user.fullName},</p>
          <p>Thank you for registering with SME-Investor Hub. We're excited to have you join our platform!</p>
          <p style="margin-top: 20px;"><strong>Account Details:</strong></p>
          <ul>
            <li>Username: ${user.username}</li>
            <li>Account Type: ${user.userType === 'investor' ? 'Investor' : 'Business Owner'}</li>
          </ul>
          <div style="margin-top: 20px;">
            <p><strong>Your next steps:</strong></p>
            ${user.userType === 'investor' ? `
              <ul>
                <li>Complete your investor profile</li>
                <li>Browse available investment opportunities</li>
                <li>Connect with business owners</li>
              </ul>
            ` : `
              <ul>
                <li>Complete your business profile</li>
                <li>Create your first business proposal</li>
                <li>Connect with potential investors</li>
              </ul>
            `}
          </div>
          <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact our support team.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p>Best regards,<br>The SME-Investor Hub Team</p>
          </div>
        </div>
      `;

      const params = {
        Source: this.FROM_EMAIL,
        Destination: {
          ToAddresses: [user.email]
        },
        Message: {
          Subject: {
            Data: 'Welcome to SME-Investor Hub - Get Started Today!'
          },
          Body: {
            Html: {
              Data: htmlBody
            },
            Text: {
              Data: `Welcome to SME-Investor Hub!\n\nDear ${user.fullName},\n\nThank you for registering with SME-Investor Hub. We're excited to have you join our platform!`
            }
          }
        }
      };

      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      console.log('Email sent successfully:', response);
      return {
        success: true,
        messageId: response.MessageId
      };

    } catch (error) {
      console.error('Failed to send welcome email:', {
        message: error.message,
        stack: error.stack
      });
      return {
        success: false,
        error: error.message,
        details: error.code === 'MessageRejected' ? 'Email verification required' : 'Unknown error'
      };
    }
  }

  async verifyRecipientEmail(email) {
    try {
      // This function would implement your email verification workflow
      // For example, sending a verification link to the user
      
      const params = {
        Source: this.FROM_EMAIL,
        Destination: {
          ToAddresses: [email]
        },
        Message: {
          Subject: {
            Data: 'Verify your email for SME-Investor Hub'
          },
          Body: {
            Text: {
              Data: `Please verify your email address to receive communications from SME-Investor Hub. Visit the AWS SES console to complete verification.`
            }
          }
        }
      };

      const command = new SendEmailCommand(params);
      return await this.sesClient.send(command);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();