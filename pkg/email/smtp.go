package email

import (
	"bytes"
	"context"
	"fmt"
	"net/smtp"
)

// SMTPSender implements Sender using raw SMTP.
type SMTPSender struct {
	host       string
	port       string
	username   string
	password   string
	fromName   string
	fromEmail  string
	useTLS     bool
}

// SMTPConfig holds SMTP connection settings.
type SMTPConfig struct {
	Host      string
	Port      string
	Username  string
	Password  string
	FromName  string
	FromEmail string
	UseTLS    bool
}

func NewSMTPSender(cfg SMTPConfig) *SMTPSender {
	return &SMTPSender{
		host:      cfg.Host,
		port:      cfg.Port,
		username:  cfg.Username,
		password:  cfg.Password,
		fromName:  cfg.FromName,
		fromEmail: cfg.FromEmail,
		useTLS:    cfg.UseTLS,
	}
}

func (s *SMTPSender) Send(ctx context.Context, req SendRequest) error {
	from := fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail)
	to := []string{req.To}

	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = req.To
	headers["Subject"] = req.Subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	var msg bytes.Buffer
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(req.HTMLBody)

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	auth := smtp.PlainAuth("", s.username, s.password, s.host)

	return smtp.SendMail(addr, auth, s.fromEmail, to, msg.Bytes())
}

func (s *SMTPSender) SendTemplate(ctx context.Context, req TemplateRequest) error {
	// Templates would be resolved here. For now, pass through.
	textBody := fmt.Sprintf("Template: %s with variables %v", req.Template, req.Variables)
	return s.Send(ctx, SendRequest{
		To:      req.To,
		Subject: req.Template,
		HTMLBody: fmt.Sprintf("<html><body>Template: %s<br>Variables: %v</body></html>",
			req.Template, req.Variables),
		TextBody: textBody,
	})
}