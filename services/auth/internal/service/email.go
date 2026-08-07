package service

import (
	"context"
	"fmt"

	"github.com/fusion-platform/pkg/email"
)

// EmailSender provides an interface for sending emails.
// Implementations: ConsoleEmailSender (dev), ResendEmailSender (prod).
type EmailSender interface {
	SendEmail(ctx context.Context, to, subject, text, html string) error
}

// ConsoleEmailSender logs emails to stdout (for development).
// Wraps pkg/email.ConsoleSender.
type ConsoleEmailSender struct {
	inner *email.ConsoleSender
}

// NewConsoleEmailSender creates a new ConsoleEmailSender.
func NewConsoleEmailSender(fromName, fromEmail string) *ConsoleEmailSender {
	return &ConsoleEmailSender{
		inner: email.NewConsoleSender(fromName, fromEmail),
	}
}

func (s *ConsoleEmailSender) SendEmail(ctx context.Context, to, subject, text, html string) error {
	return s.inner.Send(ctx, email.SendRequest{
		To:       to,
		Subject:  subject,
		TextBody: text,
		HTMLBody: html,
	})
}

// ResendEmailSender sends emails via the Resend API.
// Wraps pkg/email.ResendSender.
type ResendEmailSender struct {
	inner *email.ResendSender
}

// NewResendEmailSender creates a new ResendEmailSender.
func NewResendEmailSender(apiKey, fromName, fromEmail string) *ResendEmailSender {
	return &ResendEmailSender{
		inner: email.NewResendSender(email.ResendConfig{
			APIKey:    apiKey,
			FromName:  fromName,
			FromEmail: fromEmail,
		}),
	}
}

func (s *ResendEmailSender) SendEmail(ctx context.Context, to, subject, text, html string) error {
	return s.inner.Send(ctx, email.SendRequest{
		To:       to,
		Subject:  subject,
		TextBody: text,
		HTMLBody: html,
	})
}

// SendEmailViaSender is a helper that sends an email using any pkg/email.Sender.
// Useful for injecting a generic Sender where EmailSender is expected.
func SendEmailViaSender(ctx context.Context, sender email.Sender, to, subject, text, html string) error {
	return sender.Send(ctx, email.SendRequest{
		To:       to,
		Subject:  subject,
		TextBody: text,
		HTMLBody: html,
	})
}

// OTPEmailBuilder builds email content for OTP-related messages.
// This is kept for backward compatibility — new code should use pkg/email.Builder.
type OTPEmailBuilder struct {
	appName string
	baseURL string
}

// NewOTPEmailBuilder creates a new OTPEmailBuilder.
func NewOTPEmailBuilder(appName, baseURL string) *OTPEmailBuilder {
	return &OTPEmailBuilder{
		appName: appName,
		baseURL: baseURL,
	}
}

func (b *OTPEmailBuilder) VerifyEmail(code string) (subject, text, html string) {
	subject = "Verify your email address"
	text = "Your verification code is: " + code + "\n\n" +
		"This code expires in 10 minutes.\n\n" +
		"If you didn't request this, you can ignore this email."
	html = "<h2>Verify your email</h2>" +
		"<p>Your verification code is:</p>" +
		"<h1 style=\"letter-spacing: 8px; font-size: 32px;\">" + code + "</h1>" +
		"<p>This code expires in 10 minutes.</p>" +
		"<p>If you didn't request this, you can ignore this email.</p>"
	return
}

func (b *OTPEmailBuilder) PasswordReset(code string) (subject, text, html string) {
	subject = "Reset your password"
	text = "Your password reset code is: " + code + "\n\n" +
		"This code expires in 10 minutes.\n\n" +
		"If you didn't request a password reset, you can ignore this email."
	html = "<h2>Reset your password</h2>" +
		"<p>Your password reset code is:</p>" +
		"<h1 style=\"letter-spacing: 8px; font-size: 32px;\">" + code + "</h1>" +
		"<p>This code expires in 10 minutes.</p>" +
		"<p>If you didn't request this, you can ignore this email.</p>"
	return
}

func (b *OTPEmailBuilder) EmailChangeOld(code, newEmail string) (subject, text, html string) {
	subject = "Confirm email change"
	text = "We received a request to change your email to: " + newEmail + "\n\n" +
		"Your confirmation code is: " + code + "\n\n" +
		"This code expires in 10 minutes.\n\n" +
		"If you didn't request this, please secure your account immediately."
	html = "<h2>Confirm email change</h2>" +
		"<p>We received a request to change your email to: <strong>" + newEmail + "</strong></p>" +
		"<p>Your confirmation code is:</p>" +
		"<h1 style=\"letter-spacing: 8px; font-size: 32px;\">" + code + "</h1>" +
		"<p>This code expires in 10 minutes.</p>" +
		"<p>If you didn't request this, please secure your account immediately.</p>"
	return
}

func (b *OTPEmailBuilder) EmailChangeNew(code, oldEmail string) (subject, text, html string) {
	subject = "Confirm your new email"
	text = "Please confirm this email address for your " + b.appName + " account (" + oldEmail + ").\n\n" +
		"Your confirmation code is: " + code + "\n\n" +
		"This code expires in 10 minutes."
	html = "<h2>Confirm your new email</h2>" +
		"<p>Please confirm this email address for your " + b.appName + " account (<strong>" + oldEmail + "</strong>).</p>" +
		"<p>Your confirmation code is:</p>" +
		"<h1 style=\"letter-spacing: 8px; font-size: 32px;\">" + code + "</h1>" +
		"<p>This code expires in 10 minutes.</p>"
	return
}

// Ensure interfaces are satisfied at compile time.
var _ EmailSender = (*ConsoleEmailSender)(nil)
var _ EmailSender = (*ResendEmailSender)(nil)
var _ = fmt.Sprintf // keep fmt import available for potential future use