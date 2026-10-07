// Package mail sends emails over SMTP (Mailpit locally).
package mail

import (
	"fmt"
	"mime"
	"net/smtp"
	"strings"
	"time"
)

type Mailer struct {
	Addr string
	From string
}

func (m Mailer) Send(to, subject, body string) error {
	address := m.From
	if i := strings.LastIndex(address, "<"); i >= 0 {
		address = strings.Trim(address[i:], "<>")
	}
	msg := strings.Join([]string{
		"From: " + m.From,
		"To: " + to,
		"Subject: " + mime.QEncoding.Encode("utf-8", subject),
		"Date: " + time.Now().Format(time.RFC1123Z),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=utf-8",
		"",
		body,
	}, "\r\n")
	if err := smtp.SendMail(m.Addr, nil, address, []string{to}, []byte(msg)); err != nil {
		return fmt.Errorf("send mail: %w", err)
	}
	return nil
}
