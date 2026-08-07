// Package email provides a provider-agnostic email sending interface.
package email

import (
	"context"
	"fmt"
)

// Sender is the interface for sending transactional emails.
type Sender interface {
	// Send sends a transactional email.
	Send(ctx context.Context, req SendRequest) error

	// SendTemplate sends an email using a pre-defined template.
	SendTemplate(ctx context.Context, req TemplateRequest) error
}

// SendRequest contains the details for a single email.
type SendRequest struct {
	To           string
	Subject      string
	TextBody     string
	HTMLBody     string
	ReplyTo      string
	Metadata     map[string]string
}

// TemplateRequest sends an email using a template.
type TemplateRequest struct {
	To        string
	Template  string // template name/id in the provider
	Variables map[string]string
	ReplyTo   string
	Metadata  map[string]string
}

// Builder creates email content for common platform flows.
type Builder struct {
	AppName string
	BaseURL string
}

// NewBuilder creates a new email content builder.
func NewBuilder(appName, baseURL string) *Builder {
	return &Builder{AppName: appName, BaseURL: baseURL}
}

// VerifyEmail builds an OTP verification email.
func (b *Builder) VerifyEmail(otpCode string) (subject, text, html string) {
	subject = fmt.Sprintf("Verify your %s account", b.AppName)
	text = fmt.Sprintf(`Welcome to %s!

Your verification code is: %s

This code expires in 10 minutes. If you didn't request this, you can ignore this email.

— %s Team`, b.AppName, otpCode, b.AppName)
	html = fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>Welcome to %s!</h2>
<p>Your verification code is:</p>
<div style="font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; font-weight: bold;">%s</div>
<p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't sign up, ignore this email.</p>
<p style="color: #999; font-size: 12px;">— %s Team</p>
</body></html>`, b.AppName, otpCode, b.AppName)
	return
}

// PasswordReset builds a password reset email (OTP primary, link backup).
func (b *Builder) PasswordReset(otpCode, resetLink string) (subject, text, html string) {
	subject = fmt.Sprintf("Reset your %s password", b.AppName)
	text = fmt.Sprintf(`We received a password reset request for your %s account.

Your reset code is: %s

This code expires in 15 minutes.

If the code doesn't work, click this link: %s

If you didn't request this, you can safely ignore this email.

— %s Team`, b.AppName, otpCode, resetLink, b.AppName)
	html = fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>Password Reset</h2>
<p>Your reset code is:</p>
<div style="font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; font-weight: bold;">%s</div>
<p style="font-size: 14px;">Or <a href="%s">click here</a> to reset your password.</p>
<p style="color: #666; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
<p style="color: #999; font-size: 12px;">— %s Team</p>
</body></html>`, otpCode, resetLink, b.AppName)
	return
}

// PayoutConfirmation builds a payout confirmation email.
func (b *Builder) PayoutConfirmation(amount, method, date string) (subject, text, html string) {
	subject = fmt.Sprintf("Payout of %s processed — %s", amount, b.AppName)
	text = fmt.Sprintf(`Your payout of %s has been processed via %s on %s.

It may take 1-5 business days to arrive depending on your payment method.

— %s Team`, amount, method, date, b.AppName)
	html = fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>Payout Processed ✅</h2>
<p>Amount: <strong>%s</strong></p>
<p>Method: %s</p>
<p>Date: %s</p>
<p style="color: #666; font-size: 14px;">May take 1-5 business days to arrive.</p>
<p style="color: #999; font-size: 12px;">— %s Team</p>
</body></html>`, amount, method, date, b.AppName)
	return
}

// NewFollower builds a new follower notification email.
func (b *Builder) NewFollower(followerName, channelURL string) (subject, text, html string) {
	subject = fmt.Sprintf("New follower: %s", followerName)
	text = fmt.Sprintf(`You have a new follower: %s

View your channel: %s

— %s Team`, followerName, channelURL, b.AppName)
	html = fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
<h2>New Follower 🎉</h2>
<p><strong>%s</strong> followed you!</p>
<p><a href="%s">View your channel</a></p>
<p style="color: #999; font-size: 12px;">— %s Team</p>
</body></html>`, followerName, channelURL, b.AppName)
	return
}