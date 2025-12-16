import nodemailer from 'nodemailer'

// Email service configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'usamajatt16@gmail.com',
      pass: process.env.SMTP_PASS || '', // App password for Gmail
    },
  })
}

// Email template for new scholarship post
export const createScholarshipEmailTemplate = (post: any, baseUrl: string = 'http://localhost:3000') => {
  const postUrl = `${baseUrl}/blog/${post.slug}`
  const featuredImage = post.featured_image || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop'
  
  // Format deadline if exists
  let deadlineHtml = ''
  if (post.application_deadline) {
    const deadline = new Date(post.application_deadline)
    deadlineHtml = `
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong style="color: #856404;">⏰ Application Deadline:</strong>
        <p style="color: #856404; margin: 5px 0 0 0; font-size: 16px;">${deadline.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
    `
  }

  // Format funding type
  let fundingType = ''
  if (post.funding_type_id) {
    fundingType = `<span style="background: #d4edda; color: #155724; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${post.funding_type_id}</span>`
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Scholarship Opportunity</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #f97316 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎓 New Scholarship Available!</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Your Study Abroad Dream Awaits</p>
                        </td>
                    </tr>

                    <!-- Featured Image -->
                    <tr>
                        <td style="padding: 0;">
                            <img src="${featuredImage}" alt="${post.title}" style="width: 100%; height: auto; display: block; max-height: 300px; object-fit: cover;" />
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 24px; line-height: 1.3;">
                                ${post.title}
                            </h2>
                            
                            ${fundingType ? `<div style="margin-bottom: 20px;">${fundingType}</div>` : ''}

                            ${post.excerpt ? `
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 15px 0;">
                                ${post.excerpt}
                            </p>
                            ` : ''}

                            ${post.university_name ? `
                            <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                <strong style="color: #1e40af;">🏛️ University:</strong>
                                <p style="color: #1e40af; margin: 5px 0 0 0;">${post.university_name}</p>
                            </div>
                            ` : ''}

                            ${deadlineHtml}

                            ${post.scholarship_benefits ? `
                            <div style="margin: 20px 0;">
                                <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 10px;">✨ Benefits:</h3>
                                <div style="color: #4b5563; line-height: 1.6;">
                                    ${post.scholarship_benefits.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                            ` : ''}

                            ${post.eligibility_criteria ? `
                            <div style="margin: 20px 0;">
                                <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 10px;">📋 Eligibility Criteria:</h3>
                                <div style="color: #4b5563; line-height: 1.6;">
                                    ${post.eligibility_criteria.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                            ` : ''}

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${postUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                                            View Full Details & Apply →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
                                Don't miss this opportunity! Apply now before the deadline.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                <strong style="color: #1f2937;">Scholarship Gateway</strong><br>
                                Your trusted source for international scholarships
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">
                                You're receiving this because you subscribed to scholarship updates.<br>
                                <a href="${baseUrl}/unsubscribe?email={{EMAIL}}" style="color: #2563eb; text-decoration: none;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `
}

// Send email to newsletter subscribers
export const sendNewsletterEmail = async (post: any, subscribers: { email: string }[]) => {
  if (!subscribers || subscribers.length === 0) {
    console.log('No subscribers to send email to')
    return { success: true, sent: 0 }
  }

  const transporter = createTransporter()
  
  // Use FRONTEND_URL if provided, otherwise use localhost for local testing
  // For production, set FRONTEND_URL in .env file
  const baseUrl = process.env.FRONTEND_URL || 
                  (process.env.NODE_ENV === 'production' 
                    ? 'https://scholarshipgateway.com' 
                    : 'http://localhost:3000')
  
  const emailHtml = createScholarshipEmailTemplate(post, baseUrl)

  let successCount = 0
  let errorCount = 0

  // Send emails in batches to avoid overwhelming the SMTP server
  const batchSize = 10
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)
    
    await Promise.allSettled(
      batch.map(async (subscriber) => {
        try {
          const personalizedHtml = emailHtml.replace(/\{\{EMAIL\}\}/g, subscriber.email)
          
          await transporter.sendMail({
            from: `"Scholarship Gateway" <${process.env.SMTP_USER || 'usamajatt16@gmail.com'}>`,
            to: subscriber.email,
            subject: `🎓 New Scholarship: ${post.title}`,
            html: personalizedHtml,
          })
          
          successCount++
          console.log(`Email sent successfully to ${subscriber.email}`)
        } catch (error: any) {
          errorCount++
          console.error(`Failed to send email to ${subscriber.email}:`, error.message)
        }
      })
    )

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return {
    success: true,
    sent: successCount,
    failed: errorCount,
    total: subscribers.length
  }
}

