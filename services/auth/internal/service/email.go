package service

import (
	"context"
	"log/slog"
)

// EmailSender provides an interface for sending emails.
// Implementations: ConsoleEmailSender (dev), ResendEmailSender (prod).
type EmailSender interface {
	SendEmail(ctx context.Context, to, subject, text, html string) error
}

// ConsoleEmailSender logs emails to stdout (for development).
type ConsoleEmailSender struct {
	fromName  string
	fromEmail string
}

func NewConsoleEmailSender(fromName, fromEmail string) *ConsoleEmailSender {
	return &ConsoleEmailSender{
		fromName:  fromName,
		fromEmail: fromEmail,
	}
}

func (s *ConsoleEmailSender) SendEmail(ctx context.Context, to, subject, text, html string) error {
	slog.Info("📧 EMAIL (dev)",
		"to", to,
		"subject", subject,
		"text_body", text,
	)
	return nil
}

// ResendEmailSender sends emails via the Resend API.
type ResendEmailSender struct {
	apiKey    string
	fromName  string
	fromEmail string
}

func NewResendEmailSender(apiKey, fromName, fromEmail string) *ResendEmailSender {
	return &ResendEmailSender{
		apiKey:    apiKey,
		fromName:  fromName,
		fromEmail: fromEmail,
	}
}

func (s *ResendEmailSender) SendEmail(ctx context.Context, to, subject, text, html string) error {
	// TODO: Implement Resend API call
	// This is a stub — actual implementation requires Resend Go SDK or raw HTTP call.
	return nil
}

// OTPEmailBuilder builds email content for OTP-related messages.
type OTPEmailBuilder struct {
	appName string
	baseURL string
}

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