import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

async def send_email(
    subject: str,
    recipients: List[str],
    body: str,
    html_body: Optional[str] = None
):
    """
    Sends an email using SMTP settings from config.
    If SMTP_USER or SMTP_PASSWORD is not set, it logs the email to the console.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Email NOT sent. Content follows:")
        logger.warning(f"Subject: {subject}")
        logger.warning(f"To: {recipients}")
        logger.warning(f"Body: {body}")
        return

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = ", ".join(recipients)

    # Attach plain text part
    part1 = MIMEText(body, "plain")
    message.attach(part1)

    # Attach HTML part if provided
    if html_body:
        part2 = MIMEText(html_body, "html")
        message.attach(part2)

    try:
        # Connect to server
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        if settings.SMTP_TLS:
            server.starttls()
        
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, recipients, message.as_string())
        server.quit()
        logger.info(f"Email successfully sent to {recipients}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipients}: {str(e)}")
        raise e

async def send_reset_password_email(email: str, token: str):
    """Sends a password reset link to the user."""
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    subject = "Reset Your PlateSense Password"
    body = f"Hello,\n\nYou requested to reset your password. Please click the link below to set a new one:\n\n{reset_link}\n\nIf you did not request this, please ignore this email.\n\nRegards,\nPlateSense Team"
    
    html_body = f"""
    <html>
        <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #513825;">Reset Your Password</h2>
                <p>Hello,</p>
                <p>You requested a password reset for your PlateSense account. Click the button below to proceed:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background: #513825; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">{reset_link}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">If you didn't request this email, you can safely ignore it.</p>
            </div>
        </body>
    </html>
    """
    
    await send_email(subject, [email], body, html_body)
