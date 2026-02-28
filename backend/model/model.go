package model

import (
	"time"

	"github.com/google/uuid"
)

// User はユーザー情報
type User struct {
	ID          uuid.UUID `json:"id"`
	DisplayName string    `json:"display_name"`
	Bio         string    `json:"bio"`
	AvatarURL   string    `json:"avatar_url"`
	Location    string    `json:"location"`
	Occupation  string    `json:"occupation"`
	CreatedAt   time.Time `json:"created_at"`
}

// Queue はマッチング待ちの1レコード
type Queue struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	CriteriaKey string     `json:"criteria_key"`
	DurationMin int        `json:"duration_min"`
	Status      string     `json:"status"`
	SessionID   *uuid.UUID `json:"session_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// Session はマッチ成立後のセッション
type Session struct {
	ID          uuid.UUID `json:"id"`
	CriteriaKey string    `json:"criteria_key"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartAt     time.Time `json:"start_at"`
	EndAt       time.Time `json:"end_at"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

// Message はセッション内のメッセージ
type Message struct {
	ID           uuid.UUID `json:"id"`
	SessionID    uuid.UUID `json:"session_id"`
	SenderID     uuid.UUID `json:"sender_id"`
	SenderName   string    `json:"sender_name"`
	SenderAvatar string    `json:"sender_avatar"`
	Text         string    `json:"text"`
	CreatedAt    time.Time `json:"created_at"`
}

// EnqueueRequest はPOST /queues のリクエストボディ
type EnqueueRequest struct {
	UserID      string `json:"user_id"      binding:"required,uuid"`
	CriteriaKey string `json:"criteria_key" binding:"required"`
	DurationMin int    `json:"duration_min" binding:"required,min=1"`
}

// UpdateUserRequest はPUT /users/:id のリクエストボディ
type UpdateUserRequest struct {
	DisplayName string `json:"display_name"`
	Bio         string `json:"bio"`
	AvatarURL   string `json:"avatar_url"`
	Location    string `json:"location"`
	Occupation  string `json:"occupation"`
}

// SendMessageRequest はPOST /sessions/:id/messages のリクエストボディ
type SendMessageRequest struct {
	SenderID string `json:"sender_id" binding:"required,uuid"`
	Text     string `json:"text"      binding:"required"`
}
